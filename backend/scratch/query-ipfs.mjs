import { db } from '../dist/db/connection.js'
import { ipfsUploads } from '../dist/db/schema.js'

async function main() {
  try {
    const list = await db.select().from(ipfsUploads)
    console.log('IPFS UPLOADS:', JSON.stringify(list, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}
main()
