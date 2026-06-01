'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  // 1. Puxar todos os Workspaces
  const { data: workspaces } = useQuery({
    queryKey: ['admin_workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workspaces').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });

  // 2. Puxar todos os Perfis (Usuários)
  const { data: profiles } = useQuery({
    queryKey: ['admin_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('email');
      if (error) throw error;
      return data;
    },
  });

  // 3. Criar novo Workspace
  const createWorkspace = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('workspaces').insert([{ name }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_workspaces'] });
      setNewWorkspaceName('');
    },
    onError: (err: any) => {
      alert('Erro ao criar equipe: ' + err.message);
    }
  });

  // 4. Adicionar Usuário ao Workspace
  const addMember = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspace || !selectedUser) return;
      const { error } = await supabase.from('workspace_members').insert([
        { workspace_id: selectedWorkspace, user_id: selectedUser }
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      alert('Usuário adicionado com sucesso!');
      setSelectedUser('');
    },
    onError: (err: any) => {
      alert('Erro ao adicionar (Talvez já esteja na equipe?): ' + err.message);
    }
  });

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-slate-800 mb-8">Painel de Administração</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Bloco 1: Criar Equipe */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-700 mb-4">1. Criar Nova Equipe</h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Ex: Equipe de TI"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => createWorkspace.mutate(newWorkspaceName)}
              disabled={!newWorkspaceName || createWorkspace.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Criar
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">Equipes Existentes:</h3>
            <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
              {workspaces?.map((w: any) => (
                <li key={w.id} className="p-3 text-slate-700">{w.name}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bloco 2: Alocar Usuário */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-700 mb-4">2. Colocar na Equipe</h2>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Selecione a Equipe</label>
              <select 
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="">-- Escolha uma equipe --</option>
                {workspaces?.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Selecione o Usuário</label>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"
              >
                <option value="">-- Escolha um usuário --</option>
                {profiles?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.email}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => addMember.mutate()}
              disabled={!selectedWorkspace || !selectedUser || addMember.isPending}
              className="mt-2 bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
            >
              Alocar Usuário nesta Equipe
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
