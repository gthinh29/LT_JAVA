"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskItem from './TaskItem';
import { Task, deleteTask, TaskStatus as ApiTaskStatus, getTasksByProjectId, getAssignedTasks, updateTask, handleApiError, ProjectData, TaskPayload } from '@/utils/apiClient';
import { useTaskModal } from '@/app/layout'; 
import { PlusCircle, ListFilter, ChevronDown, Info, Search, XIcon, AlertTriangle, LayoutGrid, List, SortAsc, SortDesc, CalendarClock, CheckSquare, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

type TaskStatus = ApiTaskStatus;
type StatusFilterOption = TaskStatus | 'ALL_UNCOMPLETED';
type SortOrder = 'newest' | 'oldest' | 'dueDateAsc' | 'dueDateDesc' | 'titleAsc' | 'titleDesc';
type ViewMode = 'list' | 'grid';

const statusDisplayNames: Record<TaskStatus, string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const sortOptionLabels: Record<SortOrder, string> = {
  newest: 'Mới cập nhật',
  oldest: 'Cũ nhất (tạo)',
  dueDateAsc: 'Hạn chót (tăng dần)',
  dueDateDesc: 'Hạn chót (giảm dần)',
  titleAsc: 'Tiêu đề (A-Z)',
  titleDesc: 'Tiêu đề (Z-A)',
};

interface TaskSectionProps {
  currentProjectId?: number | null; 
  projects?: ProjectData[]; 
}

const TaskSection: React.FC<TaskSectionProps> = ({ currentProjectId, projects }) => {
  const { isAuthenticated, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { 
    openNewTaskModal: openNewTaskModalFromContextHook, 
    openEditTaskModal: openEditTaskModalFromContextHook,
    lastTaskOperationTimestamp 
  } = useTaskModal(); 

  const handleOpenNewTaskModal = () => {
    openNewTaskModalFromContextHook(currentProjectId);
  };
  const handleOpenEditTaskModal = (task: Task) => {
    openEditTaskModalFromContextHook(task);
  };

  const [activeView, setActiveView] = useState<'uncompleted' | 'completed'>('uncompleted');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ALL_UNCOMPLETED');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Thay đổi ở đây: Loại bỏ useCallback cho fetchTasks và định nghĩa nó bên trong useEffect
  // Hoặc, nếu muốn giữ useCallback, đảm bảo dependencies của nó thực sự ổn định.
  // Cách đơn giản hơn là đưa logic fetch trực tiếp vào useEffect.
  useEffect(() => {
    const fetchTasksAsync = async () => {
      if (!isAuthenticated) {
        setTasks([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setApiError(null);
      console.log(`TaskSection: Fetching tasks. ProjectID: ${currentProjectId}, Timestamp: ${lastTaskOperationTimestamp}`);
      try {
        let tasksData: Task[];
        if (currentProjectId !== undefined && currentProjectId !== null) {
          tasksData = await getTasksByProjectId(currentProjectId);
        } else {
          tasksData = await getAssignedTasks();
        }
        setTasks(tasksData);
      } catch (err) {
        setApiError(handleApiError(err));
        console.error("Lỗi tải công việc:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasksAsync();
  }, [isAuthenticated, currentProjectId, lastTaskOperationTimestamp]); // Dependencies trực tiếp cho useEffect
  
  const handleTaskStatusChange = async (taskWithNewStatus: Task) => {
    const originalTask = tasks.find(t => t.id === taskWithNewStatus.id);
    if (!originalTask) return;
    const newStatus = taskWithNewStatus.status;
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskWithNewStatus.id ? { ...task, status: newStatus } : task
      )
    );
    try {
      if (taskWithNewStatus.projectId === undefined || taskWithNewStatus.projectId === null) {
          console.error("Không thể cập nhật task: thiếu projectId.", taskWithNewStatus);
          setApiError("Lỗi cập nhật: Task không có thông tin dự án.");
          setTasks(prevTasks => prevTasks.map(task => task.id === taskWithNewStatus.id ? originalTask : task ));
          return;
      }
      const payload: TaskPayload = {
        title: taskWithNewStatus.title,
        description: taskWithNewStatus.description,
        status: newStatus,
        dueDate: taskWithNewStatus.dueDate,
        projectId: taskWithNewStatus.projectId,
        assigneeId: taskWithNewStatus.assigneeId,
      };
      const updatedTaskFromServer = await updateTask(taskWithNewStatus.id, payload);
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === updatedTaskFromServer.id ? updatedTaskFromServer : task)
      );
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái task:", err);
      setApiError(handleApiError(err));
      setTasks(prevTasks => prevTasks.map(task => task.id === taskWithNewStatus.id ? originalTask : task ));
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
      const originalTasks = [...tasks];
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      try {
        await deleteTask(id);
        // Sau khi xóa thành công, có thể bạn muốn trigger refresh từ context
        // để đảm bảo các component khác (nếu có) cũng cập nhật.
        // Tuy nhiên, nếu chỉ TaskSection cần cập nhật, việc fetch lại (nếu lastTaskOperationTimestamp thay đổi) là đủ.
        // Hoặc, nếu việc xóa không qua TaskFormModal, bạn có thể gọi triggerTaskRefresh() từ useTaskModal() ở đây.
        // Ví dụ: const { triggerTaskRefresh } = useTaskModal(); triggerTaskRefresh();
        // Nhưng điều này có thể gây ra fetch lại không cần thiết nếu xóa thành công và UI đã cập nhật.
        // Tạm thời để UI tự cập nhật client-side.
      } catch (err) {
        setApiError(handleApiError(err));
        setTasks(originalTasks);
      }
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;
    if (activeView === 'completed') {
      filtered = tasks.filter(task => task.status === 'DONE');
    } else { 
      if (statusFilter === 'ALL_UNCOMPLETED') {
        filtered = tasks.filter(task => task.status !== 'DONE');
      } else if (statusFilter === 'TODO' || statusFilter === 'IN_PROGRESS' || statusFilter === 'CANCELLED') {
        filtered = tasks.filter(task => task.status === statusFilter);
      }
    }
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTermLower) ||
        (task.description && task.description.toLowerCase().includes(searchTermLower))
      );
    }
    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'dueDateAsc':
          if (!a.dueDate && !b.dueDate) return 0; if (!a.dueDate) return 1; if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'dueDateDesc':
          if (!a.dueDate && !b.dueDate) return 0; if (!a.dueDate) return 1; if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        case 'titleAsc': return a.title.localeCompare(b.title);
        case 'titleDesc': return b.title.localeCompare(a.title);
        case 'newest': default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [tasks, activeView, statusFilter, sortOrder, searchTerm]);
  
   const listContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
   const sectionTitleVariants = { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
   const controlsVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1, ease: "easeOut" } } };
  
  const getNoTasksMessage = (): { title: string; description: string } => {
    if (apiError) return { title: 'Đã xảy ra lỗi', description: apiError };
    if (activeView === 'completed') return searchTerm ? { title: 'Không tìm thấy công việc hoàn thành.', description: 'Vui lòng thử từ khóa khác.' } : { title: 'Chưa có công việc nào hoàn thành.', description: 'Hoàn thành một vài công việc để xem chúng ở đây!' };
    if (searchTerm) return { title: 'Không tìm thấy công việc.', description: 'Vui lòng thử từ khóa khác.' };
    if (statusFilter === 'ALL_UNCOMPLETED') return { title: 'Tuyệt vời! Không có việc cần làm.', description: 'Nhấn "Thêm Task" để tạo công việc mới.'};
    if (statusFilter === 'TODO') return { title: 'Không có công việc "Cần làm".', description: 'Bạn có thể thêm công việc mới hoặc kiểm tra các mục khác.'};
    if (statusFilter === 'IN_PROGRESS') return { title: 'Không có công việc "Đang làm".', description: 'Hãy bắt đầu một công việc!'};
    if (statusFilter === 'CANCELLED') return { title: 'Không có công việc "Đã hủy".', description: ''};
    return { title: 'Chưa có công việc nào.', description: 'Hãy nhấn nút "Thêm Task" để bắt đầu.'};
  };

  const SortIcon = useMemo(() => { 
    if (sortOrder === 'dueDateAsc' || sortOrder === 'titleAsc') return SortAsc;
    if (sortOrder === 'dueDateDesc' || sortOrder === 'titleDesc') return SortDesc;
    if (sortOrder === 'newest' || sortOrder === 'oldest') return CalendarClock;
    return ChevronDown;
  }, [sortOrder]);

  if (!isAuthenticated && !loading) { return null; }

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.div variants={sectionTitleVariants} initial="hidden" animate="visible" className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-border pb-5 mb-5">
        <div className="flex items-center gap-3">
            <Button type="button" variant={activeView === 'uncompleted' ? "secondary" : "outline"} size="sm" onClick={() => { setActiveView('uncompleted'); setStatusFilter('ALL_UNCOMPLETED'); }} className="px-3 py-1.5 h-auto">
                <Clock className="h-4 w-4 mr-1.5 opacity-80"/> Đang chờ
            </Button>
            <Button type="button" variant={activeView === 'completed' ? "secondary" : "outline"} size="sm" onClick={() => setActiveView('completed')} className="px-3 py-1.5 h-auto">
                <CheckSquare className="h-4 w-4 mr-1.5 opacity-80"/> Hoàn thành
            </Button>
        </div>
        <Button type="button" onClick={handleOpenNewTaskModal} variant="default" size="default" className="button-primary group shadow-md hover:shadow-lg active:shadow-inner-sm">
          <PlusCircle className="h-5 w-5 mr-2" /> Thêm Task
        </Button>
      </motion.div>

      {apiError && !loading && ( <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4"> <Alert variant="destructive"> <AlertTriangle className="h-5 w-5" /> <AlertTitle>Đã xảy ra lỗi</AlertTitle> <AlertDescription>{apiError}</AlertDescription> </Alert> </motion.div> )}
      {(tasks.length > 0 || searchTerm || activeView === 'completed' || loading) && (
        <motion.div variants={controlsVariants} initial="hidden" animate="visible" className="card p-3.5 shadow-sm border border-border mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 items-center">
            <div className="relative w-full lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input id="search-term-section" type="text" placeholder="Tìm kiếm công việc..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-9 pr-9 py-2 text-sm w-full h-9" aria-label="Tìm kiếm công việc" />
                {searchTerm && (<Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')} aria-label="Xóa tìm kiếm" > <XIcon className="h-4 w-4 text-muted-foreground" /> </Button>)}
            </div>
            <div className="flex items-center gap-3 w-full lg:col-span-1">
                {activeView === 'uncompleted' && (
                     <div className="relative flex-1">
                        <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <select id="status-filter-section" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterOption)} className="select-field pl-9 appearance-none bg-no-repeat bg-right pr-7 py-2 text-sm w-full h-9" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em' }} aria-label="Lọc theo trạng thái chi tiết">
                        <option value="ALL_UNCOMPLETED">Tất cả (chưa HT)</option> <option value="TODO">Cần làm</option> <option value="IN_PROGRESS">Đang làm</option> <option value="CANCELLED">Đã hủy</option>
                        </select>
                    </div>
                )}
                <div className={cn("relative flex-1", activeView === 'completed' && "lg:col-start-1 lg:col-span-1")}>
                    <SortIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select id="sort-order-section" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)} className="select-field pl-9 appearance-none bg-no-repeat bg-right pr-7 py-2 text-sm w-full h-9" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em' }} aria-label="Sắp xếp theo">
                    {Object.entries(sortOptionLabels).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
                    </select>
                </div>
            </div>
            <div className="flex items-center justify-end gap-0.5 lg:col-span-1">
                <Button type="button" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8 rounded-sm"> <LayoutGrid className="h-4 w-4"/> <span className="sr-only">Xem dạng lưới</span> </Button>
                <Button type="button" variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8 rounded-sm"> <List className="h-4 w-4"/> <span className="sr-only">Xem dạng danh sách</span> </Button>
            </div>
            </div>
        </motion.div>
      )}

      {loading && (<motion.div variants={listContainerVariants} initial="hidden" animate="visible" className={cn("grid", viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "grid-cols-1 gap-1.5")}>
          {[...Array(viewMode === 'grid' ? 8 : 5)].map((_, i) => ( <div key={`skeleton-${i}`} className={cn("bg-card border border-border rounded-lg p-3 shadow-sm animate-pulse", viewMode === 'list' ? 'h-[52px]' : 'h-[120px]')}> <div className="h-4 bg-muted rounded w-3/4 mb-2"></div> {viewMode === 'grid' && <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>} {viewMode === 'grid' && <div className="h-3 bg-muted rounded w-full"></div>} </div> ))}
      </motion.div>)}

      {!loading && !apiError && filteredAndSortedTasks.length === 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="my-10 text-center py-10 card shadow-sm border border-border"> <Info className="h-10 w-10 mx-auto mb-3 text-primary/80" /> <h3 className="text-lg font-semibold text-foreground mb-1.5"> {getNoTasksMessage().title} </h3> <p className="text-muted-foreground text-sm max-w-xs mx-auto"> {getNoTasksMessage().description} </p> </motion.div> )}
      {!loading && !apiError && filteredAndSortedTasks.length > 0 && (<motion.div variants={listContainerVariants} initial="hidden" animate="visible" className={cn("grid", viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" : "grid-cols-1 gap-1.5")}>
          {filteredAndSortedTasks.map((task) => (<TaskItem key={task.id} task={task} onDeleteTask={handleDeleteTask} onEditTask={() => handleOpenEditTaskModal(task)} onStatusChange={handleTaskStatusChange} /> ))}
      </motion.div>)}
    </div>
  );
};

export default TaskSection;
