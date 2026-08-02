const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Fetching existing queues...");
  const { data: queues, error } = await supabase.from('queues').select('*');
  const business_id = queues[0].business_id;

  console.log("Creating default queues...");
  const { error: insertErr } = await supabase.from('queues').insert([
    { name: 'Dr. Verma Queue', department: 'Pediatrics', doctor_name: 'Dr. P. Verma', counter_number: 'Counter 2', status: 'available', is_active: true, business_id },
    { name: 'Dr. Kulkarni Queue', department: 'Dental', doctor_name: 'Dr. S. Kulkarni', counter_number: 'Counter 3', status: 'available', is_active: true, business_id }
  ]);
  
  if (insertErr) console.error("Insert error:", insertErr);
  else console.log("Created 2 more default queues!");
}

runMigration();
