"use client"

import { Sidebar } from "@/components/app/sidebar"
import { Topbar } from "@/components/app/topbar"
import { MobileNav } from "@/components/app/mobile-nav"
import { AuthGate } from "@/components/app/auth-gate"
import { useUIStore } from "@/lib/stores/ui-store"
import type { ReactNode } from "react"

export default function AppLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useUIStore()

  return (
    <AuthGate>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        {/* Sidebar Component */}
        <Sidebar />
        
        {/* Mobile Navigation Drawer */}
        <MobileNav />

        <div className="flex flex-1 flex-col overflow-hidden relative">
          {/* Top Header Panel */}
          <Topbar />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-card/10 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  )
}
