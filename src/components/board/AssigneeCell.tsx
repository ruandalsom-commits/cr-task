'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { UserPlus, X, Search } from 'lucide-react';

export function AssigneeCell({ task }: { task: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [rect, setRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: allTasks } = useQuery({
    queryKey: ['workspace_users'],
    queryFn: async () => {
      // 1. Pega os usuários oficiais da base (cadastrados)
      const { data: profiles } = await supabase.from('profiles').select('email');
      const profileEmails = profiles ? profiles.map((p: any) => p.email) : [];
      
      // 2. Pega os e-mails que já foram atribuídos a alguma tarefa (mesmo que não tenham conta ainda)
      const { data: tasks } = await supabase.from('tasks').select('assignee_email').not('assignee_email', 'is', null);
      const taskEmails = tasks ? tasks.map((d: any) => d.assignee_email as string) : [];
      
      return Array.from(new Set([...profileEmails, ...taskEmails])); // Remove duplicados
    }
  });

  const teamMembers = useMemo(() => {
    const list = allTasks || [];
    if (search.trim()) {
      return list.filter(email => email.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [allTasks, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', () => setIsOpen(false));
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const bounds = e.currentTarget.getBoundingClientRect();
    setRect(bounds);
    setIsOpen(true);
    setSearch('');
  };

  const updateTask = useMutation({
    mutationFn: async (newEmail: string | null) => {
      const { error } = await supabase
        .from('tasks')
        .update({ assignee_email: newEmail })
        .eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace_users'] });
      setIsOpen(false);
    }
  });

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div 
        ref={buttonRef}
        onClick={handleOpen}
        title={task.assignee_email || 'Atribuir responsável'}
        className={`w-8 h-8 rounded-full mx-auto overflow-hidden border cursor-pointer transition-all flex items-center justify-center ${task.assignee_email ? 'border-slate-200 hover:ring-2 ring-blue-400' : 'bg-slate-100 border-dashed border-slate-300 hover:bg-slate-200'}`}
      >
        {task.assignee_email ? (
          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.assignee_email}`} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <UserPlus className="w-4 h-4 text-slate-400" />
        )}
      </div>
      
      {updateTask.isPending && (
        <span className="absolute right-1 top-1 w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
      )}

      {/* Hover Tooltip (mostra apenas se não estiver aberto e tem email) */}
      {task.assignee_email && !isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
          {task.assignee_email}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}

      {isOpen && rect && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] w-[320px] bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-left animate-in fade-in zoom-in duration-150"
          style={{ top: rect.bottom + 8, left: rect.left + (rect.width / 2), transform: 'translateX(-50%)' }}
        >
          {task.assignee_email && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center bg-slate-100 rounded-full pl-1 pr-3 py-1 gap-2 border border-slate-200">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.assignee_email}`} className="w-6 h-6 rounded-full" />
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{task.assignee_email.split('@')[0]}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask.mutate(null);
                  }}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded-full transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              autoFocus
              placeholder="Pesquise nomes ou e-mails..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim() && search.includes('@')) {
                  updateTask.mutate(search.trim());
                }
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="max-h-48 overflow-y-auto mb-2">
            <h4 className="text-xs text-slate-400 font-semibold mb-2 px-2">Pessoas sugeridas</h4>
            {teamMembers.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-slate-500">Nenhuma pessoa encontrada. Digite um e-mail completo e aperte Enter para convidar.</div>
            ) : (
              <div className="flex flex-col gap-1">
                {teamMembers.map((email: string) => (
                  <button
                    key={email}
                    onClick={() => updateTask.mutate(email)}
                    className="flex items-center gap-3 w-full p-2 hover:bg-slate-100 rounded-lg text-sm text-slate-700 transition-colors text-left"
                  >
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${email}`} className="w-7 h-7 rounded-full bg-slate-200 border border-slate-200" />
                    <span className="truncate">{email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t border-slate-100 mt-2">
            <button 
              onClick={() => {
                const email = prompt("E-mail para convidar:");
                if (email && email.includes('@')) {
                  updateTask.mutate(email);
                }
              }}
              className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><UserPlus className="w-4 h-4" /></div>
              Convide um novo membro por e-mail
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
