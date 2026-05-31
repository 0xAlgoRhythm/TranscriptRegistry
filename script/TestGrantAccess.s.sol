// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TranscriptRegistry.sol";

contract TestGrantAccess is Script {
    function run() external {
        // Load environment variables
        address studentAddress = vm.envAddress("TEST_STUDENT_ADDRESS");
        uint256 studentPrivateKey = vm.envUint("TEST_STUDENT_PRIVATE_KEY");
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        address verifierAddress = vm.envAddress("TEST_VERIFIER_ADDRESS");
        
        // Use the Record ID from the previous successful registration
        bytes32 recordId = 0xf49acb04f4b936b04fcfd6e981a985ed7f2500c9bfc932cc44dcdd2a0ac134e8;
        
        console.log("==============================================");
        console.log("TESTING ACCESS GRANT ON BLOCKCHAIN");
        console.log("==============================================");
        console.log("Registry:", registryAddress);
        console.log("Student:", studentAddress);
        console.log("Verifier:", verifierAddress);
        console.log("Record ID:", vm.toString(recordId));
        console.log("==============================================");
        
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        
        // Start broadcasting transactions as the student
        vm.startBroadcast(studentPrivateKey);
        
        console.log("\nGranting access to verifier...");
        
        // Grant access to the verifier for 30 days (2592000 seconds)
        uint256 duration = 30 days;
        registry.grantAccess(recordId, verifierAddress, duration);
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("ACCESS GRANTED SUCCESSFULLY!");
        console.log("==============================================");
        
        // Verify the access was granted using checkAccess instead of hasAccess
        bool hasAccess = registry.checkAccess(recordId, verifierAddress);
        console.log("\nVerification:");
        console.log("  Verifier has access:", hasAccess);
        console.log("==============================================");
    }
}

contract TestVerifyTranscript is Script {
    function run() external {
        // Load environment variables
        address verifierAddress = vm.envAddress("TEST_VERIFIER_ADDRESS");
        uint256 verifierPrivateKey = vm.envUint("TEST_VERIFIER_PRIVATE_KEY");
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        
        // Use the Record ID from the previous successful registration
        bytes32 recordId = 0xf49acb04f4b936b04fcfd6e981a985ed7f2500c9bfc932cc44dcdd2a0ac134e8;
        
        console.log("==============================================");
        console.log("TESTING TRANSCRIPT VERIFICATION");
        console.log("==============================================");
        console.log("Registry:", registryAddress);
        console.log("Verifier:", verifierAddress);
        console.log("Record ID:", vm.toString(recordId));
        console.log("==============================================");
        
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        
        // Check if verifier has access using checkAccess
        bool hasAccess = registry.checkAccess(recordId, verifierAddress);
        console.log("\nAccess Check:");
        console.log("  Verifier has access:", hasAccess);
        
        if (!hasAccess) {
            console.log("\nERROR: Verifier does not have access to this record!");
            console.log("Please run TestGrantAccess first.");
            return;
        }
        
        // Get the transcript to get the fileHash
        (
            bytes32 studentHash,
            string memory metadataCID,
            bytes32 fileHash,
            address issuer,
            uint256 timestamp,
            
        ) = registry.getTranscript(recordId);
        
        console.log("\nTranscript Details Before Verification:");
        console.log("  Student Hash:", vm.toString(studentHash));
        console.log("  Metadata CID:", metadataCID);
        console.log("  File Hash:", vm.toString(fileHash));
        console.log("  Issuer:", issuer);
        console.log("  Timestamp:", timestamp);
        
        // Start broadcasting transactions as the verifier
        vm.startBroadcast(verifierPrivateKey);
        
        console.log("\nVerifying transcript...");
        
        // Verify the transcript with the fileHash
        bool isValid = registry.verifyTranscript(recordId, fileHash);
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        if (isValid) {
            console.log("TRANSCRIPT VERIFIED SUCCESSFULLY!");
        } else {
            console.log("TRANSCRIPT VERIFICATION FAILED!");
        }
        console.log("==============================================");
        
        // Get the updated stats
        (uint256 totalTranscripts, uint256 totalVerifications, bool contractActive) = registry.getContractStats();
        
        console.log("\nContract Statistics:");
        console.log("  Total Transcripts:", totalTranscripts);
        console.log("  Total Verifications:", totalVerifications);
        console.log("  Contract Active:", contractActive);
        console.log("==============================================");
    }
}

contract TestRevokeAccess is Script {
    function run() external {
        // Load environment variables
        address studentAddress = vm.envAddress("TEST_STUDENT_ADDRESS");
        uint256 studentPrivateKey = vm.envUint("TEST_STUDENT_PRIVATE_KEY");
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        address verifierAddress = vm.envAddress("TEST_VERIFIER_ADDRESS");
        
        // Use the Record ID from the previous successful registration
        bytes32 recordId = 0xf49acb04f4b936b04fcfd6e981a985ed7f2500c9bfc932cc44dcdd2a0ac134e8;
        
        console.log("==============================================");
        console.log("TESTING ACCESS REVOCATION");
        console.log("==============================================");
        console.log("Registry:", registryAddress);
        console.log("Student:", studentAddress);
        console.log("Verifier:", verifierAddress);
        console.log("Record ID:", vm.toString(recordId));
        console.log("==============================================");
        
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        
        // Check current access using checkAccess
        bool hasAccessBefore = registry.checkAccess(recordId, verifierAddress);
        console.log("\nBefore Revocation:");
        console.log("  Verifier has access:", hasAccessBefore);
        
        // Start broadcasting transactions as the student
        vm.startBroadcast(studentPrivateKey);
        
        console.log("\nRevoking access from verifier...");
        
        // Revoke access from the verifier
        registry.revokeAccess(recordId, verifierAddress);
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("ACCESS REVOKED SUCCESSFULLY!");
        console.log("==============================================");
        
        // Verify the access was revoked using checkAccess
        bool hasAccessAfter = registry.checkAccess(recordId, verifierAddress);
        console.log("\nAfter Revocation:");
        console.log("  Verifier has access:", hasAccessAfter);
        console.log("==============================================");
    }
}