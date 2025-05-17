// task-management-frontend/src/components/TaskItem.tsx

import React from 'react';
import { Task } from '../utils/apiClient';
// Import style global hoặc CSS Modules nếu cần, nhưng chúng ta sẽ dùng Tailwind

interface TaskItemProps {
  task: Task;
  onDelete: (id: number) => Promise<void>; // Bắt buộc có hàm xóa
  onEdit: (task: Task) => void; // Bắt buộc có hàm sửa
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onDelete, onEdit }) => {
  return (
    // Sử dụng các class Tailwind CSS để tạo kiểu dáng
    <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          <span>Status: {task.status}</span>
          <span className="ml-4">Due: {task.dueDate ? task.dueDate : 'N/A'}</span>
          <span className="ml-4">Created: {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        {/* Nút Sửa */}
        <button
          onClick={() => onEdit(task)}
          className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Sửa
        </button>
        {/* Nút Xóa */}
        <button
          onClick={() => onDelete(task.id)}
          className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default TaskItem;