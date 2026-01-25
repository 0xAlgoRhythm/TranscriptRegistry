// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/initializable.sol";

/**
 * @title TranscriptRegistryUpgradeable
 * @dev Upgradeable version of TranscriptRegistry using OpenZeppelin's Initializable
 * @notice This contract will be deployed once as implementation, then used via BeaconProxy
 */
contract TranscriptRegistryUpgradeable is Initializable {
    // ============ State Variables ============
    
    address public admin;
    address public registrar;
    string public universityName;
    bool public isActive;
    
    uint256 public transcriptCount;
    uint256 public verificationCount;
    
    // Transcript status enum
    enum Status { Active, Revoked, Amended }
    
    // Transcript structure
    struct Transcript {
        bytes32 studentHash;
        string metadataCID;
        bytes32 fileHash;
        address issuer;
        uint256 timestamp;
        Status status;
        bool exists;
    }
    
    // Access control structure
    struct AccessGrant {
        address verifier;
        uint256 grantedAt;
        uint256 expiresAt;
        bool isActive;
    }
    
    // ============ Mappings ============
    
    mapping(bytes32 => Transcript) public transcripts;
    mapping(bytes32 => mapping(address => AccessGrant)) public accessControl;
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
        require(msg.sender == admin, "Only admin can call this");
        _;
    }
    
    modifier onlyAdminOrFactory() {
        require(msg.sender == admin || msg.sender == address(0), "Only admin or factory can call this");
        _;
    }
    
    modifier onlyRegistrar() {
        require(msg.sender == registrar, "Only registrar can call this");
        _;
    }
    
    modifier onlyActiveContract() {
        require(isActive, "Contract is not active");
        _;
    }
    
    modifier transcriptExists(bytes32 recordId) {
        require(transcripts[recordId].exists, "Transcript does not exist");
        _;
    }
    
    // ============ Constructor (Disabled for Upgradeable) ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    // ============ Initializer (Replaces Constructor) ============
    
    /**
     * @dev Initialize the contract (called once per proxy)
     * @param _universityName Name of the university
     * @param _registrar Address of the university registrar
     * @param _admin Address of the platform admin
     */
    function initialize(
        string memory _universityName,
        address _registrar,
        address _admin
    ) external initializer {
        require(_registrar != address(0), "Invalid registrar address");
        require(_admin != address(0), "Invalid admin address");
        
        admin = _admin;
        registrar = _registrar;
        universityName = _universityName;
        isActive = true;
    }
    
    // ============ Core Functions ============
    
    function registerTranscript(
        bytes32 studentHash,
        string memory metadataCID,
        bytes32 fileHash
    ) external onlyRegistrar onlyActiveContract returns (bytes32) {
        require(studentHash != bytes32(0), "Invalid student hash");
        require(bytes(metadataCID).length > 0, "Invalid metadata CID");
        require(fileHash != bytes32(0), "Invalid file hash");
        
        bytes32 recordId = keccak256(
            abi.encodePacked(
                studentHash,
                fileHash,
                block.timestamp,
                transcriptCount
            )
        );
        
        require(!transcripts[recordId].exists, "Record ID collision");
        
        transcripts[recordId] = Transcript({
            studentHash: studentHash,
            metadataCID: metadataCID,
            fileHash: fileHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            status: Status.Active,
            exists: true
        });
        
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
    
    function grantAccess(
        bytes32 recordId,
        address verifier,
        uint256 duration
    ) external transcriptExists(recordId) {
        require(verifier != address(0), "Invalid verifier address");
        require(duration > 0 && duration <= 365 days, "Invalid duration");
        
        require(
            transcripts[recordId].studentHash == keccak256(abi.encodePacked(msg.sender)),
            "Not the transcript owner"
        );
        
        uint256 expiresAt = block.timestamp + duration;
        
        accessControl[recordId][verifier] = AccessGrant({
            verifier: verifier,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true
        });
        
        emit AccessGranted(recordId, verifier, msg.sender, expiresAt);
    }
    
    function revokeAccess(
        bytes32 recordId,
        address verifier
    ) external transcriptExists(recordId) {
        require(
            transcripts[recordId].studentHash == keccak256(abi.encodePacked(msg.sender)),
            "Not the transcript owner"
        );
        
        require(
            accessControl[recordId][verifier].isActive,
            "Access not granted or already revoked"
        );
        
        accessControl[recordId][verifier].isActive = false;
        
        emit AccessRevoked(recordId, verifier, msg.sender);
    }
    
    function verifyTranscript(
        bytes32 recordId,
        bytes32 fileHash
    ) external transcriptExists(recordId) returns (bool) {
        AccessGrant memory access = accessControl[recordId][msg.sender];
        require(
            access.isActive && block.timestamp < access.expiresAt,
            "Access denied or expired"
        );
        
        bool isValid = transcripts[recordId].fileHash == fileHash;
        
        if (isValid) {
            verificationCount++;
            emit TranscriptVerified(recordId, msg.sender, block.timestamp);
        }
        
        return isValid;
    }
    
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
    
    function checkAccess(bytes32 recordId, address verifier)
        external
        view
        transcriptExists(recordId)
        returns (bool)
    {
        AccessGrant memory access = accessControl[recordId][verifier];
        return access.isActive && block.timestamp < access.expiresAt;
    }
    
    function getStudentTranscripts(bytes32 studentHash)
        external
        view
        returns (bytes32[] memory)
    {
        return studentTranscripts[studentHash];
    }
    
    // ============ Admin Functions ============
    
    function updateTranscriptStatus(
        bytes32 recordId,
        Status newStatus,
        string memory reason
    ) external onlyRegistrar transcriptExists(recordId) {
        Status oldStatus = transcripts[recordId].status;
        require(oldStatus != newStatus, "Status already set");
        
        transcripts[recordId].status = newStatus;
        
        emit TranscriptStatusUpdated(recordId, oldStatus, newStatus, reason);
    }
    
    function updateRegistrar(address newRegistrar) external onlyAdmin {
        require(newRegistrar != address(0), "Invalid address");
        require(newRegistrar != registrar, "Same as current registrar");
        
        address oldRegistrar = registrar;
        registrar = newRegistrar;
        
        emit RegistrarUpdated(oldRegistrar, newRegistrar);
    }
    
    function deactivateContract() external {
        require(msg.sender == admin, "Only admin can call this");
        isActive = false;
    }
    
    function activateContract() external {
        require(msg.sender == admin, "Only admin can call this");
        isActive = true;
    }
    
    // ============ View Functions ============
    
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
    
    /**
     * @dev Returns the version of the implementation
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
# commit-marker-66
