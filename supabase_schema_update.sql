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

-- 5. Criar a tabela de modelos de IA (ai_models)
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'gemini' ou 'openrouter'
  name TEXT NOT NULL, -- Nome de exibição amigável
  value TEXT NOT NULL UNIQUE, -- Identificador/valor real do modelo (ex: 'deepseek/deepseek-chat')
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para segurança
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública dos modelos
CREATE POLICY "Allow read access to ai_models for everyone" 
ON ai_models FOR SELECT 
USING (true);

-- Permitir inserção/edição/deleção para usuários autenticados
CREATE POLICY "Allow all actions for authenticated users on ai_models" 
ON ai_models FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Inserir alguns modelos padrões se não existirem
INSERT INTO ai_models (provider, name, value) VALUES
('gemini', 'gemini-2.5-flash (Recomendado)', 'gemini-2.5-flash'),
('gemini', 'gemini-2.5-pro (Raciocínio avançado)', 'gemini-2.5-pro'),
('gemini', 'gemini-1.5-flash', 'gemini-1.5-flash'),
('gemini', 'gemini-3.1-flash-lite-preview', 'gemini-3.1-flash-lite-preview'),
('openrouter', 'google/gemini-2.5-flash (Recomendado)', 'google/gemini-2.5-flash'),
('openrouter', 'google/gemini-2.5-pro', 'google/gemini-2.5-pro'),
('openrouter', 'meta-llama/llama-3.3-70b-instruct', 'meta-llama/llama-3.3-70b-instruct'),
('openrouter', 'deepseek/deepseek-chat', 'deepseek/deepseek-chat'),
('openrouter', 'anthropic/claude-3.5-sonnet', 'anthropic/claude-3.5-sonnet'),
('openrouter', 'meta-llama/llama-3-8b-instruct:free', 'meta-llama/llama-3-8b-instruct:free')
ON CONFLICT (value) DO NOTHING;

-- 6. Adicionar a coluna story_stickers na tabela posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS story_stickers TEXT;
