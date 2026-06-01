'use client';
import { useState, use, useEffect } from 'react';
import { BoardTableView } from '@/components/board/BoardTableView';
import { BoardKanbanView } from '@/components/board/BoardKanbanView';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

// Ajuste para lidar com a prop params do Next.js App Router (usando hook 'use' do React)
export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  const [activeTab, setActiveTab] = useState<'tabela' | 'kanban'>('tabela');
  const queryClient = useQueryClient();

  useEffect(() => {
    // Inscreve no canal do Supabase para escutar qualquer mudança nas tarefas
    const channel = supabase
      .channel('realtime_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        // Toda vez que alguém insere, altera ou deleta uma tarefa, recarrega os dados na tela
        queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, queryClient]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header do Quadro */}
      <div className="flex flex-col border-b border-slate-200 p-6 pb-0 gap-6 bg-white z-20">
        <div>
          <h1 className="text-3xl font-black text-[#323338]">Desenvolvimento Principal</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie suas tarefas com a visualização que preferir.</p>
        </div>
        
        {/* Abas Interativas */}
        <div className="flex gap-6 text-[14px] font-medium">
          <button 
            onClick={() => setActiveTab('tabela')}
            className={`pb-3 border-b-[3px] transition-colors ${
              activeTab === 'tabela' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-[#676879] hover:text-[#323338]'
            }`}
          >
            Tabela Principal
          </button>
          
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`pb-3 border-b-[3px] transition-colors ${
              activeTab === 'kanban' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-[#676879] hover:text-[#323338]'
            }`}
          >
            Kanban
          </button>
          
          <button className="pb-3 border-b-[3px] border-transparent text-[#676879] hover:text-[#323338]">
            Gráficos (Em Breve)
          </button>
        </div>
      </div>

      {/* Renderização Condicional do Conteúdo */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'tabela' ? (
          <BoardTableView boardId={boardId} />
        ) : (
          <BoardKanbanView boardId={boardId} />
        )}
      </div>
    </div>
  );
}
