"use client"

import { Sidebar } from "@/components/app/sidebar"
import { Topbar } from "@/components/app/topbar"
import { MobileNav } from "@/components/app/mobile-nav"
import { AuthGate } from "@/components/app/auth-gate"
import { RBACProvider } from "@/components/providers/rbac-provider"
import { RoleGuard } from "@/components/app/role-guard"
import { StudentGate } from "@/components/app/student-gate"
import { useUIStore } from "@/lib/stores/ui-store"
import { ReactNode, useEffect } from "react"

export default function AppLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen, theme, setTheme } = useUIStore()

  useEffect(() => {
    // Initial theme sync from localStorage
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (storedTheme) {
      setTheme(storedTheme)
    } else {
      // Start with light mode as requested
      setTheme("light")
    }
  }, [setTheme])

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <AuthGate>
      <RBACProvider>
        <RoleGuard>
          <StudentGate>
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
          </StudentGate>
        </RoleGuard>
      </RBACProvider>
    </AuthGate>
  )
}

