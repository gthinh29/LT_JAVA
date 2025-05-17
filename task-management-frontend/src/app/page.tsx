// task-management-frontend/src/app/page.tsx

// Không cần "use client" ở đây nếu page.tsx chỉ render Server Components
// Tuy nhiên, TaskList là Client Component, nên page.tsx có thể là Server Component
// hoặc đơn giản là một Server Component wrapper cho TaskList.

import TaskList from '../components/TaskList'; // Import component TaskList

// Metadata (có thể đặt ở layout.tsx hoặc đây)
export const metadata = {
  title: 'Task Management App',
  description: 'Ứng dụng quản lý công việc đơn giản',
};

// Component Page gốc
// Nó chỉ đơn giản render component TaskList
export default function HomePage() {
  return (
    // TaskList là Client Component và chứa toàn bộ logic UI/State/Fetch
    <TaskList />
  );
}