"use client";

import { Sun, Moon, Menu, X, PanelRightOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isMobileView: boolean;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  isMobileView,
  currentTheme,
  onThemeChange,
}) => {
  const toggleThemeInternal = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    onThemeChange(newTheme);
  };

  const headerMotion = {
    initial: { y: -60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: "spring", stiffness: 200, damping: 25, duration: 0.3 },
  };

  return (
    <motion.header
      {...headerMotion}
      className="sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container main-container-padding flex h-[60px] items-center">

        <div className="flex-1">
        </div>

        <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
          <motion.button
            onClick={toggleThemeInternal}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            aria-label={currentTheme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            title={currentTheme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentTheme === 'dark' ? "moon-theme-icon" : "sun-theme-icon"}
                initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {currentTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;