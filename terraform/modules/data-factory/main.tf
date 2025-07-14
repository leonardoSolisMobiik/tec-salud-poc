# =============================================================================
# TECSALUD MVP - DATA FACTORY MODULE
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
  data_factory_name = "adf-${var.project_name}-${var.environment}-${var.location_short}-001"
  
  # Data Factory tags
  adf_tags = merge(var.tags, {
    Module  = "Data-Factory"
    Purpose = "ETL and Data Processing"
  })
}

# =============================================================================
# AZURE DATA FACTORY
# =============================================================================

resource "azurerm_data_factory" "main" {
  name                = local.data_factory_name
  location            = var.location
  resource_group_name = var.resource_group_name

  # Managed Virtual Network integration
  managed_virtual_network_enabled = true
  
  # Public network access
  public_network_enabled = var.public_network_enabled

  # Managed identity for authentication
  identity {
    type = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  # Git configuration for source control (optional)
  dynamic "github_configuration" {
    for_each = var.github_configuration != null ? [var.github_configuration] : []
    content {
      account_name    = github_configuration.value.account_name
      branch_name     = github_configuration.value.branch_name
      git_url         = github_configuration.value.git_url
      repository_name = github_configuration.value.repository_name
      root_folder     = github_configuration.value.root_folder
    }
  }

  tags = local.adf_tags
}

# =============================================================================
# INTEGRATION RUNTIMES
# =============================================================================

# Azure Integration Runtime for cloud data processing
resource "azurerm_data_factory_integration_runtime_azure" "main" {
  name            = "AutoResolveIntegrationRuntime"
  data_factory_id = azurerm_data_factory.main.id
  location        = var.location
  
  # Core configuration
  compute_type = var.integration_runtime_compute_type
  core_count   = var.integration_runtime_core_count
  
  # Virtual network integration
  virtual_network_enabled = true
}

# Self-hosted Integration Runtime for on-premises connectivity (if needed)
resource "azurerm_data_factory_integration_runtime_self_hosted" "onprem" {
  count           = var.enable_self_hosted_ir ? 1 : 0
  name            = "SelfHostedIntegrationRuntime"
  data_factory_id = azurerm_data_factory.main.id
  description     = "Self-hosted IR for on-premises data sources"
}

# =============================================================================
# LINKED SERVICES
# =============================================================================

# Azure Blob Storage Linked Service
resource "azurerm_data_factory_linked_service_azure_blob_storage" "storage" {
  name            = "AzureBlobStorage"
  data_factory_id = azurerm_data_factory.main.id
  
  # Use managed identity for authentication
  use_managed_identity = true
  service_endpoint     = var.storage_primary_endpoint
  
  description = "Azure Blob Storage for TecSalud document storage"
}

# Cosmos DB Linked Service
resource "azurerm_data_factory_linked_service_cosmosdb" "cosmos" {
  name            = "CosmosDB"
  data_factory_id = azurerm_data_factory.main.id
  
  # Connection configuration
  connection_string = var.cosmos_connection_string
  
  description = "Cosmos DB for TecSalud medical data"
}

# Azure SQL Database Linked Service (if needed for reporting)
resource "azurerm_data_factory_linked_service_azure_sql_database" "sql" {
  count           = var.enable_sql_linked_service ? 1 : 0
  name            = "AzureSqlDatabase"
  data_factory_id = azurerm_data_factory.main.id
  
  connection_string = var.sql_connection_string
  
  description = "Azure SQL Database for reporting and analytics"
}

# Key Vault Linked Service for secrets management
resource "azurerm_data_factory_linked_service_key_vault" "keyvault" {
  name            = "KeyVault"
  data_factory_id = azurerm_data_factory.main.id
  key_vault_id    = var.key_vault_id
  
  description = "Key Vault for secrets and connection strings"
}

# =============================================================================
# DATASETS
# =============================================================================

# Medical Documents Dataset (Blob Storage)
resource "azurerm_data_factory_dataset_azure_blob" "medical_documents" {
  name                = "MedicalDocuments"
  data_factory_id     = azurerm_data_factory.main.id
  linked_service_name = azurerm_data_factory_linked_service_azure_blob_storage.storage.name
  
  path     = "medical-documents"
  filename = "*.pdf"
  
  description = "Medical documents stored in blob storage"
}

# Processed Documents Dataset
resource "azurerm_data_factory_dataset_azure_blob" "processed_documents" {
  name                = "ProcessedDocuments"
  data_factory_id     = azurerm_data_factory.main.id
  linked_service_name = azurerm_data_factory_linked_service_azure_blob_storage.storage.name
  
  path     = "processed-documents"
  filename = "*.json"
  
  description = "Processed medical documents with OCR results"
}

# Patient Data Dataset (Cosmos DB)
resource "azurerm_data_factory_dataset_cosmosdb_sqlapi" "patient_data" {
  name                = "PatientData"
  data_factory_id     = azurerm_data_factory.main.id
  linked_service_name = azurerm_data_factory_linked_service_cosmosdb.cosmos.name
  
  collection_name = "patients"
  
  description = "Patient data in Cosmos DB"
}

# =============================================================================
# PIPELINES
# =============================================================================

# Document Processing Pipeline
resource "azurerm_data_factory_pipeline" "document_processing" {
  name            = "DocumentProcessingPipeline"
  data_factory_id = azurerm_data_factory.main.id
  description     = "Pipeline for processing medical documents with OCR"
  
  activities_json = jsonencode([
    {
      name = "ProcessDocuments"
      type = "Copy"
      typeProperties = {
        source = {
          type = "BinarySource"
          recursive = true
        }
        sink = {
          type = "BinarySink"
        }
        enableStaging = false
      }
      inputs = [
        {
          referenceName = azurerm_data_factory_dataset_azure_blob.medical_documents.name
          type = "DatasetReference"
        }
      ]
      outputs = [
        {
          referenceName = azurerm_data_factory_dataset_azure_blob.processed_documents.name
          type = "DatasetReference"
        }
      ]
    }
  ])
  
  parameters = {
    inputPath  = "medical-documents"
    outputPath = "processed-documents"
  }
}

# Data Validation Pipeline
resource "azurerm_data_factory_pipeline" "data_validation" {
  name            = "DataValidationPipeline"
  data_factory_id = azurerm_data_factory.main.id
  description     = "Pipeline for validating and cleaning medical data"
  
  activities_json = jsonencode([
    {
      name = "ValidateData"
      type = "Validation"
      typeProperties = {
        dataset = {
          referenceName = azurerm_data_factory_dataset_cosmosdb_sqlapi.patient_data.name
          type = "DatasetReference"
        }
        timeout = "7.00:00:00"
        sleep = 30
        minimumSize = 1
      }
    }
  ])
}

# ETL Pipeline for Analytics
resource "azurerm_data_factory_pipeline" "etl_analytics" {
  name            = "ETLAnalyticsPipeline"
  data_factory_id = azurerm_data_factory.main.id
  description     = "ETL pipeline for medical data analytics"
  
  activities_json = jsonencode([
    {
      name = "ExtractTransformLoad"
      type = "ExecuteDataFlow"
      typeProperties = {
        dataflow = {
          referenceName = "MedicalDataTransformation"
          type = "DataFlowReference"
        }
        compute = {
          coreCount = 8
          computeType = "General"
        }
      }
    }
  ])
  
  parameters = {
    sourceContainer = "medical-documents"
    targetContainer = "analytics-data"
  }
}

# =============================================================================
# TRIGGERS
# =============================================================================

# Scheduled Trigger for document processing
resource "azurerm_data_factory_trigger_schedule" "document_processing" {
  name            = "DocumentProcessingTrigger"
  data_factory_id = azurerm_data_factory.main.id
  pipeline_name   = azurerm_data_factory_pipeline.document_processing.name
  
  description = "Scheduled trigger for document processing every 4 hours"
  
  # Schedule configuration
  frequency = "Hour"
  interval  = 4
  
  start_time = "2024-01-01T00:00:00Z"
  
  pipeline_parameters = {
    inputPath = "medical-documents"
    outputPath = "processed-documents"
  }
}

# Blob Trigger for new document uploads
resource "azurerm_data_factory_trigger_blob_event" "new_documents" {
  name            = "NewDocumentsTrigger"
  data_factory_id = azurerm_data_factory.main.id
  
  description = "Trigger when new documents are uploaded"
  
  storage_account_id = var.storage_account_id
  
  events = ["Microsoft.Storage.BlobCreated"]
  
  blob_path_begins_with = "/medical-documents/"
  blob_path_ends_with   = ".pdf"
  
  ignore_empty_blobs = true
  
  pipeline {
    name = azurerm_data_factory_pipeline.document_processing.name
    parameters = {
      inputPath  = "@triggerBody().folderPath"
      outputPath = "processed-documents"
    }
  }
}

# =============================================================================
# DATA FLOWS (for advanced transformations)
# =============================================================================

resource "azurerm_data_factory_data_flow" "medical_data_transformation" {
  name            = "MedicalDataTransformation"
  data_factory_id = azurerm_data_factory.main.id
  description     = "Data flow for medical data transformations"
  
  source {
    name = "SourcePatientData"
    dataset {
      name = azurerm_data_factory_dataset_cosmosdb_sqlapi.patient_data.name
    }
  }
  
  sink {
    name = "SinkProcessedData"
    dataset {
      name = azurerm_data_factory_dataset_azure_blob.processed_documents.name
    }
  }
  
  transformation {
    name        = "FilterValidRecords"
    description = "Filter valid patient records"
  }
  
  transformation {
    name        = "DeriveCalculatedFields" 
    description = "Add calculated fields to patient data"
  }
  
  script = <<-EOT
    source(allowSchemaDrift: true,
           validateSchema: false) ~> SourcePatientData
    SourcePatientData filter(not(isNull(patientId)) && not(isNull(name))) ~> FilterValidRecords
    FilterValidRecords derive(fullName = concat(firstName, " ", lastName),
                             processedDate = currentTimestamp()) ~> DeriveCalculatedFields
    DeriveCalculatedFields sink(allowSchemaDrift: true,
                               validateSchema: false) ~> SinkProcessedData
  EOT
}

# =============================================================================
# MONITORING AND ALERTS
# =============================================================================

# Data Factory Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "adf" {
  name                       = "adf-diagnostics"
  target_resource_id         = azurerm_data_factory.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ActivityRuns"
  }

  enabled_log {
    category = "PipelineRuns"
  }

  enabled_log {
    category = "TriggerRuns"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
} 