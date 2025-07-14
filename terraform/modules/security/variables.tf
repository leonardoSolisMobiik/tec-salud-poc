# =============================================================================
# TECSALUD MVP - SECURITY MODULE VARIABLES
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

variable "key_vault_sku" {
  description = "SKU for the Key Vault (standard or premium)"
  type        = string
  default     = "standard"
  validation {
    condition     = contains(["standard", "premium"], var.key_vault_sku)
    error_message = "Key Vault SKU must be either standard or premium."
  }
}

variable "tags" {
  description = "Tags to be applied to resources"
  type        = map(string)
  default     = {}
} 