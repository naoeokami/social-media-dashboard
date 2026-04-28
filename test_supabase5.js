import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zfdgswcbwigjqpbbrjqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGdzd2Nid2lnanFwYmJyanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODAzMDcsImV4cCI6MjA4OTI1NjMwN30.SKuBYtne6svC5Finy51QAW79Rz2cbPJbYpq7K2hP6CA');

async function test() {
  const { data: get_data } = await supabase.from('posts').select('*').eq('id', '07966154-9596-49ef-8120-4ec12bb18076');
  let p = get_data[0];

  // AppContext logic
  if (p.fileUrl && p.fileUrl.startsWith('[')) {
      try { p.fileUrls = JSON.parse(p.fileUrl); } catch(e) { p.fileUrls = [p.fileUrl]; }
  } else if (p.fileUrl) {
      p.fileUrls = [p.fileUrl];
  }
  
  // Now p is passed to PostModal as editingPost.
  // form is initialized:
  let form = {
      ...p,
      fileUrls: p.fileUrls || (p.fileUrl ? [p.fileUrl] : []),
  };

  // user removes image (it's already '[]' so fileUrls is empty array)
  // user uploads new image
  form.fileUrls = ['https://newimage.jpg'];
  form.fileUrl = 'https://newimage.jpg'; // added by PostModal logic

  // AppContext updatePost
  const dbPost = { ...form };
  if (dbPost.budget === '') dbPost.budget = null;
  if (dbPost.date === '') dbPost.date = null;
  if (dbPost.time === '') dbPost.time = null;

  if (dbPost.fileUrls !== undefined) {
         if (dbPost.fileUrls.length > 0) {
            dbPost.fileUrl = JSON.stringify(dbPost.fileUrls);
         } else {
            dbPost.fileUrl = '';
         }
         delete dbPost.fileUrls;
  }
  
  const { data, error } = await supabase.from('posts').update(dbPost).eq('id', '07966154-9596-49ef-8120-4ec12bb18076');
  console.log('Error updating:', error);
}
test();
