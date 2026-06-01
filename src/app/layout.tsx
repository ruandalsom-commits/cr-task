import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { Bell, Search, UserPlus, Grid, MoreHorizontal, LayoutTemplate, Briefcase } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monday Clone",
  description: "Clone funcional do Monday.com criado com Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#f5f6f8] text-[#323338]`}>
        <ReactQueryProvider>
          <div className="flex h-screen overflow-hidden">
            
            {/* Sidebar Fixa (Ícones) */}
            <aside className="w-16 bg-[#292f4c] text-white flex flex-col items-center py-4 shrink-0 z-20">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg mb-8 flex items-center justify-center font-black text-xl shadow-lg cursor-pointer">
                M
              </div>
              
              <nav className="flex flex-col gap-6 items-center flex-1 w-full">
                <button className="w-full flex justify-center p-2 text-blue-300 border-l-[3px] border-blue-400 bg-white/10 transition-colors">
                  <Briefcase strokeWidth={2.5} className="w-5 h-5" />
                </button>
                <button className="w-full flex justify-center p-2 text-slate-400 hover:text-white transition-colors border-l-[3px] border-transparent">
                  <Bell strokeWidth={2.5} className="w-5 h-5" />
                </button>
                <button className="w-full flex justify-center p-2 text-slate-400 hover:text-white transition-colors border-l-[3px] border-transparent">
                  <Search strokeWidth={2.5} className="w-5 h-5" />
                </button>
              </nav>

              <div className="mt-auto flex flex-col gap-4 items-center">
                <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold border border-white/20">
                  R
                </button>
              </div>
            </aside>
            
            {/* Sidebar Secundária Dinâmica */}
            <Sidebar />

            {/* Área Principal */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white z-10 shadow-sm relative rounded-tl-2xl md:rounded-none border-l border-t md:border-t-0 border-slate-200 mt-2 ml-[-8px] md:mt-0 md:ml-0">
              {children}
            </main>

          </div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
