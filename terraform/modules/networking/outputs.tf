# =============================================================================
# TECSALUD MVP - NETWORKING MODULE OUTPUTS
# =============================================================================

output "vnet_name" {
  description = "Name of the virtual network"
  value       = azurerm_virtual_network.main.name
}

output "vnet_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.main.id
}

output "subnet_frontend_id" {
  description = "ID of the frontend subnet"
  value       = azurerm_subnet.frontend.id
}

output "subnet_backend_id" {
  description = "ID of the backend subnet"
  value       = azurerm_subnet.backend.id
}

output "subnet_data_id" {
  description = "ID of the data subnet"
  value       = azurerm_subnet.data.id
}

output "subnet_bastion_id" {
  description = "ID of the bastion subnet"
  value       = azurerm_subnet.bastion.id
}

output "bastion_hostname" {
  description = "Hostname of the Bastion service"
  value       = azurerm_bastion_host.main.dns_name
}

output "bastion_public_ip" {
  description = "Public IP address of the Bastion service"
  value       = azurerm_public_ip.bastion.ip_address
}

output "nsg_frontend_id" {
  description = "ID of the frontend NSG"
  value       = azurerm_network_security_group.frontend.id
}

output "nsg_backend_id" {
  description = "ID of the backend NSG"
  value       = azurerm_network_security_group.backend.id
}

output "nsg_data_id" {
  description = "ID of the data NSG"
  value       = azurerm_network_security_group.data.id
}

output "nsg_bastion_id" {
  description = "ID of the bastion NSG"
  value       = azurerm_network_security_group.bastion.id
} 