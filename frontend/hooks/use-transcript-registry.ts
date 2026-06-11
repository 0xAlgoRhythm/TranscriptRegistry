"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { isAddress, type Address } from "viem"
import { transcriptRegistryAbi, CHAIN } from "@/lib/contracts"

export function useRegistryStats(registryAddress: Address) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "getContractStats",
    chainId: CHAIN.id,
    query: { enabled: !!registryAddress && isAddress(registryAddress) },
  })
}

export function useUniversityName(registryAddress: Address) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "universityName",
    chainId: CHAIN.id,
    query: { enabled: !!registryAddress && isAddress(registryAddress) },
  })
}

export function useRegistrar(registryAddress: Address) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "registrar",
    chainId: CHAIN.id,
    query: { enabled: !!registryAddress && isAddress(registryAddress) },
  })
}

export function useTranscript(registryAddress: Address, recordId: `0x${string}`) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "getTranscript",
    args: [recordId],
    chainId: CHAIN.id,
    query: { enabled: !!registryAddress && isAddress(registryAddress) && !!recordId },
  })
}

export function useStudentTranscripts(
  registryAddress: Address,
  studentHashValue: `0x${string}`,
) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "getStudentTranscripts",
    args: [studentHashValue],
    chainId: CHAIN.id,
    query: { enabled: !!registryAddress && isAddress(registryAddress) && !!studentHashValue },
  })
}

export function useCheckAccess(
  registryAddress: Address,
  recordId: `0x${string}`,
  verifier: Address,
) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "checkAccess",
    args: [recordId, verifier],
    chainId: CHAIN.id,
    query: { enabled: !!registryAddress && isAddress(registryAddress) && !!recordId && !!verifier && isAddress(verifier) },
  })
}

export function useAccessControl(
  registryAddress: Address,
  recordId: `0x${string}`,
  verifier: Address,
) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "accessControl",
    args: [recordId, verifier],
    chainId: CHAIN.id,
    query: { enabled: !!registryAddress && isAddress(registryAddress) && !!recordId && !!verifier && isAddress(verifier) },
  })
}

export function useRegisterTranscript() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function register(
    registryAddress: Address,
    studentHashVal: `0x${string}`,
    metadataCID: string,
    fileHash: `0x${string}`,
    studentWallet: Address,
  ) {
    writeContract({
      address: registryAddress,
      abi: transcriptRegistryAbi,
      functionName: "registerTranscript",
      args: [studentHashVal, metadataCID, fileHash, studentWallet],
      chainId: CHAIN.id,
    })
  }

  return { register, hash, isPending, isConfirming, isSuccess, error }
}

export function useGrantAccess() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function grant(
    registryAddress: Address,
    recordId: `0x${string}`,
    verifier: Address,
    duration: bigint,
  ) {
    writeContract({
      address: registryAddress,
      abi: transcriptRegistryAbi,
      functionName: "grantAccess",
      args: [recordId, verifier, duration],
      chainId: CHAIN.id,
    })
  }

  return { grant, hash, isPending, isConfirming, isSuccess, error }
}

export function useRevokeAccess() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function revoke(
    registryAddress: Address,
    recordId: `0x${string}`,
    verifier: Address,
  ) {
    writeContract({
      address: registryAddress,
      abi: transcriptRegistryAbi,
      functionName: "revokeAccess",
      args: [recordId, verifier],
      chainId: CHAIN.id,
    })
  }

  return { revoke, hash, isPending, isConfirming, isSuccess, error }
}

export function useVerifyTranscript() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function verify(
    registryAddress: Address,
    recordId: `0x${string}`,
    fileHash: `0x${string}`,
  ) {
    writeContract({
      address: registryAddress,
      abi: transcriptRegistryAbi,
      functionName: "verifyTranscript",
      args: [recordId, fileHash],
      chainId: CHAIN.id,
    })
  }

  return { verify, hash, isPending, isConfirming, isSuccess, error }
}

export function useUpdateTranscriptStatus() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function updateStatus(
    registryAddress: Address,
    recordId: `0x${string}`,
    status: number,
    reason: string,
  ) {
    writeContract({
      address: registryAddress,
      abi: transcriptRegistryAbi,
      functionName: "updateTranscriptStatus",
      args: [recordId, status, reason],
      chainId: CHAIN.id,
    })
  }

  return { updateStatus, hash, isPending, isConfirming, isSuccess, error }
}

