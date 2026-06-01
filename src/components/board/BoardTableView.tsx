'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { StatusCell } from './StatusCell';
import { PlusCircle, Trash2, MessageSquare, X, Paperclip, Activity, Copy, Download, Archive } from 'lucide-react';

const TimelineBar = ({ progress, color }: { progress: number, color: string }) => (
  <div className="flex items-center w-full">
    <div className="flex-1 h-5 rounded-full overflow-hidden bg-slate-200 flex">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
      <div className="h-full bg-slate-300 transition-all duration-500" style={{ width: `${100 - progress}%` }}></div>
    </div>
  </div>
);

const PriorityStars = ({ rating, onChange }: { rating: number, onChange: (newRating: number) => void }) => (
  <div className="flex items-center justify-center gap-0.5 group/stars cursor-pointer">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg 
        key={star} 
        onClick={() => onChange(star)}
        className={`w-4 h-4 transition-colors hover:scale-110 ${star <= rating ? 'text-[#ffcc00]' : 'text-slate-200 hover:text-yellow-200'}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export function BoardTableView({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState<any | null>(null);

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

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      setSelectedTasks([]); // Limpa seleção após excluir
    }
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  });

  const toggleSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir ${selectedTasks.length} tarefas?`)) {
      for (const id of selectedTasks) {
        await supabase.from('tasks').delete().eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      setSelectedTasks([]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const groupedTasks = tasks?.reduce((acc: any, task: any) => {
    const groupName = task.group_name || 'Este mês';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(task);
    return acc;
  }, {}) || {};

  const groupsToRender = Object.keys(groupedTasks).length > 0 
    ? Object.keys(groupedTasks) 
    : ['Este mês', 'Próximo mês'];

  const getGroupColor = (groupName: string) => {
    if (groupName === 'Próximo mês') return { text: 'text-[#a25ddc]', bg: '#a25ddc' };
    return { text: 'text-[#579bfc]', bg: '#579bfc' };
  };

  const renderGroup = (title: string, groupTasks: any[]) => {
    const colors = getGroupColor(title);
    
    return (
      <div key={title} className="mb-10">
        <div className="flex items-center gap-2 mb-3 px-8">
          <button className={`hover:opacity-80 transition-colors ${colors.text}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          <h2 className={`text-[22px] font-medium ${colors.text}`}>{title}</h2>
          <span className="text-slate-400 text-sm ml-2">{groupTasks?.length || 0} Tarefas</span>
        </div>

        <div className="px-8">
          <div className="bg-white border-y border-slate-200 rounded-tl-md overflow-hidden relative">
            <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="border-b border-slate-200 text-[#676879] text-[14px]">
                  <th className="w-2 p-0"></th>
                  <th className="w-10 text-center p-0 border-r border-slate-200"></th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200" style={{ width: '35%' }}></th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-24 text-center">Resp.</th>
                  <th className="font-normal px-0 py-0 border-r border-slate-200 w-40 text-center">Status</th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-48 text-center">Timeline</th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-32 text-center">Prazo</th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-36 text-center">Prioridade</th>
                  <th className="w-10 text-center p-0"></th>
                </tr>
              </thead>
              <tbody className="text-[15px]">
                {groupTasks && groupTasks.length > 0 ? (
                  groupTasks.map((task) => (
                    <tr key={task.id} className={`group/row border-b border-slate-200 transition-colors h-[42px] ${selectedTasks.includes(task.id) ? 'bg-blue-50/50' : 'hover:bg-[#f5f6f8]'}`}>
                      <td className="w-2 p-0" style={{ backgroundColor: colors.bg }}></td>
                      <td className="w-10 text-center p-0 border-r border-slate-200 relative bg-[#f5f6f8]">
                        <input 
                          type="checkbox" 
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => toggleSelection(task.id)}
                          className="w-4 h-4 rounded border-slate-300 opacity-0 group-hover/row:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer checked:opacity-100 accent-blue-600" 
                        />
                      </td>
                      <td className="px-4 py-0 border-r border-slate-200 relative truncate">
                        <input 
                          type="text" 
                          defaultValue={task.title} 
                          onBlur={(e) => {
                            if (e.target.value !== task.title) {
                              updateTask.mutate({ id: task.id, updates: { title: e.target.value } });
                            }
                          }}
                          className="text-[#323338] hover:text-blue-600 bg-transparent outline-none w-full cursor-text"
                        />
                        {/* Botões que aparecem no hover da linha (Chat e Excluir) */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-all bg-gradient-to-l from-white via-white to-transparent pl-4">
                          <button 
                            onClick={() => setTaskDetailsOpen(task)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md bg-white border border-slate-200 shadow-sm transition-all"
                            title="Abrir Atualizações"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { if(confirm('Excluir esta tarefa?')) deleteTask.mutate(task.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md bg-white border border-slate-200 shadow-sm transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-0 border-r border-slate-200 text-center">
                        <div className="w-8 h-8 rounded-full bg-slate-300 mx-auto overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 ring-blue-400 transition-all">
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.id}`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-0 border-r border-slate-200 relative z-10">
                        <StatusCell task={task} />
                      </td>
                      <td className="px-4 py-0 border-r border-slate-200">
                        <TimelineBar 
                          progress={task.status === 'Feito' ? 100 : task.status === 'Trabalhando' ? 60 : 30} 
                          color={task.status === 'Feito' ? 'bg-[#00c875]' : task.status === 'Trabalhando' ? 'bg-[#fdab3d]' : 'bg-[#579bfc]'} 
                        />
                      </td>
                      <td className="px-2 py-0 border-r border-slate-200 text-center text-[#323338]">
                        <input 
                          type="date" 
                          defaultValue={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateTask.mutate({ id: task.id, updates: { due_date: e.target.value } })}
                          className="bg-transparent outline-none text-sm cursor-pointer hover:bg-slate-200 p-1 rounded transition-colors w-full text-center"
                        />
                      </td>
                      <td className="px-4 py-0 border-r border-slate-200 text-center">
                        <PriorityStars 
                          rating={task.priority === 'Alta' ? 5 : task.priority === 'Baixa' ? 2 : 4} 
                          onChange={(rating) => {
                            const newPriority = rating === 5 ? 'Alta' : rating <= 2 ? 'Baixa' : 'Média';
                            updateTask.mutate({ id: task.id, updates: { priority: newPriority } });
                          }}
                        />
                      </td>
                      <td className="w-10 text-center p-0"></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-slate-400 text-sm">
                      Nenhuma tarefa aqui ainda.
                    </td>
                  </tr>
                )}
                
                {/* Linha de Adicionar Item */}
                <tr className="hover:bg-[#f5f6f8] transition-colors h-[42px]">
                  <td className="w-2 p-0 bg-transparent border-l-[3px] border-transparent group-hover:border-l-slate-300"></td>
                  <td className="w-10 border-r border-slate-200 bg-[#f5f6f8]"></td>
                  <td colSpan={7} className="px-4 py-0">
                    <input 
                      type="text" 
                      placeholder="+ Adicionar Item" 
                      className="w-full bg-transparent text-[#323338] placeholder-slate-400 outline-none text-[14px]"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                          const taskTitle = e.currentTarget.value.trim();
                          e.currentTarget.value = '';
                          const { error } = await supabase.from('tasks').insert([
                            { 
                              title: taskTitle, 
                              board_id: boardId, 
                              group_name: title, 
                              position: (groupTasks?.length || 0) + 1 
                            }
                          ]);
                          if (error) {
                            alert('Erro ao criar: ' + error.message);
                          } else {
                            queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
                          }
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
  };

  return (
    <div className="w-full h-full relative">
      <div className="w-full pb-32 pt-6">
        {groupsToRender.map(groupName => renderGroup(groupName, groupedTasks[groupName] || []))}
      </div>

      {/* Floating Action Bar (Múltiplas Seleções) */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-slate-200 px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {selectedTasks.length}
            </div>
            <span className="font-medium text-slate-700 text-sm">Tarefas Selecionadas</span>
          </div>
          
          <div className="w-px h-6 bg-slate-200"></div>

          <div className="flex items-center gap-1">
            <button className="flex flex-col items-center justify-center w-16 text-slate-500 hover:text-slate-800 transition-colors">
              <Copy className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-medium">Duplicar</span>
            </button>
            <button className="flex flex-col items-center justify-center w-16 text-slate-500 hover:text-slate-800 transition-colors">
              <Download className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-medium">Exportar</span>
            </button>
            <button className="flex flex-col items-center justify-center w-16 text-slate-500 hover:text-slate-800 transition-colors">
              <Archive className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-medium">Arquivar</span>
            </button>
            <button 
              onClick={handleBulkDelete}
              className="flex flex-col items-center justify-center w-16 text-slate-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-medium">Excluir</span>
            </button>
          </div>

          <button onClick={() => setSelectedTasks([])} className="ml-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Task Drawer (Gaveta Lateral de Atualizações) */}
      {taskDetailsOpen && (
        <>
          {/* Overlay Escuro */}
          <div 
            className="fixed inset-0 bg-slate-900/20 z-40" 
            onClick={() => setTaskDetailsOpen(null)}
          ></div>

          {/* Gaveta */}
          <div className="fixed top-0 right-0 h-screen w-[600px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800">{taskDetailsOpen.title}</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"><MessageSquare className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                <button onClick={() => setTaskDetailsOpen(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex gap-6 px-6 border-b border-slate-100 text-sm font-medium text-slate-500">
              <button className="pb-3 border-b-2 border-blue-600 text-blue-600 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Atualizações
              </button>
              <button className="pb-3 border-b-2 border-transparent hover:text-slate-800 flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Arquivos
              </button>
              <button className="pb-3 border-b-2 border-transparent hover:text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Log de atividade
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-8">
                <div className="flex items-center gap-4 text-slate-400 border-b border-slate-100 pb-3 mb-3 text-sm">
                  <button className="hover:text-slate-700 font-bold">B</button>
                  <button className="hover:text-slate-700 italic">I</button>
                  <button className="hover:text-slate-700 underline">U</button>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <button className="hover:text-slate-700"><Paperclip className="w-4 h-4" /></button>
                </div>
                <textarea 
                  placeholder="Escreva uma atualização..." 
                  className="w-full min-h-[100px] resize-none outline-none text-slate-700 text-sm"
                ></textarea>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><span className="text-xs font-bold">@</span></button>
                    <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded text-xs">GIF</button>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                    Atualizar
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center mt-12 text-slate-400">
                <div className="w-32 h-32 mb-4 opacity-50 relative">
                   {/* Placeholder para a imagem de empty state do monday */}
                   <div className="absolute inset-0 bg-blue-100 rounded-2xl flex items-center justify-center">
                     <MessageSquare className="w-12 h-12 text-blue-300" />
                   </div>
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-1">Nenhuma atualização ainda</h3>
                <p className="text-sm max-w-xs">Compartilhe o progresso, mencione um colega ou carregue um arquivo para dar andamento às coisas.</p>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
