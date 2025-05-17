"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Task } from '@/utils/apiClient';
import { cn } from '@/utils/cn';
import { Edit3, Trash2, CalendarDays, AlertCircle, CheckCircle, Loader2 as LoaderIcon, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TaskItemProps {
  task: Task;
  onDeleteTask: (id: number) => Promise<void>;
  onEditTask: (task: Task) => void;
}

const statusConfig: Record<Task['status'], { badge: string; text: string; border: string; icon: React.ElementType; iconColor: string }> = {
  TODO: {
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    text: 'Cần làm',
    border: 'border-yellow-500 dark:border-yellow-600',
    icon: AlertCircle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  IN_PROGRESS: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    text: 'Đang làm',
    border: 'border-blue-500 dark:border-blue-600',
    icon: LoaderIcon,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  DONE: {
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700',
    text: 'Hoàn thành',
    border: 'border-green-500 dark:border-green-600',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

export const TaskItemSkeleton: React.FC = () => {
  return (
    <div className="card-base animate-pulse ">
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-5 bg-muted rounded-full w-20"></div>
        </div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <div className="h-3 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-28"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-9 w-[70px] bg-muted rounded-md"></div>
              <div className="h-9 w-[70px] bg-muted rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onDeleteTask, onEditTask }) => {
  const { badge, text: statusText, border: statusBorderColor, icon: StatusIcon, iconColor } = statusConfig[task.status];

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate + 'T00:00:00') < new Date(new Date().toDateString()) && task.status !== 'DONE';

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, scale: 0.9, transition: {duration: 0.2} }}
      whileHover={{ y: -4, boxShadow: "var(--tw-shadow-lg)" }}
      className={cn(
        "card-base flex flex-col h-full group",
        statusBorderColor,
        task.status !== 'DONE' ? 'border-l-4 shadow-md hover:shadow-lg' : 'opacity-80 dark:opacity-70 hover:opacity-100 shadow-sm hover:shadow-md'
      )}
    >
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3 gap-2">
          <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors break-words flex-1 line-clamp-2">
            {task.title}
          </h4>
          <span className={cn("px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap inline-flex items-center border", badge)}>
            <StatusIcon className={cn("h-3.5 w-3.5 mr-1.5", iconColor, task.status === 'IN_PROGRESS' && "animate-spin")} />
            {statusText}
          </span>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 whitespace-pre-wrap break-words flex-grow min-h-[60px]">
            {task.description}
          </p>
        )}
        {!task.description && <div className="flex-grow min-h-[60px]"></div>}

        <div className="border-t border-border pt-4 mt-auto">
          <div className="text-xs text-muted-foreground space-y-1.5 mb-4">
            {formattedDueDate && (
              <div className={cn("flex items-center", isOverdue && "text-destructive font-semibold")}>
                <CalendarDays className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>Hạn chót: {formattedDueDate}</span>
                {isOverdue && <AlertCircle className="h-4 w-4 ml-1.5 flex-shrink-0" />}
              </div>
            )}
            <div className="flex items-center text-muted-foreground/80">
                <span>Tạo: {new Date(task.createdAt).toLocaleDateString('vi-VN')}</span>
                <span className="mx-1.5">•</span>
                <span>Sửa: {new Date(task.updatedAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditTask(task)}
              aria-label={`Sửa công việc ${task.title}`}
              className="group/button"
            >
              <Edit3 className="h-4 w-4 mr-1.5 text-muted-foreground group-hover/button:text-primary transition-colors" /> Sửa
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              aria-label={`Xóa công việc ${task.title}`}
              className="group/button"
            >
               <Trash2 className="h-4 w-4 mr-1.5 opacity-80 group-hover/button:opacity-100 transition-opacity" /> Xóa
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskItem;
