'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MessageSquare, AlignLeft } from 'lucide-react';

export function KanbanCard({ task, isOverlay }: { task: any, isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all ${
        isOverlay ? 'scale-105 shadow-xl cursor-grabbing' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-[#323338] text-[15px] leading-tight pr-4">
          {task.title}
        </h4>
      </div>
      
      <div className="flex items-center gap-4 text-slate-400 text-xs font-medium mt-4">
        {task.due_date && (
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <AlignLeft className="w-4 h-4 hover:text-blue-500 transition-colors" />
          <MessageSquare className="w-4 h-4 hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}
