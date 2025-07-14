# =============================================================================
# TECSALUD MVP - DATA MODULE
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
  cosmos_name        = "cosmos-${var.project_name}-${var.environment}-${var.location_short}-001"
  storage_name       = "st${var.project_name}${var.environment}${var.location_short}001"
}

# =============================================================================
# COSMOS DB ACCOUNT
# =============================================================================

resource "azurerm_cosmosdb_account" "main" {
  name                = local.cosmos_name
  location            = var.location
  resource_group_name = var.resource_group_name
  
  # Offer type (only Standard is supported)
  offer_type = "Standard"
  
  # Kind of Cosmos DB account - Changed to MongoDB
  kind = "MongoDB"
  
  # Enable automatic failover
  enable_automatic_failover = true
  
  # Enable multiple write locations for high availability
  enable_multiple_write_locations = false
  
  # Consistency policy for medical data
  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }
  
  # Primary location
  geo_location {
    location          = var.location
    failover_priority = 0
  }
  
  # MongoDB-specific capabilities
  capabilities {
    name = "EnableMongo"
  }
  
  # Enable server version 4.2 for better MongoDB compatibility
  mongo_server_version = "4.2"
  
  # Enable RBAC for security
  # Note: This is important for HIPAA compliance
  local_authentication_disabled = false
  
  # Backup policy for compliance
  backup {
    type                = "Periodic"
    interval_in_minutes = 240  # 4 hours
    retention_in_hours  = 720  # 30 days
  }
  
  # Network access
  public_network_access_enabled = true
  
  # Enable analytical store for future analytics
  analytical_storage_enabled = false
  
  tags = var.tags
}

# =============================================================================
# COSMOS DB MONGODB DATABASE
# =============================================================================

resource "azurerm_cosmosdb_mongo_database" "main" {
  name                = "tecsalud-medical-db"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  
  # Throughput for the database (can be overridden at collection level)
  throughput = 400
  
  depends_on = [azurerm_cosmosdb_account.main]
}

# =============================================================================
# COSMOS DB MONGODB COLLECTIONS
# =============================================================================

# Patients collection
resource "azurerm_cosmosdb_mongo_collection" "patients" {
  name                = "patients"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.main.name
  
  # Shard key for MongoDB
  shard_key = "patientId"
  
  # Indexes for medical data
  index {
    keys   = ["patientId"]
    unique = true
  }
  
  index {
    keys = ["createdAt"]
  }
  
  index {
    keys = ["medicalNumber"]
  }
  
  depends_on = [azurerm_cosmosdb_mongo_database.main]
}

# Medical documents collection
resource "azurerm_cosmosdb_mongo_collection" "medical_documents" {
  name                = "medical-documents"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.main.name
  
  # Shard key for MongoDB
  shard_key = "patientId"
  
  # Indexes for document metadata
  index {
    keys = ["patientId"]
  }
  
  index {
    keys = ["documentType"]
  }
  
  index {
    keys = ["uploadDate"]
  }
  
  depends_on = [azurerm_cosmosdb_mongo_database.main]
}

# Medical chat sessions collection
resource "azurerm_cosmosdb_mongo_collection" "chat_sessions" {
  name                = "chat-sessions"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.main.name
  
  # Shard key for MongoDB
  shard_key = "userId"
  
  # Indexes for chat sessions
  index {
    keys = ["userId"]
  }
  
  index {
    keys = ["sessionId"]
  }
  
  index {
    keys = ["createdAt"]
  }
  
  depends_on = [azurerm_cosmosdb_mongo_database.main]
}

# =============================================================================
# STORAGE ACCOUNT
# =============================================================================

resource "azurerm_storage_account" "main" {
  name                     = local.storage_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  
  # Security settings for HIPAA compliance
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  
  # Enable encryption at rest
  infrastructure_encryption_enabled = true
  
  # Network access rules
  network_rules {
    default_action = "Allow"
    bypass         = ["AzureServices"]
    
    # Allow access from backend subnet
    virtual_network_subnet_ids = var.allowed_subnet_ids
  }
  
  # Enable blob versioning for data protection
  blob_properties {
    versioning_enabled = true
    
    # Enable soft delete
    delete_retention_policy {
      days = 30
    }
    
    # Enable container soft delete
    container_delete_retention_policy {
      days = 30
    }
  }
  
  tags = var.tags
}

# =============================================================================
# STORAGE CONTAINERS
# =============================================================================

# Container for medical documents
resource "azurerm_storage_container" "medical_documents" {
  name                  = "medical-documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
  
  depends_on = [azurerm_storage_account.main]
}

# Container for processed documents (OCR results)
resource "azurerm_storage_container" "processed_documents" {
  name                  = "processed-documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
  
  depends_on = [azurerm_storage_account.main]
}

# Container for temporary files
resource "azurerm_storage_container" "temp_files" {
  name                  = "temp-files"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
  
  depends_on = [azurerm_storage_account.main]
}

# Azure Cognitive Search removed - not needed for MVP

# =============================================================================
# KEY VAULT SECRETS UPDATES
# =============================================================================

# Note: Secrets are managed by the Security module and will be updated
# by the application deployment process with the actual connection strings
# This avoids duplicate resource creation conflicts 