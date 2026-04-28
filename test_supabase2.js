import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zfdgswcbwigjqpbbrjqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGdzd2Nid2lnanFwYmJyanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODAzMDcsImV4cCI6MjA4OTI1NjMwN30.SKuBYtne6svC5Finy51QAW79Rz2cbPJbYpq7K2hP6CA');

async function test() {
  const { data: get_data, error: get_error } = await supabase.from('posts').select('*').limit(1);
  if (get_error || !get_data || get_data.length === 0) {
    console.log('Error getting:', get_error);
    return;
  }
  let post = get_data[0];
  const original_id = post.id;
  console.log('Original post:', post);

  // simulate AppContext
  post.fileUrls = undefined; // actually it's what postmodal sends
  // Add what PostModal adds:
  const dbPost = { ...post };
  dbPost.fileUrls = []; // user removed all images
  
  if (dbPost.fileUrls !== undefined) {
         if (dbPost.fileUrls.length > 0) {
            dbPost.fileUrl = JSON.stringify(dbPost.fileUrls);
         } else {
            dbPost.fileUrl = '';
         }
         delete dbPost.fileUrls;
  }
  
  // try to update
  const { data, error } = await supabase.from('posts').update(dbPost).eq('id', original_id);
  console.log('Error updating full dbPost:', error);

  // maybe try with user_id?
}
test();
