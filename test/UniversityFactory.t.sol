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
        vm.expectRevert("Only platform admin");
        factory.deployUniversityContract(uniName1, registrar1);
    }
    
    function test_DeployUniversityContract_RevertsWithEmptyName() public {
        vm.prank(platformAdmin);
        vm.expectRevert("Invalid university name");
        factory.deployUniversityContract("", registrar1);
    }
    
    function test_DeployUniversityContract_RevertsWithZeroRegistrarAddress() public {
        vm.prank(platformAdmin);
        vm.expectRevert("Invalid registrar address");
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
        vm.expectRevert("Only platform admin");
        factory.deactivateUniversity(universityId, "Unauthorized attempt");
    }
    
    function test_DeactivateUniversity_RevertsIfDoesNotExist() public {
        vm.prank(platformAdmin);
        vm.expectRevert("University does not exist");
        factory.deactivateUniversity(999, "Non-existent university");
    }
    
    function test_DeactivateUniversity_RevertsIfAlreadyDeactivated() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityContract(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "First deactivation");
        
        vm.prank(platformAdmin);
        vm.expectRevert("Already deactivated");
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
        vm.expectRevert("Only platform admin");
        factory.reactivateUniversity(universityId);
    }
    
    function test_ReactivateUniversity_RevertsIfDoesNotExist() public {
        vm.prank(platformAdmin);
        vm.expectRevert("University does not exist");
        factory.reactivateUniversity(999);
    }
    
    function test_ReactivateUniversity_RevertsIfAlreadyActive() public {
        vm.prank(platformAdmin);
        (uint256 universityId, ) = factory.deployUniversityContract(uniName1, registrar1);
        
        vm.prank(platformAdmin);
        vm.expectRevert("Already active");
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
        vm.expectRevert("University does not exist");
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
        
        vm.expectRevert("Not a university contract");
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
        
        vm.expectRevert("Offset out of bounds");
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
        bytes32 recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
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
    
    function test_MultipleUniversitiesWorkflow() public {
        // Deploy 3 universities
        vm.startPrank(platformAdmin);
        (uint256 id1, address contract1) = factory.deployUniversityContract("Uni 1", registrar1);
        (uint256 id2, address contract2) = factory.deployUniversityContract("Uni 2", registrar2);
        (uint256 id3, address contract3) = factory.deployUniversityContract("Uni 3", registrar1);
        vm.stopPrank();
        
        // Each university registers transcripts independently
        TranscriptRegistry registry1 = TranscriptRegistry(contract1);
        TranscriptRegistry registry2 = TranscriptRegistry(contract2);
        TranscriptRegistry registry3 = TranscriptRegistry(contract3);
        
        vm.prank(registrar1);
        registry1.registerTranscript(
            keccak256(abi.encodePacked(address(1))),
            "QmUni1Transcript",
            keccak256("uni1_file")
        );
        
        vm.prank(registrar2);
        registry2.registerTranscript(
            keccak256(abi.encodePacked(address(2))),
            "QmUni2Transcript",
            keccak256("uni2_file")
        );
        
        vm.prank(registrar1);
        registry3.registerTranscript(
            keccak256(abi.encodePacked(address(3))),
            "QmUni3Transcript",
            keccak256("uni3_file")
        );
        
        // Verify each has 1 transcript
        assertEq(registry1.transcriptCount(), 1);
        assertEq(registry2.transcriptCount(), 1);
        assertEq(registry3.transcriptCount(), 1);
        
        // Deactivate one university
        vm.prank(platformAdmin);
        factory.deactivateUniversity(id2, "Compliance issue");
        
        // Verify uni2 is deactivated but others are active
        assertFalse(registry2.isActive());
        assertTrue(registry1.isActive());
        assertTrue(registry3.isActive());
        
        // Get active universities
        uint256[] memory activeIds = factory.getActiveUniversities(0, 10);
        assertEq(activeIds.length, 2);
        assertEq(activeIds[0], id1);
        assertEq(activeIds[1], id3);
    }
    
    function test_DeactivateReactivateWorkflow() public {
        vm.prank(platformAdmin);
        (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
            uniName1,
            registrar1
        );
        
        TranscriptRegistry registry = TranscriptRegistry(contractAddress);
        
        // Register transcript while active
        vm.prank(registrar1);
        bytes32 recordId = registry.registerTranscript(
            keccak256(abi.encodePacked(address(1))),
            "QmTest",
            keccak256("test")
        );
        
        // Deactivate university
        vm.prank(platformAdmin);
        factory.deactivateUniversity(universityId, "Temporary suspension");
        
        // Cannot register new transcripts
        vm.prank(registrar1);
        vm.expectRevert("Contract is not active");
        registry.registerTranscript(
            keccak256(abi.encodePacked(address(2))),
            "QmTest2",
            keccak256("test2")
        );
        
        // But can still view existing transcript
        (bytes32 studentHash, , , , , ) = registry.getTranscript(recordId);
        assertEq(studentHash, keccak256(abi.encodePacked(address(1))));
        
        // Reactivate
        vm.prank(platformAdmin);
        factory.reactivateUniversity(universityId);
        
        // Can register again
        vm.prank(registrar1);
        registry.registerTranscript(
            keccak256(abi.encodePacked(address(3))),
            "QmTest3",
            keccak256("test3")
        );
        
        assertEq(registry.transcriptCount(), 2);
    }
    
    // ============ Fuzz Tests ============
    
    function testFuzz_DeployUniversityContract_DifferentNames(string memory name) public {
        vm.assume(bytes(name).length > 0 && bytes(name).length < 200);
        
        vm.prank(platformAdmin);
        (uint256 universityId, address contractAddress) = factory.deployUniversityContract(
            name,
            registrar1
        );
        
        UniversityFactory.UniversityInfo memory uniInfo = factory.getUniversity(universityId);
        assertEq(uniInfo.name, name);
        assertTrue(contractAddress != address(0));
    }
    
    function testFuzz_GetActiveUniversities_DifferentPagination(
        uint8 universityCount,
        uint8 offset,
        uint8 limit
    ) public {
        vm.assume(universityCount > 0 && universityCount <= 50);
        vm.assume(limit > 0 && limit <= 20);
        vm.assume(offset < universityCount);
        
        // Deploy universities
        vm.startPrank(platformAdmin);
        for (uint i = 0; i < universityCount; i++) {
            factory.deployUniversityContract(
                string(abi.encodePacked("University ", i)),
                registrar1
            );
        }
        vm.stopPrank();
        
        // Get active universities
        uint256[] memory activeIds = factory.getActiveUniversities(offset, limit);
        
        // Verify results
        uint256 expectedLength = universityCount - offset;
        if (expectedLength > limit) {
            expectedLength = limit;
        }
        
        assertEq(activeIds.length, expectedLength);
    }
}
