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
  const { role, isDemoMode, toggleDemoMode } = useRoleStore()

  const getRoleLabel = () => {
    switch (role) {
      case "admin": return "Platform Admin"
      case "registrar": return "University Registrar"
      case "student": return "Student Hub"
      case "verifier": return "Public Verifier"
      case "institution": return "Third-Party Institution"
      default: return "No Role Selected"
    }
  }

  const getRoleColor = () => {
    switch (role) {
      case "admin": return "border-ca-danger/30 bg-ca-danger/5 text-ca-danger"
      case "registrar": return "border-ca-accent/30 bg-ca-accent/5 text-ca-accent"
      case "student": return "border-ca-teal/30 bg-ca-teal/5 text-ca-teal"
      case "verifier": return "border-ca-success/30 bg-ca-success/5 text-ca-success"
      case "institution": return "border-ca-success/30 bg-ca-success/5 text-ca-success"
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
        
        {/* Demo Mode Toggle */}
        <button
          onClick={toggleDemoMode}
          className={`p-1.5 rounded hover:bg-muted transition-colors font-mono text-[9px] uppercase tracking-wider font-bold border flex items-center gap-1.5 h-8 ${
            isDemoMode
              ? "bg-ca-accent/15 border-ca-accent/30 text-ca-accent hover:bg-ca-accent/25"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          }`}
          title={isDemoMode ? "Disable Demo Mode" : "Enable Demo Mode"}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{isDemoMode ? "DEMO ACTIVE" : "DEMO MODE"}</span>
        </button>

        {!ready ? (
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted/40" />
        ) : !authenticated ? (
          <Button
            onClick={login}
            size="sm"
            className="bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs px-3 sm:px-4"
          >
            <span className="hidden sm:inline">CONNECT WALLET</span>
            <span className="sm:hidden">CONNECT</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {address && (
              <span className="hidden sm:inline-block rounded border border-border/50 bg-muted/20 px-3 py-1 font-mono text-xs text-foreground shadow-sm">
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

