"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { useRoleStore, UserRole } from "@/lib/stores/role-store"
import { usePlatformAdmin } from "@/hooks/use-university-factory"
import { usePrivy } from "@privy-io/react-auth"

interface RBACContextType {
  resolvedRole: UserRole | null
  isLoading: boolean
}

const RBACContext = createContext<RBACContextType>({ resolvedRole: null, isLoading: true })

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const { user } = usePrivy()
  const { role, setRole } = useRoleStore()
  const { data: adminAddress, isLoading: adminLoading, isError: adminError, isFetching: adminFetching } = usePlatformAdmin()
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    // 0. Check Hardcoded Platform Admin Email (Instant local check)
    if (user?.email?.address) {
      const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "johnokyere282@icloud.com"
      const userEmail = user.email.address.toLowerCase()
      if (userEmail === ADMIN_EMAIL.toLowerCase() || userEmail === "johnotchere282@gmail.com") {
        setRole("admin")
        setResolving(false)
        return
      }
    }

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
          // Keep as fallback
          const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "johnokyere282@icloud.com"
          const userEmail = user?.email?.address?.toLowerCase()
          if (userEmail === ADMIN_EMAIL.toLowerCase() || userEmail === "johnotchere282@gmail.com") {
            setRole("admin")
            setResolving(false)
            return
          }

          // Gather all associated addresses for this user (connected wallet + linked accounts)
          const userAddresses = [address.toLowerCase()]
          if (user?.linkedAccounts) {
            user.linkedAccounts.forEach(acc => {
              if (acc.type === "wallet" && acc.address) {
                userAddresses.push(acc.address.toLowerCase())
              }
            })
          }

          // 1. Check Platform Admin Wallet
          if (adminAddress) {
            const adminAddr = (adminAddress as string).toLowerCase()
            if (userAddresses.includes(adminAddr)) {
              setRole("admin")
              setResolving(false)
              return
            }
          }

          // 2. Check if Registrar via Hono API
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          const res = await fetch(`${API_URL}/api/universities`)
          if (res.ok) {
            const universities = await res.json()
            const isRegistrar = universities.some(
              (u: any) => userAddresses.includes(u.registrar.toLowerCase())
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
  }, [address, adminAddress, adminLoading, adminFetching, adminError, setRole, user])

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
