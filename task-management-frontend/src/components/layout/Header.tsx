"use client";

import { Sun, Moon, Menu } from 'lucide-react'; // Thêm Menu icon
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button'; // Import Button component

interface HeaderProps {
  onToggleSidebar: () => void; // Prop để gọi hàm toggle sidebar trong RootLayout
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const localTheme = localStorage.getItem('theme');
    if (localTheme === 'dark' || (!localTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  if (!mounted) {
    // Để tránh hydration mismatch, render một placeholder hoặc null trên server
    // và chỉ render UI đầy đủ sau khi client đã mount.
    // Hoặc, bạn có thể render một phiên bản đơn giản của header không phụ thuộc vào theme.
    // Ở đây, chúng ta render một header tối giản để giữ chỗ.
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container main-container-padding flex h-14 items-center justify-between md:justify-end">
           {/* Placeholder cho nút menu trên mobile */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
           {/* Placeholder cho nút theme */}
          <div className="h-9 w-9 rounded-full bg-muted"></div>
        </div>
      </header>
    );
  }


  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }} // Tăng y để hiệu ứng mượt hơn
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
      // Giảm z-index một chút để sidebar (z-40) có thể đè lên nếu cần (ví dụ: hiệu ứng overlay)
    >
      <div className="container main-container-padding flex h-14 items-center justify-between md:justify-end"> {/* Giảm chiều cao header */}
        {/* Nút Hamburger Menu cho Mobile - sẽ gọi prop onToggleSidebar */}
        <div className="md:hidden"> {/* Chỉ hiển thị trên mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleSidebar} 
            aria-label="Mở menu"
            className="h-9 w-9" // Kích thước nút nhỏ hơn
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Nút chuyển đổi Theme */}
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          aria-label={isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;
