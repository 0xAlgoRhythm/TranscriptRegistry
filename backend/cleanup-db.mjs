import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL");
  process.exit(1);
}

const client = new Client({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Fetching universities...");
  const res = await client.query('SELECT * FROM universities ORDER BY university_id DESC');
  const allUnis = res.rows;
  
  const seenNames = new Set();
  
  for (const uni of allUnis) {
    if (!seenNames.has(uni.name)) {
      seenNames.add(uni.name);
      if (!uni.is_active) {
        console.log(`Activating latest ${uni.name} (ID: ${uni.university_id})`);
        await client.query('UPDATE universities SET is_active = true WHERE university_id = $1', [uni.university_id]);
      }
    } else {
      if (uni.is_active) {
        console.log(`Deactivating older ${uni.name} (ID: ${uni.university_id})`);
        await client.query('UPDATE universities SET is_active = false WHERE university_id = $1', [uni.university_id]);
      }
    }
  }
  
  console.log("Cleanup complete!");
  await client.end();
}

main().catch(console.error);
