-- Script para atualizar o banco de dados do Supabase
-- Copie e cole este código no "SQL Editor" do seu painel do Supabase e execute.

-- 1. Criar a tabela de perfis sociais
CREATE TABLE IF NOT EXISTS social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security) na nova tabela para segurança dos dados por usuário
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de segurança de acesso
CREATE POLICY "Users can manage their own social profiles" 
ON social_profiles FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Adicionar a coluna profile_ids na tabela posts se ela não existir
ALTER TABLE posts ADD COLUMN IF NOT EXISTS profile_ids TEXT;
