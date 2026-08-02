const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Fetching existing queues...");
  const { data: queues, error } = await supabase.from('queues').select('*');
  if (error) {
    console.error("Error fetching queues:", error);
    return;
  }
  
  if (!queues || queues.length === 0) {
    console.log("No queues found. Creating default queues...");
    // Create new queues
    const { error: insertErr } = await supabase.from('queues').insert([
      { name: 'Dr. Sharma Queue', department: 'General OPD', doctor_name: 'Dr. A. Sharma', counter_number: 'Counter 1', status: 'available', is_active: true },
      { name: 'Dr. Verma Queue', department: 'Pediatrics', doctor_name: 'Dr. P. Verma', counter_number: 'Counter 2', status: 'available', is_active: true },
      { name: 'Dr. Kulkarni Queue', department: 'Dental', doctor_name: 'Dr. S. Kulkarni', counter_number: 'Counter 3', status: 'available', is_active: true }
    ]);
    if (insertErr) console.error("Insert error:", insertErr);
    else console.log("Created 3 default queues!");
    return;
  }

  console.log("Updating existing queues...");
  // Update up to 3 queues with the hardcoded data to simulate the matrix
  const updates = [
    { department: 'General OPD', doctor_name: 'Dr. A. Sharma', counter_number: 'Counter 1', status: 'available' },
    { department: 'Pediatrics', doctor_name: 'Dr. P. Verma', counter_number: 'Counter 2', status: 'available' },
    { department: 'Dental', doctor_name: 'Dr. S. Kulkarni', counter_number: 'Counter 3', status: 'available' }
  ];

  for (let i = 0; i < queues.length; i++) {
    const updateData = updates[i % updates.length];
    const { error: updateErr } = await supabase.from('queues').update(updateData).eq('id', queues[i].id);
    if (updateErr) {
      console.error(`Error updating queue ${queues[i].id}:`, updateErr);
    } else {
      console.log(`Updated queue ${queues[i].id} with doctor ${updateData.doctor_name}`);
    }
  }

  console.log("Migration complete.");
}

runMigration();
