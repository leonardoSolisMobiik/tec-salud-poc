# =============================================================================
# TECSALUD MVP - VIRTUAL MACHINES MODULE VARIABLES
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
  description = "ID of the managed identity for VMs"
  type        = string
}

variable "key_vault_name" {
  description = "Name of the Key Vault for configuration"
  type        = string
}

# =============================================================================
# NETWORK CONFIGURATION
# =============================================================================

variable "backend_subnet_id" {
  description = "ID of the backend subnet for processing VM"
  type        = string
}

variable "data_subnet_id" {
  description = "ID of the data subnet for services VM"
  type        = string
}

variable "backend_nsg_id" {
  description = "ID of the backend network security group"
  type        = string
}

variable "data_nsg_id" {
  description = "ID of the data network security group"
  type        = string
}

# =============================================================================
# VM CONFIGURATION
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

variable "os_disk_type" {
  description = "Type of OS disk for VMs"
  type        = string
  default     = "Premium_LRS"
  validation {
    condition     = contains(["Standard_LRS", "Premium_LRS", "StandardSSD_LRS"], var.os_disk_type)
    error_message = "OS disk type must be Standard_LRS, Premium_LRS, or StandardSSD_LRS."
  }
}

# =============================================================================
# AUTHENTICATION CONFIGURATION
# =============================================================================

variable "admin_username" {
  description = "Admin username for VMs"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
}

variable "admin_email" {
  description = "Email for admin notifications"
  type        = string
  default     = "admin@tecsalud.com"
}

# =============================================================================
# BACKUP AND MONITORING CONFIGURATION
# =============================================================================

variable "enable_backup" {
  description = "Enable backup for VMs"
  type        = bool
  default     = true
}

variable "enable_auto_shutdown" {
  description = "Enable auto-shutdown for VMs"
  type        = bool
  default     = true
}

variable "auto_shutdown_time" {
  description = "Time for auto-shutdown (24h format)"
  type        = string
  default     = "22:00"
}

variable "auto_shutdown_timezone" {
  description = "Timezone for auto-shutdown"
  type        = string
  default     = "Central Standard Time"
}

variable "auto_shutdown_notification_minutes" {
  description = "Minutes before auto-shutdown to send notification"
  type        = number
  default     = 30
}

# =============================================================================
# STORAGE CONFIGURATION
# =============================================================================

variable "data_disk_size_gb" {
  description = "Size of additional data disk in GB"
  type        = number
  default     = 128
  validation {
    condition     = var.data_disk_size_gb >= 32 && var.data_disk_size_gb <= 4095
    error_message = "Data disk size must be between 32 and 4095 GB."
  }
}

variable "data_disk_type" {
  description = "Type of data disk for VMs"
  type        = string
  default     = "Premium_LRS"
  validation {
    condition     = contains(["Standard_LRS", "Premium_LRS", "StandardSSD_LRS"], var.data_disk_type)
    error_message = "Data disk type must be Standard_LRS, Premium_LRS, or StandardSSD_LRS."
  }
}

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

variable "enable_processing_service" {
  description = "Enable document processing service on processing VM"
  type        = bool
  default     = true
}

variable "enable_services_api" {
  description = "Enable services API on services VM"
  type        = bool
  default     = true
}

variable "enable_monitoring_agents" {
  description = "Enable monitoring agents on VMs"
  type        = bool
  default     = true
}

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

variable "enable_disk_encryption" {
  description = "Enable disk encryption for VMs"
  type        = bool
  default     = true
}

variable "enable_boot_diagnostics" {
  description = "Enable boot diagnostics for VMs"
  type        = bool
  default     = true
}

variable "patch_mode" {
  description = "Patch mode for VMs"
  type        = string
  default     = "ImageDefault"
  validation {
    condition     = contains(["ImageDefault", "AutomaticByPlatform"], var.patch_mode)
    error_message = "Patch mode must be ImageDefault or AutomaticByPlatform."
  }
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
} 