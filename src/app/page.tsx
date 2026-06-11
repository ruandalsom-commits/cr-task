'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFirstBoard() {
      const savedId = localStorage.getItem('monday_active_workspace');
      
      let query = supabase.from('boards').select('id').limit(1);
      if (savedId) {
        query = query.eq('workspace_id', savedId);
      }

      const { data: boards, error } = await query;
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (boards && boards.length > 0) {
        router.push(`/boards/${boards[0].id}`);
      } else {
        setError('Este setor não possui quadros. Crie um quadro no menu lateral ou peça para o administrador adicionar você a outro setor.');
        setLoading(false);
      }
    }

    fetchFirstBoard();
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      {loading ? (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Buscando seus quadros...</p>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-lg shadow border border-slate-100 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Quase lá!</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      )}
    </div>
  );
}
