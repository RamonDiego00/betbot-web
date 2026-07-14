"use client";

import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { authUtils } from "@/lib/auth";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const AUTH_PAGES = ["/login", "/auth/callback"];

// Anti-FOUC: aplica a classe `dark` no <html> ANTES do React hidratar,
// lendo a preferência persistida em localStorage (chave betbot_theme).
const THEME_SCRIPT = `try{if(localStorage.getItem('betbot_theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  // Lê o token UMA VEZ no mount (client-side). SSR retorna false por não ter window.
  // Login/logout usam hard-reload (window.location.href), então o valor é estável por sessão.
  const [hasToken] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!authUtils.getToken();
  });

  // Monta flag para não agir antes da hidratação do cliente
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Redireciona após montagem (sem setState dentro do efeito)
  useEffect(() => {
    if (!mounted) return;
    if (hasToken && isAuthPage) {
      // Usuário já autenticado tentando acessar login/callback → vai para dashboard
      router.replace("/");
    } else if (!hasToken && !isAuthPage) {
      // Sem token em página protegida → vai para login
      router.replace("/login");
    }
  }, [mounted, hasToken, isAuthPage, router]);

  // Enquanto hidrata ou quando vai redirecionar, mostra apenas o spinner em páginas protegidas
  const isRedirecting =
    !mounted || (hasToken && isAuthPage) || (!hasToken && !isAuthPage);

  if (isRedirecting && !isAuthPage) {
    return (
      <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Toaster position="top-right" richColors />
        <div className="flex">
          {!isAuthPage && <Sidebar serverStatus="online" />}

          <main className={isAuthPage ? "flex-1 min-h-screen" : "flex-1 ml-64 min-h-screen p-8"}>
            <div className={isAuthPage ? "" : "max-w-7xl mx-auto"}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
