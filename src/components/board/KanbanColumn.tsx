'use client';

import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

const BORDER_COLORS: Record<string, string> = {
  'Feito': 'border-t-[#00c875]',
  'Trabalhando': 'border-t-[#fdab3d]',
  'Travado': 'border-t-[#e2445c]',
  'Pendente': 'border-t-[#c4c4c4]',
};

export function KanbanColumn({ column, children }: { column: any, children: ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const borderColor = BORDER_COLORS[column.id] || BORDER_COLORS['Pendente'];

  return (
    <div className="flex flex-col w-[300px] shrink-0 h-full max-h-[calc(100vh-220px)]">
      <div className={`bg-white rounded-t-lg rounded-b-md shadow-sm border border-slate-200 border-t-4 ${borderColor} p-4 mb-3 flex justify-between items-center shrink-0`}>
        <h3 className="font-bold text-[#323338] text-[16px]">{column.title}</h3>
        <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {column.tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className="flex-1 rounded-lg bg-slate-200/50 p-2 overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
}
