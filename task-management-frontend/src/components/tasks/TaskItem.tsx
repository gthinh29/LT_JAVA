"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, updateTask } from '@/utils/apiClient';
import { cn } from '@/utils/cn';
import { Edit3, Trash2, CalendarDays, Loader2 as LoaderIcon, MoreHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TaskItemProps {
  task: Task;
  onDeleteTask: (id: number) => Promise<void>;
  onEditTask: (task: Task) => void;
  onStatusChange?: (task: Task) => void;
}

const statusConfig: Record<Task['status'], { icon?: React.ElementType; iconColor?: string; text: string; itemClasses?: string; titleClasses?: string }> = {
  TODO: { 
    text: 'Cần làm',
    itemClasses: 'border-l-2 border-yellow-500 dark:border-yellow-400',
    titleClasses: 'text-foreground group-hover:text-primary'
  },
  IN_PROGRESS: { 
    icon: LoaderIcon, 
    iconColor: 'text-blue-500 dark:text-blue-400 animate-spin',
    text: 'Đang làm',
    itemClasses: 'border-l-2 border-blue-500 dark:border-blue-400',
    titleClasses: 'text-foreground group-hover:text-primary'
  },
  DONE: { 
    text: 'Hoàn thành',
    itemClasses: 'opacity-60 dark:opacity-50',
    titleClasses: 'line-through text-muted-foreground'
  },
};

const CustomCheckbox: React.FC<{ checked: boolean; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; id: string; disabled?: boolean }> = ({ checked, onChange, id, disabled }) => {
  return (
    <div className="flex items-center justify-center h-5 w-5 flex-shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange} // onChange sẽ nhận event
        disabled={disabled}
        className="sr-only peer"
      />
      <label
        htmlFor={id}
        className={cn(
          "flex items-center justify-center h-4 w-4 border rounded-sm transition-all duration-150",
          "border-gray-400 dark:border-gray-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
          checked ? "bg-primary border-primary dark:bg-primary dark:border-primary" : "bg-transparent hover:border-primary/70",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
      >
        {checked && (
          <Check
            className="h-3 w-3 text-primary-foreground"
            strokeWidth={3}
          />
        )}
      </label>
    </div>
  );
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onDeleteTask, onEditTask, onStatusChange }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const currentStatusConfig = statusConfig[task.status];
  const StatusIcon = currentStatusConfig.icon;

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate + 'T00:00:00Z').toLocaleDateString('vi-VN', { day: '2-digit', month: 'numeric' }) // Thêm 'Z' để chỉ UTC
    : null;

  const isOverdue = task.dueDate && new Date(task.dueDate + 'T00:00:00Z') < new Date(new Date().setHours(0,0,0,0)) && task.status !== 'DONE';


  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  };

  const handleCheckboxChangeInternal = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation(); // Ngăn sự kiện nổi bọt
    if (isLoadingStatus) return;
    setIsLoadingStatus(true);
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      const updatedTaskData = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        status: newStatus,
        dueDate: task.dueDate,
      });
      if (onStatusChange) {
        onStatusChange(updatedTaskData);
      }
    } catch (error) {
      console.error("Không thể cập nhật trạng thái công việc:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // Ngăn sự kiện nổi bọt
    onEditTask(task);
    setIsMenuOpen(false); // Đóng menu nếu đang mở
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện nổi bọt
    await onDeleteTask(task.id);
    setIsMenuOpen(false); // Đóng menu
  };
  
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };


  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsMenuOpen(false);}}
      className={cn(
        "bg-card text-card-foreground rounded-md border flex items-center p-2.5 space-x-2.5 shadow-sm hover:shadow-md transition-shadow duration-200 group",
        currentStatusConfig.itemClasses
      )}
    >
      <div onClick={(e) => e.stopPropagation()} className="flex items-center">
        <CustomCheckbox
          id={`task-checkbox-${task.id}`}
          checked={task.status === 'DONE'}
          onChange={handleCheckboxChangeInternal}
          disabled={isLoadingStatus}
        />
        {isLoadingStatus && <LoaderIcon className="h-4 w-4 animate-spin text-primary ml-2" />}
      </div>

      <div 
        className="flex-grow min-w-0 cursor-pointer" 
        onClick={handleEditClick}
        onKeyDown={(e) => {if(e.key === 'Enter' || e.key === ' ') handleEditClick(e)}}
        role="button" 
        tabIndex={0} 
        aria-label={`Sửa công việc ${task.title}`}
      >
        <div className="flex items-center space-x-1.5">
            {task.status === 'IN_PROGRESS' && StatusIcon && (
                <StatusIcon className={cn("h-3.5 w-3.5 flex-shrink-0", currentStatusConfig.iconColor)} title={currentStatusConfig.text} />
            )}
            <p className={cn(
                "text-sm font-medium truncate",
                currentStatusConfig.titleClasses
              )}
              title={task.title}
            >
              {task.title}
            </p>
        </div>
        {task.description && task.status !== 'DONE' && (
            <p className="text-xs text-muted-foreground truncate mt-0.5" title={task.description}>
                {task.description}
            </p>
        )}
      </div>

      {formattedDueDate && task.status !== 'DONE' && (
        <div className={cn(
            "flex items-center text-xs px-1.5 py-0.5 rounded whitespace-nowrap ml-auto flex-shrink-0",
            isOverdue ? "bg-destructive/10 text-destructive" : "bg-muted/70 text-muted-foreground",
          )}
          title={`Hạn chót: ${formattedDueDate}${isOverdue ? ' (Quá hạn)' : ''}`}
        >
          <CalendarDays className={cn("h-3 w-3 mr-1", isOverdue && "text-destructive")} />
          {formattedDueDate}
        </div>
      )}

      <div className="relative ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
                "h-7 w-7 rounded-full transition-opacity duration-150 text-muted-foreground hover:text-foreground",
                (isHovered || isMenuOpen) ? "opacity-100" : "opacity-0 group-focus-within:opacity-100"
            )}
            onClick={toggleMenu}
            aria-label="Tùy chọn khác"
        >
            <MoreHorizontal className="h-4 w-4" />
        </Button>
        {isMenuOpen && (
            <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-lg z-20 py-1"
            >
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start px-3 py-1.5 text-sm rounded-none hover:bg-accent"
                    onClick={handleEditClick}
                >
                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Sửa chi tiết
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive rounded-none"
                    onClick={handleDeleteClick}
                >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Xóa công việc
                </Button>
            </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskItem;
