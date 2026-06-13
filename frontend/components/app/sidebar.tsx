"use client"

import { Link } from "@/i18n/routing"
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
  ListFilter,
  Settings,
  History
} from "lucide-react"

const NAV_ITEMS = [
  // Registrar & Admin & Institution specific dashboard
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, role: "registrar" },
  
  // Student specific
  { label: "Student Profile", href: "/dashboard", icon: LayoutDashboard, role: "student" },
  { label: "My Transcripts", href: "/transcripts", icon: FileCheck2, role: "student" },
  { label: "Access Hub", href: "/access", icon: Lock, role: "student" },
  { label: "Account Settings", href: "/settings", icon: Settings2, role: "student" },
  
  // Registrar specific
  { label: "Issue Transcript", href: "/issue", icon: FilePlus2, role: "registrar" },
  { label: "Issued List", href: "/issued", icon: ListFilter, role: "registrar" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings2, role: "registrar" },
  
  // Public/All
  { label: "Verify On-Chain", href: "/verify-onchain", icon: SearchCode, role: null },
  
  // Institution specific
  { label: "Institution Portal", href: "/institution", icon: LayoutDashboard, role: "institution" },
  
  // Admin specific
  { label: "Dashboard", href: "/admin", icon: Settings, role: "admin" },
  { label: "Global Settings & Audit", href: "/admin/settings", icon: History, role: "admin" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen } = useUIStore()
  const { role, isDemoMode, setRole } = useRoleStore()

  // Filter items based on active role if set, otherwise show only public items for simulation
  const filteredNav = NAV_ITEMS.filter(item => {
    if (!role) {
      return item.role === null
    }
    return item.role === null || item.role === role
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
                  ? "bg-ca-accent/8 text-ca-accent border-ca-accent/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-transparent",
              )}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-ca-accent" />
              )}
              <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
              <span className="font-mono tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Role Switcher in Demo Mode */}
      {isDemoMode && (
        <div className="mx-4 mb-4 p-3 rounded-lg border border-dashed border-ca-accent/30 bg-ca-accent/2 space-y-2">
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">
            ⚙️ Demo Role Switcher
          </span>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
            {(["student", "registrar", "verifier", "admin", "institution"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "py-1 rounded border uppercase text-center transition-all font-semibold",
                  role === r
                    ? "bg-ca-accent text-white border-ca-accent"
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
          <span className="size-1.5 rounded-full bg-ca-teal" />
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
            Sepolia Testnet
          </span>
        </div>
      </div>
    </aside>
  )
}

