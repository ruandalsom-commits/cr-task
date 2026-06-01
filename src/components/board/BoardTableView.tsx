'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { StatusCell } from './StatusCell';
import { PlusCircle, Trash2 } from 'lucide-react';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Agrupamento Real Baseado no "group_name" da tarefa.
  // Se a coluna não existir ainda no DB (undefined), jogamos todas num grupo padrão.
  const groupedTasks = tasks?.reduce((acc: any, task: any) => {
    const groupName = task.group_name || 'Este mês';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(task);
    return acc;
  }, {}) || {};

  // Grupos Padrão para visual sempre bonito mesmo vazio
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
          <div className="bg-white border-y border-slate-200">
            <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="border-b border-slate-200 text-[#676879] text-[14px]">
                  <th className="w-2 p-0"></th>
                  <th className="w-8 text-center p-0 border-r border-slate-200"></th>
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
                    <tr key={task.id} className="group/row border-b border-slate-200 hover:bg-[#f5f6f8] transition-colors h-[42px]">
                      <td className="w-2 p-0" style={{ backgroundColor: colors.bg }}></td>
                      <td className="w-8 text-center p-0 border-r border-slate-200 relative">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-slate-300 opacity-0 group-hover/row:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer" />
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
                        {/* Botão de excluir que aparece no hover da linha */}
                        <button 
                          onClick={() => {
                            if(confirm('Excluir esta tarefa?')) deleteTask.mutate(task.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover/row:opacity-100 transition-all bg-[#f5f6f8]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                  <td className="w-8 border-r border-slate-200"></td>
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
                          if (error) alert('Erro ao criar: ' + error.message);
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
    <div className="w-full pb-12 pt-6">
      {groupsToRender.map(groupName => renderGroup(groupName, groupedTasks[groupName] || []))}
    </div>
  );
}
