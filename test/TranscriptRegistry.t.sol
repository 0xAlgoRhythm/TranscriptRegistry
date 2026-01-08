// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TranscriptRegistry.sol";

contract TranscriptRegistryTest is Test {
    TranscriptRegistry public registry;
    
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
        TranscriptRegistry.Status oldStatus,
        TranscriptRegistry.Status newStatus,
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
        // Deploy contract as admin
        vm.prank(admin);
        registry = new TranscriptRegistry("Test University", registrar);
        
        // Create student hash (simulating student wallet)
        studentHash = keccak256(abi.encodePacked(student));
    }
    
    // ============ Constructor Tests ============
    
    function test_Constructor_SetsCorrectValues() public {
        assertEq(registry.admin(), admin);
        assertEq(registry.registrar(), registrar);
        assertEq(registry.universityName(), "Test University");
        assertTrue(registry.isActive());
        assertEq(registry.transcriptCount(), 0);
        assertEq(registry.verificationCount(), 0);
    }
    
    function test_Constructor_RevertsWithZeroRegistrarAddress() public {
        vm.prank(admin);
        vm.expectRevert("Invalid registrar address");
        new TranscriptRegistry("Test University", address(0));
    }
    
    // ============ Register Transcript Tests ============
    
    function test_RegisterTranscript_Success() public {
        vm.prank(registrar);
        
        // Expect event emission
        vm.expectEmit(false, true, false, true);
        emit TranscriptRegistered(
            bytes32(0), // We don't know recordId yet
            studentHash,
            metadataCID,
            fileHash,
            registrar,
            block.timestamp
        );
        
        recordId = registry.registerTranscript(
            studentHash,
            metadataCID,
            fileHash
        );
        
        // Verify transcript was registered
        (
            bytes32 _studentHash,
            string memory _metadataCID,
            bytes32 _fileHash,
            address _issuer,
            uint256 _timestamp,
            TranscriptRegistry.Status _status
        ) = registry.getTranscript(recordId);
        
        assertEq(_studentHash, studentHash);
        assertEq(_metadataCID, metadataCID);
        assertEq(_fileHash, fileHash);
        assertEq(_issuer, registrar);
        assertEq(_timestamp, block.timestamp);
        assertEq(uint8(_status), uint8(TranscriptRegistry.Status.Active));
        
        // Check counts
        assertEq(registry.transcriptCount(), 1);
    }
    
    function test_RegisterTranscript_RevertsIfNotRegistrar() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("Only registrar can call this");
        registry.registerTranscript(studentHash, metadataCID, fileHash);
    }
    
    function test_RegisterTranscript_RevertsIfContractInactive() public {
        // Deactivate contract
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
        bytes32 recordId2 = registry.registerTranscript(studentHash, "QmDifferentCID", keccak256("different_content"));
        
        bytes32[] memory studentTranscripts = registry.getStudentTranscripts(studentHash);
        
        assertEq(studentTranscripts.length, 2);
        assertEq(studentTranscripts[0], recordId1);
        assertEq(studentTranscripts[1], recordId2);
    }
    
    function test_RegisterTranscript_IncrementsCount() public {
        assertEq(registry.transcriptCount(), 0);
        
        vm.prank(registrar);
        registry.registerTranscript(studentHash, metadataCID, fileHash);
        assertEq(registry.transcriptCount(), 1);
        
        vm.prank(registrar);
        registry.registerTranscript(studentHash, "QmDifferent", keccak256("different"));
        assertEq(registry.transcriptCount(), 2);
    }
    
    // ============ Access Control Tests ============
    
    function test_GrantAccess_Success() public {
        // First register a transcript
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        // Grant access as student
        uint256 duration = 30 days;
        uint256 expectedExpiry = block.timestamp + duration;
        
        vm.prank(student);
        vm.expectEmit(true, true, true, true);
        emit AccessGranted(recordId, verifier, student, expectedExpiry);
        
        registry.grantAccess(recordId, verifier, duration);
        
        // Verify access was granted
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
        
        // Test zero duration
        vm.prank(student);
        vm.expectRevert("Invalid duration");
        registry.grantAccess(recordId, verifier, 0);
        
        // Test duration > 365 days
        vm.prank(student);
        vm.expectRevert("Invalid duration");
        registry.grantAccess(recordId, verifier, 366 days);
    }
    
    function test_GrantAccess_RevertsIfTranscriptDoesNotExist() public {
        bytes32 fakeRecordId = keccak256("fake_record");
        
        vm.prank(student);
        vm.expectRevert("Transcript does not exist");
        registry.grantAccess(fakeRecordId, verifier, 30 days);
    }
    
    function test_RevokeAccess_Success() public {
        // Register and grant access
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        assertTrue(registry.checkAccess(recordId, verifier));
        
        // Revoke access
        vm.prank(student);
        vm.expectEmit(true, true, true, false);
        emit AccessRevoked(recordId, verifier, student);
        
        registry.revokeAccess(recordId, verifier);
        
        // Verify access was revoked
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
    
    function test_RevokeAccess_RevertsIfAccessNotGranted() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        vm.expectRevert("Access not granted or already revoked");
        registry.revokeAccess(recordId, verifier);
    }
    
    function test_CheckAccess_ReturnsFalseIfExpired() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        // Grant access for 1 day
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 1 days);
        
        assertTrue(registry.checkAccess(recordId, verifier));
        
        // Fast forward 2 days
        vm.warp(block.timestamp + 2 days);
        
        assertFalse(registry.checkAccess(recordId, verifier));
    }
    
    // ============ Verify Transcript Tests ============
    
    function test_VerifyTranscript_Success() public {
        // Register transcript
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        // Grant access
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        // Verify
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
        // Verification count should not increment for failed verifications
        assertEq(registry.verificationCount(), 0);
    }
    
    function test_VerifyTranscript_RevertsIfAccessDenied() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        // No access granted
        vm.prank(verifier);
        vm.expectRevert("Access denied or expired");
        registry.verifyTranscript(recordId, fileHash);
    }
    
    function test_VerifyTranscript_RevertsIfAccessExpired() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 1 days);
        
        // Fast forward past expiry
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(verifier);
        vm.expectRevert("Access denied or expired");
        registry.verifyTranscript(recordId, fileHash);
    }
    
    // ============ Update Transcript Status Tests ============
    
    function test_UpdateTranscriptStatus_Success() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(registrar);
        vm.expectEmit(true, false, false, true);
        emit TranscriptStatusUpdated(
            recordId,
            TranscriptRegistry.Status.Active,
            TranscriptRegistry.Status.Revoked,
            "Student graduated from different program"
        );
        
        registry.updateTranscriptStatus(
            recordId,
            TranscriptRegistry.Status.Revoked,
            "Student graduated from different program"
        );
        
        (, , , , , TranscriptRegistry.Status status) = registry.getTranscript(recordId);
        assertEq(uint8(status), uint8(TranscriptRegistry.Status.Revoked));
    }
    
    function test_UpdateTranscriptStatus_RevertsIfNotRegistrar() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Only registrar can call this");
        registry.updateTranscriptStatus(
            recordId,
            TranscriptRegistry.Status.Revoked,
            "Unauthorized attempt"
        );
    }
    
    function test_UpdateTranscriptStatus_RevertsIfSameStatus() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(registrar);
        vm.expectRevert("Status already set");
        registry.updateTranscriptStatus(
            recordId,
            TranscriptRegistry.Status.Active, // Already active
            "No change"
        );
    }
    
    // ============ Admin Functions Tests ============
    
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
    
    function test_UpdateRegistrar_RevertsWithZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Invalid address");
        registry.updateRegistrar(address(0));
    }
    
    function test_UpdateRegistrar_RevertsIfSameAsCurrentRegistrar() public {
        vm.prank(admin);
        vm.expectRevert("Same as current registrar");
        registry.updateRegistrar(registrar);
    }
    
    function test_DeactivateContract_Success() public {
        assertTrue(registry.isActive());
        
        vm.prank(admin);
        registry.deactivateContract();
        
        assertFalse(registry.isActive());
    }
    
    function test_DeactivateContract_RevertsIfNotAdmin() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("Only admin can call this");
        registry.deactivateContract();
    }
    
    function test_ActivateContract_Success() public {
        vm.prank(admin);
        registry.deactivateContract();
        assertFalse(registry.isActive());
        
        vm.prank(admin);
        registry.activateContract();
        assertTrue(registry.isActive());
    }
    
    function test_ActivateContract_RevertsIfNotAdmin() public {
        vm.prank(admin);
        registry.deactivateContract();
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("Only admin can call this");
        registry.activateContract();
    }
    
    // ============ View Functions Tests ============
    
    function test_GetTranscript_Success() public {
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        (
            bytes32 _studentHash,
            string memory _metadataCID,
            bytes32 _fileHash,
            address _issuer,
            uint256 _timestamp,
            TranscriptRegistry.Status _status
        ) = registry.getTranscript(recordId);
        
        assertEq(_studentHash, studentHash);
        assertEq(_metadataCID, metadataCID);
        assertEq(_fileHash, fileHash);
        assertEq(_issuer, registrar);
        assertEq(_timestamp, block.timestamp);
        assertEq(uint8(_status), uint8(TranscriptRegistry.Status.Active));
    }
    
    function test_GetTranscript_RevertsIfDoesNotExist() public {
        bytes32 fakeRecordId = keccak256("fake");
        
        vm.expectRevert("Transcript does not exist");
        registry.getTranscript(fakeRecordId);
    }
    
    function test_GetStudentTranscripts_ReturnsCorrectArray() public {
        bytes32[] memory studentTranscripts = registry.getStudentTranscripts(studentHash);
        assertEq(studentTranscripts.length, 0);
        
        vm.prank(registrar);
        bytes32 recordId1 = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        vm.prank(registrar);
        bytes32 recordId2 = registry.registerTranscript(studentHash, "QmDifferent", keccak256("different"));
        
        studentTranscripts = registry.getStudentTranscripts(studentHash);
        assertEq(studentTranscripts.length, 2);
        assertEq(studentTranscripts[0], recordId1);
        assertEq(studentTranscripts[1], recordId2);
    }
    
    function test_GetContractStats_ReturnsCorrectValues() public {
        (uint256 totalTranscripts, uint256 totalVerifications, bool contractActive) = 
            registry.getContractStats();
        
        assertEq(totalTranscripts, 0);
        assertEq(totalVerifications, 0);
        assertTrue(contractActive);
        
        // Register and verify
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
    
    // ============ Integration Tests ============
    
    function test_CompleteWorkflow_RegisterGrantVerify() public {
        // 1. Registrar registers transcript
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        // 2. Student grants access to verifier
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        // 3. Verifier verifies transcript
        vm.prank(verifier);
        bool isValid = registry.verifyTranscript(recordId, fileHash);
        
        assertTrue(isValid);
        assertEq(registry.transcriptCount(), 1);
        assertEq(registry.verificationCount(), 1);
        
        // 4. Student revokes access
        vm.prank(student);
        registry.revokeAccess(recordId, verifier);
        
        assertFalse(registry.checkAccess(recordId, verifier));
    }
    
    function test_MultipleVerifiersWorkflow() public {
        address verifier2 = address(7);
        address verifier3 = address(8);
        
        vm.prank(registrar);
        recordId = registry.registerTranscript(studentHash, metadataCID, fileHash);
        
        // Grant access to multiple verifiers
        vm.prank(student);
        registry.grantAccess(recordId, verifier, 30 days);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier2, 60 days);
        
        vm.prank(student);
        registry.grantAccess(recordId, verifier3, 90 days);
        
        // All can verify
        assertTrue(registry.checkAccess(recordId, verifier));
        assertTrue(registry.checkAccess(recordId, verifier2));
        assertTrue(registry.checkAccess(recordId, verifier3));
        
        // Revoke one
        vm.prank(student);
        registry.revokeAccess(recordId, verifier2);
        
        assertTrue(registry.checkAccess(recordId, verifier));
        assertFalse(registry.checkAccess(recordId, verifier2));
        assertTrue(registry.checkAccess(recordId, verifier3));
    }
}