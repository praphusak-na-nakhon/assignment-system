const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`🔗 Supabase client initialized: ${supabaseUrl.substring(0, 30)}...`);

module.exports = supabase;