"use client"; 

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import './globals.css'; 
import { Inter } from 'next/font/google';
import { cn } from '@/utils/cn';
import Header from '@/components/layout/Header'; 
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar'; 
import TaskFormModal from '@/components/tasks/TaskFormModal'; // Import TaskFormModal
import { MotionConfig } from "framer-motion";
import { Task } from '@/utils/apiClient'; // Import Task type

// Định nghĩa kiểu cho TaskModalContext
interface TaskModalContextType {
  openNewTaskModal: () => void;
  openEditTaskModal: (task: Task) => void; 
  // Không cần truyền closeTaskModal, isTaskModalOpen, taskToEdit qua context nữa
  // vì TaskFormModal sẽ được render trực tiếp trong RootLayout và nhận props từ đây.
}

export const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export const useTaskModal = () => {
  const context = useContext(TaskModalContext);
  if (context === undefined) {
    throw new Error('useTaskModal phải được sử dụng bên trong TaskModalProvider');
  }
  return context;
};

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
});

// Metadata của bạn (giữ nguyên)
// export const metadata = { ... };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // State quản lý modal được giữ ở RootLayout
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const handleOpenNewTaskModal = useCallback(() => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  }, []);

  const handleOpenEditTaskModal = useCallback((task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  }, []);

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setTaskToEdit(null); 
  }, []);

  const handleSubmitTaskSuccess = () => {
    // Logic này có thể được gọi từ TaskFormModal thông qua prop
    // và RootLayout có thể quyết định fetch lại tasks nếu cần,
    // hoặc để TaskSection tự fetch. Hiện tại TaskSection tự fetch.
    // handleCloseTaskModal(); // TaskFormModal sẽ tự đóng nếu không phải "add another"
  };


  useEffect(() => {
    setIsMounted(true);
    if (isSidebarOpen) {
      document.body.classList.add('sidebar-open-mobile');
    } else {
      document.body.classList.remove('sidebar-open-mobile');
    }
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleContentClick = () => {
    if (isSidebarOpen && window.innerWidth < 768) { 
      setIsSidebarOpen(false);
    }
  };

  if (!isMounted) {
    return (
      <html lang="vi" suppressHydrationWarning>
        <head />
        <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
          <div className="flex h-screen items-center justify-center">Đang tải...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
        )}
      >
        <TaskModalContext.Provider 
            value={{ 
                openNewTaskModal: handleOpenNewTaskModal, 
                openEditTaskModal: handleOpenEditTaskModal,
                // Các giá trị khác không cần thiết trong context nếu TaskFormModal được render ở đây
            }}
        >
          <MotionConfig reducedMotion="user">
            <div className="relative flex min-h-dvh">
              <Sidebar 
                onOpenNewTaskModal={handleOpenNewTaskModal} // Sidebar vẫn có thể gọi trực tiếp
                isSidebarOpen={isSidebarOpen}
              />

              {isSidebarOpen && (
                <div
                  className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
                  onClick={toggleSidebar}
                  aria-hidden="true"
                />
              )}

              <div className="flex flex-1 flex-col overflow-x-hidden">
                <Header onToggleSidebar={toggleSidebar} />
                <main 
                  className="flex-1 container main-container-padding py-6 md:py-8"
                  onClick={handleContentClick}
                >
                  {children} 
                </main>
                <Footer />
              </div>
            </div>
            {/* Render TaskFormModal ở đây, điều khiển bởi state của RootLayout */}
            <TaskFormModal
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                onSubmitSuccess={() => {
                    handleSubmitTaskSuccess();
                    // TaskSection sẽ tự fetch lại tasks, không cần gọi từ đây nữa
                }}
                taskToEdit={taskToEdit}
            />
          </MotionConfig>
        </TaskModalContext.Provider>
      </body>
    </html>
  );
}
