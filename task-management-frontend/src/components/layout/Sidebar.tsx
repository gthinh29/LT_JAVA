// src/components/layout/Sidebar.tsx
"use client";

import Link from 'next/link';
import {
  ListChecks, Search, Plus, Settings, HelpCircle, FileText, User, Bell, HomeIcon, Star, Folder, ChevronDown,
  PanelLeftClose, PanelRightClose, LogOut, GripVertical, Briefcase, CalendarCheck2, Filter, Tag, Inbox, CalendarClock,
  PlusCircle, Palette, Users, Archive // Added missing icons
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import * as Tooltip from '@radix-ui/react-tooltip'; // Import Tooltip
import { usePathname } from 'next/navigation';

// --- Types & Interfaces (Copied from previous "siêu hoàn thiện" version) ---
interface UserData {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface NavLinkItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  count?: number;
  isDate?: boolean;
  date?: number;
  exactMatch?: boolean;
  chip?: { text: string; variant: 'info' | 'success' | 'warning' | 'danger' };
  color?: string; // For tags or colored items
}

interface Project {
  id: string;
  name: string;
  href: string;
  color: string;
  icon?: React.ElementType;
  count: number;
  isFavorite?: boolean;
}

// Union type for items in NavGroup
type NavItemType = NavLinkItem | Project;

interface NavGroup {
  id: string;
  title?: string;
  items: NavItemType[];
  collapsible?: boolean;
  initiallyOpen?: boolean;
  showAddButton?: boolean;
  onAdd?: () => void;
  emptyStateMessage?: string;
}

interface SidebarProps {
  onOpenNewTaskModal: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobileView: boolean;
}

// --- Mock Data (Copied) ---
const mockUserData: UserData = {
  name: 'Phạm Thịnh',
  email: 'phamthinh@example.com',
  avatarUrl: undefined,
  role: 'Administrator',
};

const mockProjects: Project[] = [
  { id: 'proj-alpha', name: 'Project Alpha', href: '/project/alpha', color: 'bg-indigo-500', count: 12, isFavorite: true, icon: Briefcase },
  { id: 'proj-beta', name: 'Beta Initiative', href: '/project/beta', color: 'bg-pink-500', count: 5, icon: CalendarCheck2 },
  { id: 'proj-gamma', name: 'Gamma Stream', href: '/project/gamma', color: 'bg-amber-500', count: 23, icon: Users },
  { id: 'proj-delta', name: 'Delta Deliverables', href: '/project/delta', color: 'bg-teal-500', count: 0, isFavorite: true },
];

const SIDEBAR_WIDTH_OPEN = 280;
const SIDEBAR_WIDTH_CLOSED_DESKTOP = 68;

// --- Helper Type Guards ---
function isProject(item: NavItemType): item is Project {
  return (item as Project).color !== undefined && !('isDate' in item); // Simple check, adjust as needed
}

function isNavLinkItem(item: NavItemType): item is NavLinkItem {
  return !isProject(item);
}


// --- Component Implementation ---
const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewTaskModal,
  isSidebarOpen,
  toggleSidebar,
  isMobileView,
}) => {
  const pathname = usePathname();
  const [userDataState, setUserDataState] = useState<UserData>(mockUserData);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const footerNavLinks: NavLinkItem[] = [ // Defined footerLinks
    { name: 'Help & Feedback', id: 'help', href: '#help', icon: HelpCircle },
    { name: 'Settings', id: 'settings', href: '/settings', icon: Settings },
  ];

  const navigationStructure: NavGroup[] = useMemo(() => [
    {
      id: 'main-views',
      items: [
        { id: 'inbox', name: 'Inbox', href: '/inbox', icon: Inbox, count: 5, chip: {text: 'New', variant: 'info'}, exactMatch: true },
        { id: 'today', name: 'Today', href: '/today', icon: CalendarCheck2, date: new Date().getDate(), count: 2, exactMatch: true, isDate: true },
        { id: 'upcoming', name: 'Upcoming', href: '/upcoming', icon: CalendarClock, count: 8, exactMatch: true },
      ],
    },
    {
      id: 'favorites',
      title: 'Favorites',
      collapsible: true,
      initiallyOpen: true,
      items: mockProjects.filter(p => p.isFavorite),
      emptyStateMessage: "No favorite projects."
    },
    {
      id: 'projects',
      title: 'Projects',
      collapsible: true,
      initiallyOpen: true,
      showAddButton: true,
      onAdd: () => console.log('Add new project'),
      items: mockProjects,
      emptyStateMessage: "No projects. Create one!"
    },
  ], []);


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

  const sidebarVariants = {
    open: { width: SIDEBAR_WIDTH_OPEN, x: 0, opacity: 1 },
    closedMobile: { width: SIDEBAR_WIDTH_OPEN, x: '-100%', opacity: 1 },
    closedDesktop: { width: SIDEBAR_WIDTH_CLOSED_DESKTOP, x: 0, opacity: 1 },
  };
  const transitionConfig = { type: "spring", stiffness: 300, damping: 30, duration: 0.2 };

  const contentVisibilityVariants = {
    open: { opacity: 1, display: 'flex', transition: { delay: 0.05, duration: 0.2 } },
    closed: { opacity: 0, display: 'none', transition: { duration: 0.1 } },
  };
  const textAndIconSpacingVariants = {
    open: { opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.15, ease: "circOut" } },
    closed: { opacity: 0, x: -5, transition: { duration: 0.1, ease: "circIn" } },
  };

  const NavItemLinkRenderer: React.FC<{ item: NavItemType; isSidebarOpen: boolean; isMobileView: boolean; }> =
    ({ item, isSidebarOpen, isMobileView }) => {
    const IconCmp = item.icon || (isProject(item) ? Folder : ListChecks); // Default icon
    const isActive = ('exactMatch' in item && item.exactMatch) ? pathname === item.href : pathname.startsWith(item.href);

    const linkContent = (
      <>
        {isProject(item) && (isSidebarOpen || isMobileView) && (
          <span className={cn("h-2.5 w-2.5 rounded-full mr-2 shrink-0", item.color)}></span>
        )}
        {isProject(item) && (!isSidebarOpen && !isMobileView) && (
          <span className={cn("h-3 w-1 rounded-full shrink-0", item.color)}></span>
        )}
        <IconCmp className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
          (isSidebarOpen || isMobileView) && (!isProject(item) || (isProject(item) && !item.color)) && "mr-2.5",
           (!isSidebarOpen && !isMobileView) && "mx-auto"
        )} />
        <AnimatePresence>
          {(isSidebarOpen || isMobileView) && (
            <motion.span variants={textAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate flex-1 text-sm">
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(isSidebarOpen || isMobileView) && item.count !== undefined && item.count > 0 && (
            <motion.span
              variants={contentVisibilityVariants} initial="closed" animate="open" exit="closed"
              className="ml-auto text-xs font-normal bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
            >
              {item.count}
            </motion.span>
          )}
        </AnimatePresence>
         <AnimatePresence>
          {(isSidebarOpen || isMobileView) && isNavLinkItem(item) && item.isDate && item.date && (
            <motion.span
              variants={contentVisibilityVariants} initial="closed" animate="open" exit="closed"
              className="ml-auto text-xs font-medium text-muted-foreground"
            >
              {item.date}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(isSidebarOpen || isMobileView) && isNavLinkItem(item) && item.chip && (
             <motion.span
              variants={contentVisibilityVariants} initial="closed" animate="open" exit="closed"
              className={cn(
                "ml-1.5 text-[10px] font-semibold px-1 py-0.5 rounded-sm leading-none",
                item.chip.variant === 'info' && 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100',
                item.chip.variant === 'success' && 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100',
              )}
            >
              {item.chip.text}
            </motion.span>
          )}
        </AnimatePresence>
      </>
    );

    const commonClasses = cn(
      "flex items-center rounded-md px-2.5 py-2 group transition-colors duration-100 h-9",
      isActive ? "bg-primary/10 text-primary font-medium dark:bg-primary/20" : "text-foreground hover:bg-accent hover:text-accent-foreground",
      (!isSidebarOpen && !isMobileView) && "justify-center w-full aspect-square p-0"
    );

    if (!isSidebarOpen && !isMobileView) {
      return (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Link href={item.href} className={commonClasses}>
                {linkContent}
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                align="center"
                sideOffset={6}
                className="z-50 overflow-hidden rounded-md border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
              >
                {item.name}
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
      );
    }

    return (
      <Link href={item.href} className={commonClasses}>
        {linkContent}
      </Link>
    );
  };


  return (
    <motion.aside
      key="sidebar-main-animation-wrapper"
      initial={false}
      animate={isMobileView ? (isSidebarOpen ? "open" : "closedMobile") : (isSidebarOpen ? "open" : "closedDesktop")}
      variants={sidebarVariants}
      transition={transitionConfig}
      className={cn("fixed inset-y-0 left-0 z-40 flex flex-col bg-card text-card-foreground shadow-xl border-r border-border")}
      aria-label="Main Navigation Sidebar"
    >
      <div className={cn(
        "flex items-center shrink-0 border-b border-border h-[60px] transition-padding duration-300",
        (isSidebarOpen || isMobileView) ? "px-3 justify-between" : "px-0 flex-col justify-center py-1.5"
      )}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild disabled={!isSidebarOpen && !isMobileView}>
            <button
              className={cn(
                "flex items-center text-left p-1.5 rounded-md hover:bg-accent w-full overflow-hidden disabled:pointer-events-none disabled:opacity-100",
                 (!isSidebarOpen && !isMobileView) && "justify-center"
              )}
              title={userDataState.name}
            >
              <Avatar.Root className="inline-flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full align-middle bg-muted shrink-0">
                {userDataState.avatarUrl ?
                  <Avatar.Image src={userDataState.avatarUrl} alt={userDataState.name} className="h-full w-full object-cover" /> : null}
                <Avatar.Fallback delayMs={200} className="flex h-full w-full items-center justify-center bg-background text-sm font-semibold text-primary uppercase">
                  {userDataState.name ? userDataState.name.slice(0,1) : <User className="h-4 w-4"/>}
                </Avatar.Fallback>
              </Avatar.Root>
              <AnimatePresence>
                {(isSidebarOpen || isMobileView) && (
                  <motion.div variants={textAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="ml-2.5 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate leading-tight">{userDataState.name}</p>
                    <p className="text-xs text-muted-foreground truncate leading-tight">{userDataState.role || userDataState.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {(isSidebarOpen || isMobileView) && (
                  <motion.div variants={textAndIconSpacingVariants} initial="closed" animate="open" exit="closed">
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-1 opacity-70 shrink-0" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </DropdownMenu.Trigger>
          {(isSidebarOpen || isMobileView) && (
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8} align="start"
              className="z-50 min-w-[240px] bg-popover p-1.5 text-popover-foreground shadow-xl animate-in data-[side=bottom]:slide-in-from-top-2 rounded-lg border"
            >
              <DropdownMenu.Label className="px-2 py-1.5 text-xs font-normal text-muted-foreground">{userDataState.email}</DropdownMenu.Label>
              <DropdownMenu.Separator className="h-px bg-border -mx-1.5 my-1" />
              <DropdownMenu.Item asChild><Link href="/profile" className="flex items-center cursor-pointer select-none rounded px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"><User className="mr-2 h-4 w-4 text-muted-foreground" /> My Profile</Link></DropdownMenu.Item>
              <DropdownMenu.Item asChild><Link href="/settings" className="flex items-center cursor-pointer select-none rounded px-2 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"><Settings className="mr-2 h-4 w-4 text-muted-foreground" /> Settings</Link></DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-border -mx-1.5 my-1" />
              <DropdownMenu.Item className="flex items-center cursor-pointer select-none rounded px-2 py-1.5 text-sm outline-none text-red-600 dark:text-red-400 hover:bg-destructive/10 focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
          )}
        </DropdownMenu.Root>

        {(!isMobileView) && (
          <Tooltip.Root delayDuration={200}>
            <Tooltip.Trigger asChild>
                <Button
                    variant="ghost" size="icon" onClick={toggleSidebar}
                    className={cn("h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent shrink-0",
                                   isSidebarOpen ? "ml-1" : "mt-1.5 mx-auto"
                    )}
                    aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="right" align="center" sideOffset={6} className="z-50 rounded-md border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md">
                {isSidebarOpen ? "Collapse" : "Expand"}
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </div>

      <div className={cn("shrink-0 p-2 space-y-1", (isSidebarOpen || isMobileView) ? "border-b border-border" : "py-1")}>
        <Button
            variant={(isSidebarOpen || isMobileView) ? "default" : "outline"}
            className={cn( "w-full h-9 text-sm", (isSidebarOpen || isMobileView) ? "justify-start px-2.5" : "justify-center p-0 aspect-square")}
            onClick={onOpenNewTaskModal} title="Add New Task" aria-label="Add New Task"
        >
            <Plus className={cn("h-4 w-4 shrink-0", (isSidebarOpen || isMobileView) && "mr-2")} />
            <AnimatePresence>{(isSidebarOpen || isMobileView) && <motion.span variants={textAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate">Add Task</motion.span>}</AnimatePresence>
        </Button>
        <div className={cn("grid gap-1", (isSidebarOpen || isMobileView) ? "grid-cols-2" : "grid-cols-1")}>
            <Button variant="outline" className={cn("w-full h-8 text-sm", (isSidebarOpen || isMobileView) ? "justify-start px-2.5" : "justify-center p-0 aspect-square")} title="Search" aria-label="Search">
                <Search className={cn("h-4 w-4 shrink-0 text-muted-foreground", (isSidebarOpen || isMobileView) && "mr-2")} />
                <AnimatePresence>{(isSidebarOpen || isMobileView) && <motion.span variants={textAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate text-muted-foreground">Search</motion.span>}</AnimatePresence>
            </Button>
            <Button variant="outline" className={cn("w-full h-8 text-sm", (isSidebarOpen || isMobileView) ? "justify-start px-2.5" : "justify-center p-0 aspect-square")} title="Notifications" aria-label="Notifications">
                <Bell className={cn("h-4 w-4 shrink-0 text-muted-foreground", (isSidebarOpen || isMobileView) && "mr-2")} />
                <AnimatePresence>{(isSidebarOpen || isMobileView) && <motion.span variants={textAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate text-muted-foreground">Updates</motion.span>}</AnimatePresence>
            </Button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto overflow-x-hidden py-2 space-y-3 custom-scrollbar">
        {navigationStructure.map((group) => (
          <div key={group.id} className={cn("px-1.5 space-y-0.5", (!isSidebarOpen && !isMobileView) && "px-1")}>
            {group.title && (
              <motion.button
                className={cn(
                  "w-full flex items-center h-7 px-1.5 mb-0.5 text-xs font-semibold uppercase text-muted-foreground tracking-wider rounded-sm",
                  (isSidebarOpen || isMobileView) ? "justify-between hover:bg-accent hover:text-foreground" : "justify-center cursor-default"
                )}
                onClick={() => group.collapsible && (isSidebarOpen || isMobileView) && toggleGroupExpansion(group.id)}
                disabled={!group.collapsible || (!isSidebarOpen && !isMobileView)}
                title={!isSidebarOpen && !isMobileView ? group.title : (expandedGroups[group.id] ? `Collapse ${group.title}` : `Expand ${group.title}`)}
              >
                <AnimatePresence>
                  {(isSidebarOpen || isMobileView) && (
                    <motion.span variants={textAndIconSpacingVariants} initial="closed" animate="open" exit="closed" className="truncate">{group.title}</motion.span>
                  )}
                </AnimatePresence>
                {(!isSidebarOpen && !isMobileView && group.collapsible) && <GripVertical className="h-3 w-3 opacity-60" />}
                {(isSidebarOpen || isMobileView) && group.collapsible && (
                  <motion.div variants={contentVisibilityVariants} initial="closed" animate="open" exit="closed">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", expandedGroups[group.id] && "rotate-180")} />
                  </motion.div>
                )}
              </motion.button>
            )}
            <AnimatePresence initial={false}>
              {(!group.collapsible || expandedGroups[group.id] || (!isSidebarOpen && !isMobileView)) && (
                <motion.div
                  key={`${group.id}-items-content`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1, transition: { opacity: {duration: 0.2, delay: 0.05}, height: {duration: 0.25}} }}
                  exit={{ height: 0, opacity: 0, transition: { opacity: {duration: 0.15}, height: {duration: 0.2}} }}
                  className="space-y-0.5 overflow-hidden"
                >
                  {group.items.length > 0 ? group.items.map((item: NavItemType) => ( // Explicitly type item here
                    <NavItemLinkRenderer key={item.id} item={item} isSidebarOpen={isSidebarOpen} isMobileView={isMobileView} />
                  )) : (
                     (isSidebarOpen || isMobileView) && group.emptyStateMessage && (
                        <p className="px-2.5 py-1.5 text-xs text-muted-foreground italic">{group.emptyStateMessage}</p>
                     )
                  )}
                   {(isSidebarOpen || isMobileView) && group.showAddButton && (
                        <Button variant="ghost" onClick={group.onAdd} className="w-full h-8 justify-start text-muted-foreground hover:text-foreground text-sm px-2.5">
                            <PlusCircle className="h-3.5 w-3.5 mr-2.5"/> Add {group.title?.slice(0,-1) || 'Item'}
                        </Button>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className={cn("shrink-0 border-t border-border pt-2 pb-2 space-y-1", (isSidebarOpen || isMobileView) ? "px-3" : "px-1.5 py-1.5")}>
        {footerNavLinks.map((linkItem: NavLinkItem) => ( // Explicitly type linkItem
          <NavItemLinkRenderer key={linkItem.id} item={linkItem} isSidebarOpen={isSidebarOpen} isMobileView={isMobileView} />
        ))}
         <AnimatePresence>
            {(isSidebarOpen || isMobileView) && (
                <motion.p
                    variants={contentVisibilityVariants} initial="closed" animate="open" exit="closed"
                    className="!mt-2 px-1 text-center text-[10px] text-muted-foreground/70"
                >
                    TaskManager Pro © {new Date().getFullYear()}
                </motion.p>
            )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

export default Sidebar;