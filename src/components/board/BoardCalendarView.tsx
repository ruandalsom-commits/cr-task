'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ChevronLeft, ChevronRight, Search, User, Filter, Calendar as CalendarIcon, MessageCirclePlus } from 'lucide-react';

const STATUS_COLORS: any = {
  'Feito': 'bg-[#00c875]',
  'Trabalhando': 'bg-[#fdab3d]',
  'Travado': 'bg-[#e2445c]',
  'Pendente': 'bg-[#c4c4c4]'
};

export function BoardCalendarView({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [taskDetailsOpen, setTaskDetailsOpen] = useState<any | null>(null);

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

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Toolbar do Calendário */}
      <div className="flex items-center gap-4 p-6 border-b border-slate-200">
        <div className="flex bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors overflow-hidden h-8">
           <button className="px-4 font-medium text-sm">Criar tarefa</button>
           <button className="px-2 border-l border-blue-700 flex items-center justify-center">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 9l6 6 6-6"/></svg>
           </button>
        </div>
        <button className="h-8 px-3 border border-slate-200 hover:bg-slate-50 rounded flex items-center gap-2 text-slate-700 text-sm font-medium transition-colors">
          + Adicionar ferramenta
        </button>
        <div className="h-8 flex items-center border border-slate-200 rounded px-3 w-48 focus-within:border-blue-500 transition-colors group">
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
          <input type="text" placeholder="Pesquisar..." className="w-full h-full outline-none px-2 text-sm text-slate-700" />
        </div>
        <button className="h-8 px-3 hover:bg-slate-100 rounded flex items-center gap-2 text-slate-600 text-sm transition-colors">
          <User className="w-4 h-4" /> Pessoa
        </button>
        <button className="h-8 px-3 hover:bg-slate-100 rounded flex items-center gap-2 text-slate-600 text-sm transition-colors">
          <Filter className="w-4 h-4" /> Filtro
        </button>

        <div className="flex-1"></div>

        <button onClick={goToToday} className="h-8 px-3 border border-slate-200 hover:bg-slate-50 rounded text-slate-700 text-sm font-medium transition-colors">
          Hoje
        </button>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="h-8 w-8 hover:bg-slate-100 rounded flex items-center justify-center text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="h-8 w-8 hover:bg-slate-100 rounded flex items-center justify-center text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="h-8 flex items-center gap-2 px-2 hover:bg-slate-100 rounded cursor-pointer transition-colors">
          <span className="text-slate-800 text-[15px] font-medium">{monthNames[month]} {year}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-500"><path d="M6 9l6 6 6-6"/></svg>
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
        
        {/* Dias do Mês */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {calendarDays.map((dayObj, i) => {
            const dateString = dayObj.date.toISOString().split('T')[0];
            const tasksOnThisDay = rawTasks?.filter((t: any) => t.due_date && t.due_date.startsWith(dateString)) || [];

            return (
              <div 
                key={i} 
                className={`border-r border-b border-slate-100 last:border-r-0 flex flex-col p-1 group relative transition-colors ${dayObj.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'}`}
              >
                <div className="flex justify-end mb-1">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday(dayObj.date) ? 'bg-blue-600 text-white shadow-sm' : (dayObj.isCurrentMonth ? 'text-slate-700 group-hover:bg-slate-100' : 'text-slate-400')}`}>
                    {dayObj.day}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 relative z-10">
                  {tasksOnThisDay.map((task: any) => {
                    const bgColor = STATUS_COLORS[task.status] || STATUS_COLORS['Pendente'];
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => setTaskDetailsOpen(task)}
                        className={`text-[11px] px-2 py-1 cursor-pointer truncate text-white rounded-sm font-medium hover:brightness-95 transition-all shadow-sm ${bgColor}`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaveta de Tarefa (Reaproveitada para o Calendário) */}
      {taskDetailsOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={() => setTaskDetailsOpen(null)}></div>
          <div className="fixed top-0 right-0 h-screen w-[600px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800">{taskDetailsOpen.title}</h2>
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
    </div>
  );
}
