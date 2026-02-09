"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ContentPanel } from "@/components/content-panel";
import { AnimatedBackground } from "@/components/animated-background";
import { cn } from "@/lib/utils";

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatedBackground />
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          "relative z-10 flex-1 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        <ContentPanel activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
