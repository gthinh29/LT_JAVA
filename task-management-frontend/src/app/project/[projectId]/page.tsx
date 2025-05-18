// src/app/project/[projectId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import TaskSection from '@/components/tasks/TaskSection';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ProjectData, getProjects as fetchProjectsApi, handleApiError } from '@/utils/apiClient';

export default function ProjectSpecificPage() {
  const { 
    user, 
    isAuthenticated, 
    isLoading: authIsLoadingGlobal, 
    error: authError, 
    redirectToGoogleLogin, 
    login: attemptUserFetch,
    initialAuthCheckCompleted 
  } = useAuth();

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const projectIdParam = params?.projectId;
  const currentProjectId = typeof projectIdParam === 'string' ? parseInt(projectIdParam, 10) : null;

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  const [currentProjectDetails, setCurrentProjectDetails] = useState<ProjectData | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loginSuccessParamProcessed, setLoginSuccessParamProcessed] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && initialAuthCheckCompleted) {
      setProjectsLoading(true);
      setPageError(null);
      console.log("ProjectPage: Authenticated and initial auth check completed, fetching projects.");
      fetchProjectsApi()
        .then(fetchedProjects => {
          setProjects(fetchedProjects);
          if (currentProjectId !== null) {
            const foundProject = fetchedProjects.find(p => p.id === currentProjectId);
            setCurrentProjectDetails(foundProject || null);
            if (!foundProject && fetchedProjects.length > 0) {
                setPageError(`Không tìm thấy dự án với ID ${currentProjectId} hoặc bạn không có quyền truy cập.`);
            } else if (fetchedProjects.length === 0 && currentProjectId !== null) {
                // Trường hợp không có project nào cả nhưng URL lại trỏ đến 1 project ID
                setPageError(`Bạn không có dự án nào, bao gồm cả dự án với ID ${currentProjectId}.`);
            }
          }
        })
        .catch(err => {
          console.error("Lỗi khi lấy danh sách dự án ở ProjectPage:", err);
          setPageError(handleApiError(err));
        })
        .finally(() => setProjectsLoading(false));
    } else if (!isAuthenticated && initialAuthCheckCompleted) {
        setProjectsLoading(false);
        setProjects([]);
        setCurrentProjectDetails(null);
    }
  }, [isAuthenticated, user, initialAuthCheckCompleted, currentProjectId]);

  useEffect(() => {
    const loginSuccessParam = searchParams.get('login_success');
    if (loginSuccessParam === 'true' && !loginSuccessParamProcessed && initialAuthCheckCompleted && !user) {
      console.log("ProjectPage: login_success=true detected, initialAuthCheckCompleted. Calling attemptUserFetch().");
      setLoginSuccessParamProcessed(true);
      attemptUserFetch().then((fetchedUser) => {
        console.log("ProjectPage: attemptUserFetch() after login_success completed. User:", fetchedUser);
        if (searchParams.has('login_success')) {
            router.replace(pathname, { scroll: false });
        }
      });
    } else if (loginSuccessParam === 'true' && user) {
        if (searchParams.has('login_success')) {
            console.log("ProjectPage: login_success=true detected, but user already exists. Removing param.");
            router.replace(pathname, { scroll: false });
            setLoginSuccessParamProcessed(true);
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
  
  // Hiển thị loading projects nếu đã auth nhưng đang load projects
  if (isAuthenticated && projectsLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">Đang tải dữ liệu dự án...</p>
      </div>
    );
  }

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

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-muted-foreground mb-4">Vui lòng đăng nhập để xem dự án này.</p>
        <Button onClick={redirectToGoogleLogin} size="lg">
          <LogIn className="mr-2 h-4 w-4" /> Đăng nhập bằng Google
        </Button>
      </div>
    );
  }

  if (currentProjectId === null || isNaN(currentProjectId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg text-red-500">ID dự án không hợp lệ.</p>
        <Link href="/" passHref>
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
          </Button>
        </Link>
      </div>
    );
  }
  
  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-600 dark:text-red-400">
        <p className="text-lg mb-2">Không thể tải dữ liệu dự án:</p>
        <p className="text-sm bg-red-100 dark:bg-red-900 p-3 rounded-md">{pageError}</p>
         <Link href="/" passHref>
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
          </Button>
        </Link>
      </div>
    );
  }

  // Sau khi projectsLoading là false, kiểm tra currentProjectDetails
  // Điều kiện này cần cẩn thận để không hiển thị "Không tìm thấy" khi projects list rỗng nhưng chưa chắc đã fetch xong
  if (!projectsLoading && initialAuthCheckCompleted && !currentProjectDetails && projects.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <p className="text-lg text-red-500">Không tìm thấy dự án hoặc bạn không có quyền truy cập (ID: {currentProjectId}).</p>
            <Link href="/" passHref>
            <Button variant="link" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại trang chủ
            </Button>
            </Link>
        </div>
      );
  }

  return (
    <div>
      {currentProjectDetails && (
        <div className="mb-6 pb-4 border-b border-border">
          <div className="flex items-center space-x-2">
            {currentProjectDetails.color && (
              <span className={`inline-block h-3 w-3 rounded-full ${currentProjectDetails.color}`}></span>
            )}
            <h1 className="text-2xl font-semibold text-foreground">
              {currentProjectDetails.name}
            </h1>
          </div>
          {currentProjectDetails.description && (
            <p className="text-sm text-muted-foreground mt-1 ml-5">{currentProjectDetails.description}</p>
          )}
        </div>
      )}
      {/* Chỉ hiển thị loading nếu đang load project cụ thể này và chưa có details */}
      {!currentProjectDetails && !projectsLoading && !pageError && isAuthenticated && (
         <p className="text-sm text-muted-foreground mb-4">Đang tìm thông tin chi tiết dự án...</p>
      )}
      
      {isAuthenticated && user && (currentProjectId !== null && !isNaN(currentProjectId)) && (
        <TaskSection currentProjectId={currentProjectId} projects={projects} />
      )}
    </div>
  );
}
