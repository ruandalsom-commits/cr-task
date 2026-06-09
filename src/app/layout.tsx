import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CR Admin Workspace",
  description: "Painel de administração CR",
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
          <AppLayout>
            {children}
          </AppLayout>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
