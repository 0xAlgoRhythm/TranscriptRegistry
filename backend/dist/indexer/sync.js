import { createPublicClient, http, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";
import { db } from "../db/connection.js";
import { universities, transcripts, transcriptStatusHistory, indexerState } from "../db/schema.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.drpc.org";
const FACTORY_ADDRESS = (process.env.FACTORY_ADDRESS || "0x3828Ddf3dC3bdB4f9F838e498e4B5536bb74230e");
const START_BLOCK = 6200000n; // Safe Sepolia start block for the deployed contract
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
});
// Syncer logic
export async function startIndexer() {
    console.log(`Starting indexer target contract Factory: ${FACTORY_ADDRESS} on Sepolia RPC: ${RPC_URL}`);
    // Initialize or fetch indexer state
    let currentBlock = START_BLOCK;
    const stateRecord = await db.query.indexerState.findFirst({
        where: eq(indexerState.chainId, sepolia.id),
    });
    if (stateRecord) {
        currentBlock = stateRecord.lastBlock + 1n;
    }
    else {
        await db.insert(indexerState).values({
            chainId: sepolia.id,
            lastBlock: START_BLOCK,
            updatedAt: new Date(),
        });
    }
    // Define simple loop for logs indexing
    const indexLoop = async () => {
        try {
            const latestBlock = await publicClient.getBlockNumber();
            if (currentBlock > latestBlock) {
                // Wait 12 seconds for next block
                setTimeout(indexLoop, 12000);
                return;
            }
            // Fetch logs in chunks of 5000 blocks to prevent RPC limit issues
            const toBlock = currentBlock + 5000n > latestBlock ? latestBlock : currentBlock + 5000n;
            console.log(`Indexing logs from block ${currentBlock} to ${toBlock}...`);
            // 1. Fetch UniversityDeployed events from Factory
            const factoryLogs = await publicClient.getLogs({
                address: FACTORY_ADDRESS,
                event: parseAbiItem("event UniversityDeployed(uint256 indexed universityId, address indexed contractAddress, string universityName, address indexed registrar, uint256 timestamp)"),
                fromBlock: currentBlock,
                toBlock: toBlock,
            });
            for (const log of factoryLogs) {
                const { universityId, contractAddress, universityName, registrar, timestamp } = log.args;
                if (universityId !== undefined && contractAddress && registrar && universityName) {
                    console.log(`[EVENT] Deployed university: ${universityName} at registry ${contractAddress}`);
                    await db.insert(universities).values({
                        universityId: Number(universityId),
                        name: universityName,
                        contractAddr: contractAddress.toLowerCase(),
                        registrar: registrar.toLowerCase(),
                        deployedAt: new Date(Number(timestamp) * 1000),
                        isActive: true,
                        txHash: log.transactionHash,
                        blockNumber: log.blockNumber,
                    }).onConflictDoNothing();
                }
            }
            // Get list of all deployed registry addresses to fetch transcript event logs
            const allRegistries = await db.select({ contractAddr: universities.contractAddr }).from(universities);
            const registryAddresses = allRegistries.map((r) => r.contractAddr);
            if (registryAddresses.length > 0) {
                // 2. Fetch TranscriptRegistered events from registries
                const registeredLogs = await publicClient.getLogs({
                    address: registryAddresses,
                    event: parseAbiItem("event TranscriptRegistered(bytes32 indexed recordId, bytes32 indexed studentHash, string metadataCID, bytes32 fileHash, address indexed issuer, uint256 timestamp)"),
                    fromBlock: currentBlock,
                    toBlock: toBlock,
                });
                for (const log of registeredLogs) {
                    const { recordId, studentHash, metadataCID, fileHash, issuer, timestamp } = log.args;
                    if (recordId && studentHash && metadataCID && fileHash && issuer && timestamp) {
                        const registryAddr = log.address.toLowerCase();
                        const uni = await db.query.universities.findFirst({
                            where: eq(universities.contractAddr, registryAddr)
                        });
                        console.log(`[EVENT] Registered transcript for student hash: ${studentHash} at registry: ${registryAddr}`);
                        await db.insert(transcripts).values({
                            recordId: recordId,
                            studentHash: studentHash,
                            metadataCid: metadataCID,
                            fileHash: fileHash,
                            issuer: issuer.toLowerCase(),
                            registryAddr: registryAddr,
                            universityId: uni ? uni.universityId : null,
                            issuedAt: new Date(Number(timestamp) * 1000),
                            status: "Active",
                            txHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                        }).onConflictDoNothing();
                    }
                }
                // 3. Fetch TranscriptStatusUpdated events (suspensions/revocations)
                const statusLogs = await publicClient.getLogs({
                    address: registryAddresses,
                    event: parseAbiItem("event TranscriptStatusUpdated(bytes32 indexed recordId, uint8 oldStatus, uint8 newStatus, string reason)"),
                    fromBlock: currentBlock,
                    toBlock: toBlock,
                });
                const statusMap = {
                    0: "Active",
                    1: "Revoked",
                    2: "Amended",
                };
                for (const log of statusLogs) {
                    const { recordId, oldStatus, newStatus, reason } = log.args;
                    if (recordId && oldStatus !== undefined && newStatus !== undefined) {
                        const oldStatusStr = statusMap[oldStatus] || "Unknown";
                        const newStatusStr = statusMap[newStatus] || "Unknown";
                        console.log(`[EVENT] Updated status of transcript ${recordId}: ${oldStatusStr} -> ${newStatusStr}`);
                        // Update transcript entry
                        await db.update(transcripts)
                            .set({ status: newStatusStr })
                            .where(eq(transcripts.recordId, recordId));
                        // Add to status updates history table
                        await db.insert(transcriptStatusHistory).values({
                            recordId: recordId,
                            oldStatus: oldStatusStr,
                            newStatus: newStatusStr,
                            reason: reason || "",
                            changedAt: new Date(),
                            txHash: log.transactionHash,
                        });
                    }
                }
            }
            // Update local indexer current block state
            currentBlock = toBlock + 1n;
            await db.update(indexerState)
                .set({ lastBlock: toBlock, updatedAt: new Date() })
                .where(eq(indexerState.chainId, sepolia.id));
            // Trigger next execution chunk
            setTimeout(indexLoop, 3000);
        }
        catch (error) {
            console.error("Indexer encountered an error sync loop:", error);
            setTimeout(indexLoop, 15000);
        }
    };
    // Spawn syncer
    indexLoop();
}
// Enable running direct from cmd
if (process.argv[1] === __filename) {
    startIndexer().catch(console.error);
}
