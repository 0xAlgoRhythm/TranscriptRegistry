#!/bin/bash

# ================================================================
# QUICK TEST SCRIPT - For Rapid Feature Testing
# ================================================================
# This script runs individual tests without the interactive menu
# Usage: ./quick-test.sh [test-name]
# ================================================================

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

RPC_URL="https://sepolia.drpc.org"

# Load environment variables
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

set -a
source .env
set +a

print_usage() {
    echo -e "${CYAN}Usage: ./quick-test.sh [test-name]${NC}\n"
    echo "Available tests:"
    echo "  status          - Check factory and university status"
    echo "  register        - Register a new transcript"
    echo "  grant           - Grant access to verifier"
    echo "  verify          - Verify transcript"
    echo "  revoke          - Revoke access from verifier"
    echo "  student         - Get all student transcripts"
    echo "  all             - Run all tests in sequence"
    echo ""
    echo "Examples:"
    echo "  ./quick-test.sh status"
    echo "  ./quick-test.sh register"
    echo "  ./quick-test.sh all"
}

run_status() {
    echo -e "${CYAN}Checking platform status...${NC}"
    forge script script/TestDeployedContracts.s.sol:CheckFactoryStatus \
        --rpc-url $RPC_URL \
        -vv
}

run_register() {
    echo -e "${CYAN}Registering new transcript...${NC}"
    forge script script/TestDeployedContracts.s.sol:TestRegisterTranscript \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
}

run_grant() {
    echo -e "${CYAN}Granting access to verifier...${NC}"
    forge script script/TestDeployedContracts.s.sol:TestGrantAccess \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
}

run_verify() {
    echo -e "${CYAN}Verifying transcript...${NC}"
    forge script script/TestDeployedContracts.s.sol:TestVerifyTranscript \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
}

run_revoke() {
    echo -e "${CYAN}Revoking access...${NC}"
    forge script script/TestDeployedContracts.s.sol:TestRevokeAccess \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        -vvv
}

run_student() {
    echo -e "${CYAN}Getting student transcripts...${NC}"
    forge script script/TestDeployedContracts.s.sol:GetStudentTranscripts \
        --rpc-url $RPC_URL \
        -vv
}

run_all() {
    echo -e "${GREEN}Running complete test suite...${NC}\n"
    
    echo -e "${YELLOW}[1/6] Platform Status${NC}"
    run_status
    echo ""
    
    echo -e "${YELLOW}[2/6] Register Transcript${NC}"
    run_register
    echo ""
    
    echo -e "${YELLOW}[3/6] Grant Access${NC}"
    run_grant
    echo ""
    
    echo -e "${YELLOW}[4/6] Verify Transcript${NC}"
    run_verify
    echo ""
    
    echo -e "${YELLOW}[5/6] Get Student Transcripts${NC}"
    run_student
    echo ""
    
    echo -e "${YELLOW}[6/6] Revoke Access${NC}"
    run_revoke
    echo ""
    
    echo -e "${GREEN}✓ All tests completed successfully!${NC}"
}

# Main script logic
if [ $# -eq 0 ]; then
    print_usage
    exit 0
fi

case "$1" in
    status)
        run_status
        ;;
    register)
        run_register
        ;;
    grant)
        run_grant
        ;;
    verify)
        run_verify
        ;;
    revoke)
        run_revoke
        ;;
    student)
        run_student
        ;;
    all)
        run_all
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        echo -e "${RED}Error: Unknown test '$1'${NC}"
        print_usage
        exit 1
        ;;
# commit-marker-95
