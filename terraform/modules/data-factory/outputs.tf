# =============================================================================
# TECSALUD MVP - DATA FACTORY MODULE OUTPUTS
# =============================================================================

# Data Factory outputs
output "data_factory_id" {
  description = "ID of the Data Factory"
  value       = azurerm_data_factory.main.id
}

output "data_factory_name" {
  description = "Name of the Data Factory"
  value       = azurerm_data_factory.main.name
}

output "data_factory_identity_principal_id" {
  description = "Principal ID of the Data Factory managed identity"
  value       = azurerm_data_factory.main.identity[0].principal_id
}

output "data_factory_identity_tenant_id" {
  description = "Tenant ID of the Data Factory managed identity"
  value       = azurerm_data_factory.main.identity[0].tenant_id
}

# Integration Runtime outputs
output "azure_ir_name" {
  description = "Name of the Azure Integration Runtime"
  value       = azurerm_data_factory_integration_runtime_azure.main.name
}

output "azure_ir_id" {
  description = "ID of the Azure Integration Runtime"
  value       = azurerm_data_factory_integration_runtime_azure.main.id
}

output "self_hosted_ir_name" {
  description = "Name of the Self-hosted Integration Runtime (if enabled)"
  value       = var.enable_self_hosted_ir ? azurerm_data_factory_integration_runtime_self_hosted.onprem[0].name : null
}

output "self_hosted_ir_id" {
  description = "ID of the Self-hosted Integration Runtime (if enabled)"
  value       = var.enable_self_hosted_ir ? azurerm_data_factory_integration_runtime_self_hosted.onprem[0].id : null
}

# Linked Services outputs
output "linked_services" {
  description = "Information about linked services"
  value = {
    azure_blob_storage = {
      name = azurerm_data_factory_linked_service_azure_blob_storage.storage.name
      id   = azurerm_data_factory_linked_service_azure_blob_storage.storage.id
    }
    cosmos_db = {
      name = azurerm_data_factory_linked_service_cosmosdb.cosmos.name
      id   = azurerm_data_factory_linked_service_cosmosdb.cosmos.id
    }
    key_vault = {
      name = azurerm_data_factory_linked_service_key_vault.keyvault.name
      id   = azurerm_data_factory_linked_service_key_vault.keyvault.id
    }
    azure_sql = var.enable_sql_linked_service ? {
      name = azurerm_data_factory_linked_service_azure_sql_database.sql[0].name
      id   = azurerm_data_factory_linked_service_azure_sql_database.sql[0].id
    } : null
  }
}

# Datasets outputs
output "datasets" {
  description = "Information about datasets"
  value = {
    medical_documents = {
      name = azurerm_data_factory_dataset_azure_blob.medical_documents.name
      id   = azurerm_data_factory_dataset_azure_blob.medical_documents.id
    }
    processed_documents = {
      name = azurerm_data_factory_dataset_azure_blob.processed_documents.name
      id   = azurerm_data_factory_dataset_azure_blob.processed_documents.id
    }
    patient_data = {
      name = azurerm_data_factory_dataset_cosmosdb_sqlapi.patient_data.name
      id   = azurerm_data_factory_dataset_cosmosdb_sqlapi.patient_data.id
    }
  }
}

# Pipelines outputs
output "pipelines" {
  description = "Information about pipelines"
  value = {
    document_processing = {
      name = azurerm_data_factory_pipeline.document_processing.name
      id   = azurerm_data_factory_pipeline.document_processing.id
    }
    data_validation = {
      name = azurerm_data_factory_pipeline.data_validation.name
      id   = azurerm_data_factory_pipeline.data_validation.id
    }
    etl_analytics = {
      name = azurerm_data_factory_pipeline.etl_analytics.name
      id   = azurerm_data_factory_pipeline.etl_analytics.id
    }
  }
}

# Triggers outputs
output "triggers" {
  description = "Information about triggers"
  value = {
    document_processing_schedule = {
      name = azurerm_data_factory_trigger_schedule.document_processing.name
      id   = azurerm_data_factory_trigger_schedule.document_processing.id
    }
    new_documents_blob = {
      name = azurerm_data_factory_trigger_blob_event.new_documents.name
      id   = azurerm_data_factory_trigger_blob_event.new_documents.id
    }
  }
}

# Data Flow outputs
output "data_flows" {
  description = "Information about data flows"
  value = {
    medical_data_transformation = {
      name = azurerm_data_factory_data_flow.medical_data_transformation.name
      id   = azurerm_data_factory_data_flow.medical_data_transformation.id
    }
  }
}

# Monitoring outputs
output "monitoring_endpoints" {
  description = "Monitoring and management endpoints"
  value = {
    data_factory_portal = "https://adf.azure.com/en/home?factory=%2Fsubscriptions%2F${split("/", azurerm_data_factory.main.id)[2]}%2FresourceGroups%2F${var.resource_group_name}%2Fproviders%2FMicrosoft.DataFactory%2Ffactories%2F${azurerm_data_factory.main.name}"
    monitoring_url = "https://portal.azure.com/#@/resource${azurerm_data_factory.main.id}/overview"
  }
}

# Configuration summary
output "data_factory_summary" {
  description = "Summary of Data Factory configuration"
  value = {
    name                              = azurerm_data_factory.main.name
    location                         = azurerm_data_factory.main.location
    resource_group                   = var.resource_group_name
    managed_virtual_network_enabled = azurerm_data_factory.main.managed_virtual_network_enabled
    public_network_enabled          = azurerm_data_factory.main.public_network_enabled
    integration_runtimes = {
      azure_ir           = azurerm_data_factory_integration_runtime_azure.main.name
      self_hosted_ir     = var.enable_self_hosted_ir ? azurerm_data_factory_integration_runtime_self_hosted.onprem[0].name : "disabled"
    }
    linked_services_count = 3 + (var.enable_sql_linked_service ? 1 : 0)
    datasets_count        = 3
    pipelines_count       = 3
    triggers_count        = 2
    data_flows_count      = 1
  }
}

# Pipeline execution endpoints
output "pipeline_endpoints" {
  description = "Pipeline execution and monitoring endpoints"
  value = {
    document_processing = {
      trigger_url = "https://management.azure.com${azurerm_data_factory_pipeline.document_processing.id}/createRun?api-version=2018-06-01"
      monitor_url = "https://portal.azure.com/#@/resource${azurerm_data_factory.main.id}/pipelines"
    }
    data_validation = {
      trigger_url = "https://management.azure.com${azurerm_data_factory_pipeline.data_validation.id}/createRun?api-version=2018-06-01"
      monitor_url = "https://portal.azure.com/#@/resource${azurerm_data_factory.main.id}/pipelines"
    }
    etl_analytics = {
      trigger_url = "https://management.azure.com${azurerm_data_factory_pipeline.etl_analytics.id}/createRun?api-version=2018-06-01"
      monitor_url = "https://portal.azure.com/#@/resource${azurerm_data_factory.main.id}/pipelines"
    }
  }
}

# Development and management information
output "development_info" {
  description = "Development and management information"
  value = {
    data_factory_studio_url = "https://adf.azure.com/en/home?factory=%2Fsubscriptions%2F${split("/", azurerm_data_factory.main.id)[2]}%2FresourceGroups%2F${var.resource_group_name}%2Fproviders%2FMicrosoft.DataFactory%2Ffactories%2F${azurerm_data_factory.main.name}"
    git_integration = var.github_configuration != null ? "enabled" : "disabled"
    managed_identity_id = azurerm_data_factory.main.identity[0].principal_id
    key_vault_access = "configured"
    storage_access = "configured"
    cosmos_db_access = "configured"
  }
}

# Security and compliance outputs
output "security_info" {
  description = "Security and compliance information"
  value = {
    managed_identity_enabled = true
    customer_managed_key_enabled = var.enable_customer_managed_key
    public_network_access = var.public_network_enabled
    managed_virtual_network = azurerm_data_factory.main.managed_virtual_network_enabled
    diagnostic_settings_enabled = var.enable_monitoring
  }
} 