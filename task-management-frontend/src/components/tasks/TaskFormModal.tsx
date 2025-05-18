"use client";

import React, { useState, useEffect, useId, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskPayload, Task, createTask, updateTask, TaskStatus, ProjectData, handleApiError } from '@/utils/apiClient';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertTriangle, CheckCircle2, XIcon, Save, CalendarDays, Check, Loader2 } from "lucide-react"; // Bỏ Folder không dùng
import { cn } from '@/utils/cn';

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

try {
  registerLocale('vi', vi);
} catch (error) {
  // console.warn("Locale 'vi' cho datepicker có thể đã được đăng ký hoặc đăng ký thất bại:", error);
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (updatedOrCreatedTask: Task) => void;
  taskToEdit?: Task | null;
  projects?: ProjectData[];
  currentProjectId?: number | null;
  isLoadingProjects?: boolean;
}

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 1000;

const formatDateToYYYYMMDD = (date: Date | null): string | null => {
  if (!date) return null;
  try {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    if (year < 1000 || year > 9999) return null;
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Lỗi định dạng ngày:", e);
    return null;
  }
};

const parseInputDateToDateObject = (dateString: string | null | undefined): Date | null => {
  if (!dateString || typeof dateString !== 'string' || dateString.trim() === "") return null;
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year >= 1000 && year <= 9999 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(Date.UTC(year, month, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  return null;
};

const CustomCheckboxInline: React.FC<{ checked: boolean; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; id: string; label: string; disabled?: boolean }> = ({ checked, onChange, id, label, disabled }) => {
  return (
    <label htmlFor={id} className={cn("flex items-center space-x-2 cursor-pointer group", disabled && "opacity-50 cursor-not-allowed")}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
      <div className={cn(
        "flex items-center justify-center h-3.5 w-3.5 border rounded-sm transition-all duration-150 flex-shrink-0",
        "border-muted-foreground/60 group-hover:border-primary peer-focus-visible:ring-1 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background dark:border-muted-foreground/50",
        checked ? "bg-primary border-primary" : "bg-transparent"
      )}>
        {checked && (<Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3.5} />)}
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground">{label}</span>
    </label>
  );
};

// --- START: Static Framer Motion Variants ---
const staticModalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: "-2%" },
  visible: { opacity: 1, scale: 1, y: "0%", transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, y: "2%", transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }
};

const staticBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};
// --- END: Static Framer Motion Variants ---

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  taskToEdit,
  projects = [],
  currentProjectId,
  isLoadingProjects = false
}) => {
  const { user } = useAuth();
  const formId = useId();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [addAnother, setAddAnother] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    const textarea = descriptionTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const computedStyle = getComputedStyle(textarea);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);
      const actualContentHeight = scrollHeight - paddingTop - paddingBottom;
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
      const minHeight = lineHeight + paddingTop + paddingBottom;
      const maxHeight = (lineHeight * 5) + paddingTop + paddingBottom;

      if (actualContentHeight <= lineHeight) {
        textarea.style.height = `${minHeight}px`;
        textarea.style.overflowY = 'hidden';
      } else if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  };

  useEffect(() => { autoResizeTextarea(); }, [description, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setDueDate(parseInputDateToDateObject(taskToEdit.dueDate));
        setSelectedProjectId(taskToEdit.projectId || currentProjectId || (projects.length > 0 ? projects[0].id : null));
        setSelectedAssigneeId(taskToEdit.assigneeId || user?.id || null);
        setStatus(taskToEdit.status);
        setAddAnother(false);
      } else {
        setTitle('');
        setDescription('');
        setDueDate(null);
        setSelectedProjectId(currentProjectId || (projects.length > 0 ? projects[0].id : null));
        setSelectedAssigneeId(user?.id || null);
        setStatus('TODO');
        setAddAnother(false);
      }
      setValidationErrors({});
      setApiError(null);
      setSuccessMessage(null);
      if (!taskToEdit) {
        setTimeout(() => titleInputRef.current?.focus(), 100);
      }
      setTimeout(autoResizeTextarea, 0);
    }
  }, [isOpen, taskToEdit, currentProjectId, projects, user]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Tên công việc không được để trống.";
    else if (title.trim().length > MAX_TITLE_LENGTH) errors.title = `Tên công việc tối đa ${MAX_TITLE_LENGTH} ký tự.`;
    
    if (description.trim().length > MAX_DESCRIPTION_LENGTH) errors.description = `Mô tả tối đa ${MAX_DESCRIPTION_LENGTH} ký tự.`;
    
    if (!selectedProjectId && !isLoadingProjects) errors.projectId = "Vui lòng chọn một dự án.";
    
    if (dueDate) {
      if (isNaN(dueDate.getTime())) errors.dueDate = "Ngày không hợp lệ.";
      else {
        if (!(taskToEdit && parseInputDateToDateObject(taskToEdit.dueDate)?.getTime() === dueDate.getTime())) {
            const today = new Date(); today.setUTCHours(0, 0, 0, 0); 
            const selectedDateOnly = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
            if (selectedDateOnly < today) errors.dueDate = "Ngày hết hạn không được là ngày trong quá khứ.";
        }
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null); setSuccessMessage(null);

    if (!validateForm()) return;
    
    if (!selectedProjectId) {
        setValidationErrors(prev => ({ ...prev, projectId: "Vui lòng chọn một dự án."})); return;
    }

    const taskPayload: TaskPayload = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      status: status,
      dueDate: formatDateToYYYYMMDD(dueDate),
      projectId: selectedProjectId,
      assigneeId: selectedAssigneeId,
    };

    setLoading(true);
    try {
      const actionText = taskToEdit ? 'cập nhật' : 'tạo mới';
      let createdOrUpdatedTask: Task;

      if (taskToEdit) {
        createdOrUpdatedTask = await updateTask(taskToEdit.id, taskPayload);
      } else {
        createdOrUpdatedTask = await createTask(taskPayload);
      }
      
      onSubmitSuccess(createdOrUpdatedTask);

      if (!addAnother || taskToEdit) {
        onClose();
      } else {
        setTitle(''); setDescription(''); setDueDate(null); setStatus('TODO');
        setSuccessMessage(`Đã ${actionText} "${createdOrUpdatedTask.title}". Thêm công việc tiếp theo.`);
        setTimeout(() => { setSuccessMessage(null); titleInputRef.current?.focus(); }, 3000);
      }
    } catch (err: unknown) {
      setApiError(handleApiError(err));
      setTimeout(() => setApiError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const CustomDateInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void } >(
    ({ value, onClick }, ref) => (
      <Button
        type="button"
        variant="outline"
        onClick={(e) => { e.stopPropagation(); if(onClick) onClick(e); }}
        ref={ref}
        className={cn(
            "w-full justify-start text-left font-normal text-sm h-auto py-2.5 px-1",
            "border-0 border-b-2 rounded-none",
            validationErrors.dueDate ? "border-destructive focus:border-destructive" : "border-border focus:border-primary",
            !value && "text-muted-foreground/80"
        )}
      >
        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground"/>
        {value || "Không có ngày hết hạn"}
      </Button>
    )
  );
  CustomDateInput.displayName = 'CustomDateInput';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="task-form-backdrop"
          variants={staticBackdropVariants} 
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 w-screen h-screen bg-black/75 dark:bg-black/85 flex items-center justify-center z-[999] p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            key="task-form-modal-content"
            ref={modalRef}
            variants={staticModalVariants} 
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-card text-card-foreground rounded-lg shadow-2xl w-full max-w-sm p-5 md:p-6 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-2 relative">
              <h3 className="text-md font-semibold text-foreground text-center">
                {taskToEdit ? 'Chỉnh sửa Công việc' : 'Thêm Công việc Mới'}
              </h3>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full absolute top-0 right-0 -mt-4 -mr-4 text-muted-foreground hover:text-foreground">
                <XIcon className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-1 min-h-[20px]">
              <AnimatePresence mode="wait">
                {apiError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}}>
                    <Alert variant="destructive" className="p-2 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <AlertDescription>{apiError}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.2}}>
                    <Alert variant="success" className="p-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off"> {/* Thêm autoComplete="off" cho form */}
              <div>
                <input
                  ref={titleInputRef}
                  type="text"
                  id={`${formId}-title`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={MAX_TITLE_LENGTH}
                  className={cn(
                    "input-field w-full text-sm py-2.5 placeholder:text-muted-foreground/70",
                    "border-0 border-b border-border focus:border-primary focus:ring-0 rounded-none px-1",
                    validationErrors.title && "border-destructive focus:border-destructive"
                  )}
                  placeholder="Viết tên công việc"
                  aria-invalid={!!validationErrors.title}
                  aria-describedby={validationErrors.title ? `${formId}-title-error` : undefined}
                  autoComplete="off"
                />
                {validationErrors.title && <p id={`${formId}-title-error`} className="mt-1 text-xs text-destructive">{validationErrors.title}</p>}
              </div>

              <div>
                <textarea
                  ref={descriptionTextareaRef}
                  id={`${formId}-description`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    autoResizeTextarea();
                  }}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={1}
                  className={cn(
                    "textarea-field w-full text-sm py-2.5 placeholder:text-muted-foreground/70",
                     "border-0 border-b border-border focus:border-primary focus:ring-0 rounded-none px-1 resize-none overflow-hidden",
                    validationErrors.description && "border-destructive focus:border-destructive"
                  )}
                  placeholder="Mô tả tùy chọn"
                  style={{ minHeight: 'calc(1.5rem * 1 + 2 * 0.625rem)' }}
                  aria-describedby={validationErrors.description ? `${formId}-description-error` : undefined}
                  autoComplete="off"
                />
                 {validationErrors.description && <p id={`${formId}-description-error`} className="mt-1 text-xs text-destructive">{validationErrors.description}</p>}
              </div>
              
              <div className="space-y-1">
                <label htmlFor={`${formId}-project`} className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Dự án</label>
                <select
                  id={`${formId}-project`}
                  value={selectedProjectId ?? ""}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                  disabled={isLoadingProjects || projects.length === 0}
                  className={cn(
                    "select-field w-full text-sm py-2.5 placeholder:text-muted-foreground/70",
                    "border-0 border-b-2 border-border focus:border-primary focus:ring-0 rounded-none px-1 h-auto bg-transparent appearance-none bg-no-repeat bg-right",
                    "bg-[url('data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2020%2020%27%3e%3cpath%20stroke='%2364748b'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='1.5'%20d='M6%208l4%204%204-4'/%3e%3c/svg%3e')]",
                    "pr-7",
                    validationErrors.projectId && "border-destructive focus:border-destructive",
                    (isLoadingProjects || projects.length === 0) && "opacity-50 cursor-not-allowed"
                  )}
                  style={{ backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em 1.25em' }}
                  aria-invalid={!!validationErrors.projectId}
                  aria-describedby={validationErrors.projectId ? `${formId}-project-error` : undefined}
                >
                  {isLoadingProjects ? (
                    <option value="" disabled>Đang tải dự án...</option>
                  ) : projects.length === 0 ? (
                    <option value="" disabled>Không có dự án nào</option>
                  ) : (
                    <>
                      <option value="" disabled className={selectedProjectId === null ? "" : "hidden"}>
                        {selectedProjectId === null ? "Chọn một dự án" : ""}
                      </option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {validationErrors.projectId && <p id={`${formId}-project-error`} className="mt-1 text-xs text-destructive">{validationErrors.projectId}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Ngày hết hạn</label>
                <DatePicker
                    selected={dueDate}
                    onChange={(date: Date | null) => setDueDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="vi"
                    isClearable
                    autoComplete="off"
                    customInput={<CustomDateInput />}
                    wrapperClassName="w-full"
                    calendarClassName="custom-datepicker-calendar-small"
                    dayClassName={(date) => cn(
                        "custom-datepicker-day-small",
                        new Date(date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) && "custom-datepicker-today-small"
                    )}
                    popperPlacement="bottom"
                    showYearDropdown
                    yearDropdownItemNumber={160}
                    scrollableYearDropdown
                    dropdownMode="select"
                    aria-invalid={validationErrors.dueDate ? "true" : "false"}
                    aria-describedby={validationErrors.dueDate ? `${formId}-dueDate-error` : undefined}
                />
                 {validationErrors.dueDate && <p id={`${formId}-dueDate-error`} className="mt-1 text-xs text-destructive">{validationErrors.dueDate}</p>}
              </div>
              
              {!taskToEdit && (
                <div className="pt-1">
                  <CustomCheckboxInline
                    id={`${formId}-addAnother`}
                    checked={addAnother}
                    onChange={(e) => setAddAnother(e.target.checked)}
                    label="Thêm công việc khác sau khi tạo"
                  />
                </div>
              )}

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || isLoadingProjects}
                  className="button-primary shadow-md hover:shadow-lg min-w-[80px]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                    <>
                      {taskToEdit ? <Save className="h-3.5 w-3.5 mr-1.5"/> : null} 
                      {taskToEdit ? 'Lưu' : 'Tạo Task'}
                    </>
                  }
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskFormModal;