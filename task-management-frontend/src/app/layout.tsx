// task-management-frontend/src/app/layout.tsx

import React from 'react';
// Import file global CSS (đường dẫn tương đối từ file layout.tsx đến file globals.css)
import '../styles/globals.css';

// Metadata cho ứng dụng (sẽ hiển thị trên tab trình duyệt)
// Có thể override ở từng page hoặc layout con nếu cần
export const metadata = {
  title: 'Task Management App', // Tiêu đề mặc định
  description: 'Ứng dụng quản lý công việc đơn giản được xây dựng với Next.js, Spring Boot, MySQL', // Mô tả mặc định
};

// Component Layout gốc của ứng dụng
// Nhận prop 'children' là nội dung của trang hoặc layout lồng ghép bên trong
export default function RootLayout({
  children, // children sẽ là nội dung từ src/app/page.tsx hoặc các route con khác
}: {
  children: React.ReactNode; // Định nghĩa kiểu dữ liệu cho children
}) {
  return (
    // Cấu trúc HTML cơ bản của một trang web
    <html lang="en"> {/* Đặt ngôn ngữ của trang */}
      <body>
        {/* Nội dung chính của trang sẽ được render tại vị trí của {children} */}
        {children}
      </body>
    </html>
  );
}