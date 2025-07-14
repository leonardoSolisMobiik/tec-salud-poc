# =============================================================================
# TECSALUD MVP - DEVELOPMENT ENVIRONMENT VARIABLES
# =============================================================================

# =============================================================================
# COMMON VARIABLES
# =============================================================================

variable "default_tags" {
  description = "Default tags to be applied to all resources"
  type        = map(string)
  default = {
    Project              = "TecSalud-MVP"
    BusinessUnit         = "TecSalud"
    DataClassification   = "Medical-Sensitive"
    Compliance          = "HIPAA-Healthcare"
    CostCenter          = "IT-Healthcare-AI"
    MaintenanceWindow   = "Sun-02:00-06:00-CST"
  }
}

variable "owner_email" {
  description = "Email of the team/person responsible for this environment"
  type        = string
  default     = "dev-team@tecsalud.com"
}

variable "support_team" {
  description = "Team responsible for support of this environment"
  type        = string
  default     = "DevOps-Team"
}

# =============================================================================
# NETWORKING VARIABLES
# =============================================================================

variable "vnet_address_space" {
  description = "Address space for the virtual network"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_frontend" {
  description = "Address space for the frontend subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "subnet_backend" {
  description = "Address space for the backend subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "subnet_data" {
  description = "Address space for the data subnet"
  type        = string
  default     = "10.0.3.0/24"
}

variable "subnet_bastion" {
  description = "Address space for the bastion subnet"
  type        = string
  default     = "10.0.4.0/24"
}

# =============================================================================
# SECURITY VARIABLES
# =============================================================================

variable "key_vault_sku" {
  description = "SKU for the Key Vault"
  type        = string
  default     = "standard"
  validation {
    condition     = contains(["standard", "premium"], var.key_vault_sku)
    error_message = "Key Vault SKU must be either standard or premium."
  }
}

# =============================================================================
# COMPUTE VARIABLES
# =============================================================================

variable "container_app_min_replicas" {
  description = "Minimum number of replicas for container apps"
  type        = number
  default     = 1
  validation {
    condition     = var.container_app_min_replicas >= 1 && var.container_app_min_replicas <= 10
    error_message = "Container app min replicas must be between 1 and 10."
  }
}

variable "container_app_max_replicas" {
  description = "Maximum number of replicas for container apps"
  type        = number
  default     = 3
  validation {
    condition     = var.container_app_max_replicas >= 1 && var.container_app_max_replicas <= 25
    error_message = "Container app max replicas must be between 1 and 25."
  }
}

variable "vm_size" {
  description = "Size of the virtual machines"
  type        = string
  default     = "Standard_B2s"
  validation {
    condition = contains([
      "Standard_B2s", "Standard_B2ms", "Standard_B4ms",
      "Standard_D2s_v3", "Standard_D4s_v3", "Standard_D8s_v3"
    ], var.vm_size)
    error_message = "VM size must be one of the supported sizes."
  }
}

# =============================================================================
# DATA VARIABLES
# =============================================================================

variable "cosmos_throughput" {
  description = "Throughput for Cosmos DB (RU/s)"
  type        = number
  default     = 400
  validation {
    condition     = var.cosmos_throughput >= 400 && var.cosmos_throughput <= 10000
    error_message = "Cosmos DB throughput must be between 400 and 10000 RU/s."
  }
}

variable "storage_replication" {
  description = "Replication type for storage accounts"
  type        = string
  default     = "LRS"
  validation {
    condition     = contains(["LRS", "GRS", "RAGRS", "ZRS"], var.storage_replication)
    error_message = "Storage replication must be one of: LRS, GRS, RAGRS, ZRS."
  }
}

# Search service variable removed - not needed for MVP

# =============================================================================
# AI SERVICES VARIABLES
# =============================================================================

variable "openai_sku" {
  description = "SKU for Azure OpenAI Service"
  type        = string
  default     = "S0"
  validation {
    condition     = contains(["S0"], var.openai_sku)
    error_message = "OpenAI SKU must be S0."
  }
}

variable "document_intelligence_sku" {
  description = "SKU for Document Intelligence Service"
  type        = string
  default     = "S0"
  validation {
    condition     = contains(["F0", "S0"], var.document_intelligence_sku)
    error_message = "Document Intelligence SKU must be F0 or S0."
  }
}

variable "speech_sku" {
  description = "SKU for Speech Services"
  type        = string
  default     = "S0"
  validation {
    condition     = contains(["F0", "S0"], var.speech_sku)
    error_message = "Speech Services SKU must be F0 or S0."
  }
}

# =============================================================================
# MONITORING VARIABLES
# =============================================================================

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
  validation {
    condition     = var.log_retention_days >= 7 && var.log_retention_days <= 730
    error_message = "Log retention days must be between 7 and 730."
  }
}

variable "log_analytics_sku" {
  description = "SKU for Log Analytics Workspace"
  type        = string
  default     = "PerGB2018"
  validation {
    condition     = contains(["Free", "Standalone", "PerNode", "PerGB2018", "Premium"], var.log_analytics_sku)
    error_message = "Log Analytics SKU must be one of: Free, Standalone, PerNode, PerGB2018, Premium."
  }
}

variable "app_insights_retention_days" {
  description = "Number of days to retain Application Insights data"
  type        = number
  default     = 90
  validation {
    condition     = var.app_insights_retention_days >= 30 && var.app_insights_retention_days <= 730
    error_message = "Application Insights retention days must be between 30 and 730."
  }
}

variable "app_insights_sampling_percentage" {
  description = "Sampling percentage for Application Insights (0-100)"
  type        = number
  default     = 100
  validation {
    condition     = var.app_insights_sampling_percentage >= 0 && var.app_insights_sampling_percentage <= 100
    error_message = "Sampling percentage must be between 0 and 100."
  }
}

variable "log_daily_quota_gb" {
  description = "Daily quota in GB for Log Analytics (null for no quota)"
  type        = number
  default     = null
  validation {
    condition     = var.log_daily_quota_gb == null || (var.log_daily_quota_gb >= 0.023 && var.log_daily_quota_gb <= 1000)
    error_message = "Daily quota must be between 0.023 and 1000 GB, or null for no quota."
  }
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = "dev-team@tecsalud.com"
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Alert email must be a valid email address."
  }
}

# =============================================================================
# CONTAINER APPS CONFIGURATION
# =============================================================================

variable "frontend_image" {
  description = "Container image for frontend application"
  type        = string
  default     = "nginx:alpine"
  validation {
    condition     = length(var.frontend_image) > 0
    error_message = "Frontend image cannot be empty."
  }
}

variable "backend_image" {
  description = "Container image for backend application"
  type        = string
  default     = "nginx:alpine"
  validation {
    condition     = length(var.backend_image) > 0
    error_message = "Backend image cannot be empty."
  }
}

# =============================================================================
# FEATURE FLAGS
# =============================================================================

variable "enable_backup" {
  description = "Enable backup for resources"
  type        = bool
  default     = false
}

variable "enable_monitoring" {
  description = "Enable monitoring for resources"
  type        = bool
  default     = true
}

variable "enable_auto_shutdown" {
  description = "Enable auto shutdown for VMs"
  type        = bool
  default     = true
}

# =============================================================================
# API MANAGEMENT VARIABLES
# =============================================================================

variable "apim_publisher_name" {
  description = "Publisher name for API Management"
  type        = string
  default     = "TecSalud"
}

variable "apim_publisher_email" {
  description = "Publisher email for API Management"
  type        = string
  default     = "admin@tecsalud.com"
}

variable "apim_sku" {
  description = "SKU for API Management"
  type        = string
  default     = "Developer_1"
  validation {
    condition     = contains(["Developer_1", "Basic_1", "Basic_2", "Standard_1", "Standard_2", "Premium_1"], var.apim_sku)
    error_message = "API Management SKU must be one of: Developer_1, Basic_1, Basic_2, Standard_1, Standard_2, Premium_1."
  }
}

# =============================================================================
# VIRTUAL MACHINES VARIABLES
# =============================================================================

variable "vm_processing_size" {
  description = "Size of the processing VM"
  type        = string
  default     = "Standard_D4s_v3"
  validation {
    condition = contains([
      "Standard_D2s_v3", "Standard_D4s_v3", "Standard_D8s_v3",
      "Standard_E2s_v3", "Standard_E4s_v3", "Standard_E8s_v3"
    ], var.vm_processing_size)
    error_message = "VM size must be a valid Azure VM size."
  }
}

variable "vm_services_size" {
  description = "Size of the services VM"
  type        = string
  default     = "Standard_D2s_v3"
  validation {
    condition = contains([
      "Standard_D2s_v3", "Standard_D4s_v3", "Standard_D8s_v3",
      "Standard_E2s_v3", "Standard_E4s_v3", "Standard_E8s_v3"
    ], var.vm_services_size)
    error_message = "VM size must be a valid Azure VM size."
  }
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  default     = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC7laRyN0B2ijG0lL4yhcPmQDdx+E7JGz3JZ8J5X8f2q2Q3yJ8V3xJ8J5X8f2q2Q3yJ8V3x tecsalud-dev-key"
}

variable "admin_email" {
  description = "Email for admin notifications"
  type        = string
  default     = "admin@tecsalud.com"
}

# =============================================================================
# DATA FACTORY VARIABLES
# =============================================================================

variable "adf_public_network_enabled" {
  description = "Enable public network access for Data Factory"
  type        = bool
  default     = true
}

variable "adf_integration_runtime_compute_type" {
  description = "Compute type for Azure Integration Runtime"
  type        = string
  default     = "General"
  validation {
    condition     = contains(["General", "ComputeOptimized", "MemoryOptimized"], var.adf_integration_runtime_compute_type)
    error_message = "Integration runtime compute type must be General, ComputeOptimized, or MemoryOptimized."
  }
}

variable "adf_integration_runtime_core_count" {
  description = "Core count for Azure Integration Runtime"
  type        = number
  default     = 8
  validation {
    condition     = contains([8, 16, 32, 48, 80, 144, 272], var.adf_integration_runtime_core_count)
    error_message = "Integration runtime core count must be one of: 8, 16, 32, 48, 80, 144, 272."
  }
}

variable "adf_enable_self_hosted_ir" {
  description = "Enable self-hosted integration runtime"
  type        = bool
  default     = false
}

variable "adf_enable_scheduled_triggers" {
  description = "Enable scheduled triggers for pipelines"
  type        = bool
  default     = true
}

variable "adf_enable_blob_event_triggers" {
  description = "Enable blob event triggers for new document uploads"
  type        = bool
  default     = true
} 