'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true); // Controla se estamos no modo Login ou Cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (isLogin) {
      // -------------------- FLUXO DE LOGIN --------------------
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        setLoading(false);
      } else {
        window.location.href = '/'; // Deixa a página inicial decidir para qual quadro enviar
      }
    } else {
      // ------------------ FLUXO DE CRIAR CONTA ------------------
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccessMsg('Conta criada com sucesso! Você já pode fazer o login.');
        setIsLogin(true); // Joga a pessoa de volta pro form de login
        setPassword('');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-100 transition-all">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200">
            M
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
          {isLogin ? 'Faça login na sua conta' : 'Crie sua conta'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              E-mail corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="exemplo@suaempresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading 
              ? 'Processando...' 
              : isLogin 
                ? 'Entrar na minha equipe' 
                : 'Cadastrar nova conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMsg('');
              }} 
              className="ml-2 font-semibold text-blue-600 hover:underline outline-none"
            >
              {isLogin ? 'Crie uma agora' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
