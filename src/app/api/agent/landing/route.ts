import { convertToModelMessages, streamText } from 'ai';
import { getModel } from '@/lib/ai/provider';
import { NextRequest } from 'next/server';

export const maxDuration = 30; // 30 seconds limit for serverless functions

const SYSTEM_PROMPT = `
You are the Cuely Sales & Support Assistant. Your ONLY job is to answer questions about the Cuely Digital Queue Management platform for prospective customers (businesses, hospitals, clinics).
You help them understand features, pricing, and how the platform works.

CRITICAL RULES:
1. NEVER answer clinical, medical, or diagnosis questions.
2. Be extremely enthusiastic, professional, and concise. Talk like you are chatting on a modern SaaS landing page.
3. Keep responses short (1-3 sentences maximum).
4. Emphasize that Cuely reduces wait times, provides live tracking via QR codes, and prevents overcrowding.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Convert useChat (UIMessage) format into ModelMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages);

    // Call Gemini or Groq (whichever API key is configured)
    const result = streamText({
      model: getModel(),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      temperature: 0.7,
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
