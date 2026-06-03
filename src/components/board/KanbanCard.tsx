'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageCirclePlus, User } from 'lucide-react';

const STATUS_COLORS: any = {
  'Feito': 'bg-[#00c875]',
  'Trabalhando': 'bg-[#fdab3d]',
  'Travado': 'bg-[#e2445c]',
  'Pendente': 'bg-[#c4c4c4]',
};

const PRIORITY_COLORS: any = {
  'Alta': 'bg-[#401694]',
  'Média': 'bg-[#5559df]',
  'Baixa': 'bg-[#579bfc]',
  'Vazio': 'bg-[#c4c4c4]',
};

export function KanbanCard({ task, isOverlay, onOpenTask }: { task: any, isOverlay?: boolean, onOpenTask?: () => void }) {
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', day: 'numeric' }).format(date).replace('.', '');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 cursor-grab active:cursor-grabbing hover:border-slate-300 transition-all ${
        isOverlay ? 'scale-105 shadow-xl cursor-grabbing' : ''
      }`}
    >
      <h4 className="font-semibold text-[#323338] text-[14px] leading-tight mb-3">
        {task.title}
      </h4>
      
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {/* Status Badge */}
        <div className="flex items-center bg-slate-100 rounded text-xs font-medium text-slate-700 overflow-hidden pr-2">
          <div className={`w-1 h-5 ${STATUS_COLORS[task.status] || STATUS_COLORS['Pendente']} mr-1.5`}></div>
          {task.status || 'Pendente'}
        </div>

        {/* Prazo Badge */}
        {task.due_date && (
          <div className="flex items-center bg-slate-100 rounded px-2 py-0.5 text-xs font-medium text-slate-600 gap-1.5 h-5">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatDate(task.due_date)}
          </div>
        )}

        {/* Prioridade Badge */}
        {task.priority && (
          <div className="flex items-center bg-slate-100 rounded text-xs font-medium text-slate-700 overflow-hidden pr-2">
            <div className={`w-1 h-5 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS['Vazio']} mr-1.5`}></div>
            {task.priority}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 mb-4 mt-1 font-medium truncate">
        {task.group_name || 'Este mês'}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="w-6 h-6 rounded-full bg-slate-200 border border-white overflow-hidden flex items-center justify-center">
          {task.assignee_email ? (
            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.assignee_email}`} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
        
        <button 
          onPointerDown={(e) => e.stopPropagation()} // Previne arrastar ao clicar
          onClick={(e) => { e.stopPropagation(); onOpenTask?.(); }}
          className="flex items-center gap-1 hover:bg-slate-50 p-1 rounded transition-colors text-slate-400 hover:text-blue-500 group"
        >
          {/* Se tivéssemos o contador de comments, colocaríamos aqui. Para visual, deixamos o ícone novo */}
          <MessageCirclePlus className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
}
