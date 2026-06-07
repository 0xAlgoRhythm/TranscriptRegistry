"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { type Address } from "viem"
import { universityFactoryAbi, CONTRACT_ADDRESSES } from "@/lib/contracts"

const factoryAddress = CONTRACT_ADDRESSES.universityFactory

export function usePlatformStats() {
  return useReadContract({
    address: factoryAddress,
    abi: universityFactoryAbi,
    functionName: "getPlatformStats",
    query: { enabled: !!factoryAddress },
  })
}

export function usePlatformAdmin() {
  return useReadContract({
    address: factoryAddress,
    abi: universityFactoryAbi,
    functionName: "platformAdmin",
    query: { enabled: !!factoryAddress },
  })
}

export function useUniversityCount() {
  return useReadContract({
    address: factoryAddress,
    abi: universityFactoryAbi,
    functionName: "universityCount",
    query: { enabled: !!factoryAddress },
  })
}

export function useUniversity(universityId: bigint) {
  return useReadContract({
    address: factoryAddress,
    abi: universityFactoryAbi,
    functionName: "getUniversity",
    args: [universityId],
    query: { enabled: !!factoryAddress },
  })
}

export function useActiveUniversities(offset: bigint, limit: bigint) {
  return useReadContract({
    address: factoryAddress,
    abi: universityFactoryAbi,
    functionName: "getActiveUniversities",
    args: [offset, limit],
    query: { enabled: !!factoryAddress },
  })
}

export function useIsUniversityContract(address: Address) {
  return useReadContract({
    address: factoryAddress,
    abi: universityFactoryAbi,
    functionName: "isUniversityContract",
    args: [address],
    query: { enabled: !!factoryAddress && !!address },
  })
}

export function useDeployUniversity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function deploy(universityName: string, registrar: Address) {
    writeContract({
      address: factoryAddress,
      abi: universityFactoryAbi,
      functionName: "deployUniversityContract",
      args: [universityName, registrar],
    })
  }

  return { deploy, hash, isPending, isConfirming, isSuccess, error }
}

export function useDeactivateUniversity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function deactivate(universityId: bigint, reason: string) {
    writeContract({
      address: factoryAddress,
      abi: universityFactoryAbi,
      functionName: "deactivateUniversity",
      args: [universityId, reason],
    })
  }

  return { deactivate, hash, isPending, isConfirming, isSuccess, error }
}

export function useReactivateUniversity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function reactivate(universityId: bigint) {
    writeContract({
      address: factoryAddress,
      abi: universityFactoryAbi,
      functionName: "reactivateUniversity",
      args: [universityId],
    })
  }

  return { reactivate, hash, isPending, isConfirming, isSuccess, error }
}
