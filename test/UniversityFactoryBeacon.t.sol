// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/UniversityFactoryBeacon.sol";
import "../src/TranscriptRegistryUpgradeable.sol";

contract UniversityFactoryBeaconTest is Test {
    UniversityFactoryBeacon public factory;
    
    // Test addresses
    address public platformAdmin = address(1);
    address public registrar1 = address(2);
    address public registrar2 = address(3);
    address public unauthorizedUser = address(4);
    
    // Test data
    string public uniName1 = "Kwame Nkrumah University of Science and Technology";
    string public uniName2 = "University of Ghana";
    
    // Events to test
    event UniversityDeployed(
        uint256 indexed universityId,
        address indexed proxyAddress,
        string universityName,
        address indexed registrar,
        uint256 timestamp
    );
    
    event UniversityDeactivated(
        uint256 indexed universityId,
        address indexed proxyAddress,
        string reason
    );
    
    event UniversityReactivated(
        uint256 indexed universityId,
        address indexed proxyAddress
    );
    
    event ImplementationUpgraded(
        address indexed oldImplementation,
        address indexed newImplementation
    );
    
    function setUp() public {
        vm.prank(platformAdmin);
        factory = new UniversityFactoryBeacon();
    }
    
    // ============ Constructor Tests ============
    
    function test_Constructor_SetsPlatformAdmin() public {
        assertEq(factory.owner(), platformAdmin);
        assertEq(factory.universityCount(), 0);
    }
    
    function test_Constructor_DeploysImplementationAndBeacon() public {
        assertTrue(factory.implementation() != address(0));
        assertTrue(address(factory.beacon()) != address(0));
        assertEq(factory.beacon().implementation(), factory.implementation());
    }
    
    function test_Constructor_BeaconOwnerIsFactory() public {
        assertEq(factory.beacon().owner(), address(factory));
    }
    
    // ============ Deploy University Proxy Tests ============
    
    function test_DeployUniversityProxy_Success() public {
        vm.prank(platformAdmin);
        
        vm.expectEmit(false, false, false, false);
        emit UniversityDeployed(0, address(0), uniName1, registrar1, block.timestamp);
        
        (uint256 universityId, address proxyAddress) = factory.deployUniversityProxy(
            uniName1,
            registrar1
        );
        
        assertEq(universityId, 0);
        assertTrue(proxyAddress != address(0));
        
        UniversityFactoryBeacon.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertEq(uniInfo.name, uniName1);
        assertEq(uniInfo.proxyAddress, proxyAddress);
        assertEq(uniInfo.registrar, registrar1);
        assertEq(uniInfo.deployedAt, block.timestamp);
        assertTrue(uniInfo.isActive);
        
        assertTrue(factory.isUniversityProxy(proxyAddress));
        assertEq(factory.proxyToUniversityId(proxyAddress), universityId);
        assertEq(factory.universityCount(), 1);
    }
    
    function test_DeployUniversityProxy_DeploysWorkingRegistry() public {
        vm.prank(platformAdmin);
        (, address proxyAddress) = factory.deployUniversityProxy(uniName1, registrar1);
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(proxyAddress);
        
        assertEq(registry.universityName(), uniName1);
        assertEq(registry.registrar(), registrar1);
        assertEq(registry.admin(), platformAdmin);
        assertTrue(registry.isActive());
        assertEq(registry.version(), "1.0.0");
    }
    
    function test_DeployUniversityProxy_IncrementsUniversityCount() public {
        assertEq(factory.universityCount(), 0);
        
        vm.prank(platformAdmin);
        factory.deployUniversityProxy(uniName1, registrar1);
        assertEq(factory.universityCount(), 1);
        
        vm.prank(platformAdmin);
        factory.deployUniversityProxy(uniName2, registrar2);
        assertEq(factory.universityCount(), 2);
    }
    
    function test_DeployUniversityProxy_CreatesUniqueProxies() public {
        vm.prank(platformAdmin);
        (, address proxyAddress1) = factory.deployUniversityProxy(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        (, address proxyAddress2) = factory.deployUniversityProxy(uniName2, registrar2);
        
        assertTrue(proxyAddress1 != proxyAddress2);
        assertTrue(factory.isUniversityProxy(proxyAddress1));
        assertTrue(factory.isUniversityProxy(proxyAddress2));
    }
    
    function test_DeployUniversityProxy_AllProxiesShareImplementation() public {
        vm.prank(platformAdmin);
        (, address proxy1) = factory.deployUniversityProxy(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        (, address proxy2) = factory.deployUniversityProxy(uniName2, registrar2);
        
        address impl = factory.getImplementation();
        
        // Both proxies should point to same beacon (which points to same implementation)
        assertEq(address(factory.beacon()), address(factory.beacon()));
    }
    
    function test_DeployUniversityProxy_RevertsIfNotOwner() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        factory.deployUniversityProxy(uniName1, registrar1);
    }
    
    function test_DeployUniversityProxy_RevertsWithEmptyName() public {
        vm.prank(platformAdmin);
        vm.expectRevert("Invalid university name");
        factory.deployUniversityProxy("", registrar1);
    }
    
    function test_DeployUniversityProxy_RevertsWithZeroRegistrarAddress() public {
        vm.prank(platformAdmin);
        vm.expectRevert("Invalid registrar address");
        factory.deployUniversityProxy(uniName1, address(0));
    }
    
    // ============ Upgrade Implementation Tests ============
    
    function test_UpgradeImplementation_Success() public {
        address oldImplementation = factory.getImplementation();
        
        // Deploy new implementation
        TranscriptRegistryUpgradeable newImplementation = new TranscriptRegistryUpgradeable();
        
        vm.prank(platformAdmin);
        vm.expectEmit(true, true, false, false);
        emit ImplementationUpgraded(oldImplementation, address(newImplementation));
        
        factory.upgradeImplementation(address(newImplementation));
        
        assertEq(factory.getImplementation(), address(newImplementation));
        assertEq(factory.beacon().implementation(), address(newImplementation));
    }
    
    function test_UpgradeImplementation_UpdatesAllProxies() public {
        // Deploy 3 proxies with old implementation
        vm.startPrank(platformAdmin);
        (, address proxy1) = factory.deployUniversityProxy("Uni 1", registrar1);
        (, address proxy2) = factory.deployUniversityProxy("Uni 2", registrar1);
        (, address proxy3) = factory.deployUniversityProxy("Uni 3", registrar1);
        vm.stopPrank();
        
        // All should have version 1.0.0
        assertEq(TranscriptRegistryUpgradeable(proxy1).version(), "1.0.0");
        assertEq(TranscriptRegistryUpgradeable(proxy2).version(), "1.0.0");
        assertEq(TranscriptRegistryUpgradeable(proxy3).version(), "1.0.0");
        
        // Deploy and upgrade to new implementation
        TranscriptRegistryUpgradeable newImpl = new TranscriptRegistryUpgradeable();
        
        vm.prank(platformAdmin);
        factory.upgradeImplementation(address(newImpl));
        
        // All proxies should now use new implementation
        assertEq(TranscriptRegistryUpgradeable(proxy1).version(), "1.0.0");
        assertEq(TranscriptRegistryUpgradeable(proxy2).version(), "1.0.0");
        assertEq(TranscriptRegistryUpgradeable(proxy3).version(), "1.0.0");
    }
    
    function test_UpgradeImplementation_RevertsIfNotOwner() public {
        TranscriptRegistryUpgradeable newImpl = new TranscriptRegistryUpgradeable();
        
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        factory.upgradeImplementation(address(newImpl));
    }
    
    function test_UpgradeImplementation_RevertsWithZeroAddress() public {
        vm.prank(platformAdmin);
        vm.expectRevert("Invalid implementation");
        factory.upgradeImplementation(address(0));
    }
    
    // ============ Deactivate University Tests ============
    
    function test_DeactivateUniversity_Success() public {
        vm.prank(platformAdmin);
        (uint256 universityId, address proxyAddress) = factory.deployUniversityProxy(
            uniName1,
            registrar1
        );
        
        UniversityFactoryBeacon.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertTrue(uniInfo.isActive);
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(proxyAddress);
        assertTrue(registry.isActive());
        
        string memory reason = "Test deactivation";
        
        vm.prank(platformAdmin);
        vm.expectEmit(true, true, false, true);
        emit UniversityDeactivated(universityId, proxyAddress, reason);
        
        factory.deactivateUniversity(universityId, reason);
        
        uniInfo = factory.getUniversity(universityId);
        assertFalse(uniInfo.isActive);
        assertFalse(registry.isActive());
    }
    
    function test_DeactivateUniversity_RevertsIfNotOwner() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityProxy(uniName1, registrar1);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        factory.deactivateUniversity(universityId, "Test");
    }
    
    function test_DeactivateUniversity_RevertsIfDoesNotExist() public {
        vm.prank(platformAdmin);
        vm.expectRevert("University does not exist");
        factory.deactivateUniversity(999, "Non-existent");
    }
    
    function test_DeactivateUniversity_RevertsIfAlreadyDeactivated() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityProxy(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "First");
        
        vm.prank(platformAdmin);
        vm.expectRevert("Already deactivated");
        factory.deactivateUniversity(universityId, "Second");
    }
    
    // ============ Reactivate University Tests ============
    
    function test_ReactivateUniversity_Success() public {
        vm.prank(platformAdmin);
        (uint256 universityId, address proxyAddress) = factory.deployUniversityProxy(
            uniName1,
            registrar1
        );
        
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "Test");
        
        UniversityFactoryBeacon.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertFalse(uniInfo.isActive);
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(proxyAddress);
        assertFalse(registry.isActive());
        
        vm.prank(platformAdmin);
        vm.expectEmit(true, true, false, false);
        emit UniversityReactivated(universityId, proxyAddress);
        
        factory.reactivateUniversity(universityId);
        
        uniInfo = factory.getUniversity(universityId);
        assertTrue(uniInfo.isActive);
        assertTrue(registry.isActive());
    }
    
    function test_ReactivateUniversity_RevertsIfNotOwner() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityProxy(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "Test");
        
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        factory.reactivateUniversity(universityId);
    }
    
    function test_ReactivateUniversity_RevertsIfAlreadyActive() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityProxy(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        vm.expectRevert("Already active");
        factory.reactivateUniversity(universityId);
    }
    
    // ============ View Functions Tests ============
    
    function test_GetImplementation_ReturnsCorrectAddress() public {
        address impl = factory.getImplementation();
        assertTrue(impl != address(0));
        assertEq(impl, factory.beacon().implementation());
    }
    
    function test_GetUniversity_ReturnsCorrectInfo() public {
        vm.prank(platformAdmin);
        (uint256 universityId, address proxyAddress) = factory.deployUniversityProxy(
            uniName1,
            registrar1
        );
        
        UniversityFactoryBeacon.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        
        assertEq(uniInfo.name, uniName1);
        assertEq(uniInfo.proxyAddress, proxyAddress);
        assertEq(uniInfo.registrar, registrar1);
        assertEq(uniInfo.deployedAt, block.timestamp);
        assertTrue(uniInfo.isActive);
    }
    
    function test_GetUniversityIdByProxy_ReturnsCorrectId() public {
        vm.prank(platformAdmin);
        (uint256 expectedId, address proxyAddress) = factory.deployUniversityProxy(
            uniName1,
            registrar1
        );
        
        uint256 actualId = factory.getUniversityIdByProxy(proxyAddress);
        assertEq(actualId, expectedId);
    }
    
    function test_GetUniversityIdByProxy_RevertsIfNotUniversityProxy() public {
        address randomAddress = address(999);
        
        vm.expectRevert("Not a university proxy");
        factory.getUniversityIdByProxy(randomAddress);
    }
    
    function test_GetActiveUniversities_ReturnsCorrectList() public {
        vm.startPrank(platformAdmin);
        factory.deployUniversityProxy("University 0", registrar1);
        factory.deployUniversityProxy("University 1", registrar1);
        factory.deployUniversityProxy("University 2", registrar1);
        factory.deployUniversityProxy("University 3", registrar1);
        factory.deployUniversityProxy("University 4", registrar1);
        vm.stopPrank();
        
        vm.startPrank(platformAdmin);
        factory.deactivateUniversity(1, "Test");
        factory.deactivateUniversity(3, "Test");
        vm.stopPrank();
        
        uint256[] memory activeIds = factory.getActiveUniversities(0, 10);
        
        assertEq(activeIds.length, 3);
        assertEq(activeIds[0], 0);
        assertEq(activeIds[1], 2);
        assertEq(activeIds[2], 4);
    }
    
    function test_GetPlatformStats_ReturnsCorrectCounts() public {
        (uint256 totalUniversities, uint256 activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 0);
        assertEq(activeCount, 0);
        
        vm.startPrank(platformAdmin);
        for (uint i = 0; i < 5; i++) {
            factory.deployUniversityProxy(
                string(abi.encodePacked("University ", i)),
                registrar1
            );
        }
        vm.stopPrank();
        
        (totalUniversities, activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 5);
        assertEq(activeCount, 5);
        
        vm.startPrank(platformAdmin);
        factory.deactivateUniversity(0, "Test");
        factory.deactivateUniversity(2, "Test");
        vm.stopPrank();
        
        (totalUniversities, activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 5);
        assertEq(activeCount, 3);
    }
    
    function test_GetUniversityVersion_ReturnsCorrectVersion() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityProxy(uniName1, registrar1);
        
        string memory version = factory.getUniversityVersion(universityId);
        assertEq(version, "1.0.0");
    }
    
    // ============ Integration Tests ============
    
    function test_CompleteWorkflow_DeployRegisterVerify() public {
        vm.prank(platformAdmin);
        (uint256 universityId, address proxyAddress) = factory.deployUniversityProxy(
            uniName1,
            registrar1
        );
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(proxyAddress);
        
        bytes32 studentHash = keccak256(abi.encodePacked(address(100)));
        string memory metadataCID = "QmTestMetadata";
        bytes32 fileHash = keccak256("test_file");
        
        vm.prank(registrar1);
        bytes32 recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        (bytes32 retrievedStudentHash, , bytes32 retrievedFileHash, , , ) = 
            registry.getTranscript(recordId);
        
        assertEq(retrievedStudentHash, studentHash);
        assertEq(retrievedFileHash, fileHash);
        
        (uint256 totalUniversities, uint256 activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 1);
        assertEq(activeCount, 1);
        
        assertTrue(factory.isUniversityProxy(proxyAddress));
        assertEq(factory.getUniversityIdByProxy(proxyAddress), universityId);
    }
    
    // ============ Fuzz Tests ============
    
    function testFuzz_DeployUniversityProxy_DifferentNames(string memory name) public {
        vm.assume(bytes(name).length > 0 && bytes(name).length < 200);
        
        vm.prank(platformAdmin);
        (uint256 universityId, address proxyAddress) = factory.deployUniversityProxy(
            name,
            registrar1
        );
        
        UniversityFactoryBeacon.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertEq(uniInfo.name, name);
        assertTrue(proxyAddress != address(0));
    }
}