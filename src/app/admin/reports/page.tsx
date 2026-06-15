'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ShieldAlert, BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  // Buscar todas as tarefas
  const { data: allTasks, isLoading } = useQuery({
    queryKey: ['admin_all_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('id, status');
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true
  });

  if (isAdmin === null) return <div className="p-10 text-center">Verificando permissões...</div>;
  if (isAdmin === false) return (
    <div className="p-10 flex flex-col items-center justify-center h-screen bg-slate-50">
      <ShieldAlert className="w-20 h-20 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-800">Acesso Negado</h1>
      <p className="text-slate-500 mt-2">Você não tem permissão de administrador para acessar esta página.</p>
      <Link href="/" className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Voltar ao Início</Link>
    </div>
  );

  const totalTasks = allTasks?.length || 0;
  const completedTasks = allTasks?.filter(t => t.status === 'Feito').length || 0;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="Voltar ao Painel Admin">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-black text-slate-800">Relatórios e Insights (Etapa 1)</h1>
      </div>
      
      {isLoading ? (
        <div className="text-slate-500">Carregando dados...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-slate-500 font-semibold mb-2">Total de Tarefas Cadastradas</h2>
            <p className="text-5xl font-black text-slate-800">{totalTasks}</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200">
            <h2 className="text-emerald-600 font-semibold mb-2">Tarefas Concluídas (Feito)</h2>
            <p className="text-5xl font-black text-emerald-600">{completedTasks}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200">
            <h2 className="text-orange-600 font-semibold mb-2">Tarefas Pendentes / Em andamento</h2>
            <p className="text-5xl font-black text-orange-600">{pendingTasks}</p>
          </div>
        </div>
      )}
    </div>
  );
}
