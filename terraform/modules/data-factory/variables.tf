# =============================================================================
# TECSALUD MVP - DATA FACTORY MODULE VARIABLES
# =============================================================================

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure location"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, stg, prd)"
  type        = string
}

variable "location_short" {
  description = "Short name for location"
  type        = string
}

variable "managed_identity_id" {
  description = "ID of the managed identity for Data Factory"
  type        = string
}

variable "key_vault_id" {
  description = "ID of the Key Vault for secrets"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace for diagnostics"
  type        = string
}

# =============================================================================
# DATA FACTORY CONFIGURATION
# =============================================================================

variable "public_network_enabled" {
  description = "Enable public network access for Data Factory"
  type        = bool
  default     = true
}

variable "managed_virtual_network_enabled" {
  description = "Enable managed virtual network for Data Factory"
  type        = bool
  default     = true
}

# =============================================================================
# INTEGRATION RUNTIME CONFIGURATION
# =============================================================================

variable "integration_runtime_compute_type" {
  description = "Compute type for Azure Integration Runtime"
  type        = string
  default     = "General"
  validation {
    condition     = contains(["General", "ComputeOptimized", "MemoryOptimized"], var.integration_runtime_compute_type)
    error_message = "Integration runtime compute type must be General, ComputeOptimized, or MemoryOptimized."
  }
}

variable "integration_runtime_core_count" {
  description = "Core count for Azure Integration Runtime"
  type        = number
  default     = 8
  validation {
    condition     = contains([8, 16, 32, 48, 80, 144, 272], var.integration_runtime_core_count)
    error_message = "Integration runtime core count must be one of: 8, 16, 32, 48, 80, 144, 272."
  }
}



variable "enable_self_hosted_ir" {
  description = "Enable self-hosted integration runtime"
  type        = bool
  default     = false
}

# =============================================================================
# LINKED SERVICES CONFIGURATION
# =============================================================================

variable "storage_primary_endpoint" {
  description = "Primary endpoint of the storage account"
  type        = string
}

variable "storage_account_id" {
  description = "ID of the storage account"
  type        = string
}

variable "cosmos_connection_string" {
  description = "Connection string for Cosmos DB"
  type        = string
  sensitive   = true
}

variable "enable_sql_linked_service" {
  description = "Enable Azure SQL Database linked service"
  type        = bool
  default     = false
}

variable "sql_connection_string" {
  description = "Connection string for Azure SQL Database"
  type        = string
  default     = ""
  sensitive   = true
}

# =============================================================================
# GITHUB CONFIGURATION (OPTIONAL)
# =============================================================================

variable "github_configuration" {
  description = "GitHub configuration for Data Factory source control"
  type = object({
    account_name    = string
    branch_name     = string
    git_url         = string
    repository_name = string
    root_folder     = string
  })
  default = null
}

# =============================================================================
# PIPELINE CONFIGURATION
# =============================================================================

variable "enable_document_processing_pipeline" {
  description = "Enable document processing pipeline"
  type        = bool
  default     = true
}

variable "enable_data_validation_pipeline" {
  description = "Enable data validation pipeline"
  type        = bool
  default     = true
}

variable "enable_etl_analytics_pipeline" {
  description = "Enable ETL analytics pipeline"
  type        = bool
  default     = true
}

variable "document_processing_schedule_hours" {
  description = "Interval in hours for document processing schedule"
  type        = number
  default     = 4
  validation {
    condition     = var.document_processing_schedule_hours >= 1 && var.document_processing_schedule_hours <= 24
    error_message = "Document processing schedule must be between 1 and 24 hours."
  }
}

# =============================================================================
# TRIGGER CONFIGURATION
# =============================================================================

variable "enable_scheduled_triggers" {
  description = "Enable scheduled triggers for pipelines"
  type        = bool
  default     = true
}

variable "enable_blob_event_triggers" {
  description = "Enable blob event triggers for new document uploads"
  type        = bool
  default     = true
}

variable "trigger_start_time" {
  description = "Start time for scheduled triggers (ISO 8601 format)"
  type        = string
  default     = "2024-01-01T00:00:00Z"
}

# =============================================================================
# DATA FLOW CONFIGURATION
# =============================================================================

variable "enable_data_flows" {
  description = "Enable data flows for advanced transformations"
  type        = bool
  default     = true
}

variable "data_flow_compute_type" {
  description = "Compute type for data flows"
  type        = string
  default     = "General"
  validation {
    condition     = contains(["General", "ComputeOptimized", "MemoryOptimized"], var.data_flow_compute_type)
    error_message = "Data flow compute type must be General, ComputeOptimized, or MemoryOptimized."
  }
}

variable "data_flow_core_count" {
  description = "Core count for data flows"
  type        = number
  default     = 8
  validation {
    condition     = contains([8, 16, 32, 48, 80, 144, 272], var.data_flow_core_count)
    error_message = "Data flow core count must be one of: 8, 16, 32, 48, 80, 144, 272."
  }
}

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================

variable "enable_monitoring" {
  description = "Enable monitoring and diagnostics for Data Factory"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
  validation {
    condition     = var.log_retention_days >= 7 && var.log_retention_days <= 730
    error_message = "Log retention days must be between 7 and 730."
  }
}

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

variable "enable_customer_managed_key" {
  description = "Enable customer-managed key for Data Factory encryption"
  type        = bool
  default     = false
}

variable "customer_managed_key_id" {
  description = "ID of the customer-managed key for encryption"
  type        = string
  default     = ""
}

variable "enable_public_network" {
  description = "Enable public network access"
  type        = bool
  default     = true
}

variable "allowed_ip_ranges" {
  description = "List of allowed IP ranges for Data Factory access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
} 