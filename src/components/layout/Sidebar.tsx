'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { LayoutTemplate, Grid } from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
  const { data: boards, isLoading } = useQuery({
    queryKey: ['sidebar_boards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('boards').select('*').order('created_at');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 hidden md:flex shrink-0">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-orange-500 text-white flex items-center justify-center font-bold">
          A
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-[14px] leading-tight">Minha Equipe</h3>
          <span className="text-xs text-slate-500">Plano Pro</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between text-slate-500 hover:bg-slate-100 p-2 rounded-md cursor-pointer mb-2 transition-colors">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" />
            <span className="text-[14px] font-medium">Meus Quadros</span>
          </div>
        </div>

        {isLoading ? (
          <div className="px-2 py-2 text-xs text-slate-400">Carregando quadros...</div>
        ) : (
          <div className="flex flex-col gap-1">
            {boards?.map(board => (
              <Link 
                key={board.id} 
                href={`/boards/${board.id}`}
                className="flex items-center gap-2 text-[#323338] hover:bg-slate-100 p-2 rounded-md cursor-pointer transition-colors"
              >
                <Grid className="w-4 h-4 text-blue-500" />
                <span className="text-[14px] font-medium truncate">{board.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
