import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

export interface UserData {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
}

export interface ProjectData {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;
  iconName?: string | null;
  isFavorite: boolean;
  taskCount: number;
  ownerId?: number | null;
  ownerName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPayload {
  name: string;
  description?: string | null;
  color?: string | null;
  iconName?: string | null;
  isFavorite?: boolean;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  projectId?: number | null;
  projectName?: string | null;
  assigneeId?: number | null;
  assigneeName?: string | null;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  projectId: number; 
  assigneeId?: number | null;
}

export const getCurrentUser = async (): Promise<UserData | null> => {
  try {
    const response = await apiClient.get<UserData>('/api/users/me');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    console.error('Lỗi khi lấy thông tin người dùng hiện tại:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await apiClient.post('/api/logout', {});
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
  }
};

export const getProjects = async (): Promise<ProjectData[]> => {
  const response = await apiClient.get<ProjectData[]>('/api/projects');
  return response.data;
};

export const createProject = async (projectPayload: ProjectPayload): Promise<ProjectData> => {
  const response = await apiClient.post<ProjectData>('/api/projects', projectPayload);
  return response.data;
};

export const getTasksByProjectId = async (projectId: number): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>(`/api/projects/${projectId}/tasks`);
  return response.data;
};

export const getAssignedTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>('/api/tasks/assigned');
  return response.data;
};

export const getTaskById = async (taskId: number): Promise<Task> => {
  const response = await apiClient.get<Task>(`/api/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (taskPayload: TaskPayload): Promise<Task> => {
  if (taskPayload.projectId === undefined || taskPayload.projectId === null) {
    throw new Error("projectId là bắt buộc khi tạo task.");
  }
  const response = await apiClient.post<Task>('/api/tasks', taskPayload);
  return response.data;
};

export const updateTask = async (taskId: number, taskPayload: TaskPayload): Promise<Task> => {
  if (taskPayload.projectId === undefined || taskPayload.projectId === null) {
    throw new Error("projectId là bắt buộc khi cập nhật task.");
  }
  const response = await apiClient.put<Task>(`/api/tasks/${taskId}`, taskPayload);
  return response.data;
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await apiClient.delete(`/api/tasks/${taskId}`);
};

// Cải thiện handleApiError
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>; // Sử dụng any để linh hoạt hơn với cấu trúc response
    if (axiosError.response) {
      const responseData = axiosError.response.data;
      console.error("API Error Response Data:", responseData); // Log chi tiết responseData

      if (responseData && typeof responseData === 'object') {
        // Ưu tiên lỗi validation từ Spring Boot (thường có dạng { errors: { field: "message" } })
        if (responseData.errors && typeof responseData.errors === 'object' && Object.keys(responseData.errors).length > 0) {
          return Object.entries(responseData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('; ');
        }
        // Lỗi chung từ backend (thường có trường 'message' hoặc 'error')
        if (responseData.message) return String(responseData.message);
        if (responseData.error) return String(responseData.error); // Thường là status text
        // Nếu responseData là một chuỗi (một số lỗi có thể trả về text)
        if (typeof responseData === 'string' && responseData.length < 200) return responseData;
      }
      // Nếu không có thông báo cụ thể, trả về status text hoặc message của Axios
      return axiosError.response.statusText || axiosError.message || `Lỗi ${axiosError.response.status}`;
    } else if (axiosError.request) {
      return 'Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.';
    } else {
      return axiosError.message;
    }
  }
  return 'Đã có lỗi không xác định xảy ra.';
};

export default apiClient;
