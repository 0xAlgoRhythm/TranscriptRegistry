import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co')
})

const factoryAddress = '0x9632D1a3194947CD888b37020261952A6aC52613'
const platformAdminAbi = [{
  type: 'function',
  name: 'platformAdmin',
  inputs: [],
  outputs: [{ type: 'address' }],
  stateMutability: 'view'
}]

async function main() {
  try {
    const admin = await client.readContract({
      address: factoryAddress,
      abi: platformAdminAbi,
      functionName: 'platformAdmin'
    })
    console.log('ON-CHAIN PLATFORM ADMIN ADDRESS:', admin)
  } catch (err) {
    console.error('Error querying platform admin:', err)
  }
}

main()
