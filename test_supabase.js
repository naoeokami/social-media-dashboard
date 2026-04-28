import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zfdgswcbwigjqpbbrjqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGdzd2Nid2lnanFwYmJyanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODAzMDcsImV4cCI6MjA4OTI1NjMwN30.SKuBYtne6svC5Finy51QAW79Rz2cbPJbYpq7K2hP6CA');

async function test() {
  const { data, error } = await supabase.from('posts').update({ fileUrl: '' }).eq('id', '07966154-9596-49ef-8120-4ec12bb18076');
  console.log('Error 1:', error);

  const { data: d2, error: e2 } = await supabase.from('posts').update({ fileUrl: '[]' }).eq('id', '07966154-9596-49ef-8120-4ec12bb18076');
  console.log('Error 2:', e2);
}
test();
