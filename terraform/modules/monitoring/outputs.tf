# =============================================================================
# TECSALUD MVP - MONITORING MODULE OUTPUTS
# =============================================================================

# Log Analytics Workspace outputs
output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.name
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

output "log_analytics_workspace_primary_shared_key" {
  description = "Primary shared key of the Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive   = true
}

output "log_analytics_workspace_workspace_id" {
  description = "Workspace ID of the Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.workspace_id
}

# Application Insights outputs
output "application_insights_name" {
  description = "Name of the Application Insights instance"
  value       = azurerm_application_insights.main.name
}

output "application_insights_id" {
  description = "ID of the Application Insights instance"
  value       = azurerm_application_insights.main.id
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key of the Application Insights instance"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Connection string of the Application Insights instance"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "application_insights_app_id" {
  description = "App ID of the Application Insights instance"
  value       = azurerm_application_insights.main.app_id
}

# Action Group outputs
output "action_group_name" {
  description = "Name of the Action Group"
  value       = azurerm_monitor_action_group.main.name
}

output "action_group_id" {
  description = "ID of the Action Group"
  value       = azurerm_monitor_action_group.main.id
}

# Dashboard outputs
output "dashboard_name" {
  description = "Name of the Azure Dashboard"
  value       = azurerm_dashboard.main.name
}

output "dashboard_id" {
  description = "ID of the Azure Dashboard"
  value       = azurerm_dashboard.main.id
}

# Monitoring URLs
output "monitoring_urls" {
  description = "URLs for monitoring resources"
  value = {
    log_analytics = "https://portal.azure.com/#@/resource${azurerm_log_analytics_workspace.main.id}/overview"
    app_insights  = "https://portal.azure.com/#@/resource${azurerm_application_insights.main.id}/overview"
    dashboard     = "https://portal.azure.com/#@/dashboard/arm${azurerm_dashboard.main.id}"
  }
}

# Alert configuration summary
output "alert_configuration" {
  description = "Summary of alert configuration"
  value = {
    action_group_name = azurerm_monitor_action_group.main.name
    alert_email       = var.alert_email
    alert_phone       = var.alert_phone
    total_alerts      = 4  # Number of metric alerts configured
  }
}

# Monitoring configuration summary
output "monitoring_configuration" {
  description = "Summary of monitoring configuration"
  value = {
    log_analytics_sku         = var.log_analytics_sku
    log_retention_days        = var.log_retention_days
    app_insights_retention    = var.app_insights_retention_days
    app_insights_sampling     = var.app_insights_sampling_percentage
    daily_quota_gb           = var.log_daily_quota_gb
  }
} 