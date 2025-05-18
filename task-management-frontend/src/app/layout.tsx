// src/app/layout.tsx
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/utils/cn';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import { Task, ProjectData, getProjects as fetchProjectsApi } from '@/utils/apiClient';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface TaskModalContextType {
  openNewTaskModal: (preselectedProjectId?: number | null) => void;
  openEditTaskModal: (task: Task) => void;
  lastTaskOperationTimestamp: number;
  triggerTaskRefresh: () => void;
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
const SIDEBAR_WIDTH_CLOSED_DESKTOP_PX = 72;

const applyThemeToHtml = (theme: 'light' | 'dark') => {
  const htmlElement = document.documentElement;
  htmlElement.classList.remove('light', 'dark');
  htmlElement.classList.add(theme);
  htmlElement.style.colorScheme = theme;
};

function MainLayoutContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [projectsForModal, setProjectsForModal] = useState<ProjectData[]>([]);
  const [currentProjectIdForModal, setCurrentProjectIdForModal] = useState<number | null>(null);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);

  const [lastTaskOperationTimestamp, setLastTaskOperationTimestamp] = useState<number>(0);
  const triggerTaskRefresh = useCallback(() => {
    setLastTaskOperationTimestamp(Date.now());
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authIsLoading) {
      setProjectsLoading(true);
      fetchProjectsApi()
        .then(data => {
          setProjectsForModal(data);
        })
        .catch(err => {
          setProjectsForModal([]);
        })
        .finally(() => {
          setProjectsLoading(false);
        });
    } else if (!isAuthenticated && !authIsLoading) {
      setProjectsForModal([]);
      setProjectsLoading(false);
    }
  }, [isAuthenticated, authIsLoading]);

  useEffect(() => {
    if (pathname) {
      const parts = pathname.split('/');
      if (parts.length === 3 && parts[1] === 'project' && !isNaN(parseInt(parts[2]))) {
        setCurrentProjectIdForModal(parseInt(parts[2]));
      } else {
        setCurrentProjectIdForModal(null);
      }
    }
  }, [pathname]);

  const handleOpenNewTaskModal = useCallback((preselectedProjectId?: number | null) => {
    setTaskToEdit(null);
    const targetProjectId = preselectedProjectId !== undefined ? preselectedProjectId : currentProjectIdForModal;
    setCurrentProjectIdForModal(targetProjectId);
    setIsTaskModalOpen(true);
    if (isMobileView && isSidebarOpen) setIsSidebarOpen(false);
  }, [isMobileView, isSidebarOpen, currentProjectIdForModal]);

  const handleOpenEditTaskModal = useCallback((task: Task) => {
    setTaskToEdit(task);
    setCurrentProjectIdForModal(task.projectId || currentProjectIdForModal);
    setIsTaskModalOpen(true);
    if (isMobileView && isSidebarOpen) setIsSidebarOpen(false);
  }, [isMobileView, isSidebarOpen, currentProjectIdForModal]);

  const handleCloseTaskModal = useCallback(() => setIsTaskModalOpen(false), []);

  useEffect(() => {
    setIsMounted(true);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const localTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = localTheme || (prefersDark ? 'dark' : 'light');
    setCurrentTheme(initialTheme);

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      const storedSidebarState = localStorage.getItem('sidebarState-v2');
      if (!mobile) {
        setIsSidebarOpen(storedSidebarState ? JSON.parse(storedSidebarState) : true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMounted) {
      applyThemeToHtml(currentTheme);
    }
  }, [currentTheme, isMounted]);

  useEffect(() => {
    if (isMounted && !isMobileView) {
      localStorage.setItem('sidebarState-v2', JSON.stringify(isSidebarOpen));
    }
    if (isMounted) {
      document.body.style.overflow = (isSidebarOpen && isMobileView) ? 'hidden' : '';
    }
    return () => {
      if (isMounted) document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobileView, isMounted]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Đang tải ứng dụng...
      </div>
    );
  }

  return (
    <TaskModalContext.Provider value={{
        openNewTaskModal: handleOpenNewTaskModal,
        openEditTaskModal: handleOpenEditTaskModal,
        lastTaskOperationTimestamp,
        triggerTaskRefresh
    }}>
      <MotionConfig transition={{ type: "spring", stiffness: 350, damping: 35, duration: 0.25 }}>
        <div className="relative flex min-h-dvh bg-background text-foreground">
          <Sidebar
            onOpenNewTaskModal={() => handleOpenNewTaskModal(currentProjectIdForModal)}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            isMobileView={isMobileView}
          />

          <AnimatePresence>
          {isSidebarOpen && isMobileView && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={toggleSidebar}
              aria-hidden="true"
            />
          )}
          </AnimatePresence>

          <div
            className="flex flex-1 flex-col overflow-x-hidden transition-all duration-300 ease-in-out"
            style={{
              ['--sidebar-width-open' as string]: `${SIDEBAR_WIDTH_OPEN_PX}px`,
              ['--sidebar-width-closed' as string]: `${SIDEBAR_WIDTH_CLOSED_DESKTOP_PX}px`,
              marginLeft: isMobileView ? '0px' : (isSidebarOpen ? `var(--sidebar-width-open)` : `var(--sidebar-width-closed)`)
            }}
          >
            <Header
              onToggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
              isMobileView={isMobileView}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
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
          </div>
        </div>
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSubmitSuccess={(submittedTask) => {
            triggerTaskRefresh();
            if (isAuthenticated && !authIsLoading) {
                fetchProjectsApi().then(setProjectsForModal).catch(console.error);
            }
          }}
          taskToEdit={taskToEdit}
          projects={projectsForModal}
          currentProjectId={currentProjectIdForModal}
          isLoadingProjects={projectsLoading}
        />
      </MotionConfig>
    </TaskModalContext.Provider>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <AuthProvider>
          <TooltipProvider delayDuration={100}>
            <MainLayoutContent>{children}</MainLayoutContent>
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}