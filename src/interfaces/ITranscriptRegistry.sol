// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITranscriptRegistry
 * @dev Interface for the TranscriptRegistry contract
 * @notice This interface defines all public functions for transcript management
 */
interface ITranscriptRegistry {
    
    // ============ Enums ============
    
    enum Status { Active, Revoked, Amended }
    
    // ============ Events ============
    
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
        Status oldStatus,
        Status newStatus,
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
    
    // ============ State Variables (View Functions) ============
    
    function admin() external view returns (address);
    
    function registrar() external view returns (address);
    
    function universityName() external view returns (string memory);
    
    function isActive() external view returns (bool);
    
    function transcriptCount() external view returns (uint256);
    
    function verificationCount() external view returns (uint256);
    
    // ============ Core Functions ============
    
    /**
     * @dev Register a new transcript on blockchain
     * @param studentHash Keccak256 hash of student ID
     * @param metadataCID IPFS CID containing metadata JSON
     * @param fileHash SHA-256 hash of the encrypted PDF file
     * @return recordId Unique identifier for the transcript
     */
    function registerTranscript(
        bytes32 studentHash,
        string memory metadataCID,
        bytes32 fileHash
    ) external returns (bytes32);
    
    /**
     * @dev Grant access to a verifier (called by student)
     * @param recordId Transcript record ID
     * @param verifier Address of the verifier
     * @param duration Duration of access in seconds
     */
    function grantAccess(
        bytes32 recordId,
        address verifier,
        uint256 duration
    ) external;
    
    /**
     * @dev Revoke access from a verifier (called by student)
     * @param recordId Transcript record ID
     * @param verifier Address of the verifier
     */
    function revokeAccess(
        bytes32 recordId,
        address verifier
    ) external;
    
    /**
     * @dev Verify if a file hash matches the registered transcript
     * @param recordId Transcript record ID
     * @param fileHash SHA-256 hash to verify
     * @return isValid True if hash matches
     */
    function verifyTranscript(
        bytes32 recordId,
        bytes32 fileHash
    ) external returns (bool);
    
    /**
     * @dev Get transcript details
     * @param recordId Transcript record ID
     * @return studentHash Hash of student ID
     * @return metadataCID IPFS CID for metadata
     * @return fileHash SHA-256 hash of file
     * @return issuer Address of registrar who issued
     * @return timestamp Issue timestamp
     * @return status Current status of transcript
     */
    function getTranscript(bytes32 recordId)
        external
        view
        returns (
            bytes32 studentHash,
            string memory metadataCID,
            bytes32 fileHash,
            address issuer,
            uint256 timestamp,
            Status status
        );
    
    /**
     * @dev Check if verifier has active access
     * @param recordId Transcript record ID
     * @param verifier Address to check
     * @return hasAccess True if access is active and not expired
     */
    function checkAccess(bytes32 recordId, address verifier)
        external
        view
        returns (bool);
    
    /**
     * @dev Get all transcript IDs for a student
     * @param studentHash Keccak256 hash of student ID
     * @return Array of record IDs
     */
    function getStudentTranscripts(bytes32 studentHash)
        external
        view
        returns (bytes32[] memory);
    
    // ============ Admin Functions ============
    
    /**
     * @dev Update transcript status (e.g., revoke, amend)
     * @param recordId Transcript record ID
     * @param newStatus New status
     * @param reason Reason for status change
     */
    function updateTranscriptStatus(
        bytes32 recordId,
        Status newStatus,
        string memory reason
    ) external;
    
    /**
     * @dev Update registrar address
     * @param newRegistrar New registrar wallet address
     */
    function updateRegistrar(address newRegistrar) external;
    
    /**
     * @dev Deactivate contract (emergency only)
     */
    function deactivateContract() external;
    
    /**
     * @dev Reactivate contract
     */
    function activateContract() external;
    
    // ============ View Functions ============
    
    /**
     * @dev Get contract statistics
     * @return totalTranscripts Total number of transcripts issued
     * @return totalVerifications Total number of verifications performed
     * @return contractActive Whether contract is active
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalTranscripts,
            uint256 totalVerifications,
            bool contractActive
        );
// commit-marker-23
