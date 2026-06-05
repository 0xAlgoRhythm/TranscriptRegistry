import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  theme: "light" | "dark"
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  setTheme: (theme: "light" | "dark") => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  theme: "light",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === "light" ? "dark" : "light"
    return { theme: nextTheme }
  }),
}))

