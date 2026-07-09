import type { Metadata } from "next";
import "./globals.css";
import LeftNavigation from "@/components/LeftNavigation";

export const metadata: Metadata = {
  title: "Kre8ors OS - Agency CRM",
  description: "The ultimate enterprise Agency CRM and Creator Management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="h-full flex bg-[#0F1117] text-white overflow-hidden font-sans">
        <LeftNavigation />
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {children}
        </main>
      </body>
    </html>
  );
}
