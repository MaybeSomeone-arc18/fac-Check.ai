import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GlobalBootstrapper } from "@/components/providers/GlobalBootstrapper";

export const metadata: Metadata = {
  title: "FacCheckAI - Global Operations",
  description: "Billion-dollar industrial AI SaaS telemetry dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking anti-FOUC script: reads stored theme before React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('faccheck-theme');
              var resolved = t === 'dark' ? 'dark' : t === 'light' ? 'light' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.setAttribute('data-theme', resolved);
            } catch(e) { document.documentElement.setAttribute('data-theme', 'dark'); }
          })();
        ` }} />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased overflow-x-hidden min-h-screen flex selection:bg-primary selection:text-background text-on-surface bg-background">
        <ThemeProvider>
          {/* Animated Background Layers */}
          <div className="aurora-bg" suppressHydrationWarning>
            <div className="aurora-blob blob-1" suppressHydrationWarning></div>
            <div className="aurora-blob blob-2" suppressHydrationWarning></div>
            <div className="aurora-blob blob-3" suppressHydrationWarning></div>
          </div>
          <div className="noise-overlay" suppressHydrationWarning></div>

          <div className="flex w-full min-h-screen p-4 md:p-6 lg:p-8 gap-6 md:gap-8" suppressHydrationWarning>
            <Sidebar />
            <div className="flex-1 flex flex-col relative z-10 w-full min-w-0 max-w-full" suppressHydrationWarning>
              <GlobalBootstrapper>
                <TopNav />
                {children}
              </GlobalBootstrapper>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
