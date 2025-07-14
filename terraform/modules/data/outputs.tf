# =============================================================================
# TECSALUD MVP - DATA MODULE OUTPUTS
# =============================================================================

# Cosmos DB outputs
output "cosmos_account_name" {
  description = "Name of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.name
}

output "cosmos_account_id" {
  description = "ID of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.id
}

output "cosmos_endpoint" {
  description = "Endpoint of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_database_name" {
  description = "Name of the Cosmos DB MongoDB database"
  value       = azurerm_cosmosdb_mongo_database.main.name
}

output "cosmos_primary_key" {
  description = "Primary key of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.primary_key
  sensitive   = true
}

output "cosmos_connection_strings" {
  description = "Connection strings of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.connection_strings
  sensitive   = true
}

output "cosmos_primary_connection_string" {
  description = "Primary connection string of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.connection_strings[0]
  sensitive   = true
}

# Storage Account outputs
output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.main.name
}

output "storage_account_id" {
  description = "ID of the storage account"
  value       = azurerm_storage_account.main.id
}

output "storage_primary_endpoint" {
  description = "Primary endpoint of the storage account"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "storage_primary_access_key" {
  description = "Primary access key of the storage account"
  value       = azurerm_storage_account.main.primary_access_key
  sensitive   = true
}

output "storage_primary_connection_string" {
  description = "Primary connection string of the storage account"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

# Storage containers
output "storage_containers" {
  description = "Names of the storage containers"
  value = {
    medical_documents   = azurerm_storage_container.medical_documents.name
    processed_documents = azurerm_storage_container.processed_documents.name
    temp_files         = azurerm_storage_container.temp_files.name
  }
}

# Search Service outputs removed - not needed for MVP

# Collection names for reference
output "cosmos_collections" {
  description = "Names of the Cosmos DB MongoDB collections"
  value = {
    patients          = azurerm_cosmosdb_mongo_collection.patients.name
    medical_documents = azurerm_cosmosdb_mongo_collection.medical_documents.name
    chat_sessions     = azurerm_cosmosdb_mongo_collection.chat_sessions.name
  }
} 