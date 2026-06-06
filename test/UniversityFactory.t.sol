// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/UniversityFactory.sol";
import "../src/TranscriptRegistry.sol";

contract UniversityFactoryTest is Test {
    UniversityFactory public factory;
    
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
        address indexed contractAddress,
        string universityName,
        address indexed registrar,
        uint256 timestamp
    );
    
    event UniversityDeactivated(
        uint256 indexed universityId,
        address indexed contractAddress,
        string reason
    );
    
    event UniversityReactivated(
        uint256 indexed universityId,
        address indexed contractAddress
    );
    
    function setUp() public {
        // Deploy factory as platform admin
        vm.prank(platformAdmin);
        factory = new UniversityFactory();
    }
    
    // ============ Constructor Tests ============
    
    function test_Constructor_SetsPlatformAdmin() public {
        assertEq(factory.platformAdmin(), platformAdmin);
        assertEq(factory.universityCount(), 0);
    }
    
    // ============ Deploy University Contract Tests ============
    
    function test_DeployUniversityContract_Success() public {
        vm.prank(platformAdmin);
        
        // Expect event emission
        vm.expectEmit(false, false, false, false);
        emit UniversityDeployed(0, address(0), uniName1, registrar1, block.timestamp);
        
        (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
            uniName1,
            registrar1
        );
        
        // Verify return values
        assertEq(universityId, 0);
        assertTrue(contractAddress != address(0));
        
        // Verify university info
        UniversityFactory.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertEq(uniInfo.name, uniName1);
        assertEq(uniInfo.contractAddress, contractAddress);
        assertEq(uniInfo.registrar, registrar1);
        assertEq(uniInfo.deployedAt, block.timestamp);
        assertTrue(uniInfo.isActive);
        
        // Verify mappings
        assertTrue(factory.isUniversityContract(contractAddress));
        assertEq(factory.contractToUniversityId(contractAddress), universityId);
        assertEq(factory.universityCount(), 1);
    }
    
    function test_DeployUniversityContract_DeploysWorkingRegistry() public {
        vm.prank(platformAdmin);
        (, address contractAddress) = factory.deployUniversityContract(uniName1, registrar1);
        
        // Cast to TranscriptRegistry and verify it works
        TranscriptRegistry registry = TranscriptRegistry(contractAddress);
        
        assertEq(registry.universityName(), uniName1);
        assertEq(registry.registrar(), registrar1);
        // Admin is the factory contract (msg.sender during deployment)
        assertEq(registry.admin(), address(factory));
        assertTrue(registry.isActive());
    }
    
    function test_DeployUniversityContract_IncrementsUniversityCount() public {
        assertEq(factory.universityCount(), 0);
        
        vm.prank(platformAdmin);
        factory.deployUniversityContract(uniName1, registrar1);
        assertEq(factory.universityCount(), 1);
        
        vm.prank(platformAdmin);
        factory.deployUniversityContract(uniName2, registrar2);
        assertEq(factory.universityCount(), 2);
    }
    
    function test_DeployUniversityContract_CreatesUniqueContracts() public {
        vm.prank(platformAdmin);
        (, address contractAddress1) = factory.deployUniversityContract(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        (, address contractAddress2) = factory.deployUniversityContract(uniName2, registrar2);
        
        assertTrue(contractAddress1 != contractAddress2);
        assertTrue(factory.isUniversityContract(contractAddress1));
        assertTrue(factory.isUniversityContract(contractAddress2));
    }
    
    function test_DeployUniversityContract_RevertsIfNotPlatformAdmin() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert(UniversityFactory.OnlyPlatformAdmin.selector);
        factory.deployUniversityContract(uniName1, registrar1);
    }
    
    function test_DeployUniversityContract_RevertsWithEmptyName() public {
        vm.prank(platformAdmin);
        vm.expectRevert(UniversityFactory.InvalidUniversityName.selector);
        factory.deployUniversityContract("", registrar1);
    }
    
    function test_DeployUniversityContract_RevertsWithZeroRegistrarAddress() public {
        vm.prank(platformAdmin);
        vm.expectRevert(UniversityFactory.InvalidRegistrarAddress.selector);
        factory.deployUniversityContract(uniName1, address(0));
    }
    
    // ============ Deactivate University Tests ============
    
    function test_DeactivateUniversity_Success() public {
        // Deploy university
        vm.prank(platformAdmin);
        (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
            uniName1,
            registrar1
        );
        
        // Verify active
        UniversityFactory.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertTrue(uniInfo.isActive);
        
        TranscriptRegistry registry = TranscriptRegistry(contractAddress);
        assertTrue(registry.isActive());
        
        // Deactivate
        string memory reason = "Emergency shutdown due to security issue";
        
        vm.prank(platformAdmin);
        vm.expectEmit(true, true, false, true);
        emit UniversityDeactivated(universityId, contractAddress, reason);
        
        factory.deactivateUniversity(universityId, reason);
        
        // Verify deactivated
        uniInfo = factory.getUniversity(universityId);
        assertFalse(uniInfo.isActive);
        assertFalse(registry.isActive());
    }
    
    function test_DeactivateUniversity_RevertsIfNotPlatformAdmin() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityContract(uniName1, registrar1);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert(UniversityFactory.OnlyPlatformAdmin.selector);
        factory.deactivateUniversity(universityId, "Unauthorized attempt");
    }
    
    function test_DeactivateUniversity_RevertsIfDoesNotExist() public {
        vm.prank(platformAdmin);
        vm.expectRevert(UniversityFactory.UniversityDoesNotExist.selector);
        factory.deactivateUniversity(999, "Non-existent university");
    }
    
    function test_DeactivateUniversity_RevertsIfAlreadyDeactivated() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityContract(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "First deactivation");
        
        vm.prank(platformAdmin);
        vm.expectRevert(UniversityFactory.AlreadyDeactivated.selector);
        factory.deactivateUniversity(universityId, "Second attempt");
    }
    
    // ============ Reactivate University Tests ============
    
    function test_ReactivateUniversity_Success() public {
        // Deploy and deactivate
        vm.prank(platformAdmin);
        (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
            uniName1,
            registrar1
        );
        
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "Test deactivation");
        
        // Verify deactivated
        UniversityFactory.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertFalse(uniInfo.isActive);
        
        TranscriptRegistry registry = TranscriptRegistry(contractAddress);
        assertFalse(registry.isActive());
        
        // Reactivate
        vm.prank(platformAdmin);
        vm.expectEmit(true, true, false, false);
        emit UniversityReactivated(universityId, contractAddress);
        
        factory.reactivateUniversity(universityId);
        
        // Verify reactivated
        uniInfo = factory.getUniversity(universityId);
        assertTrue(uniInfo.isActive);
        assertTrue(registry.isActive());
    }
    
    function test_ReactivateUniversity_RevertsIfNotPlatformAdmin() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityContract(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "Test");
        
        vm.prank(unauthorizedUser);
        vm.expectRevert(UniversityFactory.OnlyPlatformAdmin.selector);
        factory.reactivateUniversity(universityId);
    }
    
    function test_ReactivateUniversity_RevertsIfDoesNotExist() public {
        vm.prank(platformAdmin);
        vm.expectRevert(UniversityFactory.UniversityDoesNotExist.selector);
        factory.reactivateUniversity(999);
    }
    
    function test_ReactivateUniversity_RevertsIfAlreadyActive() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityContract(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        vm.expectRevert(UniversityFactory.AlreadyActive.selector);
        factory.reactivateUniversity(universityId);
    }
    
    // ============ View Functions Tests ============
    
    function test_GetUniversity_ReturnsCorrectInfo() public {
        vm.prank(platformAdmin);
        (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
            uniName1,
            registrar1
        );
        
        UniversityFactory.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        
        assertEq(uniInfo.name, uniName1);
        assertEq(uniInfo.contractAddress, contractAddress);
        assertEq(uniInfo.registrar, registrar1);
        assertEq(uniInfo.deployedAt, block.timestamp);
        assertTrue(uniInfo.isActive);
    }
    
    function test_GetUniversity_RevertsIfDoesNotExist() public {
        vm.expectRevert(UniversityFactory.UniversityDoesNotExist.selector);
        factory.getUniversity(0);
    }
    
    function test_GetUniversityIdByContract_ReturnsCorrectId() public {
        vm.prank(platformAdmin);
        (uint256 expectedId, address contractAddress) = factory.deployUniversityContract(
            uniName1,
            registrar1
        );
        
        uint256 actualId = factory.getUniversityIdByContract(contractAddress);
        assertEq(actualId, expectedId);
    }
    
    function test_GetUniversityIdByContract_RevertsIfNotUniversityContract() public {
        address randomAddress = address(999);
        
        vm.expectRevert(UniversityFactory.NotUniversityContract.selector);
        factory.getUniversityIdByContract(randomAddress);
    }
    
    function test_GetActiveUniversities_ReturnsCorrectList() public {
        // Deploy 5 universities
        vm.startPrank(platformAdmin);
        factory.deployUniversityContract("University 0", registrar1);
        factory.deployUniversityContract("University 1", registrar1);
        factory.deployUniversityContract("University 2", registrar1);
        factory.deployUniversityContract("University 3", registrar1);
        factory.deployUniversityContract("University 4", registrar1);
        vm.stopPrank();
        
        // Deactivate university 1 and 3
        vm.startPrank(platformAdmin);
        factory.deactivateUniversity(1, "Test");
        factory.deactivateUniversity(3, "Test");
        vm.stopPrank();
        
        // Get active universities (offset 0, limit 10)
        uint256[] memory activeIds = factory.getActiveUniversities(0, 10);
        
        // Should return [0, 2, 4]
        assertEq(activeIds.length, 3);
        assertEq(activeIds[0], 0);
        assertEq(activeIds[1], 2);
        assertEq(activeIds[2], 4);
    }
    
    function test_GetActiveUniversities_WithPagination() public {
        // Deploy 10 universities
        vm.startPrank(platformAdmin);
        for (uint i = 0; i < 10; i++) {
            factory.deployUniversityContract(
                string(abi.encodePacked("University ", i)),
                registrar1
            );
        }
        vm.stopPrank();
        
        // Get first 5
        uint256[] memory page1 = factory.getActiveUniversities(0, 5);
        assertEq(page1.length, 5);
        assertEq(page1[0], 0);
        assertEq(page1[4], 4);
        
        // Get next 5
        uint256[] memory page2 = factory.getActiveUniversities(5, 5);
        assertEq(page2.length, 5);
        assertEq(page2[0], 5);
        assertEq(page2[4], 9);
    }
    
    function test_GetActiveUniversities_HandlesOutOfBounds() public {
        vm.prank(platformAdmin);
        factory.deployUniversityContract(uniName1, registrar1);
        
        // Request beyond available
        uint256[] memory results = factory.getActiveUniversities(0, 100);
        assertEq(results.length, 1);
    }
    
    function test_GetActiveUniversities_RevertsIfOffsetOutOfBounds() public {
        vm.prank(platformAdmin);
        factory.deployUniversityContract(uniName1, registrar1);
        
        vm.expectRevert(UniversityFactory.OffsetOutOfBounds.selector);
        factory.getActiveUniversities(10, 5);
    }
    
    function test_GetPlatformStats_ReturnsCorrectCounts() public {
        (uint256 totalUniversities, uint256 activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 0);
        assertEq(activeCount, 0);
        
        // Deploy 5 universities
        vm.startPrank(platformAdmin);
        for (uint i = 0; i < 5; i++) {
            factory.deployUniversityContract(
                string(abi.encodePacked("University ", i)),
                registrar1
            );
        }
        vm.stopPrank();
        
        (totalUniversities, activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 5);
        assertEq(activeCount, 5);
        
        // Deactivate 2
        vm.startPrank(platformAdmin);
        factory.deactivateUniversity(0, "Test");
        factory.deactivateUniversity(2, "Test");
        vm.stopPrank();
        
        (totalUniversities, activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 5);
        assertEq(activeCount, 3);
    }
    
    // ============ Integration Tests ============
    
    function test_CompleteWorkflow_DeployRegisterVerify() public {
        // 1. Platform admin deploys university contract
        vm.prank(platformAdmin);
        (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
            uniName1,
            registrar1
        );
        
        // 2. Registrar registers a transcript
        TranscriptRegistry registry = TranscriptRegistry(contractAddress);
        
        bytes32 studentHash = keccak256(abi.encodePacked(address(100)));
        string memory metadataCID = "QmTestMetadata";
        bytes32 fileHash = keccak256("test_file");
        
        vm.prank(registrar1);
        bytes32 recordId = registry.registerTranscript(studentHash, metadataCID, fileHash, student);
        
        // 3. Verify transcript was registered
        (bytes32 retrievedStudentHash, , bytes32 retrievedFileHash, , , ) = 
            registry.getTranscript(recordId);
        
        assertEq(retrievedStudentHash, studentHash);
        assertEq(retrievedFileHash, fileHash);
        
        // 4. Check platform stats
        (uint256 totalUniversities, uint256 activeCount) = factory.getPlatformStats();
        assertEq(totalUniversities, 1);
        assertEq(activeCount, 1);
        
        // 5. Verify contract is tracked correctly
        assertTrue(factory.isUniversityContract(contractAddress));
        assertEq(factory.getUniversityIdByContract(contractAddress), universityId);
    }
}
