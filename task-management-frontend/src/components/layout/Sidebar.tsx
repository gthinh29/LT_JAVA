// src/components/layout/Sidebar.tsx
"use client";

import Link from 'next/link';
import {
  ListChecks, Search, Plus, Settings, HelpCircle, User, Bell, HomeIcon, Star, Folder, ChevronDown,
  PanelLeftClose, PanelRightClose, LogOut, GripVertical, Briefcase, CalendarCheck2, Filter, Tag, Inbox, CalendarClock,
  PlusCircle, Palette, Users, Archive, LogIn, Loader2, AlertTriangle, LucideProps, Icon as LucideIcon, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import React, { useState, useEffect, useMemo, ElementType, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import * as Tooltip from '@radix-ui/react-tooltip';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { ProjectData, UserData as ApiUserData, getProjects, createProject, ProjectPayload, handleApiError } from '@/utils/apiClient';

type UserDataUI = ApiUserData;

interface NavLinkItem {
  id: string;
  name: string;
  href: string;
  icon: ElementType<LucideProps>;
  count?: number;
  isDate?: boolean;
  date?: number;
  exactMatch?: boolean;
  chip?: { text: string; variant: 'info' | 'success' | 'warning' | 'danger' };
  color?: string;
  external?: boolean;
}

interface ProjectNavItem {
  id: number;
  name: string;
  href: string;
  color?: string | null;
  icon?: ElementType<LucideProps>;
  count: number;
  isFavorite: boolean;
  description?: string | null;
  iconName?: string | null;
}

type NavItemType = NavLinkItem | ProjectNavItem;

interface NavGroup {
  id: string;
  title?: string;
  items: NavItemType[];
  collapsible?: boolean;
  initiallyOpen?: boolean;
  showAddButton?: boolean;
  onAdd?: () => void;
  emptyStateMessage?: string;
  isLoading?: boolean;
  error?: string | null;
}

interface SidebarProps {
  onOpenNewTaskModal: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobileView: boolean;
}

const SIDEBAR_WIDTH_OPEN_NUM = 280;
const SIDEBAR_WIDTH_CLOSED_DESKTOP_NUM = 72;

const staticSidebarVariants = {
  open: { width: SIDEBAR_WIDTH_OPEN_NUM, x: 0, opacity: 1 },
  closedMobile: { width: SIDEBAR_WIDTH_OPEN_NUM, x: '-100%', opacity: 1 },
  closedDesktop: { width: SIDEBAR_WIDTH_CLOSED_DESKTOP_NUM, x: 0, opacity: 1 },
};

const staticTransitionConfig = { type: "spring", stiffness: 350, damping: 35, duration: 0.25 };

const staticContentVisibilityVariants = {
  open: { opacity: 1, display: 'flex', transition: { delay: 0.08, duration: 0.2 } },
  closed: { opacity: 0, transitionEnd: { display: 'none' }, transition: { duration: 0.1 } },
};

const staticTextAndIconSpacingVariants = {
  open: { opacity: 1, x: 0, transition: { delay: 0.12, duration: 0.18, ease: "circOut" } },
  closed: { opacity: 0, x: -8, transition: { duration: 0.1, ease: "circIn" } },
};

const iconMap: { [key: string]: ElementType<LucideProps> } = {
  Briefcase, CalendarCheck2, Users, Folder, Archive, Star, HomeIcon, ListChecks, Palette, Inbox, Settings, HelpCircle,
};

const getIconByName = (name?: string | null): ElementType<LucideProps> => {
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return Folder;
};

function isProjectNavItem(item: NavItemType): item is ProjectNavItem {
  return typeof (item as ProjectNavItem).count === 'number';
}

function isNavLinkItem(item: NavItemType): item is NavLinkItem {
  return !isProjectNavItem(item);
}

const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewTaskModal,
  isSidebarOpen,
  toggleSidebar,
  isMobileView,
}) => {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authIsLoading, logout, redirectToGoogleLogin } = useAuth();

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const fetchUserProjects = useCallback(() => {
    if (isAuthenticated) {
      setProjectsLoading(true);
      setProjectsError(null);
      getProjects()
        .then(data => {
          setProjects(data);
        })
        .catch(err => {
          setProjectsError(handleApiError(err));
        })
        .finally(() => {
          setProjectsLoading(false);
        });
    } else {
      setProjects([]);
      setProjectsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  const handleCreateNewProject = useCallback(async () => {
    const newProjectName = prompt("Nhập tên dự án mới (ít nhất 3 ký tự):");
    if (newProjectName === null) { return; }
    if (!newProjectName || newProjectName.trim().length < 3) {
        alert("Tên dự án không hợp lệ. Tên dự án phải có ít nhất 3 ký tự.");
        return;
    }
    const payload: ProjectPayload = {
        name: newProjectName.trim(),
        description: "",
        color: 'bg-gray-400',
        iconName: 'Folder',
        isFavorite: false
    };
    setProjectsLoading(true);
    try {
        const createdProject = await createProject(payload);
        setProjects(prev => [...prev, createdProject]);
    } catch (err) {
        alert(`Không thể tạo dự án: ${handleApiError(err)}`);
    } finally {
        setProjectsLoading(false);
    }
  }, []);

  const footerNavLinks: NavLinkItem[] = [
    { name: 'Trợ giúp', id: 'help', href: '#help', icon: HelpCircle },
    { name: 'Cài đặt', id: 'settings', href: '/settings', icon: Settings },
  ];

  const navigationStructure: NavGroup[] = useMemo(() => {
    const allProjectItems: ProjectNavItem[] = projects
      .map(p => ({
        id: p.id, name: p.name, href: `/project/${p.id}`, color: p.color,
        icon: getIconByName(p.iconName), count: p.taskCount, isFavorite: p.isFavorite,
        description: p.description, iconName: p.iconName,
      }));

    return [
      {
        id: 'main-views',
        items: [
          { id: 'inbox', name: 'Hộp thư đến', href: '/inbox', icon: Inbox, count: user ? 5 : undefined, chip: user ? {text: 'Mới', variant: 'info'} : undefined, exactMatch: true },
          { id: 'today', name: 'Hôm nay', href: '/today', icon: CalendarCheck2, date: new Date().getDate(), count: user ? 2 : undefined, exactMatch: true, isDate: true },
          { id: 'upcoming', name: 'Sắp tới', href: '/upcoming', icon: CalendarClock, count: user ? 8 : undefined, exactMatch: true },
        ],
      },
      {
        id: 'projects',
        title: 'Dự án',
        collapsible: true,
        initiallyOpen: true,
        showAddButton: isAuthenticated,
        onAdd: handleCreateNewProject,
        items: allProjectItems,
        emptyStateMessage: "Chưa có dự án nào.",
        isLoading: projectsLoading && isAuthenticated,
        error: projectsError,
      },
    ];
  }, [projects, user, isAuthenticated, projectsLoading, projectsError, handleCreateNewProject]);

  useEffect(() => {
    const initialExpansion: Record<string, boolean> = {};
    navigationStructure.forEach(group => {
      if (group.collapsible) {
        initialExpansion[group.id] = !!group.initiallyOpen;
      }
    });
    setExpandedGroups(initialExpansion);
  }, [navigationStructure]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const NavItemLinkRenderer: React.FC<{ item: NavItemType; isSidebarOpen: boolean; isMobileView: boolean; }> =
    ({ item, isSidebarOpen, isMobileView }) => {
    const IconCmp = item.icon || (isProjectNavItem(item) ? Folder : ListChecks);
    const isActive = ('exactMatch' in item && item.exactMatch) ? pathname === item.href : pathname.startsWith(item.href);
    const showText = isSidebarOpen || isMobileView;

    const linkContent = (
      <>
        {isProjectNavItem(item) && showText && (
          <span className={cn("h-2.5 w-2.5 rounded-full mr-2.5 shrink-0", item.color || 'bg-muted-foreground/60')}></span>
        )}
        {isProjectNavItem(item) && !showText && (
          <span className={cn("h-3 w-1.5 rounded-sm shrink-0", item.color || 'bg-muted-foreground/60')}></span>
        )}
        <IconCmp className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors duration-150",
          showText && (!isProjectNavItem(item) || (isProjectNavItem(item) && !item.color)) && "mr-3",
          !showText && "mx-auto"
        )} />
        <AnimatePresence>
          {showText && (
            <motion.span variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate flex-1 text-sm font-medium">
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showText && item.count !== undefined && item.count > 0 && (
            <motion.span
              variants={staticContentVisibilityVariants} initial="closed" animate="open" exit="closed"
              className="ml-auto text-xs font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5 min-w-[24px] text-center"
            >
              {item.count}
            </motion.span>
          )}
        </AnimatePresence>
         <AnimatePresence>
          {showText && isNavLinkItem(item) && item.isDate && item.date && (
            <motion.span
              variants={staticContentVisibilityVariants} initial="closed" animate="open" exit="closed"
              className="ml-auto text-xs font-medium text-muted-foreground"
            >
              {item.date}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showText && isNavLinkItem(item) && item.chip && (
             <motion.span
              variants={staticContentVisibilityVariants} initial="closed" animate="open" exit="closed"
              className={cn(
                "ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-md leading-none",
                item.chip.variant === 'info' && 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
                item.chip.variant === 'success' && 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
              )}
            >
              {item.chip.text}
            </motion.span>
          )}
        </AnimatePresence>
        {isNavLinkItem(item) && item.external && showText && (
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/70 ml-2" />
        )}
      </>
    );

    const commonClasses = cn(
      "flex items-center rounded-lg px-3 py-2.5 group transition-all duration-150 ease-in-out h-11",
      isActive ? "bg-primary/10 text-primary dark:bg-primary/25" : "text-foreground hover:bg-accent hover:text-accent-foreground",
      !showText && "justify-center w-full aspect-square p-0"
    );

    if (!showText) {
      return (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Link href={item.href} className={commonClasses} target={isNavLinkItem(item) && item.external ? "_blank" : undefined} aria-label={item.name}>
                {linkContent}
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                align="center"
                sideOffset={10}
                className="z-[100] overflow-hidden rounded-lg border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95"
              >
                {item.name}
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
      );
    }

    return (
      <Link href={item.href} className={commonClasses} target={isNavLinkItem(item) && item.external ? "_blank" : undefined}>
        {linkContent}
      </Link>
    );
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.aside
      key="sidebar-main-animation-wrapper"
      initial={false}
      animate={isMobileView ? (isSidebarOpen ? "open" : "closedMobile") : (isSidebarOpen ? "open" : "closedDesktop")}
      variants={staticSidebarVariants}
      transition={staticTransitionConfig}
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-card text-card-foreground shadow-2xl border-r border-border print:hidden",
        "transition-transform transform-gpu"
        )}
      aria-label="Main Navigation Sidebar"
    >
      <div className={cn(
        "flex items-center shrink-0 border-b border-border h-[70px] transition-all duration-300 ease-in-out", // Increased height for more top space
        (isSidebarOpen || isMobileView) ? "px-4 justify-between" : "px-0 flex-col justify-center py-2" // Adjusted padding for closed state
      )}>
        {authIsLoading ? (
          <div className={cn("flex items-center p-2.5 w-full", (!isSidebarOpen && !isMobileView) && "justify-center")}>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isAuthenticated && user ? (
          // User Info Section (Authenticated)
          <div className={cn(
            "flex items-center w-full",
            (isSidebarOpen || isMobileView) ? "justify-between" : "flex-col items-center justify-center space-y-1.5" // Centering for collapsed view
          )}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild disabled={!isSidebarOpen && !isMobileView && !user}>
                <button
                  className={cn(
                    "flex items-center text-left p-1.5 rounded-lg hover:bg-accent focus-visible:bg-accent overflow-hidden transition-colors duration-150 disabled:pointer-events-none",
                    (isSidebarOpen || isMobileView) ? "w-full" : "w-auto flex-col items-center", // Full width when open, auto when closed
                  )}
                  title={user.name}
                >
                  <Avatar.Root className={cn(
                    "inline-flex h-9 w-9 select-none items-center justify-center overflow-hidden rounded-full align-middle bg-muted shrink-0",
                     (!isSidebarOpen && !isMobileView) && "mb-0.5" // Small margin below avatar when collapsed
                    )}>
                    {user.avatarUrl ?
                      <Avatar.Image src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : null}
                    <Avatar.Fallback delayMs={200} className="flex h-full w-full items-center justify-center bg-background text-sm font-semibold text-primary uppercase">
                      {user.name ? user.name.charAt(0) : <User className="h-4 w-4"/>}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <AnimatePresence>
                    {(isSidebarOpen || isMobileView) && (
                      <motion.div variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="ml-3 min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">{user.role || user.email}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {(isSidebarOpen || isMobileView) && ( // Chevron only for expanded view
                      <motion.div variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed">
                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 opacity-90 shrink-0" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </DropdownMenu.Trigger>
              {(isSidebarOpen || isMobileView) && ( // Dropdown only for expanded view
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={12} align="start"
                  className="z-[100] min-w-[260px] bg-popover p-2 text-popover-foreground shadow-2xl animate-in data-[side=bottom]:slide-in-from-top-2 rounded-xl border"
                >
                  <DropdownMenu.Label className="px-2.5 py-2 text-xs font-medium text-muted-foreground">{user.email}</DropdownMenu.Label>
                  <DropdownMenu.Separator className="h-px bg-border -mx-2 my-2" />
                  <DropdownMenu.Item asChild><Link href="/profile" className="flex items-center cursor-pointer select-none rounded-lg px-2.5 py-2.5 text-sm outline-none hover:bg-accent focus:bg-accent transition-colors"><User className="mr-3 h-4 w-4 text-muted-foreground" /> Hồ sơ</Link></DropdownMenu.Item>
                  <DropdownMenu.Item asChild><Link href="/settings" className="flex items-center cursor-pointer select-none rounded-lg px-2.5 py-2.5 text-sm outline-none hover:bg-accent focus:bg-accent transition-colors"><Settings className="mr-3 h-4 w-4 text-muted-foreground" /> Cài đặt</Link></DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-border -mx-2 my-2" />
                  <DropdownMenu.Item
                    onClick={handleLogout}
                    className="flex items-center cursor-pointer select-none rounded-lg px-2.5 py-2.5 text-sm outline-none text-destructive hover:bg-destructive/10 focus:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" /> Đăng xuất
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
              )}
            </DropdownMenu.Root>
             {(!isMobileView) && ( // Sidebar toggle button for desktop, moved next to user info when open
                <Tooltip.Root delayDuration={150}>
                  <Tooltip.Trigger asChild>
                      <Button
                          variant="ghost" size="icon" onClick={toggleSidebar}
                          className={cn("h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-colors focus-visible:ring-1 focus-visible:ring-ring",
                                         isSidebarOpen ? "ml-auto" : "mt-1.5" // ml-auto to push to the right when open
                          )}
                          aria-label={isSidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
                      >
                          {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                      </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="right" align="center" sideOffset={10} className="z-[100] rounded-lg border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-xl">
                      {isSidebarOpen ? "Thu gọn" : "Mở rộng"}
                      <Tooltip.Arrow className="fill-popover" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
            )}
          </div>
        ) : (
          // Login Button Section (Not Authenticated)
          <div className={cn(
            "w-full flex",
            (isSidebarOpen || isMobileView) ? "p-2.5" : "flex-col items-center justify-center py-2 px-1.5 space-y-1.5" // Centering for collapsed view
          )}>
            <Button
              onClick={redirectToGoogleLogin}
              variant="outline" // Changed to outline for collapsed state
              size={(!isSidebarOpen && !isMobileView) ? "icon" : "default"} // Icon size when collapsed
              className={cn(
                "w-full h-9 text-sm",
                (isSidebarOpen || isMobileView) ? "justify-start px-3.5 bg-primary text-primary-foreground hover:bg-primary/90" : "p-0 aspect-square", // Default variant for open
                (!isSidebarOpen && !isMobileView) && "h-9 w-9" // Ensure size consistency with toggle button
              )}
              title="Đăng nhập"
            >
              <LogIn className={cn("h-4 w-4 shrink-0", (isSidebarOpen || isMobileView) && "mr-2.5")} />
              <AnimatePresence>{(isSidebarOpen || isMobileView) && <motion.span variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate font-medium">Đăng nhập</motion.span>}</AnimatePresence>
            </Button>
            {(!isMobileView && !isSidebarOpen) && ( // Toggle button below login when collapsed and not auth
                <Tooltip.Root delayDuration={150}>
                  <Tooltip.Trigger asChild>
                      <Button
                          variant="ghost" size="icon" onClick={toggleSidebar}
                          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                          aria-label="Mở rộng sidebar"
                      >
                          <PanelRightClose className="h-5 w-5" />
                      </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="right" align="center" sideOffset={10} className="z-[100] rounded-lg border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-xl">
                      Mở rộng
                      <Tooltip.Arrow className="fill-popover" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
            )}
          </div>
        )}
      </div>

      {isAuthenticated && (
        <>
          <div className={cn("shrink-0 p-3 space-y-2", (isSidebarOpen || isMobileView) ? "border-b border-border" : "py-2.5")}>
            <Button
                variant={(isSidebarOpen || isMobileView) ? "default" : "outline"}
                className={cn( "w-full h-10 text-sm font-semibold",
                                (isSidebarOpen || isMobileView) ? "justify-start px-3.5" : "justify-center p-0 aspect-square")}
                onClick={onOpenNewTaskModal} title="Thêm Task Mới" aria-label="Thêm Task Mới"
            >
                <Plus className={cn("h-5 w-5 shrink-0", (isSidebarOpen || isMobileView) && "mr-2.5")} />
                <AnimatePresence>{(isSidebarOpen || isMobileView) && <motion.span variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate">Thêm Task</motion.span>}</AnimatePresence>
            </Button>
            <div className={cn("grid gap-2", (isSidebarOpen || isMobileView) ? "grid-cols-2" : "grid-cols-1")}>
                <Button variant="outline" className={cn("w-full h-9 text-sm", (isSidebarOpen || isMobileView) ? "justify-start px-3" : "justify-center p-0 aspect-square")} title="Tìm kiếm" aria-label="Tìm kiếm">
                    <Search className={cn("h-4.5 w-4.5 shrink-0 text-muted-foreground", (isSidebarOpen || isMobileView) && "mr-2.5")} />
                    <AnimatePresence>{(isSidebarOpen || isMobileView) && <motion.span variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate text-muted-foreground">Tìm kiếm</motion.span>}</AnimatePresence>
                </Button>
                <Button variant="outline" className={cn("w-full h-9 text-sm", (isSidebarOpen || isMobileView) ? "justify-start px-3" : "justify-center p-0 aspect-square")} title="Thông báo" aria-label="Thông báo">
                    <Bell className={cn("h-4.5 w-4.5 shrink-0 text-muted-foreground", (isSidebarOpen || isMobileView) && "mr-2.5")} />
                    <AnimatePresence>{(isSidebarOpen || isMobileView) && <motion.span variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate text-muted-foreground">Thông báo</motion.span>}</AnimatePresence>
                </Button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto overflow-x-hidden py-2.5 space-y-2 custom-scrollbar">
            {navigationStructure.map((group) => (
              <div key={group.id} className={cn("px-2.5 space-y-1", (!isSidebarOpen && !isMobileView) && "px-2")}>
                {group.title && (
                  <motion.button
                    className={cn(
                      "w-full flex items-center h-9 px-2.5 mb-1 text-xs font-bold uppercase text-muted-foreground/90 tracking-wider rounded-md",
                      (isSidebarOpen || isMobileView) ? "justify-between hover:bg-accent hover:text-foreground" : "justify-center cursor-default"
                    )}
                    onClick={() => group.collapsible && (isSidebarOpen || isMobileView) && toggleGroupExpansion(group.id)}
                    disabled={!group.collapsible || (!isSidebarOpen && !isMobileView)}
                    title={!isSidebarOpen && !isMobileView ? group.title : (expandedGroups[group.id] ? `Thu gọn ${group.title}` : `Mở rộng ${group.title}`)}
                  >
                    <AnimatePresence>
                      {(isSidebarOpen || isMobileView) && (
                        <motion.span variants={staticTextAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate">{group.title}</motion.span>
                      )}
                    </AnimatePresence>
                    {(!isSidebarOpen && !isMobileView && group.collapsible) && <GripVertical className="h-4 w-4 opacity-80" />}
                    {(isSidebarOpen || isMobileView) && group.collapsible && (
                      <motion.div
                        animate={{ rotate: expandedGroups[group.id] ? 0 : -90 }}
                        transition={staticTransitionConfig}
                      >
                        <ChevronDown className="h-4.5 w-4.5" />
                      </motion.div>
                    )}
                  </motion.button>
                )}
                <AnimatePresence initial={false}>
                  {(!group.collapsible || expandedGroups[group.id] || (!isSidebarOpen && !isMobileView)) && (
                    <motion.div
                      key={`${group.id}-items-content`}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={{
                        open: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: "easeInOut" } },
                        closed: { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeInOut" } }
                      }}
                      className="space-y-1 overflow-hidden"
                    >
                      {group.isLoading ? (
                        <div className="flex justify-center items-center p-4 h-24">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : group.error ? (
                        <div className="px-3.5 py-2.5 text-xs text-destructive italic">
                          Lỗi: {group.error}
                        </div>
                      ) : group.items.length > 0 ? group.items.map((item: NavItemType) => (
                        <NavItemLinkRenderer key={item.id} item={item} isSidebarOpen={isSidebarOpen} isMobileView={isMobileView} />
                      )) : (
                        (isSidebarOpen || isMobileView) && group.emptyStateMessage && (
                            <p className="px-3.5 py-2.5 text-xs text-muted-foreground italic">{group.emptyStateMessage}</p>
                        )
                      )}
                      {(isSidebarOpen || isMobileView) && group.showAddButton && !group.isLoading && !group.error && (
                            <Button variant="ghost" onClick={group.onAdd} className="w-full h-10 justify-start text-muted-foreground hover:text-foreground text-sm font-medium px-3">
                                <PlusCircle className="h-4.5 w-4.5 mr-3"/> Thêm Dự án
                            </Button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={cn("shrink-0 border-t border-border mt-auto pt-2.5 pb-3.5 space-y-1", (isSidebarOpen || isMobileView) ? "px-3" : "px-2 py-2.5")}>
        {footerNavLinks.map((linkItem: NavLinkItem) => (
          <NavItemLinkRenderer key={linkItem.id} item={linkItem} isSidebarOpen={isSidebarOpen} isMobileView={isMobileView} />
        ))}
         <AnimatePresence>
            {(isSidebarOpen || isMobileView) && (
                <motion.p
                    variants={staticContentVisibilityVariants} initial="closed" animate="open" exit="closed"
                    className="!mt-4 px-2 text-center text-[11px] text-muted-foreground/70"
                >
                    TaskMaster Pro © {new Date().getFullYear()}
                </motion.p>
            )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
