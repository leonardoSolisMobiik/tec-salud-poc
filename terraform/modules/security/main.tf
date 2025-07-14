# =============================================================================
# TECSALUD MVP - SECURITY MODULE
# =============================================================================

terraform {
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

# =============================================================================
# DATA SOURCES
# =============================================================================

data "azurerm_client_config" "current" {}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Resource naming
  key_vault_name = "kv-${var.project_name}-${var.environment}-001"
  managed_identity_name = "id-${var.project_name}-${var.environment}-${var.location_short}-main-001"
}

# =============================================================================
# MANAGED IDENTITY
# =============================================================================

resource "azurerm_user_assigned_identity" "main" {
  name                = local.managed_identity_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# =============================================================================
# KEY VAULT
# =============================================================================

resource "azurerm_key_vault" "main" {
  name                       = local.key_vault_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = var.key_vault_sku
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  
  # Enable for deployment scenarios
  enabled_for_deployment          = true
  enabled_for_disk_encryption     = true
  enabled_for_template_deployment = true
  
  # Network access configuration
  public_network_access_enabled = true
  
  tags = var.tags
}

# =============================================================================
# KEY VAULT ACCESS POLICIES
# =============================================================================

# Access policy for current user/service principal (for Terraform)
resource "azurerm_key_vault_access_policy" "terraform_sp" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  key_permissions = [
    "Create", "Delete", "Get", "List", "Update", "Import", "Backup", "Restore", "Recover"
  ]

  secret_permissions = [
    "Set", "Get", "Delete", "List", "Purge", "Recover", "Backup", "Restore"
  ]

  certificate_permissions = [
    "Create", "Delete", "Get", "List", "Update", "Import", "Backup", "Restore", "Recover"
  ]
}

# Access policy for managed identity
resource "azurerm_key_vault_access_policy" "managed_identity" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.main.principal_id

  secret_permissions = [
    "Get", "List"
  ]

  depends_on = [azurerm_user_assigned_identity.main]
}

# =============================================================================
# KEY VAULT SECRETS (Initial secrets for TecSalud)
# =============================================================================

# Placeholder secret for database connection string
resource "azurerm_key_vault_secret" "cosmos_connection_string" {
  name         = "cosmos-connection-string"
  value        = "placeholder-will-be-updated-by-data-module"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "Connection String"
  
  tags = merge(var.tags, {
    Purpose = "Cosmos DB Connection"
    Module  = "Data"
  })

  depends_on = [azurerm_key_vault_access_policy.terraform_sp]
}

# Placeholder secret for OpenAI API key
resource "azurerm_key_vault_secret" "openai_api_key" {
  name         = "openai-api-key"
  value        = "placeholder-will-be-updated-by-ai-module"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "API Key"
  
  tags = merge(var.tags, {
    Purpose = "Azure OpenAI API"
    Module  = "AI"
  })

  depends_on = [azurerm_key_vault_access_policy.terraform_sp]
}

# Placeholder secret for Document Intelligence API key
resource "azurerm_key_vault_secret" "document_intelligence_key" {
  name         = "document-intelligence-key"
  value        = "placeholder-will-be-updated-by-ai-module"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "API Key"
  
  tags = merge(var.tags, {
    Purpose = "Document Intelligence API"
    Module  = "AI"
  })

  depends_on = [azurerm_key_vault_access_policy.terraform_sp]
}

# Placeholder secret for Speech Services API key
resource "azurerm_key_vault_secret" "speech_api_key" {
  name         = "speech-api-key"
  value        = "placeholder-will-be-updated-by-ai-module"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "API Key"
  
  tags = merge(var.tags, {
    Purpose = "Speech Services API"
    Module  = "AI"
  })

  depends_on = [azurerm_key_vault_access_policy.terraform_sp]
}

# Storage account connection string
resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "storage-connection-string"
  value        = "placeholder-will-be-updated-by-data-module"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "Connection String"
  
  tags = merge(var.tags, {
    Purpose = "Storage Account Connection"
    Module  = "Data"
  })

  depends_on = [azurerm_key_vault_access_policy.terraform_sp]
} 