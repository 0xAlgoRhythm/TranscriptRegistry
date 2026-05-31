import { pgTable, serial, integer, text, boolean, timestamp, jsonb, bigint } from "drizzle-orm/pg-core"

export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").unique().notNull(),
  name: text("name").notNull(),
  contractAddr: text("contract_addr").notNull(),
  registrar: text("registrar").notNull(),
  deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").default(true),
  txHash: text("tx_hash"),
  blockNumber: bigint("block_number", { mode: "bigint" }),
})

export const transcripts = pgTable("transcripts", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").unique().notNull(),
  studentHash: text("student_hash").notNull(),
  metadataCid: text("metadata_cid").notNull(),
  fileHash: text("file_hash").notNull(),
  issuer: text("issuer").notNull(),
  registryAddr: text("registry_addr").notNull(),
  universityId: integer("university_id").references(() => universities.universityId),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  status: text("status").default("Active"), // Active | Revoked | Suspended
  txHash: text("tx_hash"),
  blockNumber: bigint("block_number", { mode: "bigint" }),
})

export const transcriptStatusHistory = pgTable("transcript_status_history", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").references(() => transcripts.recordId),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  reason: text("reason"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull(),
  txHash: text("tx_hash"),
})

export const accessGrants = pgTable("access_grants", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull(),
  verifier: text("verifier").notNull(),
  student: text("student").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").default(true),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  grantTx: text("grant_tx"),
  revokeTx: text("revoke_tx"),
})

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull(),
  verifier: text("verifier").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
  txHash: text("tx_hash"),
  blockNumber: bigint("block_number", { mode: "bigint" }),
})

export const ipfsUploads = pgTable("ipfs_uploads", {
  id: serial("id").primaryKey(),
  recordId: text("record_id"),
  cid: text("cid").unique().notNull(),
  fileHash: text("file_hash").notNull(),
  studentHash: text("student_hash").notNull(),
  universityName: text("university_name").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull(),
  metadataJson: jsonb("metadata_json").notNull(),
})

export const indexerState = pgTable("indexer_state", {
  chainId: integer("chain_id").primaryKey(),
  lastBlock: bigint("last_block", { mode: "bigint" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
})
