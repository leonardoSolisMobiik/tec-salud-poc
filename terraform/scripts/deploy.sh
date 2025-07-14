#!/bin/bash

# =============================================================================
# TECSALUD MVP - DEPLOYMENT SCRIPT
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
Usage: $0 [ENVIRONMENT] [MODULE] [ACTION]

ENVIRONMENT:
  dev     - Development environment
  stg     - Staging environment
  prd     - Production environment

MODULE (optional):
  networking  - Deploy networking resources
  security    - Deploy security resources
  data        - Deploy data resources
  ai          - Deploy AI services
  compute     - Deploy compute resources
  monitoring  - Deploy monitoring resources
  all         - Deploy all modules (default)

ACTION (optional):
  plan        - Generate and show execution plan
  apply       - Apply changes (default)
  destroy     - Destroy resources
  validate    - Validate configuration
  format      - Format terraform files

Examples:
  $0 dev                          # Deploy all modules to dev
  $0 dev networking plan          # Plan networking module for dev
  $0 prd all apply                # Apply all modules to production
  $0 dev compute destroy          # Destroy compute resources in dev

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_color $BLUE "Checking prerequisites..."
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_color $RED "Error: Terraform is not installed"
        exit 1
    fi
    
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
    
    print_color $GREEN "✓ All prerequisites met"
}

# Function to initialize Terraform
init_terraform() {
    local env=$1
    print_color $BLUE "Initializing Terraform for $env environment..."
    
    cd "environments/$env"
    
    terraform init
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Terraform initialized successfully"
    else
        print_color $RED "✗ Terraform initialization failed"
        exit 1
    fi
}

# Function to validate configuration
validate_config() {
    print_color $BLUE "Validating Terraform configuration..."
    
    terraform validate
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Configuration is valid"
    else
        print_color $RED "✗ Configuration validation failed"
        exit 1
    fi
}

# Function to format code
format_code() {
    print_color $BLUE "Formatting Terraform code..."
    
    terraform fmt -recursive ../../
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Code formatted successfully"
    else
        print_color $RED "✗ Code formatting failed"
        exit 1
    fi
}

# Function to plan deployment
plan_deployment() {
    local env=$1
    print_color $BLUE "Planning deployment for $env environment..."
    
    terraform plan -var-file="$env.tfvars" -out="$env.tfplan"
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Plan generated successfully"
    else
        print_color $RED "✗ Plan generation failed"
        exit 1
    fi
}

# Function to apply deployment
apply_deployment() {
    local env=$1
    print_color $BLUE "Applying deployment for $env environment..."
    
    # Use plan file if it exists
    if [ -f "$env.tfplan" ]; then
        terraform apply "$env.tfplan"
    else
        terraform apply -var-file="$env.tfvars" -auto-approve
    fi
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✓ Deployment applied successfully"
    else
        print_color $RED "✗ Deployment failed"
        exit 1
    fi
}

# Function to destroy resources
destroy_resources() {
    local env=$1
    print_color $YELLOW "WARNING: This will destroy all resources in $env environment"
    
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ $confirm == "yes" ]]; then
        terraform destroy -var-file="$env.tfvars" -auto-approve
        
        if [ $? -eq 0 ]; then
            print_color $GREEN "✓ Resources destroyed successfully"
        else
            print_color $RED "✗ Resource destruction failed"
            exit 1
        fi
    else
        print_color $YELLOW "Destruction cancelled"
    fi
}

# Function to show outputs
show_outputs() {
    local env=$1
    print_color $BLUE "Showing outputs for $env environment..."
    
    terraform output
}

# Main function
main() {
    # Check arguments
    if [ $# -eq 0 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
        print_usage
        exit 0
    fi
    
    # Parse arguments
    local env=$1
    local module=${2:-all}
    local action=${3:-apply}
    
    # Validate environment
    if [[ ! "$env" =~ ^(dev|stg|prd)$ ]]; then
        print_color $RED "Error: Invalid environment. Use dev, stg, or prd"
        exit 1
    fi
    
    # Validate action
    if [[ ! "$action" =~ ^(plan|apply|destroy|validate|format|output)$ ]]; then
        print_color $RED "Error: Invalid action. Use plan, apply, destroy, validate, format, or output"
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Change to terraform directory
    cd "$(dirname "$0")/.."
    
    # Handle special actions
    case $action in
        format)
            format_code
            exit 0
            ;;
        validate)
            cd "environments/$env"
            validate_config
            exit 0
            ;;
    esac
    
    # Initialize Terraform
    init_terraform $env
    
    # Validate configuration
    validate_config
    
    # Execute action
    case $action in
        plan)
            plan_deployment $env
            ;;
        apply)
            plan_deployment $env
            apply_deployment $env
            show_outputs $env
            ;;
        destroy)
            destroy_resources $env
            ;;
        output)
            show_outputs $env
            ;;
        *)
            print_color $RED "Error: Unknown action: $action"
            exit 1
            ;;
    esac
    
    print_color $GREEN "✓ Operation completed successfully"
}

# Run main function
main "$@" 