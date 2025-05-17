"use client";

import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskPayload, Task, createTask, updateTask } from '@/utils/apiClient';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertTriangle, CheckCircle2, XIcon, Save, Plus, CalendarIcon, TagIcon } from "lucide-react";
import { cn } from '@/utils/cn';

interface TaskFormProps {
  onSubmitSuccess: () => void;
  taskToEdit?: Task | null;
  onCancelEdit?: () => void;
  isVisible: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmitSuccess, taskToEdit, onCancelEdit, isVisible }) => {
  const formId = useId();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskPayload['status']>('TODO');
  const [dueDate, setDueDate] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status);
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setDueDate('');
    }
    if(isVisible) {
        setValidationErrors({});
        setApiError(null);
        setSuccessMessage(null);
    }
  }, [taskToEdit, isVisible]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Tiêu đề không được để trống.";
    if (title.trim().length > 255) errors.title = "Tiêu đề không được quá 255 ký tự.";
    if (description.trim().length > 1000) errors.description = "Mô tả không được quá 1000 ký tự.";
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(dueDate);
      selectedDate.setHours(0,0,0,0);
      if (selectedDate < today) {
        errors.dueDate = "Ngày hết hạn phải là ngày hiện tại hoặc trong tương lai.";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);
    if (!validateForm()) return;

    const taskPayload: TaskPayload = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      status,
      dueDate: dueDate ? dueDate : null,
    };

    setLoading(true);
    try {
      const action = taskToEdit ? 'cập nhật' : 'tạo';
      if (taskToEdit) {
        await updateTask(taskToEdit.id, taskPayload);
      } else {
        await createTask(taskPayload);
      }
      setSuccessMessage(`Công việc đã được ${action} thành công!`);
      
      if (!taskToEdit) {
        setTitle(''); setDescription(''); setStatus('TODO'); setDueDate('');
      }
      onSubmitSuccess(); 
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const responseData = err.response.data as any;
        if (responseData?.errors && typeof responseData.errors === 'object') {
          setValidationErrors(responseData.errors);
        } else if (responseData?.message) {
          setApiError(`Lỗi từ server: ${responseData.message}`);
        } else {
          setApiError(`Lỗi ${err.response.status}: Không thể xử lý yêu cầu.`);
        }
      } else if (err instanceof Error) {
        setApiError(`Đã xảy ra lỗi: ${err.message}`);
      } else {
        setApiError('Đã xảy ra lỗi không xác định.');
      }
      setTimeout(() => setApiError(null), 5000);
    } finally {
      setLoading(false);
    }
  };
  
  const formVariants = {
    hidden: { opacity: 0, height: 0, y: -20, marginTop: 0, marginBottom: 0, paddingTop:0, paddingBottom:0 },
    visible: { opacity: 1, height: 'auto', y: 0, marginTop: '1.5rem', marginBottom: '2rem', paddingTop:'1.5rem', paddingBottom:'1.5rem' },
  };
  
  if (!isVisible && !taskToEdit && !onCancelEdit) return null;


  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="task-form"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="card-base relative overflow-hidden px-6 md:px-8 shadow-lg"
          id="task-form-container"
        >
          {onCancelEdit && (
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={onCancelEdit} aria-label="Đóng form">
              <XIcon className="h-5 w-5" />
            </Button>
          )}
          <h3 className="text-2xl font-semibold leading-none tracking-tight mb-8 text-center text-foreground">
            {taskToEdit ? 'Chỉnh sửa Công việc' : 'Thêm Công việc Mới'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby={`${formId}-form-title`}>
            <span id={`${formId}-form-title`} className="sr-only">{taskToEdit ? 'Form chỉnh sửa công việc' : 'Form thêm công việc mới'}</span>

            <AnimatePresence mode="wait">
              {apiError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: {duration: 0.2} }} transition={{duration: 0.3}}>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {successMessage && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: {duration: 0.2} }} transition={{duration: 0.3}}>
                  <Alert variant="success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Thành công</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label htmlFor={`${formId}-title-input`} className="block text-sm font-medium text-foreground/90">
                Tiêu đề <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                id={`${formId}-title-input`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn("input-base", validationErrors.title && "border-destructive ring-1 ring-destructive/50")}
                aria-invalid={!!validationErrors.title}
                aria-describedby={`${formId}-title-error`}
              />
              {validationErrors.title && (
                <p id={`${formId}-title-error`} className="mt-1.5 text-xs text-destructive">{validationErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor={`${formId}-description`} className="block text-sm font-medium text-foreground/90">
                Mô tả
              </label>
              <textarea
                id={`${formId}-description`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={cn("textarea-base", validationErrors.description && "border-destructive ring-1 ring-destructive/50")}
                aria-invalid={!!validationErrors.description}
                aria-describedby={`${formId}-description-error`}
              />
              {validationErrors.description && (
                <p id={`${formId}-description-error`} className="mt-1.5 text-xs text-destructive">{validationErrors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              <div className="space-y-2">
                <label htmlFor={`${formId}-status`} className="block text-sm font-medium text-foreground/90">
                  Trạng thái <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                    <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                    id={`${formId}-status`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskPayload['status'])}
                    className="select-base pl-10"
                    >
                    <option value="TODO">Cần làm</option>
                    <option value="IN_PROGRESS">Đang làm</option>
                    <option value="DONE">Hoàn thành</option>
                    </select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor={`${formId}-dueDate`} className="block text-sm font-medium text-foreground/90">
                  Ngày hết hạn
                </label>
                 <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                    type="date"
                    id={`${formId}-dueDate`}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={cn("input-base pl-10", validationErrors.dueDate && "border-destructive ring-1 ring-destructive/50")}
                    aria-invalid={!!validationErrors.dueDate}
                    aria-describedby={`${formId}-dueDate-error`}
                    />
                </div>
                {validationErrors.dueDate && (
                  <p id={`${formId}-dueDate-error`} className="mt-1.5 text-xs text-destructive">{validationErrors.dueDate}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              {taskToEdit && onCancelEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancelEdit}
                  loading={loading}
                  className="w-full sm:w-auto"
                >
                  Hủy
                </Button>
              )}
              <Button
                type="submit"
                loading={loading}
                className="w-full sm:w-auto button-primary shadow-md hover:shadow-lg"
              >
                {taskToEdit ? <Save className="h-4 w-4 mr-2"/> : <Plus className="h-4 w-4 mr-2"/>}
                {taskToEdit ? 'Lưu Thay đổi' : 'Thêm Công việc'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskForm;
