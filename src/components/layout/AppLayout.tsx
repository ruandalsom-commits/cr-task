'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserProfile } from "@/components/layout/UserProfile";
import { Briefcase, Search } from "lucide-react";
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const INACTIVITY_LIMIT = 12 * 60 * 60 * 1000; // 12 horas em ms

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    if (pathname === '/login') return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, handleLogout]);

  // Checagem global de Lembretes do Calendário
  useEffect(() => {
    if (pathname === '/login') return;

    const checkReminders = async () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const hours = String(today.getHours()).padStart(2, '0');
      const mins = String(today.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${mins}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('tasks')
        .select('id, title, due_time, board_id')
        .eq('task_type', 'Lembrete')
        .eq('assignee_email', user.email)
        .eq('due_date', dateStr)
        .eq('due_time', timeStr);

      if (data && data.length > 0) {
        data.forEach((lembrete: any) => {
          const notifId = `lembrete-${lembrete.id}-${timeStr}`;
          const alreadyNotified = localStorage.getItem(notifId);
          
          if (!alreadyNotified) {
            localStorage.setItem(notifId, 'true');
            if ('Notification' in window && Notification.permission === 'granted') {
              const n = new Notification('🔔 Lembrete do Calendário', {
                body: `Está na hora: ${lembrete.title}`,
                icon: '/logo.png',
              });
              n.onclick = () => {
                window.focus();
                window.location.href = `/boards/${lembrete.board_id}`;
              };
            }
          }
        });
      }
    };

    checkReminders();
    const intervalId = setInterval(checkReminders, 60000); // Roda a cada 1 minuto
    
    return () => clearInterval(intervalId);
  }, [pathname]);

  if (pathname === '/login') {
    return <main className="flex-1 w-full bg-[#0a0a0a] min-h-screen">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <aside className="w-16 bg-[#1a1a1a] text-white flex flex-col items-center py-4 shrink-0 z-50 relative">
        <div className="w-10 h-10 bg-black rounded-lg mb-8 flex items-center justify-center shadow-lg cursor-pointer overflow-hidden border border-white/10 p-0.5">
          <img src="/logo.png" alt="CR Logo" className="w-full h-full object-contain rounded-md" />
        </div>
        
        <nav className="flex flex-col gap-6 items-center flex-1 w-full">
          <button className="w-full flex justify-center p-2 text-white border-l-[3px] border-white bg-white/10 transition-colors">
            <Briefcase strokeWidth={2.5} className="w-5 h-5" />
          </button>
          <NotificationBell />
          <button className="w-full flex justify-center p-2 text-slate-400 hover:text-white transition-colors border-l-[3px] border-transparent">
            <Search strokeWidth={2.5} className="w-5 h-5" />
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4 items-center">
          <UserProfile />
        </div>
      </aside>
      
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden bg-white z-10 shadow-sm relative rounded-tl-2xl md:rounded-none border-l border-t md:border-t-0 border-slate-200 mt-2 ml-[-8px] md:mt-0 md:ml-0">
        {children}
      </main>
    </div>
  );
}
