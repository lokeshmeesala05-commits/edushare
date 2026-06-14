import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://auamyuvvlmgllljdmedk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YW15dXZ2bG1nbGxsamRtZWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzYzNTYsImV4cCI6MjA5NjE1MjM1Nn0.LswruK1C77iKr9k53M0dcZ00H2hxGVPCeQP7DKhDcfY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchNotes() {
  const { data, error } = await supabase.from('notes').select('*');
  if (error) {
    console.error('Error fetching notes:', error);
    process.exit(1);
  }
  console.log('Notes:', JSON.stringify(data, null, 2));
}

fetchNotes();
