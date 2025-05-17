import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/utils/cn';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MotionConfig } from "framer-motion";

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata = {
  title: {
    default: 'TaskMaster Pro',
    template: '%s | TaskMaster Pro',
  },
  description: 'Ứng dụng quản lý công việc hiệu quả, trực quan và dễ sử dụng.',
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <MotionConfig reducedMotion="user">
          <div className="relative flex min-h-dvh flex-col">
            <Header />
            <main className="flex-1 container main-container-padding py-8 md:py-12">
              {children}
            </main>
            <Footer />
          </div>
        </MotionConfig>
      </body>
    </html>
  );
}
