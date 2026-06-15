'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ShieldAlert, BarChart3, ArrowLeft, PieChart as PieChartIcon } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

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
      const { data, error } = await supabase.from('tasks').select('id, status, assignee_email');
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

  // Processar dados para o gráfico de Pizza (Status)
  const statusCounts = allTasks?.reduce((acc: any, task: any) => {
    const status = task.status || 'Pendente';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = statusCounts ? Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  })) : [];

  // Processar dados para o Gráfico de Barras (Desempenho por Usuário)
  const userStats = allTasks?.reduce((acc: any, task: any) => {
    if (!task.assignee_email) return acc;
    
    // Suportar múltiplos emails separados por vírgula
    const emails = task.assignee_email.split(',').map((e: string) => e.trim()).filter(Boolean);
    
    emails.forEach((email: string) => {
      const username = email.split('@')[0];
      if (!acc[username]) {
        acc[username] = { name: username, concluido: 0, pendente: 0 };
      }
      if (task.status === 'Feito') {
        acc[username].concluido += 1;
      } else {
        acc[username].pendente += 1;
      }
    });
    return acc;
  }, {});

  const barData = userStats ? Object.values(userStats).sort((a: any, b: any) => (b.concluido + b.pendente) - (a.concluido + a.pendente)).slice(0, 10) : []; // Top 10 usuários com mais tarefas

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="Voltar ao Painel Admin">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-black text-slate-800">Relatórios e Insights</h1>
      </div>
      
      {isLoading ? (
        <div className="text-slate-500">Carregando dados...</div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-slate-500 font-semibold mb-2">Total de Tarefas Cadastradas</h2>
              <p className="text-5xl font-black text-slate-800">{totalTasks}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-emerald-600 font-semibold mb-2">Tarefas Concluídas (Feito)</h2>
                <p className="text-5xl font-black text-emerald-600">{completedTasks}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <PieChartIcon className="w-32 h-32 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-200">
              <h2 className="text-orange-600 font-semibold mb-2">Tarefas Pendentes / Em andamento</h2>
              <p className="text-5xl font-black text-orange-600">{pendingTasks}</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gráfico de Status */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-500" />
                Status das Tarefas
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Feito' ? '#10b981' : entry.name === 'Travado' ? '#ef4444' : entry.name === 'Trabalhando' ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Produtividade */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Carga de Trabalho por Usuário (Top 10)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="concluido" name="Concluídas" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="pendente" name="Pendentes" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
