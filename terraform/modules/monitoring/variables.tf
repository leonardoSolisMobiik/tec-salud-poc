# =============================================================================
# TECSALUD MVP - MONITORING MODULE VARIABLES
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

# =============================================================================
# LOG ANALYTICS WORKSPACE VARIABLES
# =============================================================================

variable "log_analytics_sku" {
  description = "SKU for Log Analytics Workspace"
  type        = string
  default     = "PerGB2018"
  validation {
    condition     = contains(["Free", "Standalone", "PerNode", "PerGB2018", "Premium"], var.log_analytics_sku)
    error_message = "Log Analytics SKU must be one of: Free, Standalone, PerNode, PerGB2018, Premium."
  }
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

variable "log_daily_quota_gb" {
  description = "Daily quota in GB for Log Analytics (null for no quota)"
  type        = number
  default     = null
  validation {
    condition     = var.log_daily_quota_gb == null || (var.log_daily_quota_gb >= 0.023 && var.log_daily_quota_gb <= 1000)
    error_message = "Daily quota must be between 0.023 and 1000 GB, or null for no quota."
  }
}

# =============================================================================
# APPLICATION INSIGHTS VARIABLES
# =============================================================================

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

# =============================================================================
# ALERT CONFIGURATION VARIABLES
# =============================================================================

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Alert email must be a valid email address."
  }
}

variable "alert_phone" {
  description = "Phone number for SMS alerts (optional)"
  type        = string
  default     = null
}

variable "alert_phone_country_code" {
  description = "Country code for SMS alerts (e.g., '1' for US, '52' for Mexico)"
  type        = string
  default     = "52"
}

variable "alert_webhook_url" {
  description = "Webhook URL for alerts (optional)"
  type        = string
  default     = null
}

# =============================================================================
# RESOURCE IDS FOR MONITORING
# =============================================================================

variable "container_app_ids" {
  description = "List of Container App IDs to monitor"
  type        = list(string)
  default     = []
}

# Application Gateway variable removed - not needed for MVP

variable "cosmos_db_id" {
  description = "ID of the Cosmos DB account to monitor"
  type        = string
}

variable "key_vault_id" {
  description = "ID of the Key Vault to monitor"
  type        = string
}

variable "storage_account_id" {
  description = "ID of the Storage Account to monitor"
  type        = string
}

# =============================================================================
# ALERT THRESHOLDS
# =============================================================================

variable "cpu_threshold" {
  description = "CPU usage threshold for alerts (percentage)"
  type        = number
  default     = 80
  validation {
    condition     = var.cpu_threshold >= 0 && var.cpu_threshold <= 100
    error_message = "CPU threshold must be between 0 and 100."
  }
}

variable "memory_threshold" {
  description = "Memory usage threshold for alerts (percentage)"
  type        = number
  default     = 80
  validation {
    condition     = var.memory_threshold >= 0 && var.memory_threshold <= 100
    error_message = "Memory threshold must be between 0 and 100."
  }
}

variable "error_threshold" {
  description = "Error count threshold for alerts"
  type        = number
  default     = 10
  validation {
    condition     = var.error_threshold >= 0
    error_message = "Error threshold must be greater than or equal to 0."
  }
}

variable "cosmos_ru_threshold" {
  description = "Cosmos DB RU consumption threshold for alerts"
  type        = number
  default     = 8000
  validation {
    condition     = var.cosmos_ru_threshold >= 0
    error_message = "Cosmos RU threshold must be greater than or equal to 0."
  }
}

variable "tags" {
  description = "Tags to be applied to resources"
  type        = map(string)
  default     = {}
} 