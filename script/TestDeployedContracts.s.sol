// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UniversityFactoryBeacon.sol";
import "../src/TranscriptRegistryUpgradeable.sol";

/**
 * @title TestRegisterTranscript
 * @dev Test script to register a real transcript on the deployed contract
 */
contract TestRegisterTranscript is Script {
    
    function run() external {
        // Load environment variables
        string memory pkString = vm.envString("REGISTRAR_PRIVATE_KEY");
        uint256 registrarPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        address studentAddress = vm.envAddress("TEST_STUDENT_ADDRESS");
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(registryAddress);
        
        console.log("==============================================");
        console.log("TESTING TRANSCRIPT REGISTRATION ON BLOCKCHAIN");
        console.log("==============================================");
        console.log("Registry:", registryAddress);
        console.log("University:", registry.universityName());
        console.log("Student:", studentAddress);
        console.log("==============================================");
        
        // Test data (replace with real data later)
        bytes32 studentHash = keccak256(abi.encodePacked(studentAddress));
        
        // These will be replaced with actual Pinata IPFS CIDs
        string memory metadataCID = "QmTestMetadata123456789ABCDEF"; // Placeholder
        bytes32 fileHash = keccak256("test_transcript_pdf_content"); // Placeholder
        
        console.log("\nTest Data:");
        console.log("Student Hash:", vm.toString(studentHash));
        console.log("Metadata CID:", metadataCID);
        console.log("File Hash:", vm.toString(fileHash));
        
        vm.startBroadcast(registrarPrivateKey);
        
        console.log("\nRegistering transcript on blockchain...");
        bytes32 recordId = registry.registerTranscript(
            studentHash,
            metadataCID,
            fileHash
        );
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("TRANSCRIPT REGISTERED SUCCESSFULLY!");
        console.log("==============================================");
        console.log("Record ID:", vm.toString(recordId));
        
        // Verify registration
        (
            bytes32 retrievedStudentHash,
            string memory retrievedMetadataCID,
            bytes32 retrievedFileHash,
            address issuer,
            uint256 timestamp,
            
        ) = registry.getTranscript(recordId);
        
        // Get status separately to avoid enum type issues
        uint8 statusValue;
        (,,,,,statusValue) = registry.getTranscript(recordId);
        
        console.log("\nVerification:");
        console.log("Student Hash Match:", retrievedStudentHash == studentHash);
        console.log("Metadata CID:", retrievedMetadataCID);
        console.log("File Hash Match:", retrievedFileHash == fileHash);
        console.log("Issuer:", issuer);
        console.log("Timestamp:", timestamp);
        console.log("Status (0=Active, 1=Revoked, 2=Amended):", statusValue);
        
        console.log("\nView on Etherscan:");
        console.log("https://sepolia.etherscan.io/address/", registryAddress);
        console.log("==============================================");
    }
}

/**
 * @title TestGrantAccessUpgradeable
 * @dev Test script for student to grant access to a verifier (Upgradeable version)
 */
contract TestGrantAccessUpgradeable is Script {
    
    function run() external {
        // Load from environment
        address studentAddress = vm.envAddress("TEST_STUDENT_ADDRESS");
        string memory studentPkString = vm.envString("TEST_STUDENT_PRIVATE_KEY");
        uint256 studentPrivateKey = vm.parseUint(string(abi.encodePacked("0x", studentPkString)));
        
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        address verifierAddress = vm.envAddress("TEST_VERIFIER_ADDRESS");
        bytes32 recordId = bytes32(vm.envBytes32("RECORD_ID")); // From previous registration
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(registryAddress);
        
        console.log("==============================================");
        console.log("TESTING ACCESS GRANT ON BLOCKCHAIN");
        console.log("==============================================");
        console.log("Registry:", registryAddress);
        console.log("Student:", studentAddress);
        console.log("Verifier:", verifierAddress);
        console.log("Record ID:", vm.toString(recordId));
        console.log("==============================================");
        
        uint256 duration = 30 days;
        
        vm.startBroadcast(studentPrivateKey);
        
        console.log("\nGranting access to verifier...");
        console.log("Duration:", duration, "seconds (30 days)");
        
        registry.grantAccess(recordId, verifierAddress, duration);
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("ACCESS GRANTED SUCCESSFULLY!");
        console.log("==============================================");
        
        // Verify access
        bool hasAccess = registry.checkAccess(recordId, verifierAddress);
        console.log("Verifier has access:", hasAccess);
        console.log("==============================================");
    }
}

/**
 * @title TestVerifyTranscriptUpgradeable
 * @dev Test script for verifier to verify a transcript (Upgradeable version)
 */
contract TestVerifyTranscriptUpgradeable is Script {
    
    function run() external {
        address verifierAddress = vm.envAddress("TEST_VERIFIER_ADDRESS");
        string memory verifierPkString = vm.envString("TEST_VERIFIER_PRIVATE_KEY");
        uint256 verifierPrivateKey = vm.parseUint(string(abi.encodePacked("0x", verifierPkString)));
        
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        bytes32 recordId = bytes32(vm.envBytes32("RECORD_ID"));
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(registryAddress);
        
        console.log("==============================================");
        console.log("TESTING TRANSCRIPT VERIFICATION ON BLOCKCHAIN");
        console.log("==============================================");
        console.log("Registry:", registryAddress);
        console.log("Verifier:", verifierAddress);
        console.log("Record ID:", vm.toString(recordId));
        console.log("==============================================");
        
        // Get the transcript to verify
        (, , bytes32 fileHash, , , ) = registry.getTranscript(recordId);
        
        console.log("\nFile Hash from blockchain:", vm.toString(fileHash));
        console.log("Verifying transcript...");
        
        vm.startBroadcast(verifierPrivateKey);
        
        bool isValid = registry.verifyTranscript(recordId, fileHash);
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("VERIFICATION COMPLETE!");
        console.log("==============================================");
        console.log("Is Valid:", isValid ? "YES - AUTHENTIC" : "NO - FAKE");
        console.log("==============================================");
        
        // Get stats
        (uint256 totalTranscripts, uint256 totalVerifications, ) = registry.getContractStats();
        console.log("\nContract Statistics:");
        console.log("Total Transcripts:", totalTranscripts);
        console.log("Total Verifications:", totalVerifications);
        console.log("==============================================");
    }
}

/**
 * @title CheckFactoryStatus
 * @dev Check the status of deployed factory and universities
 */
contract CheckFactoryStatus is Script {
    
    function run() external view {
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        
        UniversityFactoryBeacon factory = UniversityFactoryBeacon(factoryAddress);
        
        console.log("==============================================");
        console.log("FACTORY STATUS CHECK");
        console.log("==============================================");
        console.log("Factory:", factoryAddress);
        console.log("Owner:", factory.owner());
        console.log("Implementation:", factory.getImplementation());
        console.log("Beacon:", address(factory.beacon()));
        console.log("==============================================");
        
        (uint256 totalUniversities, uint256 activeCount) = factory.getPlatformStats();
        
        console.log("\nPlatform Statistics:");
        console.log("Total Universities:", totalUniversities);
        console.log("Active Universities:", activeCount);
        console.log("==============================================");
        
        console.log("\nUniversity Details:");
        for (uint256 i = 0; i < totalUniversities; i++) {
            UniversityFactoryBeacon.UniversityInfo memory uni = factory.getUniversity(i);
            
            console.log("\n---");
            console.log("ID:", i);
            console.log("Name:", uni.name);
            console.log("Proxy:", uni.proxyAddress);
            console.log("Registrar:", uni.registrar);
            console.log("Active:", uni.isActive);
            
            // Get registry stats
            TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(uni.proxyAddress);
            console.log("Version:", registry.version());
            console.log("Transcripts:", registry.transcriptCount());
            console.log("Verifications:", registry.verificationCount());
        }
        
        console.log("\n==============================================");
    }
}