'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { LayoutTemplate, Grid } from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
  const { data: boards, isLoading } = useQuery({
    queryKey: ['sidebar_boards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('boards').select('*').order('created_at');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 hidden md:flex shrink-0">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-orange-500 text-white flex items-center justify-center font-bold">
          A
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-[14px] leading-tight">Minha Equipe</h3>
          <span className="text-xs text-slate-500">Plano Pro</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between text-slate-500 hover:bg-slate-100 p-2 rounded-md cursor-pointer mb-2 transition-colors group">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" />
            <span className="text-[14px] font-medium">Meus Quadros</span>
          </div>
          <button 
            onClick={async () => {
              const name = prompt('Nome do novo quadro:');
              if (name) {
                // Para o MVP, estamos assumindo que o usuário só tem 1 workspace no array. Na versão final puxaremos isso dinamicamente.
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
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600 transition-all"
            title="Adicionar Novo Quadro"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>

        {isLoading ? (
          <div className="px-2 py-2 text-xs text-slate-400">Carregando quadros...</div>
        ) : (
          <div className="flex flex-col gap-1">
            {boards?.map(board => (
              <div key={board.id} className="flex items-center group/board relative">
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
                      window.location.href = '/'; // Volta para a home
                    }
                  }}
                  className="absolute right-2 opacity-0 group-hover/board:opacity-100 p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500 transition-all"
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
  );
}
