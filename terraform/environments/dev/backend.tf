# =============================================================================
# TECSALUD MVP - DEVELOPMENT ENVIRONMENT BACKEND
# =============================================================================

terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tsalud-shared-cus-tfstate-001"
    storage_account_name = "sttsaludtfstate001"
    container_name       = "tfstate"
    key                  = "dev/terraform.tfstate"
  }
} 