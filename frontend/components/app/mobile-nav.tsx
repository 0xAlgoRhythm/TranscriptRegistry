"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUIStore } from "@/lib/stores/ui-store"
import { useRoleStore } from "@/lib/stores/role-store"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  LayoutDashboard, 
  FileCheck2, 
  FilePlus2, 
  SearchCode, 
  Settings2 
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, role: null },
  { label: "Transcripts", href: "/transcripts", icon: FileCheck2, role: "student" },
  { label: "Issue", href: "/issue", icon: FilePlus2, role: "registrar" },
  { label: "Verify", href: "/verify", icon: SearchCode, role: null },
  { label: "Admin", href: "/admin", icon: Settings2, role: "admin" },
]

export function MobileNav() {
  const pathname = usePathname()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { role } = useRoleStore()

  // Filter items based on active role if set, otherwise show all for simulation
  const filteredNav = NAV_ITEMS.filter(item => {
    if (!role) return true
    if (!item.role) return true
    return item.role === role
  })

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-[280px] bg-background border-r border-border/60 p-0 flex flex-col h-full">
        <SheetHeader className="h-16 px-6 border-b border-border/40 flex items-center justify-between flex-row">
          <SheetTitle className="text-left">
            <Logo size="sm" />
          </SheetTitle>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
          <nav className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border",
                    isActive
                      ? "bg-ca-accent/8 text-ca-accent border-ca-accent/20"
                      : "text-muted-foreground hover:bg-muted/20 hover:text-foreground border-transparent",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-mono tracking-tight">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border/40 bg-card/20 space-y-4">
          <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1 w-fit">
            <span className="size-1.5 rounded-full bg-ca-teal" />
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
              Sepolia Network
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
