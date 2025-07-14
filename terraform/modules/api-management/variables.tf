# =============================================================================
# TECSALUD MVP - API MANAGEMENT MODULE VARIABLES
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
  description = "ID of the managed identity for API Management"
  type        = string
}

variable "backend_subnet_id" {
  description = "ID of the backend subnet for internal API Management"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace for diagnostics"
  type        = string
}

# =============================================================================
# API MANAGEMENT CONFIGURATION
# =============================================================================

variable "publisher_name" {
  description = "Publisher name for API Management"
  type        = string
  default     = "TecSalud"
}

variable "publisher_email" {
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

variable "backend_service_url" {
  description = "URL of the backend service for API Management"
  type        = string
}

# =============================================================================
# NETWORK CONFIGURATION
# =============================================================================

variable "virtual_network_type" {
  description = "Virtual network type for API Management"
  type        = string
  default     = "Internal"
  validation {
    condition     = contains(["None", "External", "Internal"], var.virtual_network_type)
    error_message = "Virtual network type must be one of: None, External, Internal."
  }
}

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

variable "enable_client_certificate" {
  description = "Enable client certificate authentication"
  type        = bool
  default     = false
}

variable "certificate_source" {
  description = "Source of the certificate (BuiltIn or Custom)"
  type        = string
  default     = "BuiltIn"
  validation {
    condition     = contains(["BuiltIn", "Custom"], var.certificate_source)
    error_message = "Certificate source must be either BuiltIn or Custom."
  }
}

# =============================================================================
# API CONFIGURATION
# =============================================================================

variable "api_revision" {
  description = "API revision number"
  type        = string
  default     = "1"
}

variable "subscription_required" {
  description = "Whether API subscription is required"
  type        = bool
  default     = true
}

variable "approval_required" {
  description = "Whether subscription approval is required"
  type        = bool
  default     = true
}

# =============================================================================
# RATE LIMITING
# =============================================================================

variable "rate_limit_calls" {
  description = "Number of calls allowed per renewal period"
  type        = number
  default     = 100
}

variable "rate_limit_renewal_period" {
  description = "Rate limit renewal period in seconds"
  type        = number
  default     = 60
}

variable "quota_calls" {
  description = "Number of calls allowed in quota period"
  type        = number
  default     = 10000
}

variable "quota_renewal_period" {
  description = "Quota renewal period in seconds (604800 = 1 week)"
  type        = number
  default     = 604800
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
} 