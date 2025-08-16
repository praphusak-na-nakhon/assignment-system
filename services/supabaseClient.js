const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://dsqcgrkvoyiqanzicpgz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcWNncmt2b3lpcWFuemljcGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTkxNzksImV4cCI6MjA3MDY3NTE3OX0.YPbI4oz80Ukkgq-7EVnG9oK_tNpAOkzWlSizEJUNklw';

console.log(`🔗 Supabase config: URL exists: ${!!supabaseUrl}, Key exists: ${!!supabaseKey}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`🔗 Supabase client initialized: ${supabaseUrl.substring(0, 30)}...`);

module.exports = supabase;