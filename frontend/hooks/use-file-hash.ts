"use client"

import { useState } from "react"

export function useFileHash() {
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateHash = async (file: File) => {
    setIsCalculating(true)
    setError(null)
    setHash(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer)
      
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
      
      const fullHash = `0x${hashHex}` as `0x${string}`
      setHash(fullHash)
    } catch (err) {
      console.error("Error calculating file hash:", err)
      setError("Failed to calculate file hash.")
    } finally {
      setIsCalculating(false)
    }
  }

  const reset = () => {
    setHash(null)
    setIsCalculating(false)
    setError(null)
  }

  return { hash, isCalculating, error, calculateHash, reset }
}
