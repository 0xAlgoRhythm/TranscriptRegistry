// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TranscriptRegistry.sol";
import "../lib/openzeppelin-contracts/contracts/proxy/Clones.sol";

/**
 * @title UniversityFactory
 * @dev Factory contract to deploy and manage university-specific transcript registries using minimal proxy clones
 * @notice Only platform admin can deploy new university contracts
 */
contract UniversityFactory {
    // ============ Custom Errors ============
    
    error OnlyPlatformAdmin();
    error InvalidUniversityName();
    error InvalidRegistrarAddress();
    error UniversityDoesNotExist();
    error AlreadyDeactivated();
    error AlreadyActive();
    error NotUniversityContract();
    error OffsetOutOfBounds();

    // ============ State Variables ============
    
    address public immutable platformAdmin;
    address public immutable implementation;
    uint256 public universityCount;
    
    // University information
    struct UniversityInfo {
        string name;
        address contractAddress;
        address registrar;
        uint256 deployedAt;
        bool isActive;
    }
    
    // ============ Mappings ============
    
    // universityId => UniversityInfo
    mapping(uint256 => UniversityInfo) public universities;
    
    // contractAddress => universityId
    mapping(address => uint256) public contractToUniversityId;
    
    // Check if an address is a registered university contract
    mapping(address => bool) public isUniversityContract;
    
    // ============ Events ============
    
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
    
    // ============ Modifiers ============
    
    modifier onlyPlatformAdmin() {
        if (msg.sender != platformAdmin) revert OnlyPlatformAdmin();
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        platformAdmin = msg.sender;
        // Deploy single TranscriptRegistry master implementation contract
        implementation = address(new TranscriptRegistry());
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Deploy a new university transcript registry contract using minimal proxy clones
     * @param universityName Name of the university
     * @param registrar Wallet address of the university registrar
     * @return universityId Unique ID for the university
     * @return contractAddress Address of deployed TranscriptRegistry clone
     */
    function deployUniversityContract(
        string memory universityName,
        address registrar
    )
        external
        onlyPlatformAdmin
        returns (uint256 universityId, address contractAddress)
    {
        if (bytes(universityName).length == 0) revert InvalidUniversityName();
        if (registrar == address(0)) revert InvalidRegistrarAddress();
        
        // Clone the master implementation using Clones.clone
        address clone = Clones.clone(implementation);
        
        // Initialize the clone, setting admin to the factory contract
        TranscriptRegistry(clone).initialize(universityName, registrar, address(this));
        
        contractAddress = clone;
        universityId = universityCount;
        
        // Store university information
        universities[universityId] = UniversityInfo({
            name: universityName,
            contractAddress: contractAddress,
            registrar: registrar,
            deployedAt: block.timestamp,
            isActive: true
        });
        
        contractToUniversityId[contractAddress] = universityId;
        isUniversityContract[contractAddress] = true;
        
        universityCount++;
        
        emit UniversityDeployed(
            universityId,
            contractAddress,
            universityName,
            registrar,
            block.timestamp
        );
        
        return (universityId, contractAddress);
    }
    
    /**
     * @dev Deactivate a university contract (emergency use)
     * @param universityId ID of the university
     * @param reason Reason for deactivation
     */
    function deactivateUniversity(
        uint256 universityId,
        string memory reason
    ) external onlyPlatformAdmin {
        if (universityId >= universityCount) revert UniversityDoesNotExist();
        if (!universities[universityId].isActive) revert AlreadyDeactivated();
        
        universities[universityId].isActive = false;
        
        // Deactivate the underlying transcript registry
        TranscriptRegistry registry = TranscriptRegistry(
            universities[universityId].contractAddress
        );
        registry.deactivateContract();
        
        emit UniversityDeactivated(
            universityId,
            universities[universityId].contractAddress,
            reason
        );
    }
    
    /**
     * @dev Reactivate a university contract
     * @param universityId ID of the university
     */
    function reactivateUniversity(uint256 universityId)
        external
        onlyPlatformAdmin
    {
        if (universityId >= universityCount) revert UniversityDoesNotExist();
        if (universities[universityId].isActive) revert AlreadyActive();
        
        universities[universityId].isActive = true;
        
        // Reactivate the underlying transcript registry
        TranscriptRegistry registry = TranscriptRegistry(
            universities[universityId].contractAddress
        );
        registry.activateContract();
        
        emit UniversityReactivated(
            universityId,
            universities[universityId].contractAddress
        );
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get university information by ID
     * @param universityId ID of the university
     * @return University info struct
     */
    function getUniversity(uint256 universityId)
        external
        view
        returns (UniversityInfo memory)
    {
        if (universityId >= universityCount) revert UniversityDoesNotExist();
        return universities[universityId];
    }
    
    /**
     * @dev Get university ID from contract address
     * @param contractAddress Address of TranscriptRegistry
     * @return universityId ID of the university
     */
    function getUniversityIdByContract(address contractAddress)
        external
        view
        returns (uint256)
    {
        if (!isUniversityContract[contractAddress]) revert NotUniversityContract();
        return contractToUniversityId[contractAddress];
    }
    
    /**
     * @dev Get all active universities (paginated)
     * @param offset Starting index
     * @param limit Number of results
     * @return Array of university IDs
     */
    function getActiveUniversities(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory)
    {
        if (offset >= universityCount) revert OffsetOutOfBounds();
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > universityCount) {
            actualLimit = universityCount - offset;
        }
        
        // Count active universities in range
        uint256 activeCount = 0;
        for (uint256 i = offset; i < offset + actualLimit; i++) {
            if (universities[i].isActive) {
                activeCount++;
            }
        }
        
        // Populate result array
        uint256[] memory result = new uint256[](activeCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = offset; i < offset + actualLimit; i++) {
            if (universities[i].isActive) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get platform statistics
     * @return totalUniversities Total number of universities deployed
     * @return activeCount Number of active universities
     */
    function getPlatformStats()
        external
        view
        returns (uint256 totalUniversities, uint256 activeCount)
    {
        totalUniversities = universityCount;
        
        for (uint256 i = 0; i < universityCount; i++) {
            if (universities[i].isActive) {
                activeCount++;
            }
        }
        
        return (totalUniversities, activeCount);
    }
}