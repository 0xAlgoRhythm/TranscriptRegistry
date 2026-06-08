import { db } from '../db/connection.js';
import { students, transcripts, ipfsUploads } from '../db/schema.js';
async function main() {
    try {
        console.log('=== STUDENTS ===');
        const allStudents = await db.select().from(students);
        console.log(JSON.stringify(allStudents, null, 2));
        console.log('=== TRANSCRIPTS ===');
        const allTranscripts = await db.select().from(transcripts);
        console.log(JSON.stringify(allTranscripts, null, 2));
        console.log('=== IPFS UPLOADS ===');
        const allIpfs = await db.select().from(ipfsUploads).limit(10);
        console.log(JSON.stringify(allIpfs, null, 2));
    }
    catch (err) {
        console.error('Error querying DB:', err);
    }
    finally {
        process.exit(0);
    }
}
main();
