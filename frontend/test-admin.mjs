import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.drpc.org') // Base Sepolia RPC from root .env
})

const factoryAddress = '0xC47F6F55C968b7c47ec011EB3BcD76c944a937ad'
const platformAdminAbi = [{
  type: 'function',
  name: 'platformAdmin',
  inputs: [],
  outputs: [{ type: 'address' }],
  stateMutability: 'view'
}]

async function main() {
  try {
    const code = await client.getBytecode({
      address: factoryAddress
    })
    console.log('BASE SEPOLIA BYTECODE FOR 0xC47F:', code ? code.substring(0, 100) + '...' : 'null')
    
    if (code) {
      const admin = await client.readContract({
        address: factoryAddress,
        abi: platformAdminAbi,
        functionName: 'platformAdmin'
      })
      console.log('ON-CHAIN PLATFORM ADMIN ADDRESS ON BASE SEPOLIA:', admin)
    }
  } catch (err) {
    console.error('Error on Base Sepolia:', err.message)
  }
}

main()
