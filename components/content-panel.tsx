"use client";

import React from "react"

import {
  CalendarDays,
  BookOpen,
  Settings,
  Wrench,
  Users,
  Calculator,
  TrendingUp,
  Home,
  CrosshairIcon,
  Crown,
} from "lucide-react";

import { AccountsContent } from "@/components/accounts-content";
import { PlannerContent } from "@/components/planner-content";
import { CalculatorContent } from "@/components/calculator-content";
import { GeneralToolsContent } from "@/components/general-tools-content";
import { GuidesContent } from "@/components/guides-content";
import { CalendarContent } from "@/components/calendar-content";
import { SettingsContent } from "@/components/settings-content";
import { HomeContent } from "@/components/home-content";
import { KvkContent } from "@/components/kvk-content";
import { CommanderContent } from "@/components/commander-content";

const tabMeta: Record<string, { label: string; description: string; icon: React.ElementType }> = {
  home: {
    label: "Home",
    description: "Welcome to your Rise of Kingdoms Toolkit",
    icon: Home,
  },
  calendar: {
    label: "Calendar",
    description: "Track events, Mightiest Governor, and KvK schedules",
    icon: CalendarDays,
  },
  kvk: {
    label: "KvK Tracker",
    description: "Plan KvK runs, calculate honor points, and track timelines",
    icon: CrosshairIcon,
  },
  commander: {
    label: "Commander Prep",
    description: "Plan commander upgrades, gold head income, and wheel of fortune spending",
    icon: Crown,
  },
  guides: {
    label: "Guides",
    description: "Commander guides, strategies, and tips",
    icon: BookOpen,
  },
  "general-tools": {
    label: "General Tools",
    description: "Useful utilities for your kingdom",
    icon: Wrench,
  },
  accounts: {
    label: "Accounts",
    description: "Manage your Rise of Kingdoms accounts",
    icon: Users,
  },
  calculator: {
    label: "Calculator",
    description: "Speedups, resources, and troop calculators",
    icon: Calculator,
  },
  "progression-plans": {
    label: "Progression Plans",
    description: "Plan your growth from day one",
    icon: TrendingUp,
  },
  settings: {
    label: "Settings",
    description: "Configure your toolkit preferences",
    icon: Settings,
  },
};

interface ContentPanelProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export function ContentPanel({ activeTab, onTabChange }: ContentPanelProps) {
  const meta = tabMeta[activeTab] || tabMeta.home;
  const Icon = meta.icon;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-border px-8 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {meta.label}
          </h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === "accounts" ? (
          <AccountsContent />
        ) : activeTab === "calculator" ? (
          <CalculatorContent />
        ) : activeTab === "progression-plans" ? (
          <PlannerContent />
        ) : activeTab === "general-tools" ? (
          <GeneralToolsContent />
        ) : activeTab === "guides" ? (
          <GuidesContent />
        ) : activeTab === "calendar" ? (
          <CalendarContent />
        ) : activeTab === "kvk" ? (
          <KvkContent />
        ) : activeTab === "commander" ? (
          <CommanderContent />
        ) : activeTab === "settings" ? (
          <SettingsContent />
        ) : (
          <HomeContent onTabChange={onTabChange} />
        )}
      </main>
    </div>
  );
}

