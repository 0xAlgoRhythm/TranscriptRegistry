import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Address, encodePacked, keccak256 } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function studentHash(address: Address): `0x${string}` {
  return keccak256(encodePacked(["address"], [address]))
}

export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function timeRemaining(expiresAt: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = Number(expiresAt) - now
  if (diff <= 0) return "Expired"
  const days = Math.floor(diff / 86_400)
  const hours = Math.floor((diff % 86_400) / 3600)
  if (days > 0) return `${days}d ${hours}h remaining`
  const minutes = Math.floor((diff % 3600) / 60)
  return `${hours}h ${minutes}m remaining`
}

export function getHumanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes("User rejected") || message.includes("user rejected"))
    return "Transaction cancelled"
  if (message.includes("insufficient funds"))
    return "Insufficient funds for gas"
  if (message.includes("execution reverted"))
    return "Transaction would fail — check your inputs"
  if (message.includes("network") || message.includes("timeout"))
    return "Network error — please try again"

  return "Something went wrong — please try again"
}

export function getPrivyEmail(user: any): string | null {
  if (!user) return null
  if (user.email?.address) return user.email.address.toLowerCase()
  if (user.google?.email) return user.google.email.toLowerCase()
  if (user.apple?.email) return user.apple.email.toLowerCase()
  if (user.linkedAccounts) {
    for (const acc of user.linkedAccounts) {
      if (acc.type === "email" && acc.address) return acc.address.toLowerCase()
      if (acc.type === "google_oauth" && acc.email) return acc.email.toLowerCase()
      if (acc.type === "apple_oauth" && acc.email) return acc.email.toLowerCase()
    }
  }
  return null
}

