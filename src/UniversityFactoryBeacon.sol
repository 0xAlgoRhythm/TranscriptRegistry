// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "../lib/openzeppelin-contracts/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "../lib/openzeppelin-contracts/contracts/proxy/beacon/BeaconProxy.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "./TranscriptRegistryUpgradeable.sol";

/**
 * @title UniversityFactoryBeacon
 * @dev Factory contract using Beacon Proxy pattern for gas-efficient deployments
 * @notice Deploys lightweight proxies that share a single implementation contract
 */
contract UniversityFactoryBeacon is Ownable {
    
    // ============ State Variables ============
    
    UpgradeableBeacon public immutable beacon;
    address public immutable implementation;
    uint256 public universityCount;
    
    // University information
    struct UniversityInfo {
        string name;
        address proxyAddress;
        address registrar;
        uint256 deployedAt;
        bool isActive;
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => UniversityInfo) public universities;
    mapping(address => uint256) public proxyToUniversityId;
    mapping(address => bool) public isUniversityProxy;
    
    // ============ Events ============
    
    event UniversityDeployed(
        uint256 indexed universityId,
        address indexed proxyAddress,
        string universityName,
        address indexed registrar,
        uint256 timestamp
    );
    
    event UniversityDeactivated(
        uint256 indexed universityId,
        address indexed proxyAddress,
        string reason
    );
    
    event UniversityReactivated(
        uint256 indexed universityId,
        address indexed proxyAddress
    );
    
    event ImplementationUpgraded(
        address indexed oldImplementation,
        address indexed newImplementation
    );
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // Deploy the implementation contract once
        implementation = address(new TranscriptRegistryUpgradeable());
        
        // Deploy the beacon pointing to implementation
        beacon = new UpgradeableBeacon(implementation, address(this));
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Deploy a new university proxy (lightweight, ~200K gas)
     * @param universityName Name of the university
     * @param registrar Wallet address of the university registrar
     * @return universityId Unique ID for the university
     * @return proxyAddress Address of deployed BeaconProxy
     */
    function deployUniversityProxy(
        string memory universityName,
        address registrar
    )
        external
        onlyOwner
        returns (uint256 universityId, address proxyAddress)
    {
        require(bytes(universityName).length > 0, "Invalid university name");
        require(registrar != address(0), "Invalid registrar address");
        
        // Deploy lightweight BeaconProxy
        BeaconProxy proxy = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(
                TranscriptRegistryUpgradeable.initialize.selector,
                universityName,
                registrar,
                owner() // platform admin
            )
        );
        
        proxyAddress = address(proxy);
        universityId = universityCount;
        
        // Store university information
        universities[universityId] = UniversityInfo({
            name: universityName,
            proxyAddress: proxyAddress,
            registrar: registrar,
            deployedAt: block.timestamp,
            isActive: true
        });
        
        proxyToUniversityId[proxyAddress] = universityId;
        isUniversityProxy[proxyAddress] = true;
        
        universityCount++;
        
        emit UniversityDeployed(
            universityId,
            proxyAddress,
            universityName,
            registrar,
            block.timestamp
        );
        
        return (universityId, proxyAddress);
    }
    
    /**
     * @dev Upgrade the implementation for ALL universities at once
     * @param newImplementation Address of new TranscriptRegistryUpgradeable
     */
    function upgradeImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        
        address oldImplementation = beacon.implementation();
        beacon.upgradeTo(newImplementation);
        
        emit ImplementationUpgraded(oldImplementation, newImplementation);
    }
    
    /**
     * @dev Deactivate a university proxy
     * @param universityId ID of the university
     * @param reason Reason for deactivation
     * @notice The factory owner will call deactivate/activate on the registry
     */
    function deactivateUniversity(
        uint256 universityId,
        string memory reason
    ) external onlyOwner {
        require(universityId < universityCount, "University does not exist");
        require(universities[universityId].isActive, "Already deactivated");
        
        universities[universityId].isActive = false;
        
        // Note: The actual registry deactivation should be done by the platform admin
        // calling deactivateContract() directly on the registry, since the admin
        // in the registry is the platform admin, not the factory
        
        emit UniversityDeactivated(
            universityId,
            universities[universityId].proxyAddress,
            reason
        );
    }
    
    /**
     * @dev Reactivate a university proxy
     * @param universityId ID of the university
     * @notice The factory owner will call deactivate/activate on the registry
     */
    function reactivateUniversity(uint256 universityId) external onlyOwner {
        require(universityId < universityCount, "University does not exist");
        require(!universities[universityId].isActive, "Already active");
        
        universities[universityId].isActive = true;
        
        // Note: The actual registry activation should be done by the platform admin
        // calling activateContract() directly on the registry
        
        emit UniversityReactivated(
            universityId,
            universities[universityId].proxyAddress
        );
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get current implementation address
     * @return Address of TranscriptRegistryUpgradeable implementation
     */
    function getImplementation() external view returns (address) {
        return beacon.implementation();
    }
    
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
     * @dev Get university ID from proxy address
     * @param proxyAddress Address of BeaconProxy
     * @return universityId ID of the university
     */
    function getUniversityIdByProxy(address proxyAddress)
        external
        view
        returns (uint256)
    {
        require(isUniversityProxy[proxyAddress], "Not a university proxy");
        return proxyToUniversityId[proxyAddress];
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
        
        uint256 actualLimit = limit;
        if (offset + limit > universityCount) {
            actualLimit = universityCount - offset;
        }
        
        uint256 activeCount = 0;
        for (uint256 i = offset; i < offset + actualLimit; i++) {
            if (universities[i].isActive) {
                activeCount++;
            }
        }
        
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
    
    /**
     * @dev Get version of a specific university's implementation
     * @param universityId ID of the university
     * @return Version string
     */
    function getUniversityVersion(uint256 universityId)
        external
        view
        returns (string memory)
    {
        require(universityId < universityCount, "University does not exist");
        
        TranscriptRegistryUpgradeable registry = TranscriptRegistryUpgradeable(
            universities[universityId].proxyAddress
        );
        
        return registry.version();
    }
}