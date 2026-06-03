'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { StatusCell } from './StatusCell';
import { PriorityCell } from './PriorityCell';
import { AssigneeCell } from './AssigneeCell';
import { PlusCircle, Trash2, MessageSquare, X, Paperclip, Activity, Copy, Download, Archive, MoreHorizontal, MessageCirclePlus, AlertCircle, CheckCircle2, Search, UserPlus, Sparkles, FileText, Calendar } from 'lucide-react';

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
  const [newUpdateText, setNewUpdateText] = useState('');

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [priorityFilterOpen, setPriorityFilterOpen] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Para resolver fuso horário
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', day: 'numeric' }).format(date).replace('.', '');
  };

  const getDueStatus = (dateString: string, status: string) => {
    if (!dateString) return null;
    if (status === 'Feito') return 'done';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'today';
    return 'pending';
  };

  const { data: taskUpdates, refetch: refetchUpdates } = useQuery({
    queryKey: ['task_updates', taskDetailsOpen?.id],
    queryFn: async () => {
      if (!taskDetailsOpen?.id) return [];
      const { data, error } = await supabase
        .from('task_updates')
        .select('*')
        .eq('task_id', taskDetailsOpen.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Tabela task_updates ainda não existe ou erro:", error);
        return [];
      }
      return data;
    },
    enabled: !!taskDetailsOpen?.id
  });

  const postUpdate = async () => {
    if (!newUpdateText.trim() || !taskDetailsOpen) return;
    const { error } = await supabase.from('task_updates').insert([
      { task_id: taskDetailsOpen.id, content: newUpdateText }
    ]);
    if (!error) {
      setNewUpdateText('');
      refetchUpdates();
      // Invalida a query de tasks para buscar o updates_count atualizado pelo trigger do Supabase
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    } else {
      alert("A tabela 'task_updates' ainda não foi criada no Supabase! Rode o SQL.");
    }
  };

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

  const filteredTasks = tasks?.filter((task: any) => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groupedTasks = filteredTasks?.reduce((acc: any, task: any) => {
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
      <div key={title} className="mb-8 mt-2">
        <div className="flex items-center gap-2 mb-1 px-8">
          <button className={`hover:opacity-80 transition-colors ${colors.text}`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          <h2 className={`text-[22px] font-medium ${colors.text}`}>{title}</h2>
          <span className="text-slate-400 text-sm ml-2">{groupTasks?.length || 0} Tarefas</span>
        </div>

        <div className="px-8 mb-2">
          <style dangerouslySetInnerHTML={{ __html: `
            .date-hack::-webkit-calendar-picker-indicator {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              width: 100%;
              height: 100%;
              opacity: 0;
              cursor: pointer;
            }
          `}} />
          <div className="bg-white relative">
            <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="border-b border-slate-200 text-[#676879] text-[14px]">
                  <th className="w-2 p-0"></th>
                  <th className="w-10 text-center p-0 border-r border-slate-200"></th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200" style={{ width: '40%', minWidth: '350px' }}></th>
                  <th className="w-14 border-r border-slate-200"></th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-32 text-center">Responsável</th>
                  <th className="font-normal px-0 py-0 border-r border-slate-200 w-40 text-center">Status</th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-48 text-center">Timeline</th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-32 text-center">Prazo</th>
                  <th className="font-normal px-0 py-0 border-r border-slate-200 w-40 text-center">Prioridade</th>
                  <th className="font-normal px-4 py-2 border-r border-slate-200 w-32 text-center">Arquivos</th>
                  <th className="w-10 text-center p-0"></th>
                </tr>
              </thead>
              <tbody className="text-[15px]">
                {groupTasks && groupTasks.length > 0 ? (
                  groupTasks.map((task) => (
                    <tr key={task.id} className={`group/row border-b border-slate-200 transition-colors h-[42px] ${selectedTasks.includes(task.id) ? 'bg-blue-50/50' : 'hover:bg-[#f5f6f8]'}`}>
                      <td className="w-2 p-0" style={{ backgroundColor: colors.bg }}></td>
                      <td className="w-10 text-center p-0 border-r border-slate-200 relative bg-transparent">
                        <input 
                          type="checkbox" 
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => toggleSelection(task.id)}
                          className="w-4 h-4 rounded border-slate-300 opacity-0 group-hover/row:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer checked:opacity-100 accent-blue-600" 
                        />
                      </td>
                      <td className="px-4 py-0 border-r border-slate-200 relative truncate group/title">
                        <div className="flex items-center justify-between w-full">
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
                          <div className="flex items-center gap-1 bg-transparent px-2 opacity-0 group-hover/title:opacity-100 transition-opacity absolute right-0 top-0 h-full">
                            <button 
                              onClick={() => { if(confirm('Excluir esta tarefa?')) deleteTask.mutate(task.id); }}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-[18px] h-[18px] stroke-[1.5]" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="border-r border-slate-200 text-center relative hover:bg-slate-50 transition-colors">
                        <div className="absolute inset-0 flex items-center justify-center cursor-pointer group/chat" onClick={() => setTaskDetailsOpen(task)}>
                          <div className="relative">
                            <MessageCirclePlus className="w-5 h-5 text-slate-300 group-hover/chat:text-blue-500 stroke-[1.5] transition-colors" />
                            {/* Simulação de notificação: Badge azul com count se existir updates_count na DB */}
                            {task.updates_count > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <span className="text-[10px] text-white font-bold leading-none">{task.updates_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-0 border-r border-slate-200 text-center relative group/assignee">
                        <AssigneeCell task={task} />
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
                      <td className="p-0 border-r border-slate-200 text-center relative group/date h-full">
                        <div className="flex items-center justify-center gap-2 h-[42px] w-full group-hover/date:bg-slate-100 transition-colors relative cursor-pointer">
                           {getDueStatus(task.due_date, task.status) === 'overdue' && task.status !== 'Feito' && (
                             <AlertCircle className="w-4 h-4 text-red-500 fill-red-50 stroke-red-500" />
                           )}
                           {getDueStatus(task.due_date, task.status) === 'done' && (
                             <CheckCircle2 className="w-4 h-4 text-green-500" />
                           )}
                           <span className={`text-[13px] ${getDueStatus(task.due_date, task.status) === 'overdue' && task.status !== 'Feito' ? 'text-red-500 font-medium' : 'text-[#323338]'} ${task.status === 'Feito' ? 'line-through text-slate-400' : ''}`}>
                             {formatDate(task.due_date) || '-'}
                           </span>
                           <input 
                             type="date" 
                             defaultValue={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                             onChange={(e) => updateTask.mutate({ id: task.id, updates: { due_date: e.target.value } })}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 date-hack"
                           />
                        </div>
                      </td>
                      <td className="p-0 border-r border-slate-200 text-center">
                        <PriorityCell task={task} />
                      </td>
                      <td className="px-4 py-0 border-r border-slate-200 text-center hover:bg-slate-50 cursor-pointer group/file relative h-full">
                        <div className="flex items-center justify-center h-[42px] w-full">
                          <div className="flex items-center gap-1 text-slate-400 group-hover/file:bg-slate-200 px-2 py-1 rounded transition-colors">
                            <span className="text-lg leading-none opacity-0 group-hover/file:opacity-100 absolute left-8">+</span>
                            <FileText className="w-[18px] h-[18px] group-hover/file:text-slate-600" />
                          </div>
                        </div>
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
                  <td className="w-10 border-r border-slate-200 bg-transparent"></td>
                  <td colSpan={9} className="px-4 py-0">
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
    <div className="w-full h-full relative flex flex-col">
      {/* Toolbar */}
      <div className="px-8 py-4 flex items-center gap-4 border-b border-slate-200 bg-white shrink-0">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-[14px] font-medium transition-colors shadow-sm">
          Novo Item
        </button>
        
        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-full border border-slate-200 bg-white text-[14px] focus:outline-none focus:border-blue-400 transition-colors w-64 shadow-sm"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => { setStatusFilterOpen(!statusFilterOpen); setPriorityFilterOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[14px] transition-colors shadow-sm ${filterStatus ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Status {filterStatus && `: ${filterStatus}`}
          </button>
          {statusFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50">
              <div className="text-xs font-bold text-slate-400 mb-2 px-2">Filtrar por Status</div>
              {['Feito', 'Trabalhando', 'Travado', 'Pendente'].map(status => (
                <button 
                  key={status}
                  onClick={() => { setFilterStatus(filterStatus === status ? null : status); setStatusFilterOpen(false); }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-slate-100 flex items-center justify-between"
                >
                  {status} {filterStatus === status && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => { setPriorityFilterOpen(!priorityFilterOpen); setStatusFilterOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[14px] transition-colors shadow-sm ${filterPriority ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Prioridade {filterPriority && `: ${filterPriority}`}
          </button>
          {priorityFilterOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50">
              <div className="text-xs font-bold text-slate-400 mb-2 px-2">Filtrar por Prioridade</div>
              {['Alta', 'Média', 'Baixa', 'Vazio'].map(priority => (
                <button 
                  key={priority}
                  onClick={() => { setFilterPriority(filterPriority === priority ? null : priority); setPriorityFilterOpen(false); }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-slate-100 flex items-center justify-between"
                >
                  {priority} {filterPriority === priority && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto pb-24 pt-6">
        <div className="min-w-[1300px] w-full">
          {groupsToRender.map(groupName => renderGroup(groupName, groupedTasks[groupName] || []))}
          
          <div className="px-8 mt-6">
            <button 
              onClick={async () => {
                const name = prompt('Nome do novo grupo:');
                if (name) {
                  const { error } = await supabase.from('tasks').insert([
                    { title: 'Nova Tarefa', board_id: boardId, group_name: name, position: 1 }
                  ]);
                  if (!error) queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-md transition-all font-medium text-sm bg-white shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Adicionar novo grupo
            </button>
          </div>
        </div>
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
      {taskDetailsOpen && (() => {
        const activeTask = tasks?.find((t: any) => t.id === taskDetailsOpen.id) || taskDetailsOpen;
        return (
        <>
          {/* Overlay Escuro */}
          <div 
            className="fixed inset-0 bg-slate-900/20 z-40" 
            onClick={() => setTaskDetailsOpen(null)}
          ></div>

          {/* Gaveta */}
          <div className="fixed top-0 right-0 h-screen w-[600px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800">{activeTask.title}</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"><MessageSquare className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                <button onClick={() => setTaskDetailsOpen(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Edição Rápida de Campos */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex gap-6">
              <div className="flex flex-col gap-2 w-32 relative z-20">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <div className="w-full h-8"><StatusCell task={activeTask} /></div>
              </div>
              <div className="flex flex-col gap-2 w-32 relative z-10">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prioridade</span>
                <div className="w-full h-8"><PriorityCell task={activeTask} /></div>
              </div>
              <div className="flex flex-col gap-2 w-32 relative z-10">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Prazo</span>
                <div className="w-full h-8 flex items-center justify-center border border-slate-200 rounded-full bg-white text-xs font-medium relative date-hack overflow-hidden cursor-pointer hover:border-blue-400 transition-colors">
                  <span className={activeTask.due_date ? 'text-slate-700' : 'text-slate-400'}>
                    {formatDate(activeTask.due_date) || '-'}
                  </span>
                  <input 
                    type="date" 
                    defaultValue={activeTask.due_date || ''}
                    onChange={async (e) => {
                      const { error } = await supabase.from('tasks').update({ due_date: e.target.value }).eq('id', activeTask.id);
                      if (!error) {
                        queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 w-16 items-center relative z-20">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pessoa</span>
                <div className="w-8 h-8"><AssigneeCell task={activeTask} /></div>
              </div>
            </div>

            <div className="flex gap-6 px-6 border-b border-slate-100 text-sm font-medium text-slate-500 pt-4">
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
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  placeholder="Escreva uma atualização..." 
                  className="w-full min-h-[100px] resize-none outline-none text-slate-700 text-sm"
                ></textarea>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><span className="text-xs font-bold">@</span></button>
                    <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded text-xs">GIF</button>
                  </div>
                  <button 
                    onClick={postUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                  >
                    Atualizar
                  </button>
                </div>
              </div>

              {taskUpdates && taskUpdates.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {taskUpdates.map((update: any) => (
                    <div key={update.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          U
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Usuário</h4>
                          <span className="text-xs text-slate-400">{new Date(update.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{update.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center mt-12 text-slate-400">
                  <div className="w-32 h-32 mb-4 opacity-50 relative">
                     <div className="absolute inset-0 bg-blue-100 rounded-2xl flex items-center justify-center">
                       <MessageSquare className="w-12 h-12 text-blue-300" />
                     </div>
                  </div>
                  <h3 className="text-slate-800 font-bold text-lg mb-1">Nenhuma atualização ainda</h3>
                  <p className="text-sm max-w-xs">Compartilhe o progresso, mencione um colega ou carregue um arquivo para dar andamento às coisas.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
