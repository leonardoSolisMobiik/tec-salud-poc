# =============================================================================
# TECSALUD MVP - MONITORING MODULE
# =============================================================================

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# =============================================================================
# LOCALS
# =============================================================================

locals {
  # Resource naming
  log_analytics_name         = "law-${var.project_name}-${var.environment}-${var.location_short}-001"
  application_insights_name  = "appi-${var.project_name}-${var.environment}-${var.location_short}-001"
  action_group_name         = "ag-${var.project_name}-${var.environment}-${var.location_short}-001"
  
  # Common tags for monitoring resources
  monitoring_tags = merge(var.tags, {
    Module = "Monitoring"
    Purpose = "Observability and Alerting"
  })
}

# =============================================================================
# LOG ANALYTICS WORKSPACE
# =============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = local.log_analytics_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.log_analytics_sku
  retention_in_days   = 30  # Minimum 30 days for PerGB2018 SKU
  
  # Daily quota in GB (optional, set to null for no quota)
  daily_quota_gb = var.log_daily_quota_gb
  
  # Network access control
  internet_ingestion_enabled = true
  internet_query_enabled     = true
  
  tags = local.monitoring_tags
}

# =============================================================================
# APPLICATION INSIGHTS
# =============================================================================

resource "azurerm_application_insights" "main" {
  name                = local.application_insights_name
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  
  # Data retention in days
  retention_in_days = var.app_insights_retention_days
  
  # Sampling percentage (0-100)
  sampling_percentage = var.app_insights_sampling_percentage
  
  # Disable IP masking for better analytics (be careful with GDPR)
  disable_ip_masking = false
  
  tags = local.monitoring_tags
}

# =============================================================================
# ACTION GROUP FOR ALERTS
# =============================================================================

resource "azurerm_monitor_action_group" "main" {
  name                = local.action_group_name
  resource_group_name = var.resource_group_name
  short_name          = "tsalud-${var.environment}"
  
  # Email notifications
  email_receiver {
    name          = "DevOps Team"
    email_address = var.alert_email
  }
  
  # Optional: SMS notifications
  dynamic "sms_receiver" {
    for_each = var.alert_phone != null ? [1] : []
    content {
      name         = "DevOps SMS"
      country_code = var.alert_phone_country_code
      phone_number = var.alert_phone
    }
  }
  
  # Optional: Webhook notifications
  dynamic "webhook_receiver" {
    for_each = var.alert_webhook_url != null ? [1] : []
    content {
      name        = "DevOps Webhook"
      service_uri = var.alert_webhook_url
    }
  }
  
  tags = local.monitoring_tags
}

# =============================================================================
# METRIC ALERTS
# =============================================================================

# Container Apps alerts temporarily commented - metric names need verification
# TODO: Verify correct metric names for Container Apps monitoring
# 
# # Alert for high CPU usage in Container Apps (individual alerts)
# resource "azurerm_monitor_metric_alert" "container_app_cpu" {
#   for_each = toset(var.container_app_ids)
#   
#   name                = "High CPU Usage - ${basename(each.value)}"
#   resource_group_name = var.resource_group_name
#   scopes              = [each.value]
#   description         = "Alert when Container App CPU usage exceeds 80%"
#   severity            = 2
#   frequency           = "PT1M"
#   window_size         = "PT5M"
#   
#   criteria {
#     metric_namespace = "Microsoft.App/containerApps"
#     metric_name      = "CpuUsage"
#     aggregation      = "Average"
#     operator         = "GreaterThan"
#     threshold        = 80
#   }
#   
#   action {
#     action_group_id = azurerm_monitor_action_group.main.id
#   }
#   
#   tags = local.monitoring_tags
# }

# # Alert for high memory usage in Container Apps (individual alerts)
# resource "azurerm_monitor_metric_alert" "container_app_memory" {
#   for_each = toset(var.container_app_ids)
#   
#   name                = "High Memory Usage - ${basename(each.value)}"
#   resource_group_name = var.resource_group_name
#   scopes              = [each.value]
#   description         = "Alert when Container App memory usage exceeds 80%"
#   severity            = 2
#   frequency           = "PT1M"
#   window_size         = "PT5M"
#   
#   criteria {
#     metric_namespace = "Microsoft.App/containerApps"
#     metric_name      = "MemoryUsage"
#     aggregation      = "Average"
#     operator         = "GreaterThan"
#     threshold        = 80
#   }
#   
#   action {
#     action_group_id = azurerm_monitor_action_group.main.id
#   }
#   
#   tags = local.monitoring_tags
# }

# Application Gateway alert removed - not needed for MVP

# Alert for Cosmos DB high RU consumption
resource "azurerm_monitor_metric_alert" "cosmos_db_ru" {
  name                = "Cosmos DB High RU Usage"
  resource_group_name = var.resource_group_name
  scopes              = [var.cosmos_db_id]
  description         = "Alert when Cosmos DB RU consumption exceeds 80%"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  
  criteria {
    metric_namespace = "Microsoft.DocumentDB/databaseAccounts"
    metric_name      = "TotalRequestUnits"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 8000  # Adjust based on your provisioned RUs
  }
  
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }
  
  tags = local.monitoring_tags
}

# =============================================================================
# DIAGNOSTIC SETTINGS
# =============================================================================

# Application Gateway diagnostic settings removed - not needed for MVP

# Cosmos DB diagnostic settings
resource "azurerm_monitor_diagnostic_setting" "cosmos_db" {
  name                       = "cosmos-db-diagnostics"
  target_resource_id         = var.cosmos_db_id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  enabled_log {
    category = "DataPlaneRequests"
  }
  
  enabled_log {
    category = "QueryRuntimeStatistics"
  }
  
  enabled_log {
    category = "PartitionKeyStatistics"
  }
  
  metric {
    category = "Requests"
    enabled  = true
  }
}

# Key Vault diagnostic settings
resource "azurerm_monitor_diagnostic_setting" "key_vault" {
  name                       = "key-vault-diagnostics"
  target_resource_id         = var.key_vault_id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  
  enabled_log {
    category = "AuditEvent"
  }
  
  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }
  
  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# =============================================================================
# DASHBOARD
# =============================================================================

resource "azurerm_dashboard" "main" {
  name                = "dashboard-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  
  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = {
          "0" = {
            position = {
              x = 0
              y = 0
              rowSpan = 3
              colSpan = 4
            }
            metadata = {
              inputs = [
                {
                  name = "resourceId"
                  value = azurerm_application_insights.main.id
                }
              ]
              type = "Extension/AppInsightsExtension/PartType/AppMapGalPt"
            }
          }
          "1" = {
            position = {
              x = 4
              y = 0
              rowSpan = 3
              colSpan = 4
            }
            metadata = {
              inputs = [
                {
                  name = "resourceId"
                  value = azurerm_application_insights.main.id
                }
              ]
              type = "Extension/AppInsightsExtension/PartType/PerformanceCountersPinnedPart"
            }
          }
        }
      }
    }
    metadata = {
      model = {
        timeRange = {
          value = {
            relative = {
              duration = 24
              timeUnit = 1
            }
          }
          type = "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
        }
      }
    }
  })
  
  tags = local.monitoring_tags
} 