import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "admin" | "registrar" | "student" | "verifier"

interface RoleState {
  role: UserRole | null
  isDemoMode: boolean
  setRole: (role: UserRole | null) => void
  toggleDemoMode: () => void
  reset: () => void
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: null,
      isDemoMode: false, // Enforce live wallet based resolution for production Dapp
      setRole: (role) => set({ role }),
      toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
      reset: () => set({ role: null, isDemoMode: false }),
    }),
    {
      name: "credaxis-role-storage",
    }
  )
)
