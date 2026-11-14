"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { Session } from "@/lib/types";

interface AdminShellProps {
  session: Session;
  lowStockCount: number;
  children: React.ReactNode;
}

export function AdminShell({ session, lowStockCount, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
      {/* Desktop sidebar */}
      <Sidebar
        role={session.role}
        className="hidden lg:flex w-[240px] shrink-0"
      />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 bottom-0 w-[240px] z-10">
            <Sidebar
              role={session.role}
              className="flex w-full h-full"
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          session={session}
          lowStockCount={lowStockCount}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
