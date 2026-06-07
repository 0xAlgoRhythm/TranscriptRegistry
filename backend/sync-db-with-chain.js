import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

const connectionString = process.env.DATABASE_URL
const factoryAddress = '0x9632D1a3194947CD888b37020261952A6aC52613'

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co')
})

const factoryAbi = [
  {
    type: 'function',
    name: 'universityCount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUniversity',
    inputs: [{ name: 'universityId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'contractAddress', type: 'address' },
          { name: 'registrar', type: 'address' },
          { name: 'deployedAt', type: 'uint256' },
          { name: 'isActive', type: 'bool' }
        ]
      }
    ],
    stateMutability: 'view'
  }
]

async function run() {
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env')
    return
  }

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Fetching university count from contract...')
    const count = await client.readContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: 'universityCount'
    })
    console.log(`Contract reported ${count} total universities.`)

    for (let i = 0n; i < count; i++) {
      console.log(`Fetching university ID ${i}...`)
      const info = await client.readContract({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'getUniversity',
        args: [i]
      })

      const { name, contractAddress, registrar, deployedAt, isActive } = info
      console.log(`Found: ${name} (${contractAddress}) | Registrar: ${registrar}`)

      // Check if it exists in the database
      const checkRes = await pool.query('SELECT id FROM universities WHERE university_id = $1', [Number(i)])
      const timestamp = new Date(Number(deployedAt) * 1000)

      if (checkRes.rows.length > 0) {
        // Update
        console.log(`Updating ID ${i} in database...`)
        await pool.query(
          `UPDATE universities 
           SET name = $1, contract_addr = $2, registrar = $3, deployed_at = $4, is_active = $5
           WHERE university_id = $6`,
          [name, contractAddress.toLowerCase(), registrar.toLowerCase(), timestamp, isActive, Number(i)]
        )
      } else {
        // Insert
        console.log(`Inserting ID ${i} into database...`)
        await pool.query(
          `INSERT INTO universities (university_id, name, contract_addr, registrar, deployed_at, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [Number(i), name, contractAddress.toLowerCase(), registrar.toLowerCase(), timestamp, isActive]
        )
      }
    }

    console.log('Database synchronization completed successfully!')
  } catch (err) {
    console.error('Error during synchronization:', err)
  } finally {
    await pool.end()
  }
}

run()
