// src/app/page.tsx
"use client"; 

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import TaskSection from '@/components/tasks/TaskSection';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2, LogIn } from 'lucide-react';
import { ProjectData, getProjects as fetchProjectsApi, handleApiError } from '@/utils/apiClient';

export default function HomePage() {
  const { 
    user, 
    isAuthenticated, 
    isLoading: authIsLoadingGlobal, // Loading của AuthContext (chủ yếu cho lần check đầu)
    error: authError, 
    redirectToGoogleLogin, 
    login: attemptUserFetch, // Đổi tên hàm login từ context
    initialAuthCheckCompleted 
  } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loginSuccessParamProcessed, setLoginSuccessParamProcessed] = useState(false);

  // Fetch projects khi user đã được xác thực và auth check ban đầu đã hoàn tất
  useEffect(() => {
    if (isAuthenticated && user && initialAuthCheckCompleted) {
      setProjectsLoading(true);
      setPageError(null);
      console.log("HomePage: Authenticated and initial auth check completed, fetching projects.");
      fetchProjectsApi()
        .then(setProjects)
        .catch(err => {
          console.error("Lỗi khi lấy danh sách dự án ở HomePage:", err);
          setPageError(handleApiError(err));
        })
        .finally(() => setProjectsLoading(false));
    } else if (!isAuthenticated && initialAuthCheckCompleted) {
      // Nếu không authenticated SAU KHI auth check đã xong, reset projects
      setProjects([]);
      setProjectsLoading(false);
    }
  }, [isAuthenticated, user, initialAuthCheckCompleted]);

  // Xử lý param login_success
  useEffect(() => {
    const loginSuccessParam = searchParams.get('login_success');
    if (loginSuccessParam === 'true' && !loginSuccessParamProcessed && initialAuthCheckCompleted && !user) {
      // Chỉ xử lý nếu có param, chưa xử lý trước đó, auth check ban đầu đã xong, và hiện tại chưa có user
      console.log("HomePage: login_success=true detected, initialAuthCheckCompleted. Calling attemptUserFetch().");
      setLoginSuccessParamProcessed(true); 
      attemptUserFetch().then((fetchedUser) => {
        console.log("HomePage: attemptUserFetch() after login_success completed. User:", fetchedUser);
        if (searchParams.has('login_success')) {
            router.replace(pathname, { scroll: false }); // Xóa param
        }
      });
    } else if (loginSuccessParam === 'true' && user) {
        // Nếu đã có user rồi thì chỉ cần xóa param
        if (searchParams.has('login_success')) {
            console.log("HomePage: login_success=true detected, but user already exists. Removing param.");
            router.replace(pathname, { scroll: false });
            setLoginSuccessParamProcessed(true); // Đánh dấu đã xử lý
        }
    }
  }, [searchParams, user, initialAuthCheckCompleted, attemptUserFetch, router, pathname, loginSuccessParamProcessed]);

  // Hiển thị loading CHỈ KHI AuthContext đang thực hiện kiểm tra ban đầu
  if (authIsLoadingGlobal && !initialAuthCheckCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">Đang kiểm tra trạng thái đăng nhập...</p>
      </div>
    );
  }

  // Nếu có lỗi từ AuthContext (ví dụ: backend không phản hồi /api/users/me)
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600 dark:text-red-400">
        <p className="text-lg mb-2">Lỗi xác thực hoặc kết nối:</p>
        <p className="text-sm bg-red-100 dark:bg-red-900 p-3 rounded-md">{authError}</p>
        <Button onClick={redirectToGoogleLogin} className="mt-6">
          <LogIn className="mr-2 h-4 w-4" /> Thử đăng nhập lại
        </Button>
      </div>
    );
  }

  // Nếu kiểm tra auth ban đầu đã xong, và không authenticated (hoặc không có user)
  if (initialAuthCheckCompleted && (!isAuthenticated || !user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center p-8 bg-card border rounded-lg shadow-lg max-w-md">
          <h1 className="text-3xl font-bold text-primary mb-4">Chào mừng bạn đến với TaskManager Pro!</h1>
          <p className="text-muted-foreground mb-8">
            Vui lòng đăng nhập để quản lý công việc và dự án của bạn một cách hiệu quả.
          </p>
          <Button onClick={redirectToGoogleLogin} size="lg" className="w-full">
            <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
            Đăng nhập bằng Google
          </Button>
        </div>
      </div>
    );
  }

  // Nếu đã authenticated và đang tải projects
  if (isAuthenticated && projectsLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">Đang tải dự án...</p>
      </div>
    );
  }
  
  // Nếu có lỗi khi fetch projects
  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600 dark:text-red-400">
        <p className="text-lg mb-2">Không thể tải dữ liệu trang:</p>
        <p className="text-sm bg-red-100 dark:bg-red-900 p-3 rounded-md">{pageError}</p>
      </div>
    );
  }

  // Nếu mọi thứ ổn, hiển thị TaskSection
  if (isAuthenticated && user) {
    return <TaskSection projects={projects} />; 
  }

  // Trường hợp dự phòng (không nên xảy ra nếu logic trên đúng)
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <p>Trạng thái không xác định. Vui lòng thử làm mới trang.</p>
    </div>
  );
}
