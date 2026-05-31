import { z } from "zod"
import { isAddress } from "viem"

// Helper for Ethereum address validation in Zod
const ethAddressSchema = z.string().refine((val) => isAddress(val), {
  message: "Invalid Ethereum address format",
})

export const deployUniversitySchema = z.model = z.object({
  name: z.string().min(2, "University name must be at least 2 characters"),
  symbol: z.string().min(2, "Symbol must be at least 2 characters").max(10, "Symbol must be 10 characters or less"),
  adminAddress: ethAddressSchema,
})

export const issueTranscriptSchema = z.object({
  studentAddress: ethAddressSchema,
  studentName: z.string().min(2, "Student name is required"),
  studentId: z.string().min(1, "Student ID/Email is required"),
  major: z.string().min(2, "Major/Degree name is required"),
  gpa: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0 && num <= 4.0
  }, {
    message: "GPA must be a number between 0.0 and 4.0",
  }),
  graduationYear: z.string().refine((val) => {
    const num = parseInt(val, 10)
    return !isNaN(num) && num >= 1900 && num <= 2100
  }, {
    message: "Enter a valid graduation year (e.g. 2026)",
  }),
  ipfsMetadataCID: z.string().optional(),
})

export const grantAccessSchema = z.object({
  verifierAddress: ethAddressSchema,
  expiresInDays: z.string().refine((val) => {
    const num = parseInt(val, 10)
    return !isNaN(num) && num > 0
  }, {
    message: "Expiration must be greater than 0 days",
  }),
})

export const verifyTranscriptSchema = z.object({
  transcriptHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
    message: "Must be a valid 32-byte hex hash (0x followed by 64 hex characters)",
  }),
})

export type DeployUniversityInput = z.infer<typeof deployUniversitySchema>
export type IssueTranscriptInput = z.infer<typeof issueTranscriptSchema>
export type GrantAccessInput = z.infer<typeof grantAccessSchema>
export type VerifyTranscriptInput = z.infer<typeof verifyTranscriptSchema>
