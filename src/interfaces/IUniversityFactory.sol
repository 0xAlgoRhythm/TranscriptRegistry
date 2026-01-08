// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUniversityFactory
 * @dev Interface for the UniversityFactory contract
 * @notice This interface defines all public functions for factory management
 */
interface IUniversityFactory {
    
    // ============ Structs ============
    
    struct UniversityInfo {
        string name;
        address contractAddress;
        address registrar;
        uint256 deployedAt;
        bool isActive;
    }
    
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
    
    // ============ State Variables (View Functions) ============
    
    function platformAdmin() external view returns (address);
    
    function universityCount() external view returns (uint256);
    
    function isUniversityContract(address contractAddress) external view returns (bool);
    
    function contractToUniversityId(address contractAddress) external view returns (uint256);
    
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
    ) external returns (uint256 universityId, address contractAddress);
    
    /**
     * @dev Deactivate a university contract (emergency use)
     * @param universityId ID of the university
     * @param reason Reason for deactivation
     */
    function deactivateUniversity(
        uint256 universityId,
        string memory reason
    ) external;
    
    /**
     * @dev Reactivate a university contract
     * @param universityId ID of the university
     */
    function reactivateUniversity(uint256 universityId) external;
    
    // ============ View Functions ============
    
    /**
     * @dev Get university information by ID
     * @param universityId ID of the university
     * @return University info struct
     */
    function getUniversity(uint256 universityId)
        external
        view
        returns (UniversityInfo memory);
    
    /**
     * @dev Get university ID from contract address
     * @param contractAddress Address of TranscriptRegistry
     * @return universityId ID of the university
     */
    function getUniversityIdByContract(address contractAddress)
        external
        view
        returns (uint256);
    
    /**
     * @dev Get all active universities (paginated)
     * @param offset Starting index
     * @param limit Number of results
     * @return Array of university IDs
     */
    function getActiveUniversities(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory);
    
    /**
     * @dev Get platform statistics
     * @return totalUniversities Total number of universities deployed
     * @return activeCount Number of active universities
     */
    function getPlatformStats()
        external
        view
        returns (uint256 totalUniversities, uint256 activeCount);
}