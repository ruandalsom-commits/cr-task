'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { LayoutTemplate, Grid, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: boards, isLoading } = useQuery({
    queryKey: ['sidebar_boards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('boards').select('*').order('created_at');
      if (error) throw error;
      return data;
    }
  });

  const { data: userProfile } = useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const initial = userProfile?.email ? userProfile.email.charAt(0).toUpperCase() : 'U';
  const displayName = userProfile?.email ? userProfile.email.split('@')[0] : 'Usuário';

  return (
    <div className={`relative bg-white border-slate-200 flex flex-col z-10 hidden md:flex shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 border-r-0' : 'w-64 border-r'}`}>
      
      {/* Botão de Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 shadow-sm z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`flex flex-col h-full w-64 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-orange-500 text-white flex items-center justify-center font-bold">
              {initial}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-[14px] leading-tight truncate">{displayName}</h3>
              <span className="text-xs text-slate-500">Workspace</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between text-slate-500 hover:bg-slate-100 p-2 rounded-md cursor-pointer mb-2 transition-colors group shrink-0">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />
              <span className="text-[14px] font-medium">Meus Quadros</span>
            </div>
            <button 
              onClick={async () => {
                const name = prompt('Nome do novo quadro:');
                if (name) {
                  const { data: ws } = await supabase.from('workspaces').select('id').limit(1);
                  if (ws && ws.length > 0) {
                    const { data, error } = await supabase.from('boards').insert([{ name, workspace_id: ws[0].id }]).select();
                    if (!error && data) {
                      window.location.href = `/boards/${data[0].id}`;
                    }
                  } else {
                    alert('Você precisa criar uma Área de Trabalho primeiro!');
                  }
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600 transition-all shrink-0"
              title="Adicionar Novo Quadro"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>

          {isLoading ? (
            <div className="px-2 py-2 text-xs text-slate-400 shrink-0">Carregando quadros...</div>
          ) : (
            <div className="flex flex-col gap-1 shrink-0">
              {boards?.map(board => (
                <div key={board.id} className="flex items-center group/board relative shrink-0">
                  <Link 
                    href={`/boards/${board.id}`}
                    className="flex items-center gap-2 text-[#323338] hover:bg-slate-100 p-2 rounded-md cursor-pointer transition-colors w-full"
                  >
                    <Grid className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-[14px] font-medium truncate pr-8">{board.name}</span>
                  </Link>
                  <button 
                    onClick={async (e) => {
                      e.preventDefault();
                      if(confirm(`Excluir o quadro "${board.name}"? Todas as tarefas serão perdidas!`)) {
                        await supabase.from('boards').delete().eq('id', board.id);
                        window.location.href = '/'; 
                      }
                    }}
                    className="absolute right-2 opacity-0 group-hover/board:opacity-100 p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500 transition-all shrink-0"
                    title="Excluir Quadro"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
