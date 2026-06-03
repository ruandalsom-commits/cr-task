'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent 
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

const STATUSES = ['Pendente', 'Trabalhando', 'Travado', 'Feito'];

export function BoardKanbanView({ boardId }: { boardId: string }) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Buscar tarefas
  const { data: rawTasks, isLoading } = useQuery({
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
  });

  // Estado local para otimizar o drag & drop
  const [tasks, setTasks] = useState<any[]>([]);

  // Estados para a Gaveta
  const [taskDetailsOpen, setTaskDetailsOpen] = useState<any | null>(null);
  const [newUpdateText, setNewUpdateText] = useState('');

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
    }
  };

  useEffect(() => {
    if (rawTasks) setTasks(rawTasks);
  }, [rawTasks]);

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoading) return <div className="p-8">Carregando Kanban...</div>;

  // Organizar tarefas por coluna
  const columnsData = STATUSES.map(status => ({
    id: status,
    title: status,
    tasks: tasks.filter(t => (t.status || 'Pendente') === status)
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Encontrar tarefa arrastada
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Encontrar o status de destino (pode ser o ID da coluna ou o ID de outra tarefa)
    const overTask = tasks.find(t => t.id === overId);
    const destinationStatus = overTask ? overTask.status : overId;

    if (activeTask.status !== destinationStatus) {
      setTasks((prev) => {
        return prev.map(t => 
          t.id === activeId ? { ...t, status: destinationStatus } : t
        );
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (over) {
      const activeTask = tasks.find(t => t.id === active.id);
      const overTask = tasks.find(t => t.id === over.id);
      const newStatus = overTask ? overTask.status : over.id;
      
      // Atualiza banco de dados se mudou de coluna
      if (activeTask && rawTasks?.find(t => t.id === active.id)?.status !== newStatus) {
        updateTaskStatus.mutate({ id: activeTask.id, status: newStatus as string });
      }
    }
  };

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <div className="p-8 h-full flex overflow-x-auto gap-6 bg-[#f5f6f8]">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columnsData.map((col) => (
          <KanbanColumn key={col.id} column={col}>
            <SortableContext items={col.tasks.map(t => t.id)}>
              <div className="flex flex-col gap-3 min-h-[100px]">
                {col.tasks.map(task => (
                  <KanbanCard key={task.id} task={task} onOpenTask={() => setTaskDetailsOpen(task)} />
                ))}
              </div>
            </SortableContext>
          </KanbanColumn>
        ))}

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Drawer (Gaveta Lateral de Atualizações) no Kanban */}
      {taskDetailsOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 z-40" onClick={() => setTaskDetailsOpen(null)}></div>
          <div className="fixed top-0 right-0 h-screen w-[600px] bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800">{taskDetailsOpen.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setTaskDetailsOpen(null)} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
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
                      <div 
                        className="text-sm text-slate-700 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: update.content
                            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match: string, alt: string, url: string) => {
                              if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
                                return `<video src="${url}" controls class="max-w-full rounded-lg mt-2 max-h-96 border border-slate-200 shadow-sm"></video>`;
                              }
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
