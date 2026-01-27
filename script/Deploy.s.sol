// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UniversityFactory.sol";
import "../src/TranscriptRegistry.sol";

/**
 * @title DeployTranscriptChain
 * @dev Deployment script for TranscriptChain platform
 * @notice This script deploys the UniversityFactory contract and optionally deploys test universities
 */
contract DeployTranscriptChain is Script {
    
    // Deployment addresses will be logged here
    UniversityFactory public factory;
    
    function run() external {
        // Get deployment private key from environment
        // Use vm.envString for private key without 0x prefix
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("TRANSCRIPTCHAIN DEPLOYMENT SCRIPT");
        console.log("==============================================");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("==============================================");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy UniversityFactory
        console.log("\n1. Deploying UniversityFactory...");
        factory = new UniversityFactory();
        console.log("   UniversityFactory deployed at:", address(factory));
        console.log("   Platform Admin:", factory.platformAdmin());
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("==============================================");
        console.log("UniversityFactory:", address(factory));
        console.log("Platform Admin:", factory.platformAdmin());
        console.log("==============================================");
        console.log("\nNext Steps:");
        console.log("1. Verify contracts on Basescan");
        console.log("2. Save contract addresses to .env");
        console.log("3. Deploy test universities using DeployTestUniversities script");
        console.log("==============================================");
    }
}

/**
 * @title DeployTestUniversities
 * @dev Script to deploy test university contracts for pilot testing
 * @notice Run this after deploying the UniversityFactory
 */
contract DeployTestUniversities is Script {
    
    function run() external {
        // Get private key and factory address from environment
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        
        UniversityFactory factory = UniversityFactory(factoryAddress);
        
        console.log("==============================================");
        console.log("DEPLOYING TEST UNIVERSITIES");
        console.log("==============================================");
        console.log("Factory address:", factoryAddress);
        console.log("Platform admin:", factory.platformAdmin());
        console.log("==============================================");
        
        // Test university data
        string[3] memory universityNames = [
            "Kwame Nkrumah University of Science and Technology",
            "University of Ghana",
            "University of Cape Coast"
        ];
        
        address[3] memory registrars = [
            vm.envAddress("REGISTRAR_1"),
            vm.envAddress("REGISTRAR_2"),
            vm.envAddress("REGISTRAR_3")
        ];
        
        vm.startBroadcast(deployerPrivateKey);
        
        for (uint i = 0; i < 3; i++) {
            console.log("\nDeploying university:", universityNames[i]);
            console.log("Registrar address:", registrars[i]);
            
            (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
                universityNames[i],
                registrars[i]
            );
            
            console.log("   University ID:", universityId);
            console.log("   Contract address:", contractAddress);
            
            // Verify deployment
            TranscriptRegistry registry = TranscriptRegistry(contractAddress);
            console.log("   University name:", registry.universityName());
            console.log("   Is active:", registry.isActive());
        }
        
        vm.stopBroadcast();
        
        // Print summary
        (uint256 totalUniversities, uint256 activeCount) = factory.getPlatformStats();
        
        console.log("\n==============================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("==============================================");
        console.log("Total universities deployed:", totalUniversities);
        console.log("Active universities:", activeCount);
        console.log("==============================================");
    }
}

/**
 * @title RegisterTestTranscript
 * @dev Script to register a test transcript for demo purposes
 * @notice Run this to test the complete flow
 */
contract RegisterTestTranscript is Script {
    
    function run() external {
        string memory pkString = vm.envString("REGISTRAR_PRIVATE_KEY");
        uint256 registrarPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS");
        
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        
        console.log("==============================================");
        console.log("REGISTERING TEST TRANSCRIPT");
        console.log("==============================================");
        console.log("Registry address:", registryAddress);
        console.log("University:", registry.universityName());
        console.log("==============================================");
        
        // Test transcript data
        address testStudent = vm.envAddress("TEST_STUDENT_ADDRESS");
        bytes32 studentHash = keccak256(abi.encodePacked(testStudent));
        string memory metadataCID = "QmTestMetadataCID123456789"; // Replace with actual IPFS CID
        bytes32 fileHash = keccak256("test_transcript_file_content"); // Replace with actual file hash
        
        vm.startBroadcast(registrarPrivateKey);
        
        console.log("\nRegistering transcript...");
        console.log("Student hash:", vm.toString(studentHash));
        console.log("Metadata CID:", metadataCID);
        console.log("File hash:", vm.toString(fileHash));
        
        bytes32 recordId = registry.registerTranscript(
            studentHash,
            metadataCID,
            fileHash
        );
        
        console.log("\nTranscript registered successfully!");
        console.log("Record ID:", vm.toString(recordId));
        
        vm.stopBroadcast();
        
        // Verify registration
        (
            bytes32 retrievedStudentHash,
            string memory retrievedMetadataCID,
            bytes32 retrievedFileHash,
            address issuer,
            uint256 timestamp,
            TranscriptRegistry.Status status
        ) = registry.getTranscript(recordId);
        
        console.log("\n==============================================");
        console.log("TRANSCRIPT VERIFICATION");
        console.log("==============================================");
        console.log("Student hash matches:", retrievedStudentHash == studentHash);
        console.log("Metadata CID:", retrievedMetadataCID);
        console.log("File hash matches:", retrievedFileHash == fileHash);
        console.log("Issuer:", issuer);
        console.log("Timestamp:", timestamp);
        console.log("Status:", uint8(status) == 0 ? "Active" : "Other");
        console.log("==============================================");
    }
}
// commit-marker-9
