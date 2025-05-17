// src/app/layout.tsx
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import './globals.css'; // Đảm bảo import globals.css
import { Inter } from 'next/font/google';
import { cn } from '@/utils/cn';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import { MotionConfig, motion } from "framer-motion";
import { Task } from '@/utils/apiClient';
import { TooltipProvider } from '@radix-ui/react-tooltip'; // Đảm bảo import này ĐÚNG

interface TaskModalContextType {
  openNewTaskModal: () => void;
  openEditTaskModal: (task: Task) => void;
}

export const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export const useTaskModal = () => {
  const context = useContext(TaskModalContext);
  if (context === undefined) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return context;
};

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
});

const SIDEBAR_WIDTH_OPEN_PX = 280;
const SIDEBAR_WIDTH_CLOSED_DESKTOP_PX = 68;

const applyThemeToHtml = (theme: 'light' | 'dark') => {
  const htmlElement = document.documentElement;
  if (theme === 'dark') {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const handleOpenNewTaskModal = useCallback(() => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
    if (isMobileView && isSidebarOpen) setIsSidebarOpen(false);
  }, [isMobileView, isSidebarOpen]);

  const handleOpenEditTaskModal = useCallback((task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
    if (isMobileView && isSidebarOpen) setIsSidebarOpen(false);
  }, [isMobileView, isSidebarOpen]);

  const handleCloseTaskModal = useCallback(() => setIsTaskModalOpen(false), []);

  useEffect(() => {
    setIsMounted(true); // Đánh dấu component đã mount ở client

    // Theme initialization
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const localTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = localTheme || (prefersDark ? 'dark' : 'light');
    setCurrentTheme(initialTheme); // Set state
    // applyThemeToHtml(initialTheme); // Apply class ngay lập tức

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      const storedSidebarState = localStorage.getItem('sidebarState');
      if (!mobile) {
        setIsSidebarOpen(storedSidebarState ? JSON.parse(storedSidebarState) : true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Chỉ chạy 1 lần khi mount

  // Effect để áp dụng theme class khi currentTheme thay đổi (và isMounted)
  useEffect(() => {
    if (isMounted) {
      applyThemeToHtml(currentTheme);
    }
  }, [currentTheme, isMounted]);


  useEffect(() => {
    if (isMounted && !isMobileView) {
      localStorage.setItem('sidebarState', JSON.stringify(isSidebarOpen));
    }
    if (isMounted) {
      document.body.style.overflow = (isSidebarOpen && isMobileView) ? 'hidden' : '';
    }
    return () => {
      if (isMounted) document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobileView, isMounted]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  // Hàm để Header có thể thay đổi theme
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };


  if (!isMounted) {
    // Render một placeholder đơn giản hoặc null để tránh hydration mismatch
    // Quan trọng: không nên render UI phức tạp ở đây nếu nó phụ thuộc vào state client-side
    return (
      <html lang="vi" suppressHydrationWarning>
        <head />
        <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
          <div className="flex h-screen items-center justify-center text-muted-foreground">Đang tải ứng dụng...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="vi" suppressHydrationWarning> {/* Class 'dark' sẽ được thêm/xóa bởi useEffect */}
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <TooltipProvider delayDuration={100}> {/* Radix TooltipProvider */}
          <TaskModalContext.Provider value={{ openNewTaskModal: handleOpenNewTaskModal, openEditTaskModal: handleOpenEditTaskModal }}>
            <MotionConfig transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="relative flex min-h-dvh bg-background">
                <Sidebar
                  onOpenNewTaskModal={handleOpenNewTaskModal}
                  isSidebarOpen={isSidebarOpen}
                  toggleSidebar={toggleSidebar}
                  isMobileView={isMobileView}
                />

                {isSidebarOpen && isMobileView && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                  />
                )}

                <motion.div
                  className="flex flex-1 flex-col overflow-x-hidden"
                  style={{ '--sidebar-width-open': `${SIDEBAR_WIDTH_OPEN_PX}px`, '--sidebar-width-closed': `${SIDEBAR_WIDTH_CLOSED_DESKTOP_PX}px` } as React.CSSProperties}
                  animate={{
                    marginLeft: isMobileView ? 0 : (isSidebarOpen ? `var(--sidebar-width-open)` : `var(--sidebar-width-closed)`),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, duration:0.3 }}
                >
                  <Header
                    onToggleSidebar={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                    isMobileView={isMobileView}
                    currentTheme={currentTheme} // Truyền theme hiện tại
                    onThemeChange={handleThemeChange} // Truyền hàm thay đổi theme
                  />
                  <main
                    className="flex-1 container main-container-padding py-6 md:py-8 focus:outline-none"
                    onClick={() => { if (isMobileView && isSidebarOpen) toggleSidebar(); }}
                    id="main-content"
                    role="main"
                  >
                    {children}
                  </main>
                  <Footer />
                </motion.div>
              </div>
              <TaskFormModal
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                onSubmitSuccess={() => { /* Refresh logic or let section handle it */ }}
                taskToEdit={taskToEdit}
              />
            </MotionConfig>
          </TaskModalContext.Provider>
        </TooltipProvider>
      </body>
    </html>
  );
}