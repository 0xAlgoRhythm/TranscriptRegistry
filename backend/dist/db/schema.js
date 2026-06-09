import { pgTable, serial, integer, text, boolean, timestamp, jsonb, bigint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
export const universities = pgTable("universities", {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").unique().notNull(),
    name: text("name").notNull(),
    contractAddr: text("contract_addr").notNull(),
    registrar: text("registrar").notNull(),
    registrarEmail: text("registrar_email"),
    deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").default(true),
    logoUrl: text("logo_url"),
    stampUrl: text("stamp_url"),
    txHash: text("tx_hash"),
    blockNumber: bigint("block_number", { mode: "bigint" }),
});
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
    status: text("status").default("Active"), // Active | Revoked | Amended
    txHash: text("tx_hash"),
    blockNumber: bigint("block_number", { mode: "bigint" }),
});
export const transcriptStatusHistory = pgTable("transcript_status_history", {
    id: serial("id").primaryKey(),
    recordId: text("record_id").references(() => transcripts.recordId),
    oldStatus: text("old_status").notNull(),
    newStatus: text("new_status").notNull(),
    reason: text("reason"),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull(),
    txHash: text("tx_hash"),
});
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
});
export const verifications = pgTable("verifications", {
    id: serial("id").primaryKey(),
    recordId: text("record_id").notNull(),
    verifier: text("verifier").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    txHash: text("tx_hash"),
    blockNumber: bigint("block_number", { mode: "bigint" }),
});
export const ipfsUploads = pgTable("ipfs_uploads", {
    id: serial("id").primaryKey(),
    recordId: text("record_id"),
    cid: text("cid").unique().notNull(),
    fileHash: text("file_hash").notNull(),
    studentHash: text("student_hash").notNull(),
    universityName: text("university_name").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull(),
    metadataJson: jsonb("metadata_json").notNull(),
});
export const indexerState = pgTable("indexer_state", {
    chainId: integer("chain_id").primaryKey(),
    lastBlock: bigint("last_block", { mode: "bigint" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
export const students = pgTable("students", {
    id: serial("id").primaryKey(),
    walletAddress: text("wallet_address").unique(),
    fullName: text("full_name").notNull(),
    studentId: text("student_id").notNull(),
    universityId: integer("university_id").references(() => universities.universityId).notNull(),
    status: text("status").default("pending").notNull(), // pending | approved | rejected
    email: text("email").notNull(),
    approvalToken: text("approval_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
    actionAt: timestamp("action_at", { withTimezone: true }),
});
export const systemAuditLogs = pgTable("system_audit_logs", {
    id: serial("id").primaryKey(),
    actorType: text("actor_type").notNull(), // 'admin' | 'registrar' | 'system'
    actorAddress: text("actor_address").notNull(),
    action: text("action").notNull(),
    details: text("details"),
    timestamp: timestamp("timestamp", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
});
export const registrarEmails = pgTable("registrar_emails", {
    id: serial("id").primaryKey(),
    txHash: text("tx_hash").unique().notNull(),
    email: text("email").notNull(),
});
export const governanceRequests = pgTable("governance_requests", {
    id: serial("id").primaryKey(),
    type: text("type").notNull(), // 'email' | 'wallet'
    universityId: integer("university_id").notNull(),
    contractAddr: text("contract_addr").notNull(),
    currentValue: text("current_value").notNull(),
    newValue: text("new_value").notNull(),
    status: text("status").default("pending").notNull(), // 'pending' | 'approved' | 'rejected'
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
    actionAt: timestamp("action_at", { withTimezone: true }),
});
export const publicAccessRequests = pgTable("public_access_requests", {
    id: serial("id").primaryKey(),
    recordId: text("record_id").notNull(),
    requesterName: text("requester_name").notNull(),
    requesterOrg: text("requester_org").notNull(),
    requesterEmail: text("requester_email").notNull(),
    status: text("status").default("pending").notNull(), // pending | approved | rejected
    token: text("token").unique().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
});
export const issuedTokens = pgTable("issued_tokens", {
    id: serial("id").primaryKey(),
    token: text("token").unique().notNull(),
    institutionName: text("institution_name").notNull(),
    issuerAddress: text("issuer_address").notNull(),
    role: text("role").notNull(), // admin | registrar
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
});
export const transcriptRequests = pgTable("transcript_requests", {
    id: serial("id").primaryKey(),
    studentWallet: text("student_wallet").notNull(),
    studentName: text("student_name").notNull(),
    studentId: text("student_id").notNull(),
    email: text("email").notNull(),
    universityId: integer("university_id").references(() => universities.universityId).notNull(),
    status: text("status").default("pending").notNull(), // pending | completed
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
});
export const institutions = pgTable("institutions", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    walletAddress: text("wallet_address").unique().notNull(),
    status: text("status").default("pending").notNull(), // pending | approved | rejected
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
    actionAt: timestamp("action_at", { withTimezone: true }),
    actionBy: text("action_by"),
});
export const institutionRequests = pgTable("institution_requests", {
    id: serial("id").primaryKey(),
    institutionId: integer("institution_id").references(() => institutions.id).notNull(),
    studentName: text("student_name").notNull(),
    studentId: text("student_id").notNull(),
    studentEmail: text("student_email").notNull(),
    status: text("status").default("pending").notNull(), // pending | approved | rejected
    recordId: text("record_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql `CURRENT_TIMESTAMP`).notNull(),
    actionAt: timestamp("action_at", { withTimezone: true }),
});
