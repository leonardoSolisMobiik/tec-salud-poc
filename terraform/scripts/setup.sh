#!/bin/bash

# =============================================================================
# TECSALUD MVP - SETUP SCRIPT
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to print usage
print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

This script sets up the initial infrastructure for Terraform state management.

OPTIONS:
  -h, --help       Show this help message
  -l, --location   Azure location (default: Central US)
  -s, --subscription  Azure subscription ID (optional)

Examples:
  $0                           # Setup with default location
  $0 -l "East US"              # Setup with custom location
  $0 -s "subscription-id"      # Setup with specific subscription

EOF
}

# Default values
LOCATION="Central US"
LOCATION_SHORT="cus"
SUBSCRIPTION_ID=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -s|--subscription)
            SUBSCRIPTION_ID="$2"
            shift 2
            ;;
        *)
            print_color $RED "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Function to check prerequisites
check_prerequisites() {
    print_color $BLUE "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        print_color $RED "Error: Azure CLI is not installed"
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        print_color $RED "Error: Not logged in to Azure. Run 'az login' first"
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_color $RED "Error: Terraform is not installed"
        exit 1
    fi
    
    print_color $GREEN "✓ All prerequisites met"
}

# Function to set subscription
set_subscription() {
    if [ -n "$SUBSCRIPTION_ID" ]; then
        print_color $BLUE "Setting Azure subscription to $SUBSCRIPTION_ID..."
        az account set --subscription "$SUBSCRIPTION_ID"
        
        if [ $? -eq 0 ]; then
            print_color $GREEN "✓ Subscription set successfully"
        else
            print_color $RED "✗ Failed to set subscription"
            exit 1
        fi
    fi
}

# Function to create resource group for Terraform state
create_state_resource_group() {
    local rg_name="rg-tsalud-shared-${LOCATION_SHORT}-tfstate-001"
    
    print_color $BLUE "Creating resource group for Terraform state: $rg_name..."
    
    az group create \
        --name "$rg_name" \
        --location "$LOCATION" \
        --tags \
            Project="TecSalud-MVP" \
            Purpose="Terraform-State" \
            Environment="Shared" \
            CreatedBy="Setup-Script" \
            CreatedDate="$(date +%Y-%m-%d)"
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Resource group created successfully"
    else
        print_color $RED "✗ Failed to create resource group"
        exit 1
    fi
}

# Function to create storage account for Terraform state
create_state_storage_account() {
    local storage_name="sttsaludtfstate001"
    local rg_name="rg-tsalud-shared-${LOCATION_SHORT}-tfstate-001"
    
    print_color $BLUE "Creating storage account for Terraform state: $storage_name..."
    
    az storage account create \
        --name "$storage_name" \
        --resource-group "$rg_name" \
        --location "$LOCATION" \
        --sku Standard_LRS \
        --encryption-services blob \
        --https-only true \
        --tags \
            Project="TecSalud-MVP" \
            Purpose="Terraform-State" \
            Environment="Shared" \
            CreatedBy="Setup-Script" \
            CreatedDate="$(date +%Y-%m-%d)"
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Storage account created successfully"
    else
        print_color $RED "✗ Failed to create storage account"
        exit 1
    fi
}

# Function to create blob container for Terraform state
create_state_container() {
    local storage_name="sttsaludtfstate001"
    local container_name="tfstate"
    
    print_color $BLUE "Creating blob container for Terraform state: $container_name..."
    
    az storage container create \
        --name "$container_name" \
        --account-name "$storage_name" \
        --public-access off
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Blob container created successfully"
    else
        print_color $RED "✗ Failed to create blob container"
        exit 1
    fi
}

# Function to create service principal for Terraform
create_service_principal() {
    local sp_name="sp-tsalud-terraform"
    
    print_color $BLUE "Creating service principal for Terraform: $sp_name..."
    
    local sp_output=$(az ad sp create-for-rbac \
        --name "$sp_name" \
        --role Contributor \
        --scopes "/subscriptions/$(az account show --query id -o tsv)" \
        --output json)
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Service principal created successfully"
        
        # Extract values
        local client_id=$(echo "$sp_output" | jq -r '.appId')
        local client_secret=$(echo "$sp_output" | jq -r '.password')
        local tenant_id=$(echo "$sp_output" | jq -r '.tenant')
        local subscription_id=$(az account show --query id -o tsv)
        
        # Save to file
        cat > terraform_credentials.env << EOF
# =============================================================================
# TECSALUD MVP - TERRAFORM CREDENTIALS
# =============================================================================
# Generated on: $(date)
# 
# Instructions:
# 1. Keep this file secure and never commit to version control
# 2. Source this file or set these environment variables before running Terraform
# 3. Use these credentials in your CI/CD pipeline

export ARM_CLIENT_ID="$client_id"
export ARM_CLIENT_SECRET="$client_secret"
export ARM_SUBSCRIPTION_ID="$subscription_id"
export ARM_TENANT_ID="$tenant_id"

EOF
        
        print_color $GREEN "✓ Credentials saved to terraform_credentials.env"
        print_color $YELLOW "⚠️  Keep this file secure and never commit to version control"
    else
        print_color $RED "✗ Failed to create service principal"
        exit 1
    fi
}

# Function to display summary
display_summary() {
    print_color $BLUE "=================================================="
    print_color $BLUE "SETUP COMPLETED SUCCESSFULLY"
    print_color $BLUE "=================================================="
    echo
    print_color $GREEN "Resources created:"
    echo "  • Resource Group: rg-tsalud-shared-${LOCATION_SHORT}-tfstate-001"
    echo "  • Storage Account: sttsaludtfstate001"
    echo "  • Blob Container: tfstate"
    echo "  • Service Principal: sp-tsalud-terraform"
    echo
    print_color $YELLOW "Next steps:"
    echo "  1. Source the credentials: source terraform_credentials.env"
    echo "  2. Deploy infrastructure: ./scripts/deploy.sh dev"
    echo "  3. Check outputs: ./scripts/deploy.sh dev output"
    echo
    print_color $YELLOW "Important reminders:"
    echo "  • Keep terraform_credentials.env secure"
    echo "  • Never commit credentials to version control"
    echo "  • Use these credentials in your CI/CD pipeline"
    echo
}

# Main function
main() {
    print_color $BLUE "=================================================="
    print_color $BLUE "TECSALUD MVP - TERRAFORM SETUP"
    print_color $BLUE "=================================================="
    echo
    
    # Check prerequisites
    check_prerequisites
    
    # Set subscription if provided
    set_subscription
    
    # Create resources
    create_state_resource_group
    create_state_storage_account
    create_state_container
    create_service_principal
    
    # Display summary
    display_summary
    
    print_color $GREEN "✓ Setup completed successfully!"
}

# Run main function
main "$@" 