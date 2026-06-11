-- Adiciona a coluna role na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Atualiza o seu usuário atual para admin
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email de login
UPDATE profiles SET role = 'admin' WHERE email = 'ruan.dalsom@masterdeliveryexpress.com.br'; -- ou seu email principal
