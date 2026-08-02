const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  // Test 1: Simple query without priority ordering
  console.log("=== TEST 1: Simple query (no priority order) ===");
  const { data: d1, error: e1 } = await supabase
    .from("tickets")
    .select("*")
    .eq("queue_id", "22222222-2222-2222-2222-222222222222")
    .in("status", ["waiting", "called"]);
  console.log("Data:", d1);
  console.log("Error:", e1);

  // Test 2: With priority ordering (what the dashboard does)
  console.log("\n=== TEST 2: With priority order (dashboard query) ===");
  const { data: d2, error: e2 } = await supabase
    .from("tickets")
    .select("*")
    .eq("queue_id", "22222222-2222-2222-2222-222222222222")
    .in("status", ["waiting", "called"])
    .order("priority", { ascending: false })
    .order("joined_at", { ascending: true });
  console.log("Data:", d2);
  console.log("Error:", e2);

  // Test 3: Check if priority column exists
  console.log("\n=== TEST 3: Check ticket columns ===");
  const { data: d3, error: e3 } = await supabase
    .from("tickets")
    .select("id, token_number, status, priority")
    .eq("queue_id", "22222222-2222-2222-2222-222222222222")
    .limit(1);
  console.log("Data:", d3);
  console.log("Error:", e3);
}

check();
