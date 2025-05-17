// task-management-frontend/src/utils/apiClient.ts

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Định nghĩa Interface cho Dữ liệu Task (Dựa trên TaskResponse từ Backend) ---

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Interface cho dữ liệu khi tạo/cập nhật Task (Dựa trên TaskRequest từ Backend)
export interface TaskPayload {
    title: string;
    description?: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    dueDate?: string | null;
}


// --- Các Hàm Gọi API ---

export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const response = await apiClient.get('/api/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getTaskById = async (id: number): Promise<Task> => {
  try {
    const response = await apiClient.get(`/api/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task with id ${id}:`, error);
    throw error;
  }
};

export const createTask = async (taskPayload: TaskPayload): Promise<Task> => {
  try {
    const response = await apiClient.post('/api/tasks', taskPayload);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (id: number, taskPayload: TaskPayload): Promise<Task> => {
    try {
        const response = await apiClient.put(`/api/tasks/${id}`, taskPayload);
        return response.data;
    } catch (error) {
        console.error(`Error updating task with id ${id}:`, error);
        throw error;
    }
};

export const deleteTask = async (id: number): Promise<void> => {
    try {
        await apiClient.delete(`/api/tasks/${id}`);
    } catch (error) {
        console.error(`Error deleting task with id ${id}:`, error);
        throw error;
    }
};