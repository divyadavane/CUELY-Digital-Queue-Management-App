import { callTool } from './src/lib/agent/tools';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("=== Agent Tool Layer Tests ===");

  // 1. Get a test business and queue
  const { data: queues, error: qErr } = await supabase.from('queues').select('*').limit(2);
  if (qErr || !queues || queues.length < 2) {
    console.error("Need at least 2 queues for testing switch_queue.", qErr);
    return;
  }
  
  const queue1 = queues[0];
  const queue2 = queues[1];
  const businessId = queue1.business_id;

  console.log(`Using Business: ${businessId}`);
  console.log(`Queue 1: ${queue1.id}`);
  console.log(`Queue 2: ${queue2.id}`);

  // 2. Test get_daily_stats (read-only)
  console.log("\n--- Testing get_daily_stats ---");
  const statsRes = await callTool('get_daily_stats', { p_business_id: businessId }, { agent_type: 'ops_monitor', business_id: businessId });
  console.log(statsRes);

  // 3. Test suggest_rebalance (read-only)
  console.log("\n--- Testing suggest_rebalance ---");
  const rebalanceRes = await callTool('suggest_rebalance', { p_business_id: businessId }, { agent_type: 'ops_monitor', business_id: businessId });
  console.log(rebalanceRes);

  // 4. Test join_queue (state changing - will fail without confirmed_by_human)
  console.log("\n--- Testing join_queue (no human confirm, should fail) ---");
  const failRes = await callTool('join_queue', { 
    p_queue_id: queue1.id, 
    p_name: 'Test Agent User', 
    p_phone: '+1234567890'
  }, { agent_type: 'patient_assistant' });
  console.log(failRes);

  // 5. Test join_queue (state changing - with human confirm)
  console.log("\n--- Testing join_queue (with human confirm) ---");
  const joinRes = await callTool('join_queue', { 
    p_queue_id: queue1.id, 
    p_name: 'Test Agent User', 
    p_phone: '+1234567890'
  }, { agent_type: 'patient_assistant', confirmed_by_human: true });
  console.log(joinRes);

  const ticketId = joinRes?.data?.ticket_id || joinRes?.ticket_id;
  
  if (!ticketId) {
    console.log("Failed to get ticket ID. Aborting further tests.");
    return;
  }

  // 6. Test get_estimated_wait
  console.log("\n--- Testing get_estimated_wait ---");
  const waitRes = await callTool('get_estimated_wait', { p_ticket_id: ticketId }, { agent_type: 'patient_assistant', ticket_id: ticketId });
  console.log(waitRes);

  // 7. Test switch_queue
  console.log("\n--- Testing switch_queue ---");
  const switchRes = await callTool('switch_queue', { 
    p_ticket_id: ticketId,
    p_new_queue_id: queue2.id
  }, { agent_type: 'staff_copilot', confirmed_by_human: true });
  console.log(switchRes);

  const newTicketId = switchRes?.data?.new_ticket_id || switchRes?.new_ticket_id;

  // 8. Test mark_served
  console.log("\n--- Testing mark_served ---");
  const servedRes = await callTool('mark_served', {
    p_ticket_id: newTicketId || ticketId
  }, { agent_type: 'staff_copilot', confirmed_by_human: true });
  console.log(servedRes);

  // 9. Verify agent_actions logs
  console.log("\n--- Verifying agent_actions logs ---");
  const { data: logs, error: logsErr } = await supabase.from('agent_actions').select('*').order('created_at', { ascending: false }).limit(10);
  if (logsErr) {
    console.error("Error fetching logs:", logsErr);
  } else {
    console.log(`Found ${logs.length} recent logs in agent_actions.`);
    logs.forEach(l => {
      console.log(`[${l.tool_name}] confirmed: ${l.confirmed_by_human} | success: ${l.tool_result?.success || l.tool_result?.error ? false : true}`);
    });
  }

  console.log("\n=== Tests Complete ===");
}

runTests();
