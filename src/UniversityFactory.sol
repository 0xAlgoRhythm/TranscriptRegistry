// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TranscriptRegistry.sol";

/**
 * @title UniversityFactory
 * @dev Factory contract to deploy and manage university-specific transcript registries
 * @notice Only platform admin can deploy new university contracts
 */
contract UniversityFactory {
    // ============ State Variables ============
    
    address public immutable platformAdmin;
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
        require(msg.sender == platformAdmin, "Only platform admin");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        platformAdmin = msg.sender;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Deploy a new university transcript registry contract
     * @param universityName Name of the university
     * @param registrar Wallet address of the university registrar
     * @return universityId Unique ID for the university
     * @return contractAddress Address of deployed TranscriptRegistry
     */
    function deployUniversityContract(
        string memory universityName,
        address registrar
    )
        external
        onlyPlatformAdmin
        returns (uint256 universityId, address contractAddress)
    {
        require(bytes(universityName).length > 0, "Invalid university name");
        require(registrar != address(0), "Invalid registrar address");
        
        // Deploy new TranscriptRegistry contract
        TranscriptRegistry newRegistry = new TranscriptRegistry(
            universityName,
            registrar
        );
        
        contractAddress = address(newRegistry);
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
        require(universityId < universityCount, "University does not exist");
        require(universities[universityId].isActive, "Already deactivated");
        
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
        require(universityId < universityCount, "University does not exist");
        require(!universities[universityId].isActive, "Already active");
        
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
        require(universityId < universityCount, "University does not exist");
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
        require(isUniversityContract[contractAddress], "Not a university contract");
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
        require(offset < universityCount, "Offset out of bounds");
        
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
     * @return Total universities, active count
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