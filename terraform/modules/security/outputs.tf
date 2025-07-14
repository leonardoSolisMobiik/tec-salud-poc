# =============================================================================
# TECSALUD MVP - SECURITY MODULE OUTPUTS
# =============================================================================

output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "managed_identity_id" {
  description = "ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.id
}

output "managed_identity_principal_id" {
  description = "Principal ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.principal_id
}

output "managed_identity_client_id" {
  description = "Client ID of the managed identity"
  value       = azurerm_user_assigned_identity.main.client_id
}

# Secret references for other modules
output "cosmos_connection_string_secret_name" {
  description = "Name of the Cosmos DB connection string secret in Key Vault"
  value       = azurerm_key_vault_secret.cosmos_connection_string.name
}

output "openai_api_key_secret_name" {
  description = "Name of the OpenAI API key secret in Key Vault"
  value       = azurerm_key_vault_secret.openai_api_key.name
}

output "document_intelligence_key_secret_name" {
  description = "Name of the Document Intelligence key secret in Key Vault"
  value       = azurerm_key_vault_secret.document_intelligence_key.name
}

output "speech_api_key_secret_name" {
  description = "Name of the Speech API key secret in Key Vault"
  value       = azurerm_key_vault_secret.speech_api_key.name
}

output "storage_connection_string_secret_name" {
  description = "Name of the Storage connection string secret in Key Vault"
  value       = azurerm_key_vault_secret.storage_connection_string.name
} 