import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zfdgswcbwigjqpbbrjqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGdzd2Nid2lnanFwYmJyanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODAzMDcsImV4cCI6MjA4OTI1NjMwN30.SKuBYtne6svC5Finy51QAW79Rz2cbPJbYpq7K2hP6CA');

async function test() {
  const { data, error } = await supabase.from('posts').select().limit(1);
  if (data) {
     console.log(Object.keys(data[0]));
     console.log(data[0]);
  }
}
test();
