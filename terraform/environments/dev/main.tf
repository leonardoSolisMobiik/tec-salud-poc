# =============================================================================
# TECSALUD MVP - DEVELOPMENT ENVIRONMENT
# =============================================================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
}

provider "azuread" {}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "azurerm_client_config" "current" {}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Environment specific configurations
  environment = "dev"
  location    = "Central US"
  location_short = "cus"
  
  # Naming convention
  project_name = "tsalud"
  
  # Common tags
  common_tags = merge(var.default_tags, {
    Environment = local.environment
    CreatedBy   = "terraform"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  })
  
  # Resource naming
  resource_group_names = {
    network          = "rg-${local.project_name}-${local.environment}-${local.location_short}-network-001"
    compute          = "rg-${local.project_name}-${local.environment}-${local.location_short}-compute-001"
    data             = "rg-${local.project_name}-${local.environment}-${local.location_short}-data-001"
    ai               = "rg-${local.project_name}-${local.environment}-${local.location_short}-ai-001"
    security         = "rg-${local.project_name}-${local.environment}-${local.location_short}-security-001"
    monitor          = "rg-${local.project_name}-${local.environment}-${local.location_short}-monitor-001"
    api_management   = "rg-${local.project_name}-${local.environment}-${local.location_short}-apim-001"
    virtual_machines = "rg-${local.project_name}-${local.environment}-${local.location_short}-vms-001"
    data_factory     = "rg-${local.project_name}-${local.environment}-${local.location_short}-adf-001"
  }
}

# =============================================================================
# RESOURCE GROUPS
# =============================================================================

# Network Resource Group
resource "azurerm_resource_group" "network" {
  name     = local.resource_group_names.network
  location = local.location
  tags     = local.common_tags
}

# Compute Resource Group
resource "azurerm_resource_group" "compute" {
  name     = local.resource_group_names.compute
  location = local.location
  tags     = local.common_tags
}

# Data Resource Group
resource "azurerm_resource_group" "data" {
  name     = local.resource_group_names.data
  location = local.location
  tags     = local.common_tags
}

# AI Resource Group
resource "azurerm_resource_group" "ai" {
  name     = local.resource_group_names.ai
  location = local.location
  tags     = local.common_tags
}

# Security Resource Group
resource "azurerm_resource_group" "security" {
  name     = local.resource_group_names.security
  location = local.location
  tags     = local.common_tags
}

# Monitoring Resource Group
resource "azurerm_resource_group" "monitor" {
  name     = local.resource_group_names.monitor
  location = local.location
  tags     = local.common_tags
}

# API Management Resource Group
resource "azurerm_resource_group" "api_management" {
  name     = local.resource_group_names.api_management
  location = local.location
  tags     = local.common_tags
}

# Virtual Machines Resource Group
resource "azurerm_resource_group" "virtual_machines" {
  name     = local.resource_group_names.virtual_machines
  location = local.location
  tags     = local.common_tags
}

# Data Factory Resource Group
resource "azurerm_resource_group" "data_factory" {
  name     = local.resource_group_names.data_factory
  location = local.location
  tags     = local.common_tags
}

# =============================================================================
# MODULES
# =============================================================================

# Security Module (must be first for Key Vault)
module "security" {
  source = "../../modules/security"

  # Resource Group
  resource_group_name = azurerm_resource_group.security.name
  location           = azurerm_resource_group.security.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Key Vault configuration
  key_vault_sku = var.key_vault_sku
  
  # Tags
  tags = local.common_tags
  
  depends_on = [azurerm_resource_group.security]
}

# Networking Module
module "networking" {
  source = "../../modules/networking"

  # Resource Group
  resource_group_name = azurerm_resource_group.network.name
  location           = azurerm_resource_group.network.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Network configuration
  vnet_address_space = var.vnet_address_space
  subnet_frontend   = var.subnet_frontend
  subnet_backend    = var.subnet_backend
  subnet_data       = var.subnet_data
  subnet_bastion    = var.subnet_bastion
  
  # Tags
  tags = local.common_tags
  
  depends_on = [azurerm_resource_group.network]
}

# Monitoring Module - TEMPORARILY COMMENTED
# module "monitoring" {
#   source = "../../modules/monitoring"

#   # Resource Group
#   resource_group_name = azurerm_resource_group.monitor.name
#   location           = azurerm_resource_group.monitor.location

#   # Configuration
#   project_name    = local.project_name
#   environment     = local.environment
#   location_short  = local.location_short
  
#   # Monitoring configuration
#   log_retention_days = var.log_retention_days
  
#   # Tags
#   tags = local.common_tags
  
#   depends_on = [azurerm_resource_group.monitor]
# }

# Data Module
module "data" {
  source = "../../modules/data"

  # Resource Group
  resource_group_name = azurerm_resource_group.data.name
  location           = azurerm_resource_group.data.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Key Vault reference
  key_vault_id = module.security.key_vault_id
  
  # Network configuration
  allowed_subnet_ids = [module.networking.subnet_backend_id]
  
  # Tags
  tags = local.common_tags
  
  depends_on = [module.security, module.networking]
}

# AI Module
module "ai" {
  source = "../../modules/ai"

  # Resource Group
  resource_group_name = azurerm_resource_group.ai.name
  location           = azurerm_resource_group.ai.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Key Vault reference
  key_vault_id = module.security.key_vault_id
  
  # AI configuration
  openai_sku = var.openai_sku
  document_intelligence_sku = var.document_intelligence_sku
  speech_sku = var.speech_sku
  
  # Tags
  tags = local.common_tags
  
  depends_on = [module.security]
}

# Compute Module
module "compute" {
  source = "../../modules/compute"

  # Resource Group
  resource_group_name = azurerm_resource_group.compute.name
  location           = azurerm_resource_group.compute.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Managed Identity
  managed_identity_id = module.security.managed_identity_id
  
  # Network configuration
  frontend_subnet_id = module.networking.subnet_frontend_id
  
  # Container Apps configuration
  frontend_image = var.frontend_image
  backend_image  = var.backend_image
  
  # Service endpoints from other modules
  cosmos_endpoint                   = module.data.cosmos_endpoint
  storage_primary_endpoint          = module.data.storage_primary_endpoint
  document_intelligence_endpoint   = module.ai.document_intelligence_endpoint
  speech_service_endpoint          = module.ai.speech_service_endpoint
  
  # Secrets from Key Vault (retrieved via data sources)
  cosmos_connection_string      = "placeholder-will-be-retrieved-from-kv"
  storage_connection_string     = "placeholder-will-be-retrieved-from-kv"
  openai_api_key               = "placeholder-for-future-use"
  document_intelligence_key    = "placeholder-will-be-retrieved-from-kv"
  speech_api_key               = "placeholder-will-be-retrieved-from-kv"
  
  # Tags
  tags = local.common_tags
  
  depends_on = [
    azurerm_resource_group.compute,
    module.networking,
    module.security,
    module.data,
    module.ai
  ]
}

# Monitoring Module
module "monitoring" {
  source = "../../modules/monitoring"

  # Resource Group
  resource_group_name = azurerm_resource_group.monitor.name
  location           = azurerm_resource_group.monitor.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Monitoring configuration
  log_analytics_sku              = var.log_analytics_sku
  log_retention_days             = var.log_retention_days
  app_insights_retention_days    = var.app_insights_retention_days
  app_insights_sampling_percentage = var.app_insights_sampling_percentage
  log_daily_quota_gb             = var.log_daily_quota_gb
  
  # Alert configuration
  alert_email = var.alert_email
  
  # Resource IDs for monitoring
  container_app_ids      = [module.compute.frontend_app_id, module.compute.backend_app_id]
  cosmos_db_id          = module.data.cosmos_account_id
  key_vault_id          = module.security.key_vault_id
  storage_account_id    = module.data.storage_account_id
  
  # Tags
  tags = local.common_tags
  
  depends_on = [
    azurerm_resource_group.monitor,
    module.compute,
    module.data,
    module.ai,
    module.security
  ]
}

# API Management Module
module "api_management" {
  source = "../../modules/api-management"

  # Resource Group
  resource_group_name = azurerm_resource_group.api_management.name
  location           = azurerm_resource_group.api_management.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Network dependencies
  backend_subnet_id         = module.networking.subnet_backend_id
  managed_identity_id       = module.security.managed_identity_id
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  
  # API Management configuration
  publisher_name      = var.apim_publisher_name
  publisher_email     = var.apim_publisher_email
  apim_sku           = var.apim_sku
  backend_service_url = module.compute.backend_app_url
  
  # Tags
  tags = local.common_tags
  
  depends_on = [
    azurerm_resource_group.api_management,
    module.networking,
    module.security,
    module.monitoring,
    module.compute
  ]
}

# Virtual Machines Module
module "virtual_machines" {
  source = "../../modules/virtual-machines"

  # Resource Group
  resource_group_name = azurerm_resource_group.virtual_machines.name
  location           = azurerm_resource_group.virtual_machines.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Network dependencies
  backend_subnet_id     = module.networking.subnet_backend_id
  data_subnet_id        = module.networking.subnet_data_id
  backend_nsg_id        = module.networking.nsg_backend_id
  data_nsg_id           = module.networking.nsg_data_id
  managed_identity_id   = module.security.managed_identity_id
  
  # VM configuration
  vm_processing_size = var.vm_processing_size
  vm_services_size   = var.vm_services_size
  ssh_public_key     = var.ssh_public_key
  admin_email        = var.admin_email
  key_vault_name     = module.security.key_vault_name
  
  # Feature flags
  enable_backup        = var.enable_backup
  enable_auto_shutdown = var.enable_auto_shutdown
  
  # Tags
  tags = local.common_tags
  
  depends_on = [
    azurerm_resource_group.virtual_machines,
    module.networking,
    module.security
  ]
}

# Data Factory Module
module "data_factory" {
  source = "../../modules/data-factory"

  # Resource Group
  resource_group_name = azurerm_resource_group.data_factory.name
  location           = azurerm_resource_group.data_factory.location

  # Configuration
  project_name    = local.project_name
  environment     = local.environment
  location_short  = local.location_short
  
  # Dependencies
  managed_identity_id            = module.security.managed_identity_id
  key_vault_id                  = module.security.key_vault_id
  log_analytics_workspace_id    = module.monitoring.log_analytics_workspace_id
  
  # Storage configuration
  storage_primary_endpoint = module.data.storage_primary_endpoint
  storage_account_id      = module.data.storage_account_id
  cosmos_connection_string = module.data.cosmos_primary_connection_string
  
  # Data Factory configuration
  public_network_enabled           = var.adf_public_network_enabled
  integration_runtime_compute_type = var.adf_integration_runtime_compute_type
  integration_runtime_core_count   = var.adf_integration_runtime_core_count
  
  # Feature flags
  enable_self_hosted_ir      = var.adf_enable_self_hosted_ir
  enable_scheduled_triggers  = var.adf_enable_scheduled_triggers
  enable_blob_event_triggers = var.adf_enable_blob_event_triggers
  
  # Tags
  tags = local.common_tags
  
  depends_on = [
    azurerm_resource_group.data_factory,
    module.security,
    module.data,
    module.monitoring
  ]
} 