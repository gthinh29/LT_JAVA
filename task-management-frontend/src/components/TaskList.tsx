// task-management-frontend/src/components/TaskList.tsx

"use client"; // Đây là Client Component vì quản lý state và side effect

import React, { useEffect, useState } from 'react';
import TaskItem from './TaskItem'; // Import TaskItem
import TaskForm from './TaskForm'; // Import TaskForm

// Đã xóa import createTask, updateTask, TaskPayload vì chúng chỉ dùng trong TaskForm
import { Task, getAllTasks, deleteTask } from '../utils/apiClient'; // Import API functions and interface


const TaskList: React.FC = () => {
  // State để lưu danh sách Tasks
  const [tasks, setTasks] = useState<Task[]>([] as Task[]);
  // State để theo dõi trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);
  // State để lưu thông báo lỗi khi fetch/xóa/sửa
  const [error, setError] = useState<string | null>(null);
  // State để quản lý Task đang được sửa
  const [editingTask, setEditingTask] = useState<Task | null>(null);


  // Hàm để fetch danh sách tasks từ backend
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const tasksData = await getAllTasks();
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to load tasks.');
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect hook: chạy khi component mount lần đầu để tải tasks
  useEffect(() => {
    fetchTasks();
  }, []); // [] đảm bảo effect chỉ chạy 1 lần khi mount

  // Hàm xử lý khi TaskForm submit thành công (tạo hoặc cập nhật)
  // TaskForm đã gọi API, hàm này chỉ cần trigger tải lại danh sách
  const handleSubmitSuccess = () => {
      setEditingTask(null); // Kết thúc chế độ sửa nếu đang sửa
      fetchTasks(); // Tải lại danh sách để hiển thị thay đổi
  };

   // Hàm xử lý khi nhấn nút Xóa trên TaskItem
  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa task này?')) {
      try {
        await deleteTask(id); // Gọi API xóa
        fetchTasks(); // Tải lại danh sách sau khi xóa
      } catch (err) {
        setError('Failed to delete task.');
        console.error('Delete task error:', err);
      }
    }
  };

   // Hàm xử lý khi nhấn nút Sửa trên TaskItem
  const handleEditTask = (task: Task) => {
      setEditingTask(task); // Bật chế độ sửa và truyền task vào form
      // Có thể cuộn lên đầu trang hoặc đến form tại đây nếu cần
  };

  // Hàm xử lý khi nhấn nút Hủy trên TaskForm (chế độ sửa)
  const handleCancelEdit = () => {
      setEditingTask(null); // Tắt chế độ sửa
  };


  return (
    // Sử dụng Tailwind cho layout cơ bản
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Task Management</h1>

      {/* Hiển thị form (chế độ thêm hoặc sửa) */}
      {/* onSubmitSuccess được gọi từ TaskForm sau khi API call thành công */}
      {/* taskToEdit được truyền vào TaskForm để nó biết là đang sửa và hiển thị dữ liệu */}
      {/* onCancelEdit được truyền vào để TaskForm có nút Hủy ở chế độ sửa */}
      <TaskForm
          onSubmitSuccess={handleSubmitSuccess}
          taskToEdit={editingTask}
          onCancelEdit={handleCancelEdit}
      />

      {/* Hiển thị trạng thái tải hoặc lỗi */}
      {loading && <p className="text-center text-blue-600">Đang tải Tasks...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {/* Hiển thị danh sách Tasks */}
      {!loading && !error && tasks.length === 0 && <p className="text-center text-gray-600">Chưa có Tasks nào.</p>}
      {!loading && !error && tasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Danh sách Tasks</h2>
          {tasks.map((task) => (
              // Render TaskItem cho mỗi task
            <TaskItem
              key={task.id} // Key là quan trọng
              task={task}
              onDelete={handleDeleteTask} // Truyền hàm xử lý xóa xuống
              onEdit={handleEditTask}   // Truyền hàm xử lý sửa xuống (để bật chế độ sửa ở cha)
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;