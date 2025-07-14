# =============================================================================
# TECSALUD MVP - NETWORKING MODULE VARIABLES
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

variable "vnet_address_space" {
  description = "Address space for the virtual network"
  type        = list(string)
}

variable "subnet_frontend" {
  description = "Address space for the frontend subnet"
  type        = string
}

variable "subnet_backend" {
  description = "Address space for the backend subnet"
  type        = string
}

variable "subnet_data" {
  description = "Address space for the data subnet"
  type        = string
}

variable "subnet_bastion" {
  description = "Address space for the bastion subnet"
  type        = string
}

variable "tags" {
  description = "Tags to be applied to resources"
  type        = map(string)
  default     = {}
} 