'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_COLORS: Record<string, string> = {
  'Feito': 'bg-[#00c875]',
  'Trabalhando': 'bg-[#fdab3d]',
  'Travado': 'bg-[#e2445c]',
  'Pendente': 'bg-[#c4c4c4]',
};

export function StatusCell({ task }: { task: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const currentStatus = task.status || 'Pendente';
  const colorClass = STATUS_COLORS[currentStatus] || STATUS_COLORS['Pendente'];

  // Fechar o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsOpen(false);
    }
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full min-h-[36px] flex items-center justify-center text-white font-medium text-[13px] shadow-sm hover:opacity-90 transition-opacity ${colorClass}`}
        style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.1)' }}
      >
        <span className="truncate px-2">{currentStatus}</span>
        {updateStatus.isPending && (
          <span className="absolute right-1 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 z-50 w-48 bg-white rounded-lg shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2">
          {Object.keys(STATUS_COLORS).map((status) => (
            <button
              key={status}
              onClick={() => updateStatus.mutate(status)}
              className={`w-full text-left px-3 py-2 mb-1 rounded text-white font-medium text-[13px] transition-transform hover:scale-[1.02] active:scale-95 ${STATUS_COLORS[status]}`}
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
