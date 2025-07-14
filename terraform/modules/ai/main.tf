# =============================================================================
# TECSALUD MVP - AI MODULE
# =============================================================================

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Resource naming
  openai_name             = "oai-${var.project_name}-${var.environment}-${var.location_short}-001"
  document_intelligence_name = "di-${var.project_name}-${var.environment}-${var.location_short}-001"
  speech_name            = "speech-${var.project_name}-${var.environment}-${var.location_short}-001"
}

# =============================================================================
# AZURE OPENAI SERVICE - TEMPORARILY COMMENTED (QUOTA ISSUE)
# =============================================================================

# resource "azurerm_cognitive_account" "openai" {
#   name                = local.openai_name
#   location            = var.location
#   resource_group_name = var.resource_group_name
#   kind                = "OpenAI"
#   sku_name            = var.openai_sku
#   
#   # Custom subdomain for OpenAI
#   custom_subdomain_name = local.openai_name
#   
#   # Network access
#   public_network_access_enabled = true
#   
#   tags = var.tags
# }

# =============================================================================
# AZURE OPENAI DEPLOYMENTS - TEMPORARILY COMMENTED (QUOTA ISSUE)
# =============================================================================

# # GPT-4 Turbo deployment for chat completions
# resource "azurerm_cognitive_deployment" "gpt4_turbo" {
#   name                 = "gpt-4-turbo"
#   cognitive_account_id = azurerm_cognitive_account.openai.id
#   
#   model {
#     format  = "OpenAI"
#     name    = "gpt-4"
#     version = "1106-Preview"
#   }
#   
#   scale {
#     type     = "Standard"
#     tier     = "Standard"
#     capacity = 10
#   }
#   
#   depends_on = [azurerm_cognitive_account.openai]
# }

# # GPT-3.5 Turbo deployment (fallback/cost-effective option)
# resource "azurerm_cognitive_deployment" "gpt35_turbo" {
#   name                 = "gpt-35-turbo"
#   cognitive_account_id = azurerm_cognitive_account.openai.id
#   
#   model {
#     format  = "OpenAI"
#     name    = "gpt-35-turbo"
#     version = "0613"
#   }
#   
#   scale {
#     type     = "Standard"
#     tier     = "Standard"
#     capacity = 30
#   }
#   
#   depends_on = [azurerm_cognitive_account.openai]
# }

# # Text Embedding Ada 002 for semantic search
# resource "azurerm_cognitive_deployment" "text_embedding" {
#   name                 = "text-embedding-ada-002"
#   cognitive_account_id = azurerm_cognitive_account.openai.id
#   
#   model {
#     format  = "OpenAI"
#     name    = "text-embedding-ada-002"
#     version = "2"
#   }
#   
#   scale {
#     type     = "Standard"
#     tier     = "Standard"
#     capacity = 30
#   }
#   
#   depends_on = [azurerm_cognitive_account.openai]
# }

# =============================================================================
# DOCUMENT INTELLIGENCE SERVICE
# =============================================================================

resource "azurerm_cognitive_account" "document_intelligence" {
  name                = local.document_intelligence_name
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "FormRecognizer"
  sku_name            = var.document_intelligence_sku
  
  # Network access
  public_network_access_enabled = true
  
  tags = var.tags
}

# =============================================================================
# SPEECH SERVICES
# =============================================================================

resource "azurerm_cognitive_account" "speech" {
  name                = local.speech_name
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "SpeechServices"
  sku_name            = var.speech_sku
  
  # Network access
  public_network_access_enabled = true
  
  tags = var.tags
}

# =============================================================================
# KEY VAULT SECRETS UPDATES
# =============================================================================

# Note: OpenAI secrets are managed by Security module
# OpenAI service is temporarily commented due to quota issues
# 
# # Update OpenAI API key secret
# resource "azurerm_key_vault_secret" "openai_api_key" {
#   name         = "openai-api-key"
#   value        = azurerm_cognitive_account.openai.primary_access_key
#   key_vault_id = var.key_vault_id
#   content_type = "API Key"
#   
#   tags = merge(var.tags, {
#     Purpose = "Azure OpenAI API"
#     Module  = "AI"
#   })
#   
#   depends_on = [azurerm_cognitive_account.openai]
# }

# # Update OpenAI endpoint secret
# resource "azurerm_key_vault_secret" "openai_endpoint" {
#   name         = "openai-endpoint"
#   value        = azurerm_cognitive_account.openai.endpoint
#   key_vault_id = var.key_vault_id
#   content_type = "Endpoint"
#   
#   tags = merge(var.tags, {
#     Purpose = "Azure OpenAI Endpoint"
#     Module  = "AI"
#   })
#   
#   depends_on = [azurerm_cognitive_account.openai]
# }

# Note: Document Intelligence key is managed by Security module
# This avoids duplicate resource creation conflicts

# Update Document Intelligence endpoint secret
resource "azurerm_key_vault_secret" "document_intelligence_endpoint" {
  name         = "document-intelligence-endpoint"
  value        = azurerm_cognitive_account.document_intelligence.endpoint
  key_vault_id = var.key_vault_id
  content_type = "Endpoint"
  
  tags = merge(var.tags, {
    Purpose = "Document Intelligence Endpoint"
    Module  = "AI"
  })
  
  depends_on = [azurerm_cognitive_account.document_intelligence]
}

# Note: Speech API key is managed by Security module
# This avoids duplicate resource creation conflicts

# Update Speech Services endpoint secret
resource "azurerm_key_vault_secret" "speech_endpoint" {
  name         = "speech-endpoint"
  value        = azurerm_cognitive_account.speech.endpoint
  key_vault_id = var.key_vault_id
  content_type = "Endpoint"
  
  tags = merge(var.tags, {
    Purpose = "Speech Services Endpoint"
    Module  = "AI"
  })
  
  depends_on = [azurerm_cognitive_account.speech]
} 