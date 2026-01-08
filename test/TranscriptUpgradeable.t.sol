// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TranscriptRegistryUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract TranscriptRegistryUpgradeableTest is Test {
    TranscriptRegistryUpgradeable public implementation;
    TranscriptRegistryUpgradeable public registry;
    ERC1967Proxy public proxy;
    
    // Test addresses
    address public admin = address(1);
    address public registrar = address(2);
    address public student = address(3);
    address public verifier = address(4);
    address public unauthorizedUser = address(5);
    
    // Test data
    bytes32 public studentHash;
    string public metadataCID = "QmTest123MetadataCID";
    bytes32 public fileHash = keccak256("test_file_content");
    bytes32 public recordId;
    
    // Events to test
    event TranscriptRegistered(
        bytes32 indexed recordId,
        bytes32 indexed studentHash,
        string metadataCID,
        bytes32 fileHash,
        address indexed issuer,
        uint256 timestamp
    );
    
    event AccessGranted(
        bytes32 indexed recordId,
        address indexed verifier,
        address indexed student,
        uint256 expiresAt
    );
    
    event AccessRevoked(
        bytes32 indexed recordId,
        address indexed verifier,
        address indexed student
    );
    
    event TranscriptStatusUpdated(
        bytes32 indexed recordId,
        TranscriptRegistryUpgradeable.Status oldStatus,
        TranscriptRegistryUpgradeable.Status newStatus,
        string reason
    );
    
    event TranscriptVerified(
        bytes32 indexed recordId,
        address indexed verifier,
        uint256 timestamp
    );
    
    event RegistrarUpdated(
        address indexed oldRegistrar,
        address indexed newRegistrar
    );
    
    function setUp() public {
        // Deploy implementation
        implementation = new TranscriptRegistryUpgradeable();
        
        // Deploy proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            TranscriptRegistryUpgradeable.initialize.selector,
            "Test University",
            registrar,
            admin
        );
        
        proxy = new ERC1967Proxy(address(implementation), initData);
        registry = TranscriptRegistryUpgradeable(address(proxy));
        
        // Create student hash
        studentHash = keccak256(abi.encodePacked(student));
    }
    
    // ============ Initialization Tests ============
    
    function test_Initialize_SetsCorrectValues() public {
        assertEq(registry.admin(), admin);
        assertEq(registry.registrar(), registrar);
        assertEq(registry.universityName(), "Test University");
        assertTrue(registry.isActive());
        assertEq(registry.transcriptCount(), 0);
        assertEq(registry.verificationCount(), 0);
        assertEq(registry.version(), "1.0.0");
    }
    
    function test_Initialize_CannotBeCalledTwice() public {
        vm.expectRevert();
        registry.initialize("Another University", registrar, admin);
    }
    
    function test_Initialize_RevertsWithZeroRegistrarAddress() public {
        TranscriptRegistryUpgradeable newImpl = new TranscriptRegistryUpgradeable();
        
        bytes memory initData = abi.encodeWithSelector(
            TranscriptRegistryUpgradeable.initialize.selector,
            "Test University",
            address(0),
            admin
        );
        
        vm.expectRevert("Invalid registrar address");
        new ERC1967Proxy(address(newImpl), initData);
    }
    
    function test_Initialize_RevertsWithZeroAdminAddress() public {
        TranscriptRegistryUpgradeable newImpl = new TranscriptRegistryUpgradeable();
        
        bytes memory initData = abi.encodeWithSelector(
            TranscriptRegistryUpgradeable.initialize.selector,
            "Test University",
            registrar,
            address(0)
        );
        
        vm.expectRevert("Invalid admin address");
        new ERC1967Proxy(address(newImpl), initData);
    }
    
    function test_Implementation_CannotBeInitialized() public {
        vm.expectRevert();
        implementation.initialize("Test", registrar, admin);
    }
    
    // ============ Register Transcript Tests ============
    
    function test_RegisterTranscript_Success() public {
        vm.prank(registrar);
        
        vm.expectEmit(false, true, false, true);
        emit TranscriptRegistered(
            bytes32(0),
            studentHash,
            metadataCID,
            fileHash,
            registrar,
            block.timestamp
        );
        
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        (
            bytes32 _studentHash,
            string memory _metadataCID,
            bytes32 _fileHash,
            address _issuer,
            uint256 _timestamp,
            TranscriptRegistryUpgradeable.Status _status
        ) = registry.getTranscript(recordId);
        
        assertEq(_studentHash, studentHash);
        assertEq(_metadataCID, metadataCID);
        assertEq(_fileHash, fileHash);
        assertEq(_issuer, registrar);
        assertEq(_timestamp, block.timestamp);
        assertEq(uint8(_status), uint8(TranscriptRegistryUpgradeable.Status.Active));
        assertEq(registry.transcriptCount(), 1);
    }
    
    function test_RegisterTranscript_RevertsIfNotRegistrar() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("Only registrar can call this");
        registry.registerTranscript(studentHash, metadataCID, fileHash);
    }
    
    function test_RegisterTranscript_RevertsIfContractInactive() public {
        vm.prank(admin);
        registry.deactivateContract();
        
        vm.prank(registrar);
        vm.expectRevert("Contract is not active");
        registry.registerTranscript(studentHash, metadataCID, fileHash);
    }
    
    function test_RegisterTranscript_RevertsWithInvalidStudentHash() public {
        vm.prank(registrar);
        vm.expectRevert("Invalid student hash");
        registry.registerTranscript(bytes32(0), metadataCID, fileHash);
    }
    
    function test_RegisterTranscript_RevertsWithEmptyMetadataCID() public {
        vm.prank(registrar);
        vm.expectRevert("Invalid metadata CID");
        registry.registerTranscript(studentHash, "", fileHash);
    }
    
    function test_RegisterTranscript_RevertsWithInvalidFileHash() public {
        vm.prank(registrar);
        vm.expectRevert("Invalid file hash");
        registry.registerTranscript(studentHash, metadataCID, bytes32(0));
    }
    
    function test_RegisterTranscript_AddsToStudentTranscriptsList() public {
        vm.prank(registrar);
        bytes32 recordId1 = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(registrar);
        bytes32 recordId2 = registry.registerTranscript(studentHash, "QmDifferent", keccak256("different"));
        
        bytes32[] memory studentTranscripts = registry.getStudentTranscripts(studentHash);
        
        assertEq(studentTranscripts.length, 2);
        assertEq(studentTranscripts[0], recordId1);
        assertEq(studentTranscripts[1], recordId2);
    }
    
    // ============ Access Control Tests ============
    
    function test_GrantAccess_Success() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        uint256 duration = 30 days;
        uint256 expectedExpiry = block.timestamp + duration;
        
        vm.prank(student);
        vm.expectEmit(true, true, true, true);
        emit AccessGranted(recordId, verifier, student, expectedExpiry);
        
        registry.grantAccess(recordId, verifier, duration);
        
        assertTrue(registry.checkAccess(recordId, verifier));
    }
    
    function test_GrantAccess_RevertsIfNotTranscriptOwner() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not the transcript owner");
        registry.grantAccess(recordId, verifier, 30 days);
    }
    
    function test_GrantAccess_RevertsWithInvalidVerifierAddress() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        vm.expectRevert("Invalid verifier address");
        registry.grantAccess(recordId, address(0), 30 days);
    }
    
    function test_GrantAccess_RevertsWithInvalidDuration() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        vm.expectRevert("Invalid duration");
        registry.grantAccess(recordId, verifier, 0);
        
        vm.prank(student);
        vm.expectRevert("Invalid duration");
        registry.grantAccess(recordId, verifier, 366 days);
    }
    
    function test_RevokeAccess_Success() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        assertTrue(registry.checkAccess(recordId, verifier));
        
        vm.prank(student);
        vm.expectEmit(true, true, true, false);
        emit AccessRevoked(recordId, verifier, student);
        
        registry.revokeAccess(recordId, verifier);
        
        assertFalse(registry.checkAccess(recordId, verifier));
    }
    
    function test_RevokeAccess_RevertsIfNotTranscriptOwner() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Not the transcript owner");
        registry.revokeAccess(recordId, verifier);
    }
    
    function test_CheckAccess_ReturnsFalseIfExpired() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 1 days);
        
        assertTrue(registry.checkAccess(recordId, verifier));
        
        vm.warp(block.timestamp + 2 days);
        
        assertFalse(registry.checkAccess(recordId, verifier));
    }
    
    // ============ Verify Transcript Tests ============
    
    function test_VerifyTranscript_Success() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        vm.prank(verifier);
        vm.expectEmit(true, true, false, true);
        emit TranscriptVerified(recordId, verifier, block.timestamp);
        
        bool isValid = registry.verifyTranscript(recordId, fileHash);
        
        assertTrue(isValid);
        assertEq(registry.verificationCount(), 1);
    }
    
    function test_VerifyTranscript_ReturnsFalseForWrongHash() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        bytes32 wrongHash = keccak256("wrong_content");
        
        vm.prank(verifier);
        bool isValid = registry.verifyTranscript(recordId, wrongHash);
        
        assertFalse(isValid);
        assertEq(registry.verificationCount(), 0);
    }
    
    function test_VerifyTranscript_RevertsIfAccessDenied() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(verifier);
        vm.expectRevert("Access denied or expired");
        registry.verifyTranscript(recordId, fileHash);
    }
    
    // ============ Admin Functions Tests ============
    
    function test_UpdateTranscriptStatus_Success() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(registrar);
        vm.expectEmit(true, false, false, true);
        emit TranscriptStatusUpdated(
            recordId,
            TranscriptRegistryUpgradeable.Status.Active,
            TranscriptRegistryUpgradeable.Status.Revoked,
            "Test reason"
        );
        
        registry.updateTranscriptStatus(
            recordId,
            TranscriptRegistryUpgradeable.Status.Revoked,
            "Test reason"
        );
        
        (, , , , , TranscriptRegistryUpgradeable.Status status) = registry.getTranscript(recordId);
        assertEq(uint8(status), uint8(TranscriptRegistryUpgradeable.Status.Revoked));
    }
    
    function test_UpdateRegistrar_Success() public {
        address newRegistrar = address(6);
        
        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit RegistrarUpdated(registrar, newRegistrar);
        
        registry.updateRegistrar(newRegistrar);
        
        assertEq(registry.registrar(), newRegistrar);
    }
    
    function test_UpdateRegistrar_RevertsIfNotAdmin() public {
        address newRegistrar = address(6);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Only admin can call this");
        registry.updateRegistrar(newRegistrar);
    }
    
    function test_DeactivateContract_Success() public {
        assertTrue(registry.isActive());
        
        vm.prank(admin);
        registry.deactivateContract();
        
        assertFalse(registry.isActive());
    }
    
    function test_ActivateContract_Success() public {
        vm.prank(admin);
        registry.deactivateContract();
        assertFalse(registry.isActive());
        
        vm.prank(admin);
        registry.activateContract();
        assertTrue(registry.isActive());
    }
    
    // ============ View Functions Tests ============
    
    function test_GetContractStats_ReturnsCorrectValues() public {
        (uint256 totalTranscripts, uint256 totalVerifications, bool contractActive) = 
            registry.getContractStats();
        
        assertEq(totalTranscripts, 0);
        assertEq(totalVerifications, 0);
        assertTrue(contractActive);
        
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        vm.prank(verifier);
        registry.verifyTranscript(recordId, fileHash);
        
        (totalTranscripts, totalVerifications, contractActive) = registry.getContractStats();
        
        assertEq(totalTranscripts, 1);
        assertEq(totalVerifications, 1);
        assertTrue(contractActive);
    }
    
    function test_Version_ReturnsCorrectVersion() public {
        assertEq(registry.version(), "1.0.0");
    }
    
    // ============ Integration Tests ============
    
    function test_CompleteWorkflow_RegisterGrantVerify() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        vm.prank(verifier);
        bool isValid = registry.verifyTranscript(recordId, fileHash);
        
        assertTrue(isValid);
        assertEq(registry.transcriptCount(), 1);
        assertEq(registry.verificationCount(), 1);
        
        vm.prank(student);
        registry.revokeAccess(recordId, verifier);
        
        assertFalse(registry.checkAccess(recordId, verifier));
    }
    
    // ============ Fuzz Tests ============
    
    function testFuzz_RegisterTranscript_DifferentInputs(
        bytes32 _studentHash,
        string memory _metadataCID,
        bytes32 _fileHash
    ) public {
        vm.assume(_studentHash != bytes32(0));
        vm.assume(bytes(_metadataCID).length > 0);
        vm.assume(_fileHash != bytes32(0));
        
        vm.prank(registrar);
        bytes32 _recordId = registry.registerTranscript(_studentHash, _metadataCID, _fileHash);
        
        (bytes32 retrievedStudentHash, , bytes32 retrievedFileHash, , , ) = 
            registry.getTranscript(_recordId);
        
        assertEq(retrievedStudentHash, _studentHash);
        assertEq(retrievedFileHash, _fileHash);
    }
    
    function testFuzz_GrantAccess_DifferentDurations(uint256 duration) public {
        vm.assume(duration > 0 && duration <= 365 days);
        
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, duration);
        
        assertTrue(registry.checkAccess(recordId, verifier));
    }
}