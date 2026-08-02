const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data, error } = await supabase.from('doctors').select('*');
  if (error) {
    console.error("Error fetching doctors:", error);
  } else {
    console.log("Doctors table exists! Data:", data);
  }
}

checkTables();
