import { createPublicClient, http, formatEther } from 'viem'
import { sepolia } from 'viem/chains'

const client = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co')
})

async function check() {
  const address = '0x6912bC40f1446Dd8A22B1F797f2c09dca3CeB88c'
  try {
    const balance = await client.getBalance({ address })
    console.log(`Balance for ${address}: ${formatEther(balance)} ETH`)
  } catch (err) {
    console.error('Failed to get balance:', err)
  }
}

check()
