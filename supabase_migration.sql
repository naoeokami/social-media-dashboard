-- Script para adicionar a coluna user_id de forma segura (sem apagar seus dados atuais)

-- 1. Cria a coluna user_id indicando que ela armazena textos no formato UUID (o formato padrão de IDs do Supabase Auth).
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.swipe_items ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.shortcuts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. Opcional: Se você quiser amarrar as tabelas para que os dados sejam excluídos automaticamente caso o usuário delete a conta
-- (Descomente as linhas abaixo removendo os "--" se quiser esse comportamento)
-- ALTER TABLE public.posts ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.todos ADD CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.swipe_items ADD CONSTRAINT swipe_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.shortcuts ADD CONSTRAINT shortcuts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.products ADD CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.segments ADD CONSTRAINT segments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
