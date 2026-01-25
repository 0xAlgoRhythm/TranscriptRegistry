// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UniversityFactoryBeacon.sol";
import "../src/TranscriptRegistryUpgradeable.sol";

/**
 * @title DeployBeaconSystem
 * @dev Deploys the complete Beacon Proxy system (Implementation + Beacon + Factory)
 */
contract DeployBeaconSystem is Script {
    
    function run() external {
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==============================================");
        console.log("BEACON PROXY SYSTEM DEPLOYMENT");
        console.log("==============================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("==============================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy factory (which automatically deploys implementation + beacon)
        console.log("\n1. Deploying UniversityFactoryBeacon...");
        console.log("   This will deploy:");
        console.log("   - TranscriptRegistryUpgradeable (Implementation)");
        console.log("   - UpgradeableBeacon");
        console.log("   - UniversityFactoryBeacon (Factory)");
        
        UniversityFactoryBeacon factory = new UniversityFactoryBeacon();
        
        console.log("\n==============================================");
        console.log("DEPLOYMENT SUCCESSFUL");
        console.log("==============================================");
        console.log("Factory Address:", address(factory));
        console.log("Implementation:", factory.implementation());
        console.log("Beacon:", address(factory.beacon()));
        console.log("Owner (Platform Admin):", factory.owner());
        console.log("==============================================");
        console.log("\nNext Steps:");
        console.log("1. Save FACTORY_ADDRESS to .env");
        console.log("2. Verify contracts on Etherscan");
        console.log("3. Deploy university proxies");
        console.log("==============================================");
        
        vm.stopBroadcast();
    }
}

/**
 * @title DeployTestUniversitiesBeacon
 * @dev Deploys lightweight proxies for test universities
 */
contract DeployTestUniversitiesBeacon is Script {
    
    function run() external {
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        
        UniversityFactoryBeacon factory = UniversityFactoryBeacon(factoryAddress);
        
        console.log("==============================================");
        console.log("DEPLOYING UNIVERSITY PROXIES");
        console.log("==============================================");
        console.log("Factory:", factoryAddress);
        console.log("Implementation:", factory.getImplementation());
        console.log("Beacon:", address(factory.beacon()));
        console.log("==============================================");
        
        // University data
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
            console.log("\nDeploying university proxy:", universityNames[i]);
            console.log("Registrar:", registrars[i]);
            
            (uint256 universityId, address proxyAddress) = factory.deployUniversityProxy(
                universityNames[i],
                registrars[i]
            );
            
            console.log("   University ID:", universityId);
            console.log("   Proxy Address:", proxyAddress);
            
            // Verify deployment
            TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(proxyAddress);
            console.log("   University Name:", registry.universityName());
            console.log("   Version:", registry.version());
            console.log("   Is Active:", registry.isActive());
            console.log("   Admin:", registry.admin());
            console.log("   Registrar:", registry.registrar());
        }
        
        vm.stopBroadcast();
        
        // Print summary
        (uint256 totalUniversities, uint256 activeCount) = factory.getPlatformStats();
        
        console.log("\n==============================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("==============================================");
        console.log("Total Universities:", totalUniversities);
        console.log("Active Universities:", activeCount);
        console.log("==============================================");
        console.log("\nGas Savings:");
        console.log("Old System: ~2.8M gas per university");
        console.log("New System: ~200K gas per proxy");
        console.log("Savings: ~93% per university!");
        console.log("==============================================");
    }
}

/**
 * @title UpgradeImplementation
 * @dev Script to upgrade the implementation for all universities
 */
contract UpgradeImplementation is Script {
    
    function run() external {
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        
        UniversityFactoryBeacon factory = UniversityFactoryBeacon(factoryAddress);
        
        console.log("==============================================");
        console.log("UPGRADING IMPLEMENTATION");
        console.log("==============================================");
        console.log("Factory:", factoryAddress);
        console.log("Current Implementation:", factory.getImplementation());
        console.log("==============================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new implementation
        console.log("\n1. Deploying new implementation...");
        TranscriptRegistryUpgradeable newImplementation = new TranscriptRegistryUpgradeable();
        console.log("   New Implementation:", address(newImplementation));
        
        // Upgrade beacon
        console.log("\n2. Upgrading beacon...");
        factory.upgradeImplementation(address(newImplementation));
        console.log("   Beacon upgraded successfully!");
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("UPGRADE COMPLETE");
        console.log("==============================================");
        console.log("Old Implementation: (check logs above)");
        console.log("New Implementation:", address(newImplementation));
        console.log("\nAll university proxies now use new implementation!");
        console.log("==============================================");
    }
// commit-marker-48
