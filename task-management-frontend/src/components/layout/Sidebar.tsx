"use client";

import Link from 'next/link';
import { ListChecks, Search, Plus, ChevronDown, LogIn, UserPlus, DollarSign, HelpCircle, FileText, Shield, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import React from 'react';

interface SidebarProps {
  onOpenNewTaskModal: () => void; // Hàm để mở modal thêm task mới
  isSidebarOpen?: boolean; // Prop để điều khiển trạng thái mở/đóng từ bên ngoài (cho mobile)
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenNewTaskModal, isSidebarOpen }) => {
  // Các mục điều hướng chính (ví dụ)
  const mainNavItems = [
    { name: 'Tất cả công việc', href: '#all-tasks', count: 3, icon: ListChecks },
    { name: 'Hôm nay', href: '#today', count: 1, icon: CalendarDays },
    // Thêm các mục khác nếu cần
  ];

  // Các liên kết phụ ở footer (ví dụ)
  const footerLinks = [
    { name: 'Giá cả', href: '#pricing', icon: DollarSign },
    { name: 'Hỗ trợ', href: '#support', icon: HelpCircle },
    { name: 'Điều khoản', href: '#terms', icon: FileText },
    { name: 'Riêng tư', href: '#privacy', icon: Shield },
  ];

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-card text-card-foreground transition-transform duration-300 ease-in-out md:static md:flex md:translate-x-0",
        "w-64 md:w-72", // Độ rộng của sidebar
        isSidebarOpen ? "translate-x-0" : "-translate-x-full" // Điều khiển hiển thị trên mobile
      )}
      aria-label="Sidebar"
    >
      <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
        {/* Logo/Tên ứng dụng */}
        <Link href="/" className="mb-6 flex items-center space-x-2.5 px-2">
          <ListChecks className="h-7 w-7 text-primary" />
          <span className="self-center text-xl font-semibold whitespace-nowrap text-foreground">
            TaskMaster Pro
          </span>
        </Link>

        {/* Các nút thao tác nhanh */}
        <div className="mb-4 space-y-2 px-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="search"
              placeholder="Tìm kiếm..."
              className="input-field h-9 pl-9 text-sm w-full"
            />
          </div>
          <Button 
            type="button"
            onClick={onOpenNewTaskModal} 
            className="w-full button-primary justify-start text-sm h-9"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm Task Mới
          </Button>
        </div>

        {/* My Tasks Section */}
        <div className="mb-4 px-1">
          <h3 className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Công việc của tôi
          </h3>
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground group",
                    // Thêm class active nếu cần, ví dụ:
                    // pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="mr-2.5 h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                  <span className="flex-1">{item.name}</span>
                  {item.count !== undefined && (
                    <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary">
                      {item.count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Spacer để đẩy phần dưới xuống */}
        <div className="mt-auto space-y-4 pt-4 border-t border-border">
            {/* Need projects and teams? */}
            <div className="px-1 text-center">
                <p className="mb-2 text-sm text-muted-foreground">Cần dự án & đội nhóm?</p>
                <div className="flex space-x-2 justify-center">
                    <Button type="button" variant="outline" size="sm" className="text-xs">
                        <LogIn className="mr-1.5 h-3.5 w-3.5" /> Đăng nhập
                    </Button>
                    <Button type="button" variant="default" size="sm" className="text-xs">
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Đăng ký
                    </Button>
                </div>
            </div>

            {/* Footer Links */}
            <nav className="space-y-0.5 px-1">
                {footerLinks.map((link) => (
                <Link
                    key={link.name}
                    href={link.href}
                    className="group flex items-center rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <link.icon className="mr-2 h-3.5 w-3.5" />
                    {link.name}
                </Link>
                ))}
            </nav>
            <p className="px-2.5 text-center text-xs text-muted-foreground/70">
                © {new Date().getFullYear()} TaskMaster Pro
            </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
