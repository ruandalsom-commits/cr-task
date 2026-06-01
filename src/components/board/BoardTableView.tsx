'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { StatusCell } from './StatusCell';
import { MessageSquare, FileText, UserPlus, MoreHorizontal } from 'lucide-react';

export function BoardTableView({ boardId }: { boardId: string }) {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId)
        .order('position');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 pb-12">
      {/* Grupo de Tarefas */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-2">
          <button className="text-[#579bfc] hover:text-blue-700 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transform -rotate-90">
              <path d="M12 16L6 10H18L12 16Z" />
            </svg>
          </button>
          <h2 className="text-[18px] font-medium text-[#579bfc]">A Fazer</h2>
          <span className="text-slate-400 text-sm ml-2">{tasks?.length || 0} Tarefas</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#676879] text-[13px]">
                <th className="w-2 p-0 bg-[#579bfc]"></th>
                <th className="w-8 text-center p-0 border-r border-slate-200"><input type="checkbox" className="w-3 h-3 rounded-sm border-slate-300" /></th>
                <th className="font-normal px-4 py-2 border-r border-slate-200 min-w-[300px]">Item</th>
                <th className="font-normal px-4 py-2 border-r border-slate-200 w-32 text-center">Pessoa</th>
                <th className="font-normal px-0 py-0 border-r border-slate-200 w-36 text-center">Status</th>
                <th className="font-normal px-4 py-2 w-36 text-center">Data</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr key={task.id} className="group border-b border-slate-200 hover:bg-[#f5f6f8] transition-colors h-[36px]">
                    <td className="w-2 p-0 bg-[#579bfc]"></td>
                    <td className="w-8 text-center p-0 border-r border-slate-200 relative">
                      <input type="checkbox" className="w-3 h-3 rounded-sm border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </td>
                    <td className="px-4 py-0 border-r border-slate-200 relative">
                      <div className="flex items-center justify-between">
                        <input 
                          type="text" 
                          defaultValue={task.title} 
                          onBlur={async (e) => {
                            if (e.target.value !== task.title) {
                              await supabase.from('tasks').update({ title: e.target.value }).eq('id', task.id);
                            }
                          }}
                          className="text-[#323338] hover:text-blue-600 bg-transparent outline-none w-full cursor-text"
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#f5f6f8] pl-2 absolute right-2">
                          <button 
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-500"
                            title="Chat da Tarefa"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if(confirm('Tem certeza que deseja excluir esta tarefa?')) {
                                await supabase.from('tasks').delete().eq('id', task.id);
                              }
                            }}
                            className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-500"
                            title="Excluir Tarefa"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-0 border-r border-slate-200 text-center">
                      <button className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 inline-flex items-center justify-center hover:bg-slate-300 transition-colors">
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="p-0 border-r border-slate-200">
                      <StatusCell task={task} />
                    </td>
                    <td className="px-4 py-0 text-center text-[#323338]">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                    Nenhuma tarefa aqui ainda.
                  </td>
                </tr>
              )}
              
              {/* Linha de Adicionar Item */}
              <tr className="hover:bg-[#f5f6f8] transition-colors h-[36px]">
                <td className="w-2 p-0 bg-transparent border-l-[3px] border-transparent group-hover:border-[#579bfc]"></td>
                <td className="w-8 border-r border-slate-200"></td>
                <td colSpan={4} className="px-4 py-0">
                  <input 
                    type="text" 
                    placeholder="+ Adicionar Item" 
                    className="w-full bg-transparent text-[#323338] placeholder-slate-400 outline-none text-[14px]"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                        const title = e.currentTarget.value.trim();
                        e.currentTarget.value = '';
                        await supabase.from('tasks').insert([{ title, board_id: boardId, position: (tasks?.length || 0) + 1 }]);
                        // O Realtime ou invalidateQueries vai atualizar a tela sozinho depois
                      }
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
