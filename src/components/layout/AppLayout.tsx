'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserProfile } from "@/components/layout/UserProfile";
import { Briefcase, Search } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login') {
    return <main className="flex-1 w-full bg-[#0a0a0a] min-h-screen">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <aside className="w-16 bg-[#1a1a1a] text-white flex flex-col items-center py-4 shrink-0 z-20">
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
