'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { AssigneeCell } from './AssigneeCell';
import { Search, PlusCircle, Trash2, MessageCirclePlus, CheckCircle2, RotateCcw, X } from 'lucide-react';

export function BoardRoutineView({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [taskDetailsOpen, setTaskDetailsOpen] = useState<any | null>(null);

  const daysOfWeek = [
    { key: 'mon', label: 'Segunda' },
    { key: 'tue', label: 'Terça' },
    { key: 'wed', label: 'Quarta' },
    { key: 'thu', label: 'Quinta' },
    { key: 'fri', label: 'Sexta' }
  ];

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_updates(id)')
        .eq('board_id', boardId)
        .order('position');
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  });

  const toggleDayStatus = (task: any, dayKey: string) => {
    const currentRoutine = task.routine_status || {};
    // Alterna entre: null -> 'Feito' -> 'Pendente' -> null
    let nextStatus = 'Feito';
    if (currentRoutine[dayKey] === 'Feito') nextStatus = 'Pendente';
    else if (currentRoutine[dayKey] === 'Pendente') nextStatus = 'null';

    const newRoutine = { ...currentRoutine };
    if (nextStatus === 'null') {
      delete newRoutine[dayKey];
    } else {
      newRoutine[dayKey] = nextStatus;
    }

    updateTask.mutate({ id: task.id, updates: { routine_status: newRoutine } });
  };

  const resetAllRoutines = async () => {
    if (!confirm('Deseja limpar todos os dias da semana para começar uma nova semana?')) return;
    
    if (tasks) {
      for (const task of tasks) {
        if (task.routine_status && Object.keys(task.routine_status).length > 0) {
          await supabase.from('tasks').update({ routine_status: {} }).eq('id', task.id);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
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
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    if (status === 'Feito') return 'bg-[#00c875] text-white';
    if (status === 'Pendente') return 'bg-[#e2445c] text-white';
    return 'bg-slate-100 hover:bg-slate-200 text-transparent hover:text-slate-400';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Feito') return <CheckCircle2 className="w-4 h-4 mx-auto" />;
    if (status === 'Pendente') return <X className="w-4 h-4 mx-auto" />;
    return <span className="text-[10px] font-medium opacity-0 hover:opacity-100 transition-opacity">Marcar</span>;
  };

  return (
    <div className="w-full h-full relative flex flex-col bg-white">
      {/* Toolbar */}
      <div className="px-8 py-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={async () => {
              const { error } = await supabase.from('tasks').insert([
                { title: 'Nova Rotina', board_id: boardId, position: (tasks?.length || 0) + 1 }
              ]);
              if (!error) queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-[14px] font-medium transition-colors shadow-sm"
          >
            Nova Rotina
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar rotina..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-full border border-slate-200 bg-white text-[14px] focus:outline-none focus:border-blue-400 transition-colors w-64 shadow-sm"
            />
          </div>
        </div>

        <button 
          onClick={resetAllRoutines}
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors text-sm font-medium border border-slate-200 hover:border-red-200"
        >
          <RotateCcw className="w-4 h-4" /> Resetar Semana
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 pt-6 px-8">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[#676879] text-[14px]">
                <th className="font-medium px-6 py-3 border-r border-slate-200 w-1/3">Tarefa da Rotina</th>
                <th className="font-medium px-4 py-3 border-r border-slate-200 w-32 text-center">Responsável</th>
                {daysOfWeek.map(day => (
                  <th key={day.key} className="font-medium px-2 py-3 border-r border-slate-200 text-center w-24">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[15px]">
              {filteredTasks && filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="group/row border-b border-slate-200 hover:bg-[#f5f6f8] transition-colors h-[50px]">
                    <td className="px-6 py-0 border-r border-slate-200 relative truncate group/title">
                      <div className="flex items-center justify-between w-full h-full">
                        <input 
                          type="text" 
                          defaultValue={task.title} 
                          onBlur={(e) => {
                            if (e.target.value !== task.title) {
                              updateTask.mutate({ id: task.id, updates: { title: e.target.value } });
                            }
                          }}
                          className="text-[#323338] hover:text-blue-600 font-medium bg-transparent outline-none w-full cursor-text truncate"
                        />
                        <button 
                          onClick={() => { if(confirm('Excluir esta rotina?')) deleteTask.mutate(task.id); }}
                          className="opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded transition-colors absolute right-2"
                        >
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-0 border-r border-slate-200 text-center relative">
                      <AssigneeCell task={task} />
                    </td>
                    {daysOfWeek.map(day => {
                      const status = (task.routine_status || {})[day.key];
                      return (
                        <td key={day.key} className="p-1 border-r border-slate-200 text-center h-[50px]">
                          <button
                            onClick={() => toggleDayStatus(task, day.key)}
                            className={`w-full h-full flex items-center justify-center transition-all ${getStatusColor(status)}`}
                          >
                            {status === 'Feito' && <CheckCircle2 className="w-5 h-5" />}
                            {status === 'Pendente' && <X className="w-5 h-5" />}
                            {!status && <span className="opacity-0 group-hover/row:opacity-100 text-xs font-medium text-slate-400">Marcar</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    Nenhuma rotina cadastrada neste quadro. Comece adicionando uma nova rotina!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
