// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/proxy/utils/Initializable.sol";

/**
 * @title TranscriptRegistry
 * @dev Smart contract for managing university transcripts on blockchain
 * @notice Optimized with proxy clones and custom revert errors
 */
contract TranscriptRegistry is Initializable {
    // ============ Custom Errors ============
    
    error InvalidRegistrarAddress();
    error InvalidAdminAddress();
    error OnlyAdmin();
    error OnlyRegistrar();
    error ContractInactive();
    error TranscriptDoesNotExist();
    error InvalidStudentHash();
    error InvalidMetadataCID();
    error InvalidFileHash();
    error RecordCollision();
    error InvalidVerifierAddress();
    error InvalidDuration();
    error NotTranscriptOwner();
    error AccessNotGrantedOrRevoked();
    error AccessDeniedOrExpired();
    error StatusAlreadySet();
    error InvalidAddress();
    error SameRegistrar();

    // ============ State Variables ============
    
    address public admin; // Platform admin
    address public registrar; // University registrar who can issue transcripts
    string public universityName;
    bool public isActive;
    
    uint256 public transcriptCount;
    uint256 public verificationCount;
    
    // Transcript status enum
    enum Status { Active, Revoked, Amended }
    
    // Transcript structure
    struct Transcript {
        bytes32 studentHash;      // Keccak256 hash of student ID (for privacy)
        string metadataCID;       // IPFS CID for metadata JSON
        bytes32 fileHash;         // SHA-256 hash of encrypted PDF
        address issuer;           // Registrar who issued the transcript
        uint256 timestamp;        // Issue timestamp
        Status status;            // Current status
        bool exists;              // Check if transcript exists
    }
    
    // Access control structure
    struct AccessGrant {
        address verifier;         // Verifier wallet address
        uint256 grantedAt;        // When access was granted
        uint256 expiresAt;        // When access expires
        bool isActive;            // Is access currently valid
    }
    
    // ============ Mappings ============
    
    // recordId => Transcript
    mapping(bytes32 => Transcript) public transcripts;
    
    // recordId => verifier address => AccessGrant
    mapping(bytes32 => mapping(address => AccessGrant)) public accessControl;
    
    // studentHash => array of recordIds (for student to find their transcripts)
    mapping(bytes32 => bytes32[]) public studentTranscripts;
    
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
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }
    
    modifier onlyRegistrar() {
        if (msg.sender != registrar) revert OnlyRegistrar();
        _;
    }
    
    modifier onlyActiveContract() {
        if (!isActive) revert ContractInactive();
        _;
    }
    
    modifier transcriptExists(bytes32 recordId) {
        if (!transcripts[recordId].exists) revert TranscriptDoesNotExist();
        _;
    }
    
    // ============ Constructor (Disables Direct Initialization of Master template) ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    // ============ Initializer (Called by Factory clone) ============
    
    /**
     * @dev Initialize a new cloned instance
     * @param _universityName Name of the university
     * @param _registrar Wallet address of the university registrar
     * @param _admin Address of the platform admin/factory
     */
    function initialize(
        string memory _universityName,
        address _registrar,
        address _admin
    ) external initializer {
        if (_registrar == address(0)) revert InvalidRegistrarAddress();
        if (_admin == address(0)) revert InvalidAdminAddress();
        
        admin = _admin;
        registrar = _registrar;
        universityName = _universityName;
        isActive = true;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Register a new transcript on blockchain
     * @param studentHash Keccak256 hash of student ID (for privacy)
     * @param metadataCID IPFS CID containing metadata JSON
     * @param fileHash SHA-256 hash of the encrypted PDF file
     * @return recordId Unique identifier for the transcript
     */
    function registerTranscript(
        bytes32 studentHash,
        string memory metadataCID,
        bytes32 fileHash
    ) external onlyRegistrar onlyActiveContract returns (bytes32) {
        if (studentHash == bytes32(0)) revert InvalidStudentHash();
        if (bytes(metadataCID).length == 0) revert InvalidMetadataCID();
        if (fileHash == bytes32(0)) revert InvalidFileHash();
        
        // Generate unique record ID
        bytes32 recordId = keccak256(
            abi.encodePacked(
                studentHash,
                fileHash,
                block.timestamp,
                transcriptCount
            )
        );
        
        if (transcripts[recordId].exists) revert RecordCollision();
        
        // Create transcript
        transcripts[recordId] = Transcript({
            studentHash: studentHash,
            metadataCID: metadataCID,
            fileHash: fileHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            status: Status.Active,
            exists: true
        });
        
        // Add to student's transcript list
        studentTranscripts[studentHash].push(recordId);
        
        transcriptCount++;
        
        emit TranscriptRegistered(
            recordId,
            studentHash,
            metadataCID,
            fileHash,
            msg.sender,
            block.timestamp
        );
        
        return recordId;
    }
    
    /**
     * @dev Grant access to a verifier (called by student)
     * @param recordId Transcript record ID
     * @param verifier Address of the verifier
     * @param duration Duration of access in seconds (e.g., 30 days = 2592000)
     */
    function grantAccess(
        bytes32 recordId,
        address verifier,
        uint256 duration
    ) external transcriptExists(recordId) {
        if (verifier == address(0)) revert InvalidVerifierAddress();
        if (duration == 0 || duration > 365 days) revert InvalidDuration();
        
        // Verify caller owns this transcript
        if (transcripts[recordId].studentHash != keccak256(abi.encodePacked(msg.sender))) {
            revert NotTranscriptOwner();
        }
        
        uint256 expiresAt = block.timestamp + duration;
        
        accessControl[recordId][verifier] = AccessGrant({
            verifier: verifier,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true
        });
        
        emit AccessGranted(recordId, verifier, msg.sender, expiresAt);
    }
    
    /**
     * @dev Revoke access from a verifier (called by student)
     * @param recordId Transcript record ID
     * @param verifier Address of the verifier
     */
    function revokeAccess(
        bytes32 recordId,
        address verifier
    ) external transcriptExists(recordId) {
        if (transcripts[recordId].studentHash != keccak256(abi.encodePacked(msg.sender))) {
            revert NotTranscriptOwner();
        }
        
        if (!accessControl[recordId][verifier].isActive) {
            revert AccessNotGrantedOrRevoked();
        }
        
        accessControl[recordId][verifier].isActive = false;
        
        emit AccessRevoked(recordId, verifier, msg.sender);
    }
    
    /**
     * @dev Verify if a file hash matches the registered transcript
     * @param recordId Transcript record ID
     * @param fileHash SHA-256 hash to verify
     * @return isValid True if hash matches
     */
    function verifyTranscript(
        bytes32 recordId,
        bytes32 fileHash
    ) external transcriptExists(recordId) returns (bool) {
        // Check if verifier has access (or if transcript is public)
        AccessGrant memory access = accessControl[recordId][msg.sender];
        if (!access.isActive || block.timestamp >= access.expiresAt) {
            revert AccessDeniedOrExpired();
        }
        
        bool isValid = transcripts[recordId].fileHash == fileHash;
        
        if (isValid) {
            verificationCount++;
            emit TranscriptVerified(recordId, msg.sender, block.timestamp);
        }
        
        return isValid;
    }
    
    /**
     * @dev Get transcript details (public view)
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
        transcriptExists(recordId)
        returns (
            bytes32 studentHash,
            string memory metadataCID,
            bytes32 fileHash,
            address issuer,
            uint256 timestamp,
            Status status
        )
    {
        Transcript memory t = transcripts[recordId];
        return (
            t.studentHash,
            t.metadataCID,
            t.fileHash,
            t.issuer,
            t.timestamp,
            t.status
        );
    }
    
    /**
     * @dev Check if verifier has active access
     * @param recordId Transcript record ID
     * @param verifier Address to check
     * @return hasAccess True if access is active and not expired
     */
    function checkAccess(bytes32 recordId, address verifier)
        external
        view
        transcriptExists(recordId)
        returns (bool)
    {
        AccessGrant memory access = accessControl[recordId][verifier];
        return access.isActive && block.timestamp < access.expiresAt;
    }
    
    /**
     * @dev Get all transcript IDs for a student
     * @param studentHash Keccak256 hash of student ID
     * @return Array of record IDs
     */
    function getStudentTranscripts(bytes32 studentHash)
        external
        view
        returns (bytes32[] memory)
    {
        return studentTranscripts[studentHash];
    }
    
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
    ) external onlyRegistrar transcriptExists(recordId) {
        Status oldStatus = transcripts[recordId].status;
        if (oldStatus == newStatus) revert StatusAlreadySet();
        
        transcripts[recordId].status = newStatus;
        
        emit TranscriptStatusUpdated(recordId, oldStatus, newStatus, reason);
    }
    
    /**
     * @dev Update registrar address
     * @param newRegistrar New registrar wallet address
     */
    function updateRegistrar(address newRegistrar) external onlyAdmin {
        if (newRegistrar == address(0)) revert InvalidAddress();
        if (newRegistrar == registrar) revert SameRegistrar();
        
        address oldRegistrar = registrar;
        registrar = newRegistrar;
        
        emit RegistrarUpdated(oldRegistrar, newRegistrar);
    }
    
    /**
     * @dev Deactivate contract (emergency only)
     */
    function deactivateContract() external onlyAdmin {
        isActive = false;
    }
    
    /**
     * @dev Reactivate contract
     */
    function activateContract() external onlyAdmin {
        isActive = true;
    }
    
    // ============ Identity Migration ============
    
    event IdentityMigrated(
        bytes32 indexed oldHash,
        bytes32 indexed newHash,
        uint256 count
    );
    
    /**
     * @dev Migrate transcripts from one student identity hash to another
     * @param oldHash The previous student identity hash
     * @param newHash The new student identity hash
     */
    function migrateStudentIdentity(bytes32 oldHash, bytes32 newHash) external onlyRegistrar {
        if (oldHash == bytes32(0) || newHash == bytes32(0)) revert InvalidStudentHash();
        if (oldHash == newHash) revert SameRegistrar(); // using existing error for gas savings
        
        bytes32[] memory records = studentTranscripts[oldHash];
        uint256 len = records.length;
        
        for (uint256 i = 0; i < len; i++) {
            bytes32 recordId = records[i];
            transcripts[recordId].studentHash = newHash;
            studentTranscripts[newHash].push(recordId);
        }
        
        delete studentTranscripts[oldHash];
        
        emit IdentityMigrated(oldHash, newHash, len);
    }
    
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
        )
    {
        return (transcriptCount, verificationCount, isActive);
    }
}
