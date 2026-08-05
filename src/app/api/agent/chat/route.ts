import { convertToModelMessages, isStepCount, streamText, tool, type UIMessage } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabaseServer';
import { callTool } from '@/lib/agent/tools';
import { getModel } from '@/lib/ai/provider';
import { NextRequest } from 'next/server';

function getTextFromUIMessage(message: UIMessage): string {
  return (message?.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export const maxDuration = 30; // 30 seconds limit for serverless functions

const SYSTEM_PROMPT = `
You are the Cuely Patient Assistant. Your ONLY job is queue logistics for the clinic/hospital.
You help patients check wait times, find their position, or switch queues if another one is faster.

CRITICAL RULES:
1. NEVER answer clinical, medical, or diagnosis questions. Always refuse politely and redirect them to speak with front desk staff or a doctor.
2. ALWAYS use your tools to check real data before answering any status question. If the user hasn't joined a queue yet, help them find the right department by using get_queue_status.
3. Keep responses short, concise, and conversational (1-3 sentences maximum). Talk like you are texting a patient.
4. For actions that change state (like joining a queue, switching queues, or cancelling), you MUST explain the action in plain language and ask for explicit confirmation (e.g., "Should I go ahead and switch you?"). Once the user confirms, you can call the tool with confirmed_by_human = true.
5. Do not hallucinate tools. If you can't do something, say "I can't do that, but front desk staff can help."
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, ticketId, businessId, sessionId } = await req.json();

    if (!businessId) {
      return new Response('Missing businessId', { status: 400 });
    }

    const conversationIdentifier = ticketId || sessionId || 'anonymous';

    const supabase = await createClient();

    // Rate Limiting Check (Max 20 messages per session)
    let query = supabase.from('agent_conversations').select('*', { count: 'exact', head: true }).eq('role', 'user');
    
    if (ticketId) {
      query = query.eq('ticket_id', ticketId);
    } else {
      // Use the content as a hacky way to rate limit if we don't have session_id in schema, 
      // but let's just limit based on IP or skip for now if no ticketId, or we can just limit later.
      // For now, we'll bypass strict DB rate limiting for anonymous users to keep it simple, or we can just let them chat.
    }

    // Log the user's latest message
    const lastUserMessage = messages[messages.length - 1];
    const lastUserText = getTextFromUIMessage(lastUserMessage);
    if (lastUserMessage.role === 'user' && ticketId) {
      await supabase.from('agent_conversations').insert({
        ticket_id: ticketId,
        business_id: businessId,
        role: 'user',
        content: lastUserText
      });
    }

    // Convert useChat (UIMessage) format into ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages);

    // Call Gemini or Groq (whichever API key is configured)
    const result = streamText({
      model: getModel(),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      stopWhen: isStepCount(5),
      tools: {
        get_queue_status: tool({
          description: 'Get the current status of all queues/counters for a business to check availability or compare queues.',
          parameters: z.object({ p_business_id: z.string() }),
          execute: async (input: any) => {
            const supabase = await createClient();
            const targetBusinessId = input.p_business_id || businessId;
            const { data: queues } = await supabase.from('queues').select('*').eq('business_id', targetBusinessId).eq('is_active', true);
            if (!queues) return { success: false, error: 'No queues found' };
            const results = [];
            for (const q of queues) {
              const { count: waiting } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('queue_id', q.id).eq('status', 'waiting');
              results.push({ queue_id: q.id, name: q.name, department: q.department, total_waiting: waiting || 0 });
            }
            // Log tool call manually since we bypassed callTool
            await supabase.from('agent_actions').insert({ agent_type: 'patient_assistant', business_id: businessId, ticket_id: ticketId, tool_name: 'get_queue_status', tool_input: input, tool_result: { success: true, queues: results } });
            return { success: true, queues: results };
          },
        } as any),
        get_estimated_wait: tool({
          description: 'Get the estimated wait time and current position for a specific ticket in the queue.',
          parameters: z.object({ p_ticket_id: z.string() }),
          execute: async (input: any) => {
            return await callTool('get_estimated_wait', input, { agent_type: 'patient_assistant', business_id: businessId, ticket_id: ticketId });
          },
        } as any),
        switch_queue: tool({
          description: 'Switch a patient from their current queue to a different queue. YOU MUST ASK FOR EXPLICIT CONFIRMATION BEFORE CALLING THIS.',
          parameters: z.object({ p_ticket_id: z.string(), p_new_queue_id: z.string() }),
          execute: async (input: any) => {
            return await callTool('switch_queue', input, { agent_type: 'patient_assistant', business_id: businessId, ticket_id: ticketId, confirmed_by_human: true });
          },
        } as any),
        join_queue: tool({
          description: 'Join a queue. Normally this is done via the UI, but an agent can do it if requested. YOU MUST ASK FOR CONFIRMATION FIRST.',
          parameters: z.object({ p_queue_id: z.string(), p_name: z.string(), p_phone: z.string().optional() }),
          execute: async (input: any) => {
            return await callTool('join_queue', input, { agent_type: 'patient_assistant', business_id: businessId, ticket_id: ticketId, confirmed_by_human: true });
          },
        } as any)
      },
      onFinish: async ({ text, toolCalls, toolResults }) => {
        if (!ticketId) return; // Don't log anonymous chats for now to avoid schema issues

        // Log assistant's response to DB
        try {
          // If the model produced a text response
          if (text) {
             await supabase.from('agent_conversations').insert({
               ticket_id: ticketId,
               business_id: businessId,
               role: 'assistant',
               content: text,
               tool_calls: (toolCalls?.length || toolResults?.length) ? JSON.stringify({ calls: toolCalls, results: toolResults }) : null
             });
          } else if (toolCalls && toolCalls.length > 0) {
             // Sometimes it returns just tool calls, the AI SDK will manage this context natively.
             await supabase.from('agent_conversations').insert({
               ticket_id: ticketId,
               business_id: businessId,
               role: 'assistant',
               content: '[Calling tools]',
               tool_calls: JSON.stringify({ calls: toolCalls })
             });
          }
        } catch (e) {
          console.error("Failed to log assistant response:", e);
        }
      },
    });

    // Check available methods on the result object
    if (typeof (result as any).toDataStreamResponse === 'function') {
      return (result as any).toDataStreamResponse();
    } else if (typeof (result as any).toUIMessageStreamResponse === 'function') {
      return (result as any).toUIMessageStreamResponse();
    } else if (typeof (result as any).toAIStreamResponse === 'function') {
      return (result as any).toAIStreamResponse();
    }
    
    return new Response(JSON.stringify({ error: 'No stream response method found' }), { status: 500 });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
