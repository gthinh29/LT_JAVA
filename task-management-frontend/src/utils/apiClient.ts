import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string | null;
}

export const getAllTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/api/tasks');
  return response.data;
};

export const getTaskById = async (id: number): Promise<Task> => {
  const response = await apiClient.get(`/api/tasks/${id}`);
  return response.data;
};

export const createTask = async (taskPayload: TaskPayload): Promise<Task> => {
  const response = await apiClient.post('/api/tasks', taskPayload);
  return response.data;
};

export const updateTask = async (id: number, taskPayload: TaskPayload): Promise<Task> => {
  const response = await apiClient.put(`/api/tasks/${id}`, taskPayload);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/tasks/${id}`);
};
