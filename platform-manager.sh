#!/bin/bash

# ================================================================
# TRANSCRIPT REGISTRY PLATFORM - V1 MANAGEMENT SCRIPT
# ================================================================
# Comprehensive CLI tool to manage all smart contract features
# Author: Your Name
# Version: 1.0.0
# ================================================================

set -e

# Color codes for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# RPC URL
RPC_URL="https://sepolia.drpc.org"

# ================================================================
# UTILITY FUNCTIONS
# ================================================================

print_header() {
    echo -e "\n${CYAN}================================================================${NC}"
    echo -e "${BOLD}${MAGENTA}$1${NC}"
    echo -e "${CYAN}================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_section() {
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

pause() {
    echo -e "\n${CYAN}Press any key to continue...${NC}"
    read -n 1 -s
}

# ================================================================
# MAIN MENU
# ================================================================

show_main_menu() {
    clear
    print_header "TRANSCRIPT REGISTRY PLATFORM - V1 MANAGER"
    echo -e "${BOLD}Select an option:${NC}\n"
    echo -e "  ${GREEN}[1]${NC} Platform Overview & Statistics"
    echo -e "  ${GREEN}[2]${NC} University Management"
    echo -e "  ${GREEN}[3]${NC} Transcript Registration"
    echo -e "  ${GREEN}[4]${NC} Access Control Management"
    echo -e "  ${GREEN}[5]${NC} Transcript Verification"
    echo -e "  ${GREEN}[6]${NC} Record Management (Update Status)"
    echo -e "  ${GREEN}[7]${NC} Admin Functions"
    echo -e "  ${GREEN}[8]${NC} Complete Demo (All Features)"
    echo -e "  ${GREEN}[9]${NC} View Deployment Info"
    echo -e "  ${RED}[0]${NC} Exit"
    echo -e "\n${CYAN}════════════════════════════════════════════════════${NC}"
    echo -n -e "${BOLD}Enter choice: ${NC}"
}

# ================================================================
# 1. PLATFORM OVERVIEW & STATISTICS
# ================================================================

platform_overview() {
    print_header "PLATFORM OVERVIEW & STATISTICS"
    
    print_section "Factory Information"
    forge script script/TestDeployedContracts.s.sol:CheckFactoryStatus \
        --rpc-url $RPC_URL \
        -vv
    
    pause
}

# ================================================================
# 2. UNIVERSITY MANAGEMENT
# ================================================================

university_menu() {
    clear
    print_header "UNIVERSITY MANAGEMENT"
    echo -e "${BOLD}Select an option:${NC}\n"
    echo -e "  ${GREEN}[1]${NC} List All Universities"
    echo -e "  ${GREEN}[2]${NC} View University Details"
    echo -e "  ${GREEN}[3]${NC} Update University Registrar"
    echo -e "  ${GREEN}[4]${NC} Activate/Deactivate University"
    echo -e "  ${RED}[0]${NC} Back to Main Menu"
    echo -e "\n${CYAN}════════════════════════════════════════════════════${NC}"
    echo -n -e "${BOLD}Enter choice: ${NC}"
    
    read choice
    case $choice in
        1) list_universities ;;
        2) view_university_details ;;
        3) update_registrar ;;
        4) toggle_university_status ;;
        0) return ;;
        *) print_error "Invalid choice"; sleep 2; university_menu ;;
    esac
}

list_universities() {
    print_section "All Registered Universities"
    forge script script/TestDeployedContracts.s.sol:CheckFactoryStatus \
        --rpc-url $RPC_URL \
        -vv
    pause
    university_menu
}

view_university_details() {
    print_section "University Details"
    echo -e "${CYAN}Available Universities:${NC}"
    echo "  [0] KNUST"
    echo "  [1] UG"
    echo "  [2] UCC"
    echo -n -e "\n${BOLD}Enter university ID: ${NC}"
    read uni_id
    
    # Show detailed stats for the selected university
    forge script script/TestDeployedContracts.s.sol:CheckFactoryStatus \
        --rpc-url $RPC_URL \
        -vv
    
    pause
    university_menu
}

update_registrar() {
    print_section "Update University Registrar"
    print_warning "This requires admin privileges"
    
    echo -n -e "${BOLD}Enter new registrar address: ${NC}"
    read new_registrar
    
    echo -n -e "${BOLD}Enter registry address: ${NC}"
    read registry_addr
    
    print_info "Updating registrar to: $new_registrar"
    
    # Create a temporary script for this operation
    cat > script/TempUpdateRegistrar.s.sol << EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TranscriptRegistry.sol";

contract UpdateRegistrar is Script {
    function run() external {
        address registryAddress = vm.envAddress("TEMP_REGISTRY_ADDRESS");
        address newRegistrar = vm.envAddress("TEMP_NEW_REGISTRAR");
        uint256 adminKey = vm.envUint("ADMIN_PRIVATE_KEY");
        
        vm.startBroadcast(adminKey);
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        registry.updateRegistrar(newRegistrar);
        vm.stopBroadcast();
        
        console.log("Registrar updated successfully!");
    }
}
EOF
    
    TEMP_REGISTRY_ADDRESS=$registry_addr TEMP_NEW_REGISTRAR=$new_registrar \
    forge script script/TempUpdateRegistrar.s.sol:UpdateRegistrar \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vv
    
    rm script/TempUpdateRegistrar.s.sol
    print_success "Registrar updated successfully!"
    pause
    university_menu
}

toggle_university_status() {
    print_section "Activate/Deactivate University"
    echo -n -e "${BOLD}Enter registry address: ${NC}"
    read registry_addr
    
    echo -e "\n${BOLD}Select action:${NC}"
    echo "  [1] Activate"
    echo "  [2] Deactivate"
    echo -n -e "\n${BOLD}Enter choice: ${NC}"
    read action
    
    cat > script/TempToggleStatus.s.sol << EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TranscriptRegistry.sol";

contract ToggleStatus is Script {
    function run() external {
        address registryAddress = vm.envAddress("TEMP_REGISTRY_ADDRESS");
        uint256 adminKey = vm.envUint("ADMIN_PRIVATE_KEY");
        bool shouldActivate = vm.envBool("TEMP_ACTIVATE");
        
        vm.startBroadcast(adminKey);
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        
        if (shouldActivate) {
            registry.activateContract();
            console.log("Contract activated!");
        } else {
            registry.deactivateContract();
            console.log("Contract deactivated!");
        }
        vm.stopBroadcast();
    }
}
EOF
    
    activate_flag=$([[ $action == "1" ]] && echo "true" || echo "false")
    
    TEMP_REGISTRY_ADDRESS=$registry_addr TEMP_ACTIVATE=$activate_flag \
    forge script script/TempToggleStatus.s.sol:ToggleStatus \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vv
    
    rm script/TempToggleStatus.s.sol
    print_success "Status updated successfully!"
    pause
    university_menu
}

# ================================================================
# 3. TRANSCRIPT REGISTRATION
# ================================================================

transcript_registration() {
    print_header "TRANSCRIPT REGISTRATION"
    
    print_section "Register New Transcript"
    print_info "Using pre-configured test data..."
    
    forge script script/TestDeployedContracts.s.sol:TestRegisterTranscript \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
    
    print_success "Transcript registered successfully!"
    echo -e "\n${YELLOW}IMPORTANT: Save the Record ID shown above for access control!${NC}"
    pause
}

# ================================================================
# 4. ACCESS CONTROL MANAGEMENT
# ================================================================

access_control_menu() {
    clear
    print_header "ACCESS CONTROL MANAGEMENT"
    echo -e "${BOLD}Select an option:${NC}\n"
    echo -e "  ${GREEN}[1]${NC} Grant Access to Verifier"
    echo -e "  ${GREEN}[2]${NC} Revoke Access from Verifier"
    echo -e "  ${GREEN}[3]${NC} Check Access Status"
    echo -e "  ${RED}[0]${NC} Back to Main Menu"
    echo -e "\n${CYAN}════════════════════════════════════════════════════${NC}"
    echo -n -e "${BOLD}Enter choice: ${NC}"
    
    read choice
    case $choice in
        1) grant_access ;;
        2) revoke_access ;;
        3) check_access ;;
        0) return ;;
        *) print_error "Invalid choice"; sleep 2; access_control_menu ;;
    esac
}

grant_access() {
    print_section "Grant Access to Verifier"
    
    forge script script/TestDeployedContracts.s.sol:TestGrantAccess \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
    
    print_success "Access granted successfully!"
    pause
    access_control_menu
}

revoke_access() {
    print_section "Revoke Access from Verifier"
    
    forge script script/TestDeployedContracts.s.sol:TestRevokeAccess \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
    
    print_success "Access revoked successfully!"
    pause
    access_control_menu
}

check_access() {
    print_section "Check Access Status"
    
    echo -n -e "${BOLD}Enter Record ID: ${NC}"
    read record_id
    
    echo -n -e "${BOLD}Enter Verifier Address: ${NC}"
    read verifier_addr
    
    cat > script/TempCheckAccess.s.sol << EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TranscriptRegistry.sol";

contract CheckAccess is Script {
    function run() external view {
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        bytes32 recordId = vm.envBytes32("TEMP_RECORD_ID");
        address verifier = vm.envAddress("TEMP_VERIFIER");
        
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        bool hasAccess = registry.checkAccess(recordId, verifier);
        
        console.log("Access Status:", hasAccess);
    }
}
EOF
    
    TEMP_RECORD_ID=$record_id TEMP_VERIFIER=$verifier_addr \
    forge script script/TempCheckAccess.s.sol:CheckAccess \
        --rpc-url $RPC_URL \
        -vv
    
    rm script/TempCheckAccess.s.sol
    pause
    access_control_menu
}

# ================================================================
# 5. TRANSCRIPT VERIFICATION
# ================================================================

transcript_verification() {
    print_header "TRANSCRIPT VERIFICATION"
    
    print_section "Verify Transcript"
    print_info "This will verify the test transcript..."
    
    forge script script/TestDeployedContracts.s.sol:TestVerifyTranscript \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
    
    print_success "Verification completed!"
    pause
}

# ================================================================
# 6. RECORD MANAGEMENT
# ================================================================

record_management() {
    print_header "RECORD MANAGEMENT"
    
    print_section "Update Transcript Status"
    
    echo -e "${BOLD}Select new status:${NC}"
    echo "  [0] Active"
    echo "  [1] Revoked"
    echo "  [2] Amended"
    echo -n -e "\n${BOLD}Enter choice: ${NC}"
    read status_choice
    
    echo -n -e "${BOLD}Enter reason for status change: ${NC}"
    read reason
    
    echo -n -e "${BOLD}Enter Record ID: ${NC}"
    read record_id
    
    cat > script/TempUpdateStatus.s.sol << EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TranscriptRegistry.sol";

contract UpdateStatus is Script {
    function run() external {
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS_KNUST");
        bytes32 recordId = vm.envBytes32("TEMP_RECORD_ID");
        uint8 newStatus = uint8(vm.envUint("TEMP_STATUS"));
        string memory reason = vm.envString("TEMP_REASON");
        uint256 registrarKey = vm.envUint("REGISTRAR_PRIVATE_KEY_KNUST");
        
        vm.startBroadcast(registrarKey);
        TranscriptRegistry registry = TranscriptRegistry(registryAddress);
        registry.updateTranscriptStatus(recordId, TranscriptRegistry.Status(newStatus), reason);
        vm.stopBroadcast();
        
        console.log("Status updated successfully!");
    }
}
EOF
    
    TEMP_RECORD_ID=$record_id TEMP_STATUS=$status_choice TEMP_REASON="$reason" \
    forge script script/TempUpdateStatus.s.sol:UpdateStatus \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vv
    
    rm script/TempUpdateStatus.s.sol
    print_success "Status updated successfully!"
    pause
}

# ================================================================
# 7. ADMIN FUNCTIONS
# ================================================================

admin_menu() {
    clear
    print_header "ADMIN FUNCTIONS"
    echo -e "${BOLD}Select an option:${NC}\n"
    echo -e "  ${GREEN}[1]${NC} View All Contract Stats"
    echo -e "  ${GREEN}[2]${NC} Emergency Deactivate Contract"
    echo -e "  ${GREEN}[3]${NC} Reactivate Contract"
    echo -e "  ${GREEN}[4]${NC} Update Registrar"
    echo -e "  ${GREEN}[5]${NC} View Deployment Addresses"
    echo -e "  ${RED}[0]${NC} Back to Main Menu"
    echo -e "\n${CYAN}════════════════════════════════════════════════════${NC}"
    echo -n -e "${BOLD}Enter choice: ${NC}"
    
    read choice
    case $choice in
        1) view_all_stats ;;
        2) emergency_deactivate ;;
        3) reactivate_contract ;;
        4) update_registrar ;;
        5) view_deployment_info ;;
        0) return ;;
        *) print_error "Invalid choice"; sleep 2; admin_menu ;;
    esac
}

view_all_stats() {
    print_section "Complete Platform Statistics"
    forge script script/TestDeployedContracts.s.sol:CheckFactoryStatus \
        --rpc-url $RPC_URL \
        -vv
    pause
    admin_menu
}

emergency_deactivate() {
    print_section "Emergency Contract Deactivation"
    print_warning "This will deactivate the contract immediately!"
    echo -n -e "${BOLD}Are you sure? (yes/no): ${NC}"
    read confirm
    
    if [[ $confirm == "yes" ]]; then
        toggle_university_status
    else
        print_info "Operation cancelled"
    fi
    pause
    admin_menu
}

reactivate_contract() {
    print_section "Reactivate Contract"
    toggle_university_status
    pause
    admin_menu
}

# ================================================================
# 8. COMPLETE DEMO
# ================================================================

complete_demo() {
    print_header "COMPLETE PLATFORM DEMO - V1"
    print_info "This will demonstrate ALL platform features sequentially"
    echo -e "\n${YELLOW}Duration: ~5 minutes${NC}"
    echo -e "${YELLOW}This demo will:${NC}"
    echo "  1. Show platform overview"
    echo "  2. List all universities"
    echo "  3. Register a test transcript"
    echo "  4. Grant access to verifier"
    echo "  5. Verify the transcript"
    echo "  6. Revoke access"
    echo "  7. Show final statistics"
    
    echo -n -e "\n${BOLD}Start demo? (yes/no): ${NC}"
    read confirm
    
    if [[ $confirm != "yes" ]]; then
        print_info "Demo cancelled"
        sleep 2
        return
    fi
    
    # Step 1: Platform Overview
    print_section "STEP 1: Platform Overview"
    platform_overview
    
    # Step 2: List Universities
    print_section "STEP 2: University Listings"
    list_universities
    
    # Step 3: Register Transcript
    print_section "STEP 3: Register Test Transcript"
    transcript_registration
    
    # Step 4: Grant Access
    print_section "STEP 4: Grant Access to Verifier"
    grant_access
    
    # Step 5: Verify Transcript
    print_section "STEP 5: Verify Transcript"
    transcript_verification
    
    # Step 6: Revoke Access
    print_section "STEP 6: Revoke Access"
    revoke_access
    
    # Step 7: Final Stats
    print_section "STEP 7: Final Statistics"
    view_all_stats
    
    print_header "DEMO COMPLETED SUCCESSFULLY!"
    print_success "All platform features demonstrated!"
    echo -e "\n${GREEN}Your V1 is ready for presentation! 🎉${NC}\n"
    pause
}

# ================================================================
# 9. VIEW DEPLOYMENT INFO
# ================================================================

view_deployment_info() {
    print_header "DEPLOYMENT INFORMATION"
    
    echo -e "${BOLD}${CYAN}Contract Addresses:${NC}"
    echo "════════════════════════════════════════════════════"
    
    if [ -f .env ]; then
        echo -e "\n${YELLOW}Factory:${NC}"
        grep "FACTORY_ADDRESS" .env | sed 's/FACTORY_ADDRESS=//'
        
        echo -e "\n${YELLOW}Universities:${NC}"
        echo -e "KNUST Registry: $(grep "REGISTRY_ADDRESS_KNUST" .env | sed 's/REGISTRY_ADDRESS_KNUST=//')"
        echo -e "UG Registry:    $(grep "REGISTRY_ADDRESS_UG" .env | sed 's/REGISTRY_ADDRESS_UG=//')"
        echo -e "UCC Registry:   $(grep "REGISTRY_ADDRESS_UCC" .env | sed 's/REGISTRY_ADDRESS_UCC=//')"
        
        echo -e "\n${YELLOW}Registrars:${NC}"
        echo -e "KNUST: $(grep "REGISTRAR_ADDRESS_KNUST" .env | sed 's/REGISTRAR_ADDRESS_KNUST=//')"
        echo -e "UG:    $(grep "REGISTRAR_ADDRESS_UG" .env | sed 's/REGISTRAR_ADDRESS_UG=//')"
        echo -e "UCC:   $(grep "REGISTRAR_ADDRESS_UCC" .env | sed 's/REGISTRAR_ADDRESS_UCC=//')"
        
        echo -e "\n${YELLOW}Test Accounts:${NC}"
        echo -e "Student:   $(grep "TEST_STUDENT_ADDRESS" .env | sed 's/TEST_STUDENT_ADDRESS=//')"
        echo -e "Verifier:  $(grep "TEST_VERIFIER_ADDRESS" .env | sed 's/TEST_VERIFIER_ADDRESS=//')"
    else
        print_error ".env file not found!"
    fi
    
    echo -e "\n${YELLOW}Etherscan Links:${NC}"
    echo "Factory: https://sepolia.etherscan.io/address/$(grep "FACTORY_ADDRESS" .env | sed 's/FACTORY_ADDRESS=//')"
    echo "KNUST:   https://sepolia.etherscan.io/address/$(grep "REGISTRY_ADDRESS_KNUST" .env | sed 's/REGISTRY_ADDRESS_KNUST=//')"
    
    pause
}

# ================================================================
# MAIN LOOP
# ================================================================

main() {
    while true; do
        show_main_menu
        read choice
        
        case $choice in
            1) platform_overview ;;
            2) university_menu ;;
            3) transcript_registration ;;
            4) access_control_menu ;;
            5) transcript_verification ;;
            6) record_management ;;
            7) admin_menu ;;
            8) complete_demo ;;
            9) view_deployment_info ;;
            0) 
                print_header "Thank you for using Transcript Registry Platform!"
                print_success "Goodbye! 👋"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                sleep 2
                ;;
        esac
    done
}

# ================================================================
# START APPLICATION
# ================================================================

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Please create a .env file with your contract addresses"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Start the application
main