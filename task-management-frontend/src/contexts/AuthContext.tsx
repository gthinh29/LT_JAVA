// src/contexts/AuthContext.tsx
"use client"; 

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserData, getCurrentUser, logoutUser, handleApiError } from '@/utils/apiClient';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean; // Trạng thái loading chung của context (chủ yếu cho lần check đầu)
  error: string | null;
  login: () => Promise<UserData | null>; // Login trả về user hoặc null
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  redirectToGoogleLogin: () => void;
  initialAuthCheckCompleted: boolean; // Đánh dấu lần kiểm tra auth đầu tiên đã hoàn tất
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Ban đầu là true để check auth
  const [error, setError] = useState<string | null>(null);
  const [initialAuthCheckCompleted, setInitialAuthCheckCompleted] = useState<boolean>(false);

  const redirectToGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080';
    console.log("AuthContext: Redirecting to Google Login:", `${backendUrl}/oauth2/authorization/google`);
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  };

  const performLoginAttempt = useCallback(async (isInitialAttempt: boolean = false): Promise<UserData | null> => {
    if (isInitialAttempt) {
        console.log("AuthContext: Performing INITIAL login attempt.");
        setIsLoading(true); // Chỉ set loading true cho lần đầu
    } else {
        console.log("AuthContext: Performing SUBSEQUENT login attempt (e.g., after login_success).");
        // Không set isLoading lại nếu đây là lần gọi lại (ví dụ từ param login_success)
        // để tránh giật màn hình loading không cần thiết nếu user đã thấy nội dung.
    }
    setError(null);
    
    try {
      const currentUser = await getCurrentUser();
      console.log("AuthContext: getCurrentUser() response:", currentUser);
      setUser(currentUser);
      if (isInitialAttempt) setInitialAuthCheckCompleted(true);
      return currentUser;
    } catch (err: any) {
      console.error("AuthContext: Error during getCurrentUser():", err);
      if (err.isAxiosError) {
        console.error("AuthContext: Axios error details:", err.toJSON ? err.toJSON() : err.message);
      }
      const errorMessage = handleApiError(err);
      console.error("AuthContext: Parsed error by handleApiError:", errorMessage);
      setError(errorMessage); // Hiển thị lỗi nếu có
      setUser(null);
      if (isInitialAttempt) setInitialAuthCheckCompleted(true); // Đánh dấu đã hoàn tất dù lỗi
      return null;
    } finally {
      if (isInitialAttempt) {
        setIsLoading(false); // Kết thúc loading cho lần đầu
        console.log("AuthContext: INITIAL login attempt finished. isLoading set to false.");
      } else {
        console.log("AuthContext: SUBSEQUENT login attempt finished.");
      }
    }
  }, []); // useCallback không có dependency để đảm bảo hàm ổn định, logic điều khiển nằm ngoài

  const logoutAttempt = async () => {
    console.log("AuthContext: logoutAttempt() called.");
    setError(null);
    try {
      await logoutUser();
      setUser(null);
      // ĐÃ BỎ: setInitialAuthCheckCompleted(false); 
      // initialAuthCheckCompleted sẽ giữ nguyên giá trị true, không kích hoạt lại performLoginAttempt.
      // Nó sẽ tự động là false khi AuthProvider mount lại hoàn toàn (ví dụ: refresh trang).
      console.log("AuthContext: User logged out, user set to null.");
    } catch (err) {
      console.error("AuthContext: Lỗi trong logoutUser:", err);
      setError(handleApiError(err));
      setUser(null); // Vẫn set user null
      // ĐÃ BỎ: setInitialAuthCheckCompleted(false);
    }
  };

  // Effect để kiểm tra trạng thái đăng nhập lần đầu khi component mount
  useEffect(() => {
    console.log("AuthContext: Mount effect. initialAuthCheckCompleted:", initialAuthCheckCompleted);
    if (!initialAuthCheckCompleted) { // Chỉ chạy nếu chưa kiểm tra lần nào
      performLoginAttempt(true); // Đánh dấu đây là lần thử đầu tiên
    }
  }, [initialAuthCheckCompleted, performLoginAttempt]); // Thêm performLoginAttempt

  const isAuthenticated = !!user && !isLoading; // isAuthenticated đúng khi có user và không loading initial check

  console.log("AuthContext rendering. User:", user, "IsLoading (initial):", isLoading, "IsAuthenticated:", isAuthenticated, "Error:", error, "InitialAuthCheckCompleted:", initialAuthCheckCompleted);

  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoading, // isLoading này chủ yếu cho lần check đầu tiên
        error, 
        login: () => performLoginAttempt(false), // Hàm login public sẽ không set isLoading=true
        logout: logoutAttempt, 
        isAuthenticated, 
        redirectToGoogleLogin,
        initialAuthCheckCompleted 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong một AuthProvider');
  }
  return context;
};