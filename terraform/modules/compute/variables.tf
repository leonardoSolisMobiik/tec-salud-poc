# =============================================================================
# TECSALUD MVP - COMPUTE MODULE VARIABLES
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
  description = "ID of the managed identity for container apps"
  type        = string
}

variable "frontend_subnet_id" {
  description = "ID of the frontend subnet for Application Gateway"
  type        = string
}

# =============================================================================
# CONTAINER REGISTRY VARIABLES
# =============================================================================

variable "acr_sku" {
  description = "SKU for Azure Container Registry"
  type        = string
  default     = "Basic"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

# =============================================================================
# CONTAINER APPS VARIABLES - FRONTEND
# =============================================================================

variable "frontend_image" {
  description = "Container image for frontend application"
  type        = string
  default     = "nginx:alpine"
}

variable "frontend_cpu" {
  description = "CPU allocation for frontend container"
  type        = number
  default     = 0.25
  validation {
    condition     = contains([0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0], var.frontend_cpu)
    error_message = "Frontend CPU must be one of: 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0."
  }
}

variable "frontend_memory" {
  description = "Memory allocation for frontend container"
  type        = string
  default     = "0.5Gi"
  validation {
    condition     = contains(["0.5Gi", "1.0Gi", "1.5Gi", "2.0Gi", "2.5Gi", "3.0Gi", "3.5Gi", "4.0Gi"], var.frontend_memory)
    error_message = "Frontend memory must be one of: 0.5Gi, 1.0Gi, 1.5Gi, 2.0Gi, 2.5Gi, 3.0Gi, 3.5Gi, 4.0Gi."
  }
}

variable "frontend_port" {
  description = "Port for frontend application"
  type        = number
  default     = 80
}

variable "frontend_min_replicas" {
  description = "Minimum number of frontend replicas"
  type        = number
  default     = 1
  validation {
    condition     = var.frontend_min_replicas >= 0 && var.frontend_min_replicas <= 25
    error_message = "Frontend min replicas must be between 0 and 25."
  }
}

variable "frontend_max_replicas" {
  description = "Maximum number of frontend replicas"
  type        = number
  default     = 3
  validation {
    condition     = var.frontend_max_replicas >= 1 && var.frontend_max_replicas <= 25
    error_message = "Frontend max replicas must be between 1 and 25."
  }
}

# =============================================================================
# CONTAINER APPS VARIABLES - BACKEND
# =============================================================================

variable "backend_image" {
  description = "Container image for backend application"
  type        = string
  default     = "nginx:alpine"
}

variable "backend_cpu" {
  description = "CPU allocation for backend container"
  type        = number
  default     = 0.5
  validation {
    condition     = contains([0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0], var.backend_cpu)
    error_message = "Backend CPU must be one of: 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0."
  }
}

variable "backend_memory" {
  description = "Memory allocation for backend container"
  type        = string
  default     = "1.0Gi"
  validation {
    condition     = contains(["0.5Gi", "1.0Gi", "1.5Gi", "2.0Gi", "2.5Gi", "3.0Gi", "3.5Gi", "4.0Gi"], var.backend_memory)
    error_message = "Backend memory must be one of: 0.5Gi, 1.0Gi, 1.5Gi, 2.0Gi, 2.5Gi, 3.0Gi, 3.5Gi, 4.0Gi."
  }
}

variable "backend_port" {
  description = "Port for backend application"
  type        = number
  default     = 3000
}

variable "backend_min_replicas" {
  description = "Minimum number of backend replicas"
  type        = number
  default     = 1
  validation {
    condition     = var.backend_min_replicas >= 0 && var.backend_min_replicas <= 25
    error_message = "Backend min replicas must be between 0 and 25."
  }
}

variable "backend_max_replicas" {
  description = "Maximum number of backend replicas"
  type        = number
  default     = 5
  validation {
    condition     = var.backend_max_replicas >= 1 && var.backend_max_replicas <= 25
    error_message = "Backend max replicas must be between 1 and 25."
  }
}

# Application Gateway variables removed - not needed for MVP

# =============================================================================
# EXTERNAL SERVICE ENDPOINTS
# =============================================================================

variable "cosmos_endpoint" {
  description = "Cosmos DB endpoint URL"
  type        = string
}

variable "storage_primary_endpoint" {
  description = "Storage account primary endpoint URL"
  type        = string
}

# Search service URL variable removed - not needed for MVP

variable "document_intelligence_endpoint" {
  description = "Azure Document Intelligence endpoint URL"
  type        = string
}

variable "speech_service_endpoint" {
  description = "Azure Speech Services endpoint URL"
  type        = string
}

# =============================================================================
# SECRETS FROM KEY VAULT
# =============================================================================

variable "cosmos_connection_string" {
  description = "Cosmos DB connection string"
  type        = string
  sensitive   = true
}

variable "storage_connection_string" {
  description = "Storage account connection string"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "Azure OpenAI API key"
  type        = string
  sensitive   = true
  default     = "placeholder-for-future-use"
}

variable "document_intelligence_key" {
  description = "Azure Document Intelligence API key"
  type        = string
  sensitive   = true
}

variable "speech_api_key" {
  description = "Azure Speech Services API key"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to be applied to resources"
  type        = map(string)
  default     = {}
} 