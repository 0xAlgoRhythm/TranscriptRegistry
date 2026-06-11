const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');

const client = createPublicClient({
  chain: sepolia,
  transport: http()
});

const contractAddress = "0x0487722e60f437f5588bc97501177d1384c84e19";

const abi = [
  {
    "inputs": [],
    "name": "registrar",
    "outputs": [{"type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isActive",
    "outputs": [{"type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  try {
    const registrar = await client.readContract({
      address: contractAddress,
      abi,
      functionName: 'registrar'
    });
    console.log("Registrar:", registrar);
    
    const isActive = await client.readContract({
      address: contractAddress,
      abi,
      functionName: 'isActive'
    });
    console.log("Is Active:", isActive);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main();
