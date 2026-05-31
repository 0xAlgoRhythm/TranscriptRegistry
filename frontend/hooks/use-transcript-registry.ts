"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { type Address } from "viem"
import { transcriptRegistryAbi } from "@/lib/contracts"

export function useRegistryStats(registryAddress: Address) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "getContractStats",
    query: { enabled: !!registryAddress },
  })
}

export function useUniversityName(registryAddress: Address) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "universityName",
    query: { enabled: !!registryAddress },
  })
}

export function useRegistrar(registryAddress: Address) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "registrar",
    query: { enabled: !!registryAddress },
  })
}

export function useTranscript(registryAddress: Address, recordId: `0x${string}`) {
  return useReadContract({
    address: registryAddress,
    abi: transcriptRegistryAbi,
    functionName: "getTranscript",
    args: [recordId],
    query: { enabled: !!registryAddress && !!recordId },
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
    query: { enabled: !!registryAddress && !!studentHashValue },
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
    query: { enabled: !!registryAddress && !!recordId && !!verifier },
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
    query: { enabled: !!registryAddress && !!recordId && !!verifier },
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
  ) {
    writeContract({
      address: registryAddress,
      abi: transcriptRegistryAbi,
      functionName: "registerTranscript",
      args: [studentHashVal, metadataCID, fileHash],
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
  ) {
    writeContract({
      address: registryAddress,
      abi: transcriptRegistryAbi,
      functionName: "updateTranscriptStatus",
      args: [recordId, status],
    })
  }

  return { updateStatus, hash, isPending, isConfirming, isSuccess, error }
}

