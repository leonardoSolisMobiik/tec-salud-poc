# =============================================================================
# TECSALUD MVP - AI MODULE OUTPUTS
# =============================================================================

# Azure OpenAI outputs - TEMPORARILY COMMENTED (QUOTA ISSUE)
# output "openai_account_name" {
#   description = "Name of the Azure OpenAI account"
#   value       = azurerm_cognitive_account.openai.name
# }

# output "openai_account_id" {
#   description = "ID of the Azure OpenAI account"
#   value       = azurerm_cognitive_account.openai.id
# }

# output "openai_endpoint" {
#   description = "Endpoint of the Azure OpenAI service"
#   value       = azurerm_cognitive_account.openai.endpoint
# }

# output "openai_primary_access_key" {
#   description = "Primary access key of the Azure OpenAI service"
#   value       = azurerm_cognitive_account.openai.primary_access_key
#   sensitive   = true
# }

# output "openai_secondary_access_key" {
#   description = "Secondary access key of the Azure OpenAI service"
#   value       = azurerm_cognitive_account.openai.secondary_access_key
#   sensitive   = true
# }

# # OpenAI Model deployments
# output "openai_deployments" {
#   description = "Names of the OpenAI model deployments"
#   value = {
#     gpt4_turbo       = azurerm_cognitive_deployment.gpt4_turbo.name
#     gpt35_turbo      = azurerm_cognitive_deployment.gpt35_turbo.name
#     text_embedding   = azurerm_cognitive_deployment.text_embedding.name
#   }
# }

# Document Intelligence outputs
output "document_intelligence_name" {
  description = "Name of the Document Intelligence service"
  value       = azurerm_cognitive_account.document_intelligence.name
}

output "document_intelligence_id" {
  description = "ID of the Document Intelligence service"
  value       = azurerm_cognitive_account.document_intelligence.id
}

output "document_intelligence_endpoint" {
  description = "Endpoint of the Document Intelligence service"
  value       = azurerm_cognitive_account.document_intelligence.endpoint
}

output "document_intelligence_primary_key" {
  description = "Primary access key of the Document Intelligence service"
  value       = azurerm_cognitive_account.document_intelligence.primary_access_key
  sensitive   = true
}

output "document_intelligence_secondary_key" {
  description = "Secondary access key of the Document Intelligence service"
  value       = azurerm_cognitive_account.document_intelligence.secondary_access_key
  sensitive   = true
}

# Speech Services outputs
output "speech_service_name" {
  description = "Name of the Speech service"
  value       = azurerm_cognitive_account.speech.name
}

output "speech_service_id" {
  description = "ID of the Speech service"
  value       = azurerm_cognitive_account.speech.id
}

output "speech_service_endpoint" {
  description = "Endpoint of the Speech service"
  value       = azurerm_cognitive_account.speech.endpoint
}

output "speech_service_primary_key" {
  description = "Primary access key of the Speech service"
  value       = azurerm_cognitive_account.speech.primary_access_key
  sensitive   = true
}

output "speech_service_secondary_key" {
  description = "Secondary access key of the Speech service"
  value       = azurerm_cognitive_account.speech.secondary_access_key
  sensitive   = true
}

# Key Vault secret names for reference
output "key_vault_secrets" {
  description = "Names of the secrets stored in Key Vault"
  value = {
    # OpenAI secrets temporarily commented due to quota issues
    # openai_api_key                    = azurerm_key_vault_secret.openai_api_key.name
    # openai_endpoint                   = azurerm_key_vault_secret.openai_endpoint.name
    
    # Note: Document Intelligence and Speech keys are managed by Security module
    # document_intelligence_key         = azurerm_key_vault_secret.document_intelligence_key.name
    document_intelligence_endpoint    = azurerm_key_vault_secret.document_intelligence_endpoint.name
    
    # speech_api_key                    = azurerm_key_vault_secret.speech_api_key.name
    speech_endpoint                   = azurerm_key_vault_secret.speech_endpoint.name
  }
} 