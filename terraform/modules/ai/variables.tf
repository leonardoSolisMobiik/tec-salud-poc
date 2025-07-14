# =============================================================================
# TECSALUD MVP - AI MODULE VARIABLES
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

variable "tags" {
  description = "Tags to be applied to resources"
  type        = map(string)
  default     = {}
} 