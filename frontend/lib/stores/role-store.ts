import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "admin" | "registrar" | "student" | "verifier"

interface RoleState {
  role: UserRole | null
  setRole: (role: UserRole | null) => void
  reset: () => void
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: null,
      setRole: (role) => set({ role }),
      reset: () => set({ role: null }),
    }),
    {
      name: "credaxis-role-storage",
    }
  )
)
