"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Home,
  CalendarDays,
  BookOpen,
  Settings,
  Wrench,
  Users,
  Calculator,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Swords,
  LogIn,
  LogOut,
  Shield,
  CrosshairIcon,
  Crown,
  Map,
} from "lucide-react";
function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { user, loading, login, logout } = useAuth();

  return (
    <div className="border-t border-border p-3">
      {loading ? (
        <div className="h-10 animate-pulse rounded-lg bg-secondary/50" />
      ) : user ? (
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img
              src={user.avatar || "/placeholder.svg"}
              alt={user.username}
              className="h-8 w-8 rounded-full flex-shrink-0"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">{user.username}</span>
                {user.isAdmin && <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={login}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <LogIn className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign in with Discord</span>}
        </button>
      )}
    </div>
  );
}

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "kvk", label: "KvK Tracker", icon: CrosshairIcon },
  { id: "commander", label: "Commander Prep", icon: Crown },
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "general-tools", label: "General Tools", icon: Wrench },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "progression-plans", label: "Progression Plans", icon: TrendingUp },
  { id: "territory-planner", label: "Territory Planner", icon: Map },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Swords className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              RoK Toolkit
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary shadow-[0_0_20px_-4px_hsl(var(--glow)/0.3)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Auth / Footer */}
      <UserFooter collapsed={collapsed} />
    </aside>
  );
}