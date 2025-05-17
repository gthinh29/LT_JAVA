"use client"; 

import TaskSection from '@/components/tasks/TaskSection';

// Metadata có thể được xử lý ở RootLayout hoặc theo cách khác nếu cần cho Client Component.
// Hiện tại, chúng ta tập trung vào cấu trúc và chức năng.

export default function HomePage() {
  // HomePage giờ đây chỉ đóng vai trò là container cho TaskSection.
  // TaskSection sẽ sử dụng TaskModalContext được cung cấp từ RootLayout
  // để kích hoạt việc mở TaskFormModal.
  return <TaskSection />;
}
