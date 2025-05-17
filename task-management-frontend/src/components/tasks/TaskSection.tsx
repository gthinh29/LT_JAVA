"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskItem, { TaskItemSkeleton } from './TaskItem';
import TaskForm from './TaskForm';
import { Task, getAllTasks, deleteTask } from '@/utils/apiClient';
import { PlusCircle, ListFilter, ChevronDown, Info, Search, XIcon, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { cn } from '@/utils/cn';

type StatusFilter = Task['status'] | 'ALL';
type SortOrder = 'newest' | 'oldest' | 'dueDate';
type ViewMode = 'grid' | 'list';

const statusDisplayNames: Record<Task['status'], string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Hoàn thành',
};

const TaskSection: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const tasksData = await getAllTasks();
      setTasks(tasksData);
    } catch (err) {
      setApiError('Không thể tải danh sách công việc. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSubmitSuccess = () => {
    setEditingTask(null);
    setIsFormOpen(false);
    fetchTasks();
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        await deleteTask(id);
        fetchTasks();
      } catch (err) {
        setApiError('Không thể xóa công việc. Vui lòng thử lại.');
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
    const formContainer = document.getElementById('task-form-motion-container');
    if (formContainer) {
      formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const toggleFormOpen = () => {
    if (isFormOpen && editingTask) {
      setEditingTask(null);
    }
    setIsFormOpen(!isFormOpen);
    if (!isFormOpen && editingTask) setEditingTask(null);
  };

  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const matchesFilter = statusFilter === 'ALL' || task.status === statusFilter;
        const matchesSearch = searchTerm.trim() === '' ||
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          case 'newest':
          default:
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });
  }, [tasks, statusFilter, sortOrder, searchTerm]);

  const listContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const sectionTitleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const controlsVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1, ease: "easeOut" } }
  };
  
  const getNoTasksAlertTitle = (): string => {
    if (searchTerm) return 'Không tìm thấy công việc.';
    if (statusFilter === 'ALL') return 'Chưa có công việc nào.';
    return `Không có công việc "${statusDisplayNames[statusFilter]}".`;
  };

  const getNoTasksAlertDescription = (): string => {
    if (searchTerm) return 'Vui lòng thử từ khóa khác.';
    if (statusFilter === 'ALL') return 'Hãy nhấn nút "Thêm Công việc" để bắt đầu.';
    return 'Hãy thử một bộ lọc khác hoặc thêm công việc mới.';
  };

  const buttonText = useMemo(() => {
    if (isFormOpen) {
      return editingTask ? 'Đang sửa...' : 'Đóng Form';
    }
    return 'Thêm Công việc';
  }, [isFormOpen, editingTask]);

  return (
    <div className="space-y-8">
      <motion.div
        variants={sectionTitleVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-border pb-6 mb-8"
      >
        <h2 className="text-3xl font-bold text-foreground">
          Quản lý Công việc
        </h2>
        <Button onClick={toggleFormOpen} variant="default" size="lg" className="button-primary w-full sm:w-auto group shadow-md hover:shadow-lg active:shadow-inner-sm">
          <PlusCircle className={cn("h-5 w-5 mr-2 transition-transform duration-common ease-custom-bezier", isFormOpen && "rotate-[225deg]")} />
          {buttonText}
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        {isFormOpen && (
          <motion.div
            key="task-form-motion-container"
            id="task-form-motion-container"
            initial={{ opacity: 0, height: 0, y: -30, marginTop: '-2rem' }}
            animate={{ opacity: 1, height: 'auto', y: 0, marginTop: '0rem', transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } }}
            exit={{ opacity: 0, height: 0, y: -30, marginTop: '-2rem', transition: { duration: 0.3, ease: [0.5, 0, 0.75, 0] } }}
            className="overflow-hidden"
          >
            <TaskForm
              onSubmitSuccess={handleSubmitSuccess}
              taskToEdit={editingTask}
              onCancelEdit={handleCancelEdit}
              isVisible={isFormOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {apiError && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Đã xảy ra lỗi</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div
        variants={controlsVariants}
        initial="hidden"
        animate="visible"
        className="card-base p-4 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:flex-1 lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-10 pr-10"
              aria-label="Tìm kiếm công việc"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm('')}
                aria-label="Xóa tìm kiếm"
              >
                <XIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ListFilter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="select-base flex-grow appearance-none bg-no-repeat bg-right pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                aria-label="Lọc theo trạng thái"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Hoàn thành</option>
              </select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ChevronDown className="h-5 w-5 text-muted-foreground transform -rotate-90 flex-shrink-0" />
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="select-base flex-grow appearance-none bg-no-repeat bg-right pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                aria-label="Sắp xếp theo"
              >
                <option value="newest">Mới cập nhật</option>
                <option value="oldest">Cũ nhất (tạo)</option>
                <option value="dueDate">Ngày hết hạn</option>
              </select>
            </div>
             <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-background self-stretch sm:self-center">
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8 rounded-sm">
                    <LayoutGrid className="h-4 w-4"/>
                </Button>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8 rounded-sm">
                    <List className="h-4 w-4"/>
                </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {loading && (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}
        >
          {[...Array(viewMode === 'grid' ? 3 : 2)].map((_, i) => <TaskItemSkeleton key={`skeleton-${i}`} />)}
        </motion.div>
      )}

      {!loading && !apiError && filteredAndSortedTasks.length === 0 && (
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
            <div className="my-12 text-center py-12 card-base">
              <Info className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {getNoTasksAlertTitle()}
              </h3>
              <p className="text-muted-foreground">
                {getNoTasksAlertDescription()}
              </p>
            </div>
         </motion.div>
      )}

      {!loading && !apiError && filteredAndSortedTasks.length > 0 && (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}
        >
          {filteredAndSortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default TaskSection;
