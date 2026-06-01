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
        // Recarrega os dados na tela
        queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header do Quadro */}
      <div className="flex flex-col border-b border-slate-200 px-8 pt-8 pb-0 gap-6 bg-white z-20">
        <div className="flex justify-between items-start">
          <h1 className="text-[32px] font-bold text-[#323338] tracking-tight">Panorama do projeto</h1>
          <button className="p-2 hover:bg-slate-100 rounded text-slate-500">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 12a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </button>
        </div>
        
        {/* Abas Interativas e Botões */}
        <div className="flex justify-between items-end">
          <div className="flex gap-6 text-[14px] font-medium">
            <button 
              onClick={() => setActiveTab('tabela')}
              className={`pb-2 border-b-[3px] transition-colors flex items-center gap-2 ${
                activeTab === 'tabela' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-[#676879] hover:text-[#323338]'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18M9 21V9"/></svg>
              Tabela principal
            </button>
            
            <button className="pb-2 border-b-[3px] border-transparent text-[#676879] hover:text-[#323338] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 transform rotate-90"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              Timeline
            </button>

            <button 
              onClick={() => setActiveTab('kanban')}
              className={`pb-2 border-b-[3px] transition-colors flex items-center gap-2 ${
                activeTab === 'kanban' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-[#676879] hover:text-[#323338]'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 3v18M15 3v18"/></svg>
              Kanban
            </button>
            
            <button className="pb-2 border-b-[3px] border-transparent text-[#676879] hover:text-[#323338] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              Painel
            </button>
            
            <button className="pb-2 border-b-[3px] border-transparent text-slate-400 hover:text-[#323338] flex items-center gap-2">
              +
            </button>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-[#676879] mb-2 font-medium">
            <button className="flex items-center gap-1.5 hover:bg-slate-100 px-2 py-1 rounded transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              Integrar
            </button>
            <button className="flex items-center gap-1.5 hover:bg-slate-100 px-2 py-1 rounded transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              Automatizar / 2
            </button>
          </div>
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
