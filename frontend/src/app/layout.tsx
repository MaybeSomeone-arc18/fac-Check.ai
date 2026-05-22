import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

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
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden min-h-screen flex selection:bg-primary selection:text-background text-on-surface bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen relative z-10">
          <TopNav />
          {children}
        </div>
      </body>
    </html>
  );
}
