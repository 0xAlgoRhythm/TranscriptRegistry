// In production, NEXT_PUBLIC_API_URL is intentionally empty ("").
// All /api/* requests are relative and get proxied by Vercel → Render backend.
// In local dev, falls back to localhost:3001.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : ""

export async function fetchPlatformStats() {
  const res = await fetch(`${API_URL}/api/stats/platform`)
  if (!res.ok) throw new Error("Failed to fetch platform stats")
  return res.json()
}

export async function fetchUniversities() {
  const res = await fetch(`${API_URL}/api/universities`)
  if (!res.ok) throw new Error("Failed to fetch universities")
  return res.json()
}

export async function fetchUniversityByAddress(address: string) {
  const res = await fetch(`${API_URL}/api/universities/by-address/${address}`)
  if (!res.ok) throw new Error("Failed to fetch university details")
  return res.json()
}

export async function fetchTranscriptsByStudent(studentHash: string) {
  const res = await fetch(`${API_URL}/api/transcripts/by-student/${studentHash}`)
  if (!res.ok) throw new Error("Failed to fetch student transcripts")
  return res.json()
}

export async function fetchTranscriptsByRegistrar(registrarAddress: string) {
  const res = await fetch(`${API_URL}/api/transcripts/by-registrar/${registrarAddress}`)
  if (!res.ok) throw new Error("Failed to fetch registrar transcripts")
  return res.json()
}

export async function uploadToIPFS(
  fileHash: string,
  studentAddress: string,
  universityName: string,
  registryAddress: string,
  token: string
) {
  const res = await fetch(`${API_URL}/api/ipfs/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileHash,
      studentAddress,
      universityName,
      registryAddress,
    }),
  })
  if (!res.ok) throw new Error("Failed to upload to IPFS")
  return res.json()
}
