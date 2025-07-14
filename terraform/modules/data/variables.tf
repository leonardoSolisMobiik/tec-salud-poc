# =============================================================================
# TECSALUD MVP - DATA MODULE VARIABLES
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

variable "key_vault_id" {
  description = "ID of the Key Vault to store secrets"
  type        = string
}

variable "allowed_subnet_ids" {
  description = "List of subnet IDs allowed to access storage"
  type        = list(string)
  default     = []
}

# Search service variable removed - not needed for MVP

variable "cosmos_consistency_level" {
  description = "Consistency level for Cosmos DB"
  type        = string
  default     = "Session"
  validation {
    condition     = contains(["BoundedStaleness", "Eventual", "Session", "Strong", "ConsistentPrefix"], var.cosmos_consistency_level)
    error_message = "Cosmos consistency level must be one of: BoundedStaleness, Eventual, Session, Strong, ConsistentPrefix."
  }
}

variable "tags" {
  description = "Tags to be applied to resources"
  type        = map(string)
  default     = {}
} 