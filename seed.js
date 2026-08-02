const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uncnpqrbstmjrqewxoao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding data...');

  // 1. BUSINESS
  const businessId = '11111111-1111-1111-1111-111111111111';
  const { error: err1 } = await supabase.from('businesses').upsert([
    { id: businessId, name: 'City Care Hospital' }
  ]);
  if (err1) console.error('Error business:', err1);

  const { error: err2 } = await supabase.from('doctors').upsert(doctors);
  if (err2) console.error('Error doctors:', err2);

  const { error: err3 } = await supabase.from('queues').upsert(queues);
  if (err3) console.error('Error queues:', err3);

  let errTickets = 0;
  for (const ticket of tickets) {
    const { error } = await supabase.from('tickets').insert(ticket);
    if (error) {
      console.error('Error ticket:', error);
      errTickets++;
    }
  }
  console.log(`Tickets inserted. Errors: ${errTickets}`);
}

seed().catch(console.error);
