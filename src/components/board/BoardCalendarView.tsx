'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronRight, Search, User, Filter, Calendar as CalendarIcon, MessageCirclePlus, AlignLeft, Flag, FileText, DollarSign, Clock, Users, Circle, CheckCircle2, ChevronDown } from 'lucide-react';

import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';

const STATUS_COLORS: any = {
  'Feito': 'bg-[#00c875]',
  'Trabalhando': 'bg-[#fdab3d]',
  'Travado': 'bg-[#e2445c]',
  'Pendente': 'bg-[#c4c4c4]',
  'Não iniciado': 'bg-[#c4c4c4]'
};

const PRIORITIES = ['Alta', 'Média', 'Baixa', 'Vazio'];
const STATUSES = ['Feito', 'Trabalhando', 'Travado', 'Pendente', 'Não iniciado'];

function TaskChip({ task, onClick }: any) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: task.id,
    data: { task }
  });
  const bgColor = STATUS_COLORS[task.status] || STATUS_COLORS['Pendente'];
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : 1,
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
         // Stop propagation in case DnD interferes
         e.stopPropagation();
         onClick();
      }}
      className={`text-[11px] px-2 py-1 cursor-pointer truncate text-white rounded-sm font-medium hover:brightness-95 transition-all shadow-sm ${bgColor} ${isDragging ? 'opacity-50 relative' : ''}`}
      title={task.title}
    >
      {task.title}
    </div>
  );
}

function DayCell({ dayObj, tasks, isToday, onTaskClick, onAddClick }: any) {
  const dateString = dayObj.date.toISOString().split('T')[0];
  const { setNodeRef, isOver } = useDroppable({
    id: dateString,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`border-r border-b border-slate-100 last:border-r-0 flex flex-col p-1 group relative transition-colors ${dayObj.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'} ${isOver ? 'bg-blue-50/50 border-blue-200' : ''}`}
    >
      <div className="flex justify-end mb-1">
        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-blue-600 text-white shadow-sm' : (dayObj.isCurrentMonth ? 'text-slate-700 group-hover:bg-slate-100' : 'text-slate-400')}`}>
          {dayObj.day}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 relative z-10 pb-6">
        {tasks.map((task: any) => (
          <TaskChip key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>

      <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 z-20">
         <button 
          onClick={onAddClick} 
          className="w-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 py-1 rounded transition-colors"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

export function BoardCalendarView({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskDetailsOpen, setTaskDetailsOpen] = useState<any | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingTaskDate, setCreatingTaskDate] = useState<Date | null>(null);
  const [newTaskData, setNewTaskData] = useState<any>({
    title: '',
    group_name: 'Tarefas pendentes',
    assignee_email: '',
    status: 'Não iniciado',
    priority: '',
    notes: '',
    budget: ''
  });
  
  const [viewType, setViewType] = useState<'Mês' | 'Semana'>('Mês');
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Busca de Tarefas
  const { data: rawTasks } = useQuery({
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

  // Lê taskId da URL se houver para abrir a gaveta (igual ao Kanban/Tabela)
  useEffect(() => {
    if (rawTasks && !taskDetailsOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const taskIdUrl = urlParams.get('taskId');
      if (taskIdUrl) {
        const t = rawTasks.find((task: any) => task.id === taskIdUrl);
        if (t) {
          setTaskDetailsOpen(t);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [rawTasks]);

  const createTask = useMutation({
    mutationFn: async (dataToSave: any) => {
      let dateStr = dataToSave.due_date;
      if (!dateStr && creatingTaskDate) {
        const d = new Date(creatingTaskDate.getTime());
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        dateStr = d.toISOString().split('T')[0];
      }

      const { data, error } = await supabase.from('tasks').insert([
        { 
          board_id: boardId,
          title: dataToSave.title || 'Nova Tarefa',
          group_name: dataToSave.group_name || 'Este mês',
          status: dataToSave.status || 'Pendente',
          due_date: dateStr,
          priority: dataToSave.priority || null,
          assignee_email: dataToSave.assignee_email || null,
          position: (rawTasks?.length || 0) + 1
        }
      ]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      setNewTaskData({
        title: '',
        group_name: 'Tarefas pendentes',
        assignee_email: '',
        status: 'Não iniciado',
        priority: '',
        notes: '',
        budget: ''
      });
      if (variables.closeOnSuccess) {
        setCreatingTaskDate(null);
      }
    }
  });

  const filteredTasks = rawTasks?.filter((task: any) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus && task.status !== filterStatus) return false;
    return true;
  }) || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startingDay = (firstDay.getDay() + 6) % 7; // Domingo(0) vira 6, Segunda(1) vira 0
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  
  for (let i = 0; i < startingDay; i++) {
    calendarDays.unshift({ 
      day: daysInPrevMonth - i, 
      isCurrentMonth: false, 
      date: new Date(year, month - 1, daysInPrevMonth - i) 
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ 
      day: i, 
      isCurrentMonth: true, 
      date: new Date(year, month, i) 
    });
  }

  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({ 
      day: i, 
      isCurrentMonth: false, 
      date: new Date(year, month + 1, i) 
    });
  }

  const nextTime = () => {
    if (viewType === 'Semana') {
      setCurrentDate(new Date(year, month, currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };
  
  const prevTime = () => {
    if (viewType === 'Semana') {
      setCurrentDate(new Date(year, month, currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  let daysToRender = calendarDays;
  if (viewType === 'Semana') {
     const index = calendarDays.findIndex(d => d.date.getDate() === currentDate.getDate() && d.date.getMonth() === currentDate.getMonth());
     if (index !== -1) {
       const weekStart = Math.floor(index / 7) * 7;
       daysToRender = calendarDays.slice(weekStart, Math.min(weekStart + 7, calendarDays.length));
     } else {
       daysToRender = calendarDays.slice(0, 7);
     }
  }

  // Lógica da Gaveta Simplificada (somente exibição, como o usuário não pediu para recriar toda a tabela)
  // Mas como a gente combinou que a gaveta ia ser a mesma, vamos renderizar pelo menos os comentários
  const { data: taskUpdates, refetch: refetchUpdates } = useQuery({
    queryKey: ['task_updates', taskDetailsOpen?.id],
    queryFn: async () => {
      if (!taskDetailsOpen?.id) return [];
      const { data, error } = await supabase
        .from('task_updates')
        .select('*')
        .eq('task_id', taskDetailsOpen.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: !!taskDetailsOpen?.id,
    refetchInterval: 3000
  });

  const [newUpdateText, setNewUpdateText] = useState('');
  
  const postUpdate = async () => {
    if (!newUpdateText.trim() || !taskDetailsOpen) return;
    const { error } = await supabase.from('task_updates').insert([
      { task_id: taskDetailsOpen.id, content: newUpdateText }
    ]);
    if (!error) {
      setNewUpdateText('');
      refetchUpdates();
    }
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const updateTaskDate = useMutation({
    mutationFn: async ({ id, date }: { id: string, date: string }) => {
      const { error } = await supabase.from('tasks').update({ due_date: date }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      const taskId = active.id as string;
      const newDate = over.id as string;
      const task = rawTasks?.find((t: any) => t.id === taskId);
      if (task && !task.due_date?.startsWith(newDate)) {
        updateTaskDate.mutate({ id: taskId, date: newDate });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Toolbar do Calendário */}
      <div className="flex items-center gap-4 p-6 border-b border-slate-200">
        <div className="flex bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors overflow-hidden h-8">
           <button onClick={() => setCreatingTaskDate(new Date())} className="px-4 font-medium text-sm">Criar tarefa</button>
           <button onClick={() => setCreatingTaskDate(new Date())} className="px-2 border-l border-blue-700 flex items-center justify-center">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 9l6 6 6-6"/></svg>
           </button>
        </div>
        
        <div className="h-8 flex items-center border border-slate-200 rounded px-3 w-48 focus-within:border-blue-500 transition-colors group bg-white">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full outline-none px-2 text-sm text-slate-700" 
          />
        </div>
        <button className="h-8 px-3 hover:bg-slate-100 rounded flex items-center gap-2 text-slate-600 text-sm transition-colors">
          <User className="w-4 h-4" /> Pessoa
        </button>
        <div className="relative">
          <button onClick={() => setFilterDropdownOpen(!filterDropdownOpen)} className={`h-8 px-3 rounded flex items-center gap-2 text-sm transition-colors ${filterStatus ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}>
            <Filter className="w-4 h-4" /> {filterStatus || 'Filtro'}
          </button>
          {filterDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[60]">
              <button onClick={() => { setFilterStatus(null); setFilterDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium">Todos</button>
              {Object.keys(STATUS_COLORS).map(status => (
                <button key={status} onClick={() => { setFilterStatus(status); setFilterDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`}></div>
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1"></div>

        <button onClick={goToToday} className="h-8 px-3 border border-slate-200 hover:bg-slate-50 rounded text-slate-700 text-sm font-medium transition-colors">
          Hoje
        </button>
        <div className="flex items-center gap-1">
          <button onClick={prevTime} className="h-8 w-8 hover:bg-slate-100 rounded flex items-center justify-center text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextTime} className="h-8 w-8 hover:bg-slate-100 rounded flex items-center justify-center text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          <div 
            onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
            className="h-8 flex items-center gap-2 px-3 border border-slate-200 hover:bg-slate-50 rounded cursor-pointer transition-colors"
          >
            <span className="text-slate-800 text-[14px] font-medium">{viewType}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-500"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          {viewDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
              <button onClick={() => { setViewType('Mês'); setViewDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-slate-700 font-medium">Mês</button>
              <button onClick={() => { setViewType('Semana'); setViewDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-slate-700 font-medium">Semana</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-800 text-[15px] font-medium">{monthNames[month]} {year}</span>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Cabeçalho dos Dias */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-white z-10 shrink-0">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="py-2 text-center text-[13px] font-medium text-slate-700 border-r border-slate-100 last:border-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Dias do Mês/Semana */}
        <DndContext onDragEnd={handleDragEnd}>
          <div className={`flex-1 grid grid-cols-7 ${viewType === 'Mês' ? 'grid-rows-6' : 'grid-rows-1'}`}>
            {daysToRender.map((dayObj, i) => {
              const dateString = dayObj.date.toISOString().split('T')[0];
              const tasksOnThisDay = filteredTasks?.filter((t: any) => t.due_date && t.due_date.startsWith(dateString)) || [];

              return (
                <DayCell 
                  key={i}
                  dayObj={dayObj}
                  tasks={tasksOnThisDay}
                  isToday={isToday(dayObj.date)}
                  onTaskClick={setTaskDetailsOpen}
                  onAddClick={() => setCreatingTaskDate(dayObj.date)}
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      {/* Gaveta de Tarefa (Reaproveitada para o Calendário) */}
      {taskDetailsOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={() => setTaskDetailsOpen(null)}></div>
          <div className="fixed top-0 right-0 h-screen w-[600px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-800">{taskDetailsOpen.title}</h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
                   <CalendarIcon className="w-4 h-4" />
                   <span>Prazo:</span>
                   <input 
                     type="date" 
                     value={taskDetailsOpen.due_date?.split('T')[0] || ''}
                     onChange={(e) => {
                       setTaskDetailsOpen({...taskDetailsOpen, due_date: e.target.value});
                       updateTaskDate.mutate({ id: taskDetailsOpen.id, date: e.target.value });
                     }}
                     className="bg-transparent outline-none cursor-pointer hover:text-blue-600 transition-colors text-slate-800 font-medium"
                   />
                </div>
              </div>
              <button onClick={() => setTaskDetailsOpen(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-8">
                <textarea 
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  placeholder="Escreva uma atualização..." 
                  className="w-full min-h-[100px] resize-none outline-none text-slate-700 text-sm"
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button onClick={postUpdate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                    Atualizar
                  </button>
                </div>
              </div>

              {taskUpdates && taskUpdates.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {taskUpdates.map((update: any) => (
                    <div key={update.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div 
                        className="text-sm text-slate-700 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: update.content
                            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match: string, alt: string, url: string) => {
                              if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) return `<video src="${url}" controls class="max-w-full rounded-lg mt-2 max-h-96 border border-slate-200 shadow-sm"></video>`;
                              return `<img src="${url}" alt="${alt}" class="max-w-full rounded-lg mt-2 max-h-64 object-cover border border-slate-200 shadow-sm" />`;
                            })
                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium">$1</a>')
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center mt-12 text-slate-400">
                  <p className="text-sm max-w-xs">Nenhuma atualização ainda.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {/* Modal de Criar Tarefa no Dia */}
      {creatingTaskDate && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-[60]" onClick={() => setCreatingTaskDate(null)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[70] w-full max-w-2xl overflow-visible animate-in fade-in zoom-in-95 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <input 
                  type="text" 
                  autoFocus
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                  className="bg-transparent text-3xl font-bold text-slate-800 placeholder-slate-300 outline-none w-full"
                  placeholder="Criar Tarefa"
                />
                <button onClick={() => setCreatingTaskDate(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors absolute top-6 right-6 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5 bg-slate-50/50">
              
              <div className="flex items-center">
                <div className="w-40 flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center"><Circle className="w-3 h-3 text-white fill-white" /></div>
                  <span className="font-medium text-[15px]">Grupo</span>
                </div>
                <div className="flex-1">
                  <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-md px-4 py-2.5 flex items-center gap-3 cursor-text transition-colors w-full text-[15px] shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                    <input 
                      type="text" 
                      value={newTaskData.group_name}
                      onChange={(e) => setNewTaskData({...newTaskData, group_name: e.target.value})}
                      className="bg-transparent outline-none w-full text-slate-800"
                      placeholder="Nome do grupo..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-40 flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded bg-[#579bfc] flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                  <span className="font-medium text-[15px]">Responsável</span>
                </div>
                <div className="flex-1">
                  <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-md px-4 py-2.5 flex items-center justify-center cursor-pointer transition-colors w-full relative shadow-sm">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-40 flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded bg-[#00c875] flex items-center justify-center"><AlignLeft className="w-4 h-4 text-white" /></div>
                  <span className="font-medium text-[15px]">Status</span>
                </div>
                <div className="flex-1 relative">
                  <select 
                    value={newTaskData.status}
                    onChange={(e) => setNewTaskData({...newTaskData, status: e.target.value})}
                    className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-md px-4 py-2.5 w-full appearance-none outline-none cursor-pointer text-[15px] text-center font-medium shadow-sm"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-40 flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded bg-[#a25ddc] flex items-center justify-center"><CalendarIcon className="w-4 h-4 text-white" /></div>
                  <span className="font-medium text-[15px]">Prazo</span>
                </div>
                <div className="flex-1">
                  <input 
                    type="date"
                    value={newTaskData.due_date || (creatingTaskDate ? creatingTaskDate.toISOString().split('T')[0] : '')}
                    onChange={(e) => setNewTaskData({...newTaskData, due_date: e.target.value})}
                    className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-md px-4 py-2.5 w-full outline-none text-[15px] font-medium focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-40 flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded bg-[#00c875] flex items-center justify-center"><AlignLeft className="w-4 h-4 text-white rotate-90" /></div>
                  <span className="font-medium text-[15px]">Prioridade</span>
                </div>
                <div className="flex-1">
                  <select 
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({...newTaskData, priority: e.target.value})}
                    className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-md px-4 py-2.5 w-full appearance-none outline-none cursor-pointer text-[15px] text-center font-medium empty:text-slate-400 shadow-sm"
                  >
                    <option value="" disabled className="text-slate-400">- Selecione -</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-40 flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded bg-[#fdab3d] flex items-center justify-center"><FileText className="w-4 h-4 text-white" /></div>
                  <span className="font-medium text-[15px]">Notas</span>
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={newTaskData.notes}
                    onChange={(e) => setNewTaskData({...newTaskData, notes: e.target.value})}
                    className="bg-white border border-slate-200 rounded-md px-4 py-2.5 w-full outline-none text-slate-800 text-[15px] focus:border-blue-400 shadow-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-40 flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded bg-[#fdab3d] flex items-center justify-center"><DollarSign className="w-4 h-4 text-white" /></div>
                  <span className="font-medium text-[15px]">Orçamento</span>
                </div>
                <div className="flex-1">
                  <input 
                    type="number" 
                    value={newTaskData.budget}
                    onChange={(e) => setNewTaskData({...newTaskData, budget: e.target.value})}
                    className="bg-white border border-slate-200 rounded-md px-4 py-2.5 w-full outline-none text-slate-800 text-[15px] focus:border-blue-400 shadow-sm transition-colors"
                  />
                </div>
              </div>

            </div>
            
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-xl">
              <button 
                onClick={() => {
                  createTask.mutate({ ...newTaskData, closeOnSuccess: false });
                }}
                className="px-5 py-2.5 rounded border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-[15px] shadow-sm"
              >
                Salvar e criar outro
              </button>
              <button 
                disabled={!newTaskData.title.trim() || createTask.isPending}
                onClick={() => {
                  createTask.mutate({ ...newTaskData, closeOnSuccess: true });
                }} 
                className="px-6 py-2.5 rounded font-medium bg-[#0073ea] hover:bg-blue-600 text-white disabled:opacity-50 transition-colors text-[15px] shadow-sm"
              >
                {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
