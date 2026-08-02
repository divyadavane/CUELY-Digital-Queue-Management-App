import { createClient } from '../supabaseServer';

export type AgentType = 'patient_assistant' | 'staff_copilot' | 'ops_monitor';

export interface ToolContext {
  agent_type: AgentType;
  business_id?: string;
  ticket_id?: string;
  confirmed_by_human?: boolean;
}

const ALLOWED_TOOLS = new Set([
  'get_queue_status',
  'get_estimated_wait',
  'join_queue',
  'call_next',
  'mark_no_show',
  'mark_served',
  'switch_queue',
  'get_daily_stats',
  'suggest_rebalance'
]);

const STATE_CHANGING_TOOLS = new Set([
  'join_queue',
  'call_next',
  'mark_no_show',
  'mark_served',
  'switch_queue'
]);

export async function callTool(toolName: string, input: any, context: ToolContext) {
  // 1. Validate against allow-list
  if (!ALLOWED_TOOLS.has(toolName)) {
    return { success: false, error: `Unauthorized tool: ${toolName}` };
  }

  // 2. Guardrail: state-changing tools MUST be confirmed by human
  if (STATE_CHANGING_TOOLS.has(toolName)) {
    if (!context.confirmed_by_human) {
      return { 
        success: false, 
        error: `Tool ${toolName} modifies state and requires confirmed_by_human=true in context.`
      };
    }
  }

  let toolResult: any;
  let isSuccess = false;

  const supabase = await createClient();

  try {
    // 3. Execute the Supabase RPC (baseline)
    const { data, error } = await supabase.rpc(toolName as any, input);

    if (error) {
      isSuccess = false;
      toolResult = { error: error.message, details: error.details, code: error.code };
    } else {
      isSuccess = true;
      toolResult = data;
      
      // PHASE 8: ML Wait-Time Predictor Interception
      if (toolName === 'get_estimated_wait' && input.p_ticket_id && toolResult.success && toolResult.position > 0) {
        try {
          const { data: ticket } = await supabase.from('tickets').select('queue_id, joined_at').eq('id', input.p_ticket_id).single();
          if (ticket) {
            const { count } = await supabase.from('serving_stats').select('*', { count: 'exact', head: true }).eq('queue_id', ticket.queue_id);
            
            if (count !== null && count >= 50) {
              const { predictWaitTime } = await import('../ml/predictor');
              const joinedAt = new Date(ticket.joined_at);
              const hourOfDay = joinedAt.getHours();
              const dayOfWeek = joinedAt.getDay();
              const position = toolResult.position;
              const rollingAvgWait = toolResult.estimated_wait_seconds;
              
              const { count: queueLength } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('queue_id', ticket.queue_id).eq('status', 'waiting');
              
              const features = [hourOfDay, dayOfWeek, position, rollingAvgWait, queueLength || position];
              const mlWaitSeconds = await predictWaitTime(features);
              
              if (mlWaitSeconds !== null) {
                // Shadow mode logging (can be viewed in tool_result JSON in agent_actions)
                toolResult.shadow_rolling_average = rollingAvgWait;
                toolResult.estimated_wait_seconds = Math.max(60, Math.round(mlWaitSeconds)); // Floor at 1 min
                toolResult.method = 'ml_model';
                await supabase.from('tickets').update({ wait_estimate_method: 'ml_model' }).eq('id', input.p_ticket_id);
              }
            } else {
              toolResult.method = 'rolling_average';
              await supabase.from('tickets').update({ wait_estimate_method: 'rolling_average' }).eq('id', input.p_ticket_id);
            }
          }
        } catch (mlErr) {
          console.error("[ML Predictor Error]:", mlErr);
        }
      }
    }
  } catch (err: any) {
    isSuccess = false;
    toolResult = { error: err.message };
  }

  // 4. Always log to agent_actions regardless of success or failure
  try {
    await supabase.from('agent_actions').insert({
      agent_type: context.agent_type,
      business_id: context.business_id || null,
      ticket_id: context.ticket_id || null,
      tool_name: toolName,
      tool_input: input,
      tool_result: toolResult,
      confirmed_by_human: context.confirmed_by_human || false
    });
  } catch (logErr) {
    console.error("Failed to log agent action:", logErr);
    // We don't fail the tool call if logging fails, but we log the error
  }

  // 5. Return clean result
  if (!isSuccess) {
    return { success: false, error: toolResult };
  }
  
  // Some of our RPCs already return { success: boolean, ... } so let's unwrap if possible, 
  // or just return the data directly wrapped in success: true.
  if (toolResult && typeof toolResult === 'object' && 'success' in toolResult) {
    return toolResult;
  }

  return { success: true, data: toolResult };
}
