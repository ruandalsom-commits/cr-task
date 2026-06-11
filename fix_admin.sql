-- Primeiro garantimos a coluna role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Em seguida, inserimos (se não existir) ou atualizamos (se já existir)
-- o perfil pegando o ID direto da tabela de autenticação
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'ruan.dalsom@masterdeliveryexpress.com.br'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin', email = EXCLUDED.email;
