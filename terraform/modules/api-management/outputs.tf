# =============================================================================
# TECSALUD MVP - API MANAGEMENT MODULE OUTPUTS
# =============================================================================

# API Management outputs
output "apim_name" {
  description = "Name of the API Management service"
  value       = azurerm_api_management.main.name
}

output "apim_id" {
  description = "ID of the API Management service"
  value       = azurerm_api_management.main.id
}

output "apim_gateway_url" {
  description = "Gateway URL of the API Management service"
  value       = azurerm_api_management.main.gateway_url
}

output "apim_portal_url" {
  description = "Developer portal URL of the API Management service"
  value       = azurerm_api_management.main.developer_portal_url
}

output "apim_management_api_url" {
  description = "Management API URL of the API Management service"
  value       = azurerm_api_management.main.management_api_url
}

output "apim_scm_url" {
  description = "SCM URL of the API Management service"
  value       = azurerm_api_management.main.scm_url
}

output "apim_public_ip_addresses" {
  description = "Public IP addresses of the API Management service"
  value       = azurerm_api_management.main.public_ip_addresses
}

output "apim_private_ip_addresses" {
  description = "Private IP addresses of the API Management service"
  value       = azurerm_api_management.main.private_ip_addresses
}

# API outputs
output "medical_api_id" {
  description = "ID of the Medical API"
  value       = azurerm_api_management_api.medical_api.id
}

output "medical_api_name" {
  description = "Name of the Medical API"
  value       = azurerm_api_management_api.medical_api.name
}

output "document_api_id" {
  description = "ID of the Document API"
  value       = azurerm_api_management_api.document_api.id
}

output "document_api_name" {
  description = "Name of the Document API"
  value       = azurerm_api_management_api.document_api.name
}

# Product outputs
output "medical_staff_product_id" {
  description = "ID of the Medical Staff product"
  value       = azurerm_api_management_product.medical_staff.id
}

output "admin_product_id" {
  description = "ID of the Admin product"
  value       = azurerm_api_management_product.admin.id
}

# API endpoints for applications
output "api_endpoints" {
  description = "API endpoints for different services"
  value = {
    medical_api_base    = "${azurerm_api_management.main.gateway_url}/api/medical"
    document_api_base   = "${azurerm_api_management.main.gateway_url}/api/documents"
    gateway_url         = azurerm_api_management.main.gateway_url
    developer_portal    = azurerm_api_management.main.developer_portal_url
  }
}

# Security outputs
output "apim_identity_principal_id" {
  description = "Principal ID of the API Management managed identity"
  value       = azurerm_api_management.main.identity[0].principal_id
}

output "apim_identity_tenant_id" {
  description = "Tenant ID of the API Management managed identity"
  value       = azurerm_api_management.main.identity[0].tenant_id
}

# Network outputs
output "apim_additional_location" {
  description = "Additional locations of the API Management service"
  value       = azurerm_api_management.main.additional_location
}

# Configuration summary
output "apim_summary" {
  description = "Summary of API Management configuration"
  value = {
    name                    = azurerm_api_management.main.name
    sku                     = azurerm_api_management.main.sku_name
    gateway_url            = azurerm_api_management.main.gateway_url
    portal_url             = azurerm_api_management.main.developer_portal_url
    virtual_network_type   = azurerm_api_management.main.virtual_network_type
    location               = azurerm_api_management.main.location
    publisher_name         = azurerm_api_management.main.publisher_name
    publisher_email        = azurerm_api_management.main.publisher_email
  }
} 