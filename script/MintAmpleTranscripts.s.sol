// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TranscriptRegistryUpgradeable.sol";

contract MintAmpleTranscripts is Script {
    function run() external {
        uint256[3] memory registrarPKs = [
            vm.parseUint(string(abi.encodePacked("0x", vm.envString("REGISTRAR1_PRIVATE_KEY")))),
            vm.parseUint(string(abi.encodePacked("0x", vm.envString("REGISTRAR2_PRIVATE_KEY")))),
            vm.parseUint(string(abi.encodePacked("0x", vm.envString("REGISTRAR3_PRIVATE_KEY"))))
        ];
        
        address studentAddress = vm.envAddress("TEST_STUDENT_ADDRESS");
        bytes32 studentHash = keccak256(abi.encodePacked(studentAddress));

        address[3] memory registries = [
            vm.envAddress("REGISTRY_ADDRESS_KNUST"),
            vm.envAddress("REGISTRY_ADDRESS_UG"),
            vm.envAddress("REGISTRY_ADDRESS_UCC")
        ];

        for (uint i = 0; i < registries.length; i++) {
            vm.startBroadcast(registrarPKs[i]);
            
            TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(registries[i]);
            console.log("Minting for Registry:", address(registry));
            try registry.universityName() returns (string memory name) {
                console.log("University:", name);
            } catch {
                console.log("Could not get university name");
            }
            
            for (uint j = 0; j < 3; j++) {
                string memory cid = string(abi.encodePacked("QmTestMetadata", vm.toString(j+1), "_", vm.toString(i)));
                bytes32 fHash = keccak256(abi.encodePacked("file", vm.toString(j+1), "_", vm.toString(i)));
                
                try registry.registerTranscript(studentHash, cid, fHash) returns (bytes32 recordId) {
                    console.log("Minted Record ID:", vm.toString(recordId));
                } catch Error(string memory reason) {
                    console.log("Failed to mint:", reason);
                } catch {
                    console.log("Failed to mint (unknown error or custom error)");
                }
            }
            
            vm.stopBroadcast();
        }
    }
}
