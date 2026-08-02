const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Fetching existing queues...");
  const { data: queues, error } = await supabase.from('queues').select('*');
  const business_id = queues[0].business_id;

  console.log("Creating new Gynaecology queue...");
  const { error: insertErr } = await supabase.from('queues').insert([
    { name: 'Dr. Nair Queue', department: 'Gynaecology', doctor_name: 'Dr. A. Nair', counter_number: 'Counter 4', status: 'available', is_active: true, business_id }
  ]);
  
  if (insertErr) console.error("Insert error:", insertErr);
  else console.log("Created Gynaecology queue!");
}

runMigration();
