"use client";

import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isAuthPage = pathname === "/login" || pathname === "/auth/callback";

  useEffect(() => {
    const token = localStorage.getItem("betbot_jwt");
    if (!token && !isAuthPage) {
      router.push("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCheckingAuth(false);
    }
  }, [pathname, router, isAuthPage]);

  if (isCheckingAuth && !isAuthPage) {
    return (
      <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 font-sans text-slate-900">
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
