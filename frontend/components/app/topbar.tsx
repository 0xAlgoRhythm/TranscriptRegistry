"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { truncateAddress } from "@/lib/utils"
import { useUIStore } from "@/lib/stores/ui-store"
import { useRoleStore } from "@/lib/stores/role-store"
import { Menu, PanelLeftClose, PanelLeft, ShieldAlert, Sparkles, Sun, Moon } from "lucide-react"

export function Topbar() {
  const { login, logout, authenticated, ready } = usePrivy()
  const { address } = useAccount()
  const { sidebarOpen, toggleSidebar, toggleMobileMenu, theme, toggleTheme } = useUIStore()
  const { role } = useRoleStore()

  const getRoleLabel = () => {
    switch (role) {
      case "admin": return "Platform Admin"
      case "registrar": return "University Registrar"
      case "student": return "Student Hub"
      case "verifier": return "Public Verifier"
      default: return "No Role Selected"
    }
  }

  const getRoleColor = () => {
    switch (role) {
      case "admin": return "border-[oklch(var(--ca-destructive)/0.3)] bg-[oklch(var(--ca-destructive)/0.05)] text-[oklch(var(--ca-destructive))]"
      case "registrar": return "border-[oklch(var(--ca-accent)/0.3)] bg-[oklch(var(--ca-accent)/0.05)] text-[oklch(var(--ca-accent))]"
      case "student": return "border-[oklch(var(--ca-teal)/0.3)] bg-[oklch(var(--ca-teal)/0.05)] text-[oklch(var(--ca-teal))]"
      case "verifier": return "border-[oklch(var(--ca-success)/0.3)] bg-[oklch(var(--ca-success)/0.05)] text-[oklch(var(--ca-success))]"
      default: return "border-border/60 bg-muted/40 text-muted-foreground"
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card shadow-sm px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Sidebar Toggle button (Desktop) */}
        <button
          onClick={toggleSidebar}
          className="hidden md:block p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </button>

        {role && (
          <div className={`hidden sm:flex items-center gap-1.5 rounded px-2.5 py-0.5 border text-[10px] font-mono font-bold uppercase tracking-wider ${getRoleColor()}`}>
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            {getRoleLabel()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        {!ready ? (
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted/40" />
        ) : !authenticated ? (
          <Button
            onClick={login}
            size="sm"
            className="bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs px-4"
          >
            CONNECT WALLET
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {address && (
              <span className="rounded border border-border/50 bg-muted/20 px-3 py-1 font-mono text-xs text-foreground shadow-sm">
                {truncateAddress(address)}
              </span>
            )}
            <button
              onClick={logout}
              className="text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              DISCONNECT
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

