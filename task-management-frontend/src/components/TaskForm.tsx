// task-management-frontend/src/components/TaskForm.tsx

"use client"; // Đây là Client Component

import React, { useState, useEffect } from 'react';
// Import createTask, updateTask, TaskPayload, Task từ apiClient
import { TaskPayload, Task, createTask, updateTask } from '../utils/apiClient';
import axios from 'axios'; // Import axios để kiểm tra lỗi cụ thể


// Định nghĩa Props cho component TaskForm
interface TaskFormProps {
  onSubmitSuccess: () => void; // Hàm gọi sau khi submit thành công (để refresh list)
  taskToEdit?: Task | null; // Optional: Task object nếu đang ở chế độ sửa
  onCancelEdit?: () => void; // Optional: Hàm xử lý khi hủy sửa
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmitSuccess, taskToEdit, onCancelEdit }) => {
  // State để lưu dữ liệu trong form
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [status, setStatus] = useState<TaskPayload['status']>(taskToEdit?.status || 'TODO');
  const [dueDate, setDueDate] = useState<string | null>(taskToEdit?.dueDate || null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Effect hook: Cập nhật state form khi taskToEdit thay đổi
  useEffect(() => {
    setTitle(taskToEdit?.title || '');
    setDescription(taskToEdit?.description || '');
    setStatus(taskToEdit?.status || 'TODO');
    setDueDate(taskToEdit?.dueDate || null);
    setValidationErrors([]);
    setError(null); // Reset lỗi khi chuyển mode
  }, [taskToEdit]);

  // Hàm validate dữ liệu client-side đơn giản
  const validateForm = (): string[] => {
      const errors: string[] = [];
      if (!title.trim()) {
          errors.push("Tiêu đề không được để trống.");
      }
      // Thêm các kiểm tra khác nếu cần
      return errors;
  };


  // Hàm xử lý khi submit form (GỌI API TẠI ĐÂY)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate client-side trước
    const errors = validateForm();
    if(errors.length > 0) {
        setValidationErrors(errors);
        return;
    }

    const taskPayload: TaskPayload = {
      title: title.trim(),
      description: description ? description.trim() : null,
      status,
      dueDate: dueDate ? dueDate : null,
    };

    setLoading(true);
    setError(null);
    setValidationErrors([]);
    try {
        let result;
        if (taskToEdit) {
            // Chế độ sửa: Gọi API cập nhật
            result = await updateTask(taskToEdit.id, taskPayload);
        } else {
            // Chế độ tạo mới: Gọi API tạo
            result = await createTask(taskPayload);
        }

      console.log('Submit success:', result);
      onSubmitSuccess(); // Gọi hàm callback từ cha

      // Làm sạch form CHỈ KHI TẠO MỚI
      if (!taskToEdit) {
          setTitle('');
          setDescription('');
          setStatus('TODO');
          setDueDate(null);
      }

    } catch (err: unknown) { // <-- Đã sửa kiểu lỗi thành unknown
      console.error('Submit error:', err);
      // Xử lý lỗi từ API (backend validation, server error...)
      // Kiểm tra kiểu cụ thể hơn
      if (axios.isAxiosError(err)) { // Kiểm tra lỗi Axios
          if (err.response) {
              // Lỗi từ phản hồi HTTP (ví dụ: 400, 404, 500)
              console.error('Response data:', err.response.data);
              console.error('Response status:', err.response.status);
              // Cố gắng hiển thị thông báo lỗi từ backend
              // Đảm bảo chú thích ESLint chỉ có lệnh và tên rule, không văn bản khác
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (err.response.data && (err.response.data as any).message) { // <-- Dòng lỗi 'any' đầu tiên trong log trước
                  // Đảm bảo chú thích ESLint chỉ có lệnh và tên rule
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   setError(`Lỗi từ server: ${(err.response.data as any).message}`); // <-- Dòng lỗi 'any' thứ hai trong log trước
              } else if (typeof err.response.data === 'string') {
                   setError(`Lỗi từ server: ${err.response.data}`);
              } else if (err.response.data) { // Nếu data là object nhưng không có message
                   setError(`Lỗi phản hồi từ server: ${JSON.stringify(err.response.data)}`);
              }
              else {
                  setError(`Lỗi phản hồi từ server: ${err.response.status}`);
              }
          } else if (err.request) {
              // Request được gửi nhưng không nhận được phản hồi
              setError('Không nhận được phản hồi từ server.');
          } else {
              // Lỗi khi thiết lập request
              setError(`Lỗi khi gửi request: ${err.message}`);
          }
      } else if (err instanceof Error) { // Kiểm tra lỗi Javascript thông thường
           setError(`Đã xảy ra lỗi: ${err.message}`);
      }
      else {
           setError('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Sử dụng các class Tailwind
    <div className="bg-white p-6 rounded-lg shadow-xl mb-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">{taskToEdit ? 'Sửa Task' : 'Thêm Task Mới'}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Tiêu đề:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả:</label>
          <textarea
            id="description"
            value={description || ''}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

         <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Trạng thái:</label>
           <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskPayload['status'])}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
            </select>
        </div>

         <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Hạn chót:</label>
            <input
                type="date"
                id="dueDate"
                value={dueDate || ''}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
        </div>

        {/* Hiển thị lỗi validation client-side */}
        {validationErrors.length > 0 && (
            <ul className="text-red-600 text-sm">
                {validationErrors.map((err, index) => <li key={index}>{err}</li>)}
            </ul>
        )}

        {/* Hiển thị lỗi từ API */}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex space-x-4">
             <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
            >
                {loading ? (taskToEdit ? 'Đang lưu...' : 'Đang tạo...') : (taskToEdit ? 'Cập nhật Task' : 'Thêm Task')}
            </button>
            {/* Nút Hủy chỉ hiển thị ở chế độ sửa */}
            {taskToEdit && (
                <button
                    type="button" // Quan trọng: dùng type="button" để không submit form
                    onClick={onCancelEdit}
                     disabled={loading}
                    className="px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                    Hủy
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;