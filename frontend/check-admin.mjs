import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co')
})

async function run() {
  try {
    const admin = await client.readContract({
      address: '0x9632D1a3194947CD888b37020261952A6aC52613',
      abi: [
        {
          type: 'function',
          name: 'platformAdmin',
          inputs: [],
          outputs: [{ type: 'address' }],
          stateMutability: 'view'
        }
      ],
      functionName: 'platformAdmin'
    })
    console.log('PLATFORM ADMIN REGISTERED ON CONTRACT:', admin)
  } catch (err) {
    console.error('Error:', err)
  }
}
run()
