-- Script para criar a tabela de ideias de posts (post_ideas) no Supabase
-- Copie e cole este código no "SQL Editor" do seu painel do Supabase e execute.

CREATE TABLE IF NOT EXISTS post_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dia INT DEFAULT 1,
  mes INT DEFAULT 1,
  tipo TEXT DEFAULT 'estatico',
  produto TEXT,
  especial TEXT,
  titulo TEXT NOT NULL,
  hook TEXT,
  copy TEXT,
  facilidades JSONB DEFAULT '[]'::jsonb,
  story TEXT,
  cta TEXT,
  objetivo TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE post_ideas ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança de acesso
CREATE POLICY "Users can manage their own post ideas" 
ON post_ideas FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Script para criar a tabela de anotações de atividades (activities) no Supabase
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT,
  duration NUMERIC(5,2),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Criar política de segurança de acesso para atividades
CREATE POLICY "Users can manage their own activities" 
ON activities FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
