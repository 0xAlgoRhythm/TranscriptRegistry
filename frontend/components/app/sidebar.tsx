"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUIStore } from "@/lib/stores/ui-store"
import { useRoleStore, type UserRole } from "@/lib/stores/role-store"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileCheck2, 
  FilePlus2, 
  SearchCode, 
  Settings2,
  Lock,
  ListFilter
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, role: null },
  
  // Student specific
  { label: "My Transcripts", href: "/transcripts", icon: FileCheck2, role: "student" },
  { label: "Access Hub", href: "/access", icon: Lock, role: "student" },
  
  // Registrar specific
  { label: "Issue Transcript", href: "/issue", icon: FilePlus2, role: "registrar" },
  { label: "Issued List", href: "/issued", icon: ListFilter, role: "registrar" },
  
  // Public/All
  { label: "Verify On-Chain", href: "/verify", icon: SearchCode, role: null },
  
  // Admin specific
  { label: "Platform Admin", href: "/admin", icon: Settings2, role: "admin" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen } = useUIStore()
  const { role, isDemoMode, setRole } = useRoleStore()

  // Filter items based on active role if set, otherwise show all for simulation
  const filteredNav = NAV_ITEMS.filter(item => {
    if (!role) return true
    if (!item.role) return true
    if (role === "admin") return true
    return item.role === role
  })

  if (!sidebarOpen) return null

  return (
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shadow-sm">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all border group relative overflow-hidden",
                isActive
                  ? "bg-[oklch(var(--ca-accent)/0.08)] text-[oklch(var(--ca-accent))] border-[oklch(var(--ca-accent)/0.2)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-transparent",
              )}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[oklch(var(--ca-accent))]" />
              )}
              <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
              <span className="font-mono tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Role Switcher in Demo Mode */}
      {isDemoMode && (
        <div className="mx-4 mb-4 p-3 rounded-lg border border-dashed border-[oklch(var(--ca-accent)/0.3)] bg-[oklch(var(--ca-accent)/0.02)] space-y-2">
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">
            ⚙️ Demo Role Switcher
          </span>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
            {(["student", "registrar", "verifier", "admin"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "py-1 rounded border uppercase text-center transition-all font-semibold",
                  role === r
                    ? "bg-[oklch(var(--ca-accent))] text-white border-[oklch(var(--ca-accent))]"
                    : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground bg-card/40"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border/40 bg-card/25 space-y-4">
        <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1.5 w-fit">
          <span className="size-1.5 rounded-full bg-[oklch(var(--ca-teal))]" />
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
            Sepolia Testnet
          </span>
        </div>
      </div>
    </aside>
  )
}

