# =============================================================================
# TECSALUD MVP - DEVELOPMENT ENVIRONMENT OUTPUTS
# =============================================================================

# =============================================================================
# GENERAL OUTPUTS
# =============================================================================

output "environment" {
  description = "Environment name"
  value       = "dev"
}

output "location" {
  description = "Azure location"
  value       = "Central US"
}

output "resource_group_names" {
  description = "Names of all resource groups created"
  value = {
    network  = azurerm_resource_group.network.name
    compute  = azurerm_resource_group.compute.name
    data     = azurerm_resource_group.data.name
    ai       = azurerm_resource_group.ai.name
    security = azurerm_resource_group.security.name
    monitor  = azurerm_resource_group.monitor.name
  }
}

# =============================================================================
# NETWORKING OUTPUTS
# =============================================================================

output "vnet_name" {
  description = "Name of the virtual network"
  value       = module.networking.vnet_name
}

output "vnet_id" {
  description = "ID of the virtual network"
  value       = module.networking.vnet_id
}

output "subnet_ids" {
  description = "IDs of all subnets"
  value = {
    frontend = module.networking.subnet_frontend_id
    backend  = module.networking.subnet_backend_id
    data     = module.networking.subnet_data_id
    bastion  = module.networking.subnet_bastion_id
  }
}

output "bastion_hostname" {
  description = "Hostname of the Bastion service"
  value       = module.networking.bastion_hostname
}

# =============================================================================
# SECURITY OUTPUTS
# =============================================================================

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = module.security.key_vault_name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = module.security.key_vault_uri
}

output "managed_identity_id" {
  description = "ID of the managed identity"
  value       = module.security.managed_identity_id
}

# =============================================================================
# COMPUTE OUTPUTS - TEMPORARILY COMMENTED
# =============================================================================

# output "container_registry_name" {
#   description = "Name of the Container Registry"
#   value       = module.compute.container_registry_name
# }

# output "container_registry_login_server" {
#   description = "Login server of the Container Registry"
#   value       = module.compute.container_registry_login_server
# }

# output "container_app_environment_name" {
#   description = "Name of the Container App Environment"
#   value       = module.compute.container_app_environment_name
# }

# output "vm_deployment_agent_name" {
#   description = "Name of the deployment agent VM"
#   value       = module.compute.vm_deployment_agent_name
# }

# output "vm_monitoring_name" {
#   description = "Name of the monitoring VM"
#   value       = module.compute.vm_monitoring_name
# }

# =============================================================================
# DATA OUTPUTS
# =============================================================================

output "cosmos_account_name" {
  description = "Name of the Cosmos DB account"
  value       = module.data.cosmos_account_name
}

output "cosmos_endpoint" {
  description = "Endpoint of the Cosmos DB account"
  value       = module.data.cosmos_endpoint
}

output "storage_account_name" {
  description = "Name of the main storage account"
  value       = module.data.storage_account_name
}

output "storage_primary_endpoint" {
  description = "Primary endpoint of the storage account"
  value       = module.data.storage_primary_endpoint
}

# Search service outputs removed - not needed for MVP

# =============================================================================
# AI SERVICES OUTPUTS
# =============================================================================

# OpenAI outputs temporarily commented due to quota issues
# output "openai_account_name" {
#   description = "Name of the Azure OpenAI service"
#   value       = module.ai.openai_account_name
# }

# output "openai_endpoint" {
#   description = "Endpoint of the Azure OpenAI service"
#   value       = module.ai.openai_endpoint
# }

# output "openai_deployments" {
#   description = "Names of the OpenAI model deployments"
#   value       = module.ai.openai_deployments
# }

output "document_intelligence_name" {
  description = "Name of the Document Intelligence service"
  value       = module.ai.document_intelligence_name
}

output "document_intelligence_endpoint" {
  description = "Endpoint of the Document Intelligence service"
  value       = module.ai.document_intelligence_endpoint
}

output "speech_service_name" {
  description = "Name of the Speech service"
  value       = module.ai.speech_service_name
}

output "speech_service_endpoint" {
  description = "Endpoint of the Speech service"
  value       = module.ai.speech_service_endpoint
}

# =============================================================================
# COMPUTE OUTPUTS
# =============================================================================

output "container_registry_name" {
  description = "Name of the Azure Container Registry"
  value       = module.compute.container_registry_name
}

output "container_registry_login_server" {
  description = "Login server of the Azure Container Registry"
  value       = module.compute.container_registry_login_server
}

output "frontend_app_name" {
  description = "Name of the frontend Container App"
  value       = module.compute.frontend_app_name
}

output "frontend_app_url" {
  description = "URL of the frontend Container App"
  value       = module.compute.frontend_app_url
}

output "backend_app_name" {
  description = "Name of the backend Container App"
  value       = module.compute.backend_app_name
}

output "backend_app_url" {
  description = "URL of the backend Container App"
  value       = module.compute.backend_app_url
}

# Application Gateway outputs removed - not needed for MVP

output "application_urls" {
  description = "All application URLs"
  value       = module.compute.application_urls
}

# =============================================================================
# MONITORING OUTPUTS
# =============================================================================

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace"
  value       = module.monitoring.log_analytics_workspace_name
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = module.monitoring.log_analytics_workspace_id
}

output "application_insights_name" {
  description = "Name of the Application Insights instance"
  value       = module.monitoring.application_insights_name
}

output "application_insights_connection_string" {
  description = "Connection string of the Application Insights instance"
  value       = module.monitoring.application_insights_connection_string
  sensitive   = true
}

output "action_group_name" {
  description = "Name of the Action Group for alerts"
  value       = module.monitoring.action_group_name
}

output "monitoring_urls" {
  description = "URLs for monitoring resources"
  value       = module.monitoring.monitoring_urls
}

output "alert_configuration" {
  description = "Summary of alert configuration"
  value       = module.monitoring.alert_configuration
}

# =============================================================================
# SUMMARY OUTPUT
# =============================================================================

output "deployment_summary" {
  description = "Summary of the deployment"
  value = {
    environment     = "dev"
    location        = "Central US"
    resource_groups = length(values(local.resource_group_names))
    vnet_address    = var.vnet_address_space[0]
    # cosmos_ru       = var.cosmos_throughput     # Commented until data module is ready
    # vm_count        = 2                         # Commented until compute module is ready
    # container_apps  = 3                         # Commented until compute module is ready
    deployment_date = timestamp()
    status          = "Networking Phase Complete"
  }
}

# =============================================================================
# API MANAGEMENT OUTPUTS
# =============================================================================

output "api_management_name" {
  description = "Name of the API Management service"
  value       = module.api_management.apim_name
}

output "api_management_gateway_url" {
  description = "Gateway URL of the API Management service"
  value       = module.api_management.apim_gateway_url
}

output "api_management_portal_url" {
  description = "Developer portal URL of the API Management service"
  value       = module.api_management.apim_portal_url
}

output "api_endpoints" {
  description = "API endpoints for different services"
  value       = module.api_management.api_endpoints
}

# =============================================================================
# VIRTUAL MACHINES OUTPUTS
# =============================================================================

output "processing_vm_name" {
  description = "Name of the processing VM"
  value       = module.virtual_machines.processing_vm_name
}

output "processing_vm_private_ip" {
  description = "Private IP address of the processing VM"
  value       = module.virtual_machines.processing_vm_private_ip
}

output "services_vm_name" {
  description = "Name of the services VM"
  value       = module.virtual_machines.services_vm_name
}

output "services_vm_private_ip" {
  description = "Private IP address of the services VM"
  value       = module.virtual_machines.services_vm_private_ip
}

output "vm_endpoints" {
  description = "VM application endpoints"
  value       = module.virtual_machines.vm_endpoints
}

output "vm_summary" {
  description = "Summary of VM configuration"
  value       = module.virtual_machines.vm_summary
}

output "backup_status" {
  description = "Backup protection status for VMs"
  value       = module.virtual_machines.backup_status
}

# =============================================================================
# DATA FACTORY OUTPUTS
# =============================================================================

output "data_factory_name" {
  description = "Name of the Data Factory"
  value       = module.data_factory.data_factory_name
}

output "data_factory_studio_url" {
  description = "Data Factory Studio URL"
  value       = module.data_factory.development_info.data_factory_studio_url
}

output "data_factory_pipelines" {
  description = "Information about Data Factory pipelines"
  value       = module.data_factory.pipelines
}

output "data_factory_monitoring_endpoints" {
  description = "Data Factory monitoring endpoints"
  value       = module.data_factory.monitoring_endpoints
}

output "data_factory_summary" {
  description = "Summary of Data Factory configuration"
  value       = module.data_factory.data_factory_summary
}

# =============================================================================
# ENHANCED DEPLOYMENT SUMMARY
# =============================================================================

output "enhanced_deployment_summary" {
  description = "Enhanced summary of all deployed resources"
  value = {
    environment = local.environment
    location    = local.location
    
    # Core infrastructure
    resource_groups = {
      count = 9
      names = [
        azurerm_resource_group.network.name,
        azurerm_resource_group.compute.name,
        azurerm_resource_group.data.name,
        azurerm_resource_group.ai.name,
        azurerm_resource_group.security.name,
        azurerm_resource_group.monitor.name,
        azurerm_resource_group.api_management.name,
        azurerm_resource_group.virtual_machines.name,
        azurerm_resource_group.data_factory.name
      ]
    }
    
    # Application URLs
    application_endpoints = {
      frontend_app        = module.compute.frontend_app_url
      backend_app         = module.compute.backend_app_url
      api_management      = module.api_management.apim_gateway_url
      developer_portal    = module.api_management.apim_portal_url
      data_factory_studio = module.data_factory.development_info.data_factory_studio_url
    }
    
    # Management URLs
    management_endpoints = {
      azure_portal        = "https://portal.azure.com"
      api_management      = module.api_management.apim_portal_url
      data_factory_studio = module.data_factory.development_info.data_factory_studio_url
      log_analytics       = module.monitoring.monitoring_urls.log_analytics
      application_insights = module.monitoring.monitoring_urls.app_insights
    }
    
    # Virtual Machines
    virtual_machines = {
      processing_vm = {
        name = module.virtual_machines.processing_vm_name
        ip   = module.virtual_machines.processing_vm_private_ip
      }
      services_vm = {
        name = module.virtual_machines.services_vm_name
        ip   = module.virtual_machines.services_vm_private_ip
      }
    }
    
    # Data Factory pipelines
    data_pipelines = {
      document_processing = module.data_factory.pipelines.document_processing.name
      data_validation     = module.data_factory.pipelines.data_validation.name
      etl_analytics       = module.data_factory.pipelines.etl_analytics.name
    }
    
    # Feature flags
    features = {
      api_management_enabled = true
      virtual_machines_enabled = true
      data_factory_enabled = true
      backup_enabled = var.enable_backup
      monitoring_enabled = var.enable_monitoring
      auto_shutdown_enabled = var.enable_auto_shutdown
    }
    
    deployment_time = formatdate("YYYY-MM-DD hh:mm:ss ZZZ", timestamp())
    status = "All modules deployed successfully"
  }
} 