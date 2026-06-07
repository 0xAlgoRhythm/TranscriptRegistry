import { db } from './db/connection.js';
import { universities, systemAuditLogs } from './db/schema.js';
async function main() {
    try {
        console.log('=== UNIVERSITIES IN DATABASE ===');
        const unis = await db.select().from(universities);
        console.log(JSON.stringify(unis, null, 2));
        console.log('=== LATEST 10 SYSTEM AUDIT LOGS ===');
        const logs = await db.select().from(systemAuditLogs).limit(10);
        console.log(JSON.stringify(logs, null, 2));
    }
    catch (err) {
        console.error('Error querying DB:', err);
    }
    finally {
        process.exit(0);
    }
}
main();
