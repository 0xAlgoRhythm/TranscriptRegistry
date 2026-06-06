import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("No DATABASE_URL");
    process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client);
const universities = pgTable('universities', {
    universityId: serial('university_id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    registrar: varchar('registrar', { length: 42 }).notNull(),
    contractAddr: varchar('contract_addr', { length: 42 }).notNull(),
    isActive: boolean('is_active').default(true),
    deployedAt: timestamp('deployed_at').defaultNow()
});
async function main() {
    console.log("Fetching universities...");
    const allUnis = await db.select().from(universities).orderBy(desc(universities.universityId));
    // Keep track of names we've already seen (since we ordered by desc, the first one is the newest)
    const seenNames = new Set();
    for (const uni of allUnis) {
        if (!seenNames.has(uni.name)) {
            // First time seeing this name, it's the newest one. Ensure it's active.
            seenNames.add(uni.name);
            if (!uni.isActive) {
                console.log(`Activating latest ${uni.name} (ID: ${uni.universityId})`);
                await db.update(universities).set({ isActive: true }).where(eq(universities.universityId, uni.universityId));
            }
        }
        else {
            // We've already seen a newer deployment for this name. Deactivate this older one.
            if (uni.isActive) {
                console.log(`Deactivating older ${uni.name} (ID: ${uni.universityId})`);
                await db.update(universities).set({ isActive: false }).where(eq(universities.universityId, uni.universityId));
            }
        }
    }
    console.log("Cleanup complete!");
    process.exit(0);
}
main().catch(console.error);
