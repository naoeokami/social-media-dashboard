import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zfdgswcbwigjqpbbrjqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGdzd2Nid2lnanFwYmJyanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODAzMDcsImV4cCI6MjA4OTI1NjMwN30.SKuBYtne6svC5Finy51QAW79Rz2cbPJbYpq7K2hP6CA');

async function test() {
  const superLong = JSON.stringify([
    "https://zfdgswcbwigjqpbbrjqk.supabase.co/storage/v1/object/public/posts_images/d8c1c4f5-9a8b-4b21-8848-18eb9cd394b9-image.jpg",
    "https://zfdgswcbwigjqpbbrjqk.supabase.co/storage/v1/object/public/posts_images/d8c1c4f5-9a8b-4b21-8848-18eb9cd394b9-image.jpg",
    "https://zfdgswcbwigjqpbbrjqk.supabase.co/storage/v1/object/public/posts_images/d8c1c4f5-9a8b-4b21-8848-18eb9cd394b9-image.jpg"
  ]);
  const { error } = await supabase.from('posts').update({ fileUrl: superLong }).eq('id', '4d7fc07f-727e-4954-8a09-62de73ee7d11');
  console.log('Error long 3:', error);
}
test();
