import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.drpc.org')
})

const factoryAddress = '0xC47F6F55C968b7c47ec011EB3BcD76c944a937ad'
const implSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

async function main() {
  try {
    const val = await client.getStorageAt({
      address: factoryAddress,
      slot: implSlot
    })
    console.log('BASE SEPOLIA IMPLEMENTATION SLOT VALUE:', val)
  } catch (err) {
    console.error('Error getting storage:', err.message)
  }
}

main()
