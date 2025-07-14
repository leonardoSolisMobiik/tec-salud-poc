# =============================================================================
# TECSALUD MVP - VIRTUAL MACHINES MODULE OUTPUTS
# =============================================================================

# Processing VM outputs
output "processing_vm_id" {
  description = "ID of the processing VM"
  value       = azurerm_linux_virtual_machine.processing.id
}

output "processing_vm_name" {
  description = "Name of the processing VM"
  value       = azurerm_linux_virtual_machine.processing.name
}

output "processing_vm_private_ip" {
  description = "Private IP address of the processing VM"
  value       = azurerm_network_interface.processing.private_ip_address
}

output "processing_vm_public_ip" {
  description = "Public IP address of the processing VM (if any)"
  value       = azurerm_linux_virtual_machine.processing.public_ip_address
}

# Services VM outputs
output "services_vm_id" {
  description = "ID of the services VM"
  value       = azurerm_linux_virtual_machine.services.id
}

output "services_vm_name" {
  description = "Name of the services VM"
  value       = azurerm_linux_virtual_machine.services.name
}

output "services_vm_private_ip" {
  description = "Private IP address of the services VM"
  value       = azurerm_network_interface.services.private_ip_address
}

output "services_vm_public_ip" {
  description = "Public IP address of the services VM (if any)"
  value       = azurerm_linux_virtual_machine.services.public_ip_address
}

# Network Interface outputs
output "processing_nic_id" {
  description = "ID of the processing VM network interface"
  value       = azurerm_network_interface.processing.id
}

output "services_nic_id" {
  description = "ID of the services VM network interface"
  value       = azurerm_network_interface.services.id
}

# Recovery Services Vault outputs
output "recovery_vault_id" {
  description = "ID of the Recovery Services Vault"
  value       = azurerm_recovery_services_vault.main.id
}

output "recovery_vault_name" {
  description = "Name of the Recovery Services Vault"
  value       = azurerm_recovery_services_vault.main.name
}

output "backup_policy_id" {
  description = "ID of the VM backup policy"
  value       = azurerm_backup_policy_vm.main.id
}

# VM Identity outputs
output "processing_vm_identity_principal_id" {
  description = "Principal ID of the processing VM managed identity"
  value       = azurerm_linux_virtual_machine.processing.identity[0].principal_id
}

output "services_vm_identity_principal_id" {
  description = "Principal ID of the services VM managed identity"
  value       = azurerm_linux_virtual_machine.services.identity[0].principal_id
}

# VM Extensions outputs
output "processing_vm_extensions" {
  description = "Extensions installed on processing VM"
  value = {
    monitor_agent = azurerm_virtual_machine_extension.processing_monitor.id
    custom_script = azurerm_virtual_machine_extension.processing_setup.id
  }
}

output "services_vm_extensions" {
  description = "Extensions installed on services VM"
  value = {
    monitor_agent = azurerm_virtual_machine_extension.services_monitor.id
    custom_script = azurerm_virtual_machine_extension.services_setup.id
  }
}

# Application endpoints
output "vm_endpoints" {
  description = "VM application endpoints"
  value = {
    processing_vm = {
      private_ip = azurerm_network_interface.processing.private_ip_address
      ssh_command = "ssh ${var.admin_username}@${azurerm_network_interface.processing.private_ip_address}"
    }
    services_vm = {
      private_ip = azurerm_network_interface.services.private_ip_address
      api_url = "http://${azurerm_network_interface.services.private_ip_address}:8000"
      health_url = "http://${azurerm_network_interface.services.private_ip_address}:8000/health"
      ssh_command = "ssh ${var.admin_username}@${azurerm_network_interface.services.private_ip_address}"
    }
  }
}

# VM configuration summary
output "vm_summary" {
  description = "Summary of VM configuration"
  value = {
    processing_vm = {
      name = azurerm_linux_virtual_machine.processing.name
      size = azurerm_linux_virtual_machine.processing.size
      location = azurerm_linux_virtual_machine.processing.location
      os_disk_type = var.os_disk_type
      private_ip = azurerm_network_interface.processing.private_ip_address
      admin_username = var.admin_username
      auto_shutdown_enabled = var.enable_auto_shutdown
      backup_enabled = var.enable_backup
    }
    services_vm = {
      name = azurerm_linux_virtual_machine.services.name
      size = azurerm_linux_virtual_machine.services.size
      location = azurerm_linux_virtual_machine.services.location
      os_disk_type = var.os_disk_type
      private_ip = azurerm_network_interface.services.private_ip_address
      admin_username = var.admin_username
      auto_shutdown_enabled = var.enable_auto_shutdown
      backup_enabled = var.enable_backup
    }
  }
}

# Backup status
output "backup_status" {
  description = "Backup protection status for VMs"
  value = {
    processing_vm_protected = var.enable_backup ? "enabled" : "disabled"
    services_vm_protected = var.enable_backup ? "enabled" : "disabled"
    recovery_vault = azurerm_recovery_services_vault.main.name
    backup_policy = azurerm_backup_policy_vm.main.name
  }
}

# Health check information
output "health_check_info" {
  description = "Health check information for VMs"
  value = {
    processing_vm = {
      health_script = "/opt/tecsalud/health-check.sh"
      log_file = "/opt/tecsalud/logs/health-check.log"
      service_status_command = "systemctl status tecsalud-processing"
    }
    services_vm = {
      health_script = "/opt/tecsalud/health-check.sh"
      log_file = "/opt/tecsalud/logs/health-check.log"
      api_health_endpoint = "http://${azurerm_network_interface.services.private_ip_address}:8000/health"
      service_status_commands = [
        "systemctl status tecsalud-services",
        "systemctl status tecsalud-worker",
        "systemctl status redis-server",
        "systemctl status nginx"
      ]
    }
  }
} 