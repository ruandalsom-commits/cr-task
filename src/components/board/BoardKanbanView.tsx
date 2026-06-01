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
        .select('*')
        .eq('board_id', boardId)
        .order('position');
      if (error) throw error;
      return data;
    },
  });

  // Estado local para otimizar o drag & drop
  const [tasks, setTasks] = useState<any[]>([]);

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
                  <KanbanCard key={task.id} task={task} />
                ))}
              </div>
            </SortableContext>
          </KanbanColumn>
        ))}

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
