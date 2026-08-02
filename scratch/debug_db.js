const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Check all tickets
  const { data: tickets, error: tErr } = await supabase
    .from('tickets')
    .select('id, queue_id, token_number, status, customer_phone, joined_at')
    .order('joined_at', { ascending: false })
    .limit(20);
  
  console.log("=== RECENT TICKETS ===");
  console.log(JSON.stringify(tickets, null, 2));
  if (tErr) console.error("Tickets error:", tErr);

  // Check queues
  const { data: queues } = await supabase.from('queues').select('*');
  console.log("\n=== QUEUES ===");
  console.log(JSON.stringify(queues, null, 2));
}

check();
