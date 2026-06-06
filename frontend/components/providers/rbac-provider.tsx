"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { useRoleStore, UserRole } from "@/lib/stores/role-store"
import { usePlatformAdmin } from "@/hooks/use-university-factory"

interface RBACContextType {
  resolvedRole: UserRole | null
  isLoading: boolean
}

const RBACContext = createContext<RBACContextType>({ resolvedRole: null, isLoading: true })

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const { role, setRole } = useRoleStore()
  const { data: adminAddress, isLoading: adminLoading, isError: adminError, isFetching: adminFetching } = usePlatformAdmin()
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (address) {
      if (adminLoading || adminFetching) {
        setResolving(true)
        return
      }

      if (adminError && !adminAddress) {
        // If RPC failed and we don't have cached data, don't override the existing role
        // This prevents kicking admins to the student onboarding form if the RPC hiccups
        setResolving(false)
        return
      }
      
      const resolveRole = async () => {
        setResolving(true)
        try {
          // 1. Check Platform Admin
          if (adminAddress && address.toLowerCase() === (adminAddress as string).toLowerCase()) {
            setRole("admin")
            setResolving(false)
            return
          }

          // 2. Check if Registrar via Hono API
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          const res = await fetch(`${API_URL}/api/universities`)
          if (res.ok) {
            const universities = await res.json()
            const isRegistrar = universities.some(
              (u: any) => u.registrar.toLowerCase() === address.toLowerCase()
            )
            if (isRegistrar) {
              setRole("registrar")
              setResolving(false)
              return
            }
          }

          // 3. Default to Student
          setRole("student")
        } catch (e) {
          console.error("Failed to resolve RBAC role:", e)
          // If network failed, don't override existing roles
        } finally {
          setResolving(false)
        }
      }

      resolveRole()
    } else {
      setRole(null)
    }
  }, [address, adminAddress, adminLoading, adminFetching, adminError, setRole])

  const isLoading = (address && adminLoading) || resolving

  return (
    <RBACContext.Provider value={{ resolvedRole: role, isLoading: !!isLoading }}>
      {children}
    </RBACContext.Provider>
  )
}

export function useRBAC() {
  return useContext(RBACContext)
}
