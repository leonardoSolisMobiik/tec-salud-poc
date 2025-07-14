# =============================================================================
# TECSALUD MVP - COMPUTE MODULE OUTPUTS
# =============================================================================

# Container Registry outputs
output "container_registry_name" {
  description = "Name of the Azure Container Registry"
  value       = azurerm_container_registry.main.name
}

output "container_registry_id" {
  description = "ID of the Azure Container Registry"
  value       = azurerm_container_registry.main.id
}

output "container_registry_login_server" {
  description = "Login server of the Azure Container Registry"
  value       = azurerm_container_registry.main.login_server
}

output "container_registry_admin_username" {
  description = "Admin username of the Azure Container Registry"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "container_registry_admin_password" {
  description = "Admin password of the Azure Container Registry"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

# Container Apps Environment outputs
output "container_app_environment_name" {
  description = "Name of the Container Apps Environment"
  value       = azurerm_container_app_environment.main.name
}

output "container_app_environment_id" {
  description = "ID of the Container Apps Environment"
  value       = azurerm_container_app_environment.main.id
}

output "container_app_environment_default_domain" {
  description = "Default domain of the Container Apps Environment"
  value       = azurerm_container_app_environment.main.default_domain
}

# Frontend Container App outputs
output "frontend_app_name" {
  description = "Name of the frontend Container App"
  value       = azurerm_container_app.frontend.name
}

output "frontend_app_id" {
  description = "ID of the frontend Container App"
  value       = azurerm_container_app.frontend.id
}

output "frontend_app_fqdn" {
  description = "FQDN of the frontend Container App"
  value       = azurerm_container_app.frontend.latest_revision_fqdn
}

output "frontend_app_url" {
  description = "URL of the frontend Container App"
  value       = "https://${azurerm_container_app.frontend.latest_revision_fqdn}"
}

# Backend Container App outputs
output "backend_app_name" {
  description = "Name of the backend Container App"
  value       = azurerm_container_app.backend.name
}

output "backend_app_id" {
  description = "ID of the backend Container App"
  value       = azurerm_container_app.backend.id
}

output "backend_app_fqdn" {
  description = "FQDN of the backend Container App"
  value       = azurerm_container_app.backend.latest_revision_fqdn
}

output "backend_app_url" {
  description = "URL of the backend Container App"
  value       = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
}

# Application Gateway outputs removed - not needed for MVP

# Application URLs (direct Container Apps only)
output "application_urls" {
  description = "All application URLs"
  value = {
    frontend_direct     = "https://${azurerm_container_app.frontend.latest_revision_fqdn}"
    backend_api_direct  = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
  }
}

# Deployment information
output "deployment_info" {
  description = "Deployment information summary"
  value = {
    container_registry = azurerm_container_registry.main.login_server
    environment_domain = azurerm_container_app_environment.main.default_domain
    deployment_date   = timestamp()
  }
} 