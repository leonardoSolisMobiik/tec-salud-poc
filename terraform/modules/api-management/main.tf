# =============================================================================
# TECSALUD MVP - API MANAGEMENT MODULE
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
  apim_name = "apim-${var.project_name}-${var.environment}-${var.location_short}-001"
  
  # API Management tags
  apim_tags = merge(var.tags, {
    Module  = "API-Management"
    Purpose = "API Gateway and Management"
  })
}

# =============================================================================
# AZURE API MANAGEMENT
# =============================================================================

resource "azurerm_api_management" "main" {
  name                = local.apim_name
  location            = var.location
  resource_group_name = var.resource_group_name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email
  sku_name           = var.apim_sku

  # Virtual network configuration
  virtual_network_type = "Internal"
  virtual_network_configuration {
    subnet_id = var.backend_subnet_id
  }

  # Identity for Key Vault access
  identity {
    type = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  # Security and protocols
  protocols {
    enable_http2 = true
  }

  security {
    enable_frontend_ssl30  = false
    enable_backend_ssl30   = false
    enable_frontend_tls10  = false
    enable_backend_tls10   = false
    enable_frontend_tls11  = false
    enable_backend_tls11   = false
  }

  # Notification sender email
  notification_sender_email = var.publisher_email

  tags = local.apim_tags
}

# =============================================================================
# API MANAGEMENT APIS
# =============================================================================

# TecSalud Medical API
resource "azurerm_api_management_api" "medical_api" {
  name                = "tecsalud-medical-api"
  resource_group_name = var.resource_group_name
  api_management_name = azurerm_api_management.main.name
  revision            = "1"
  display_name        = "TecSalud Medical API"
  path                = "api/medical"
  protocols           = ["https"]
  
  description = "API for TecSalud medical assistant services"
  
  service_url = var.backend_service_url
  
  subscription_required = true
  
  depends_on = [azurerm_api_management.main]
}

# Document Processing API
resource "azurerm_api_management_api" "document_api" {
  name                = "tecsalud-document-api"
  resource_group_name = var.resource_group_name
  api_management_name = azurerm_api_management.main.name
  revision            = "1"
  display_name        = "TecSalud Document API"
  path                = "api/documents"
  protocols           = ["https"]
  
  description = "API for document processing and OCR services"
  
  service_url = var.backend_service_url
  
  subscription_required = true
  
  depends_on = [azurerm_api_management.main]
}

# =============================================================================
# API MANAGEMENT PRODUCTS
# =============================================================================

# Medical Staff Product
resource "azurerm_api_management_product" "medical_staff" {
  product_id          = "medical-staff"
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group_name
  display_name        = "Medical Staff Access"
  description         = "Access for medical staff to TecSalud APIs"
  
  subscription_required   = true
  approval_required       = true
  subscriptions_limit     = 100
  published              = true
  
  depends_on = [azurerm_api_management.main]
}

# Admin Product
resource "azurerm_api_management_product" "admin" {
  product_id          = "admin"
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group_name
  display_name        = "Administrator Access"
  description         = "Full access for administrators"
  
  subscription_required   = true
  approval_required       = true
  subscriptions_limit     = 10
  published              = true
  
  depends_on = [azurerm_api_management.main]
}

# =============================================================================
# API MANAGEMENT POLICIES
# =============================================================================

# Global policies
resource "azurerm_api_management_api_policy" "medical_api_policy" {
  api_name            = azurerm_api_management_api.medical_api.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group_name

  xml_content = <<XML
<policies>
  <inbound>
    <base />
    <rate-limit calls="100" renewal-period="60" />
    <quota calls="10000" renewal-period="604800" />
    <set-header name="X-Forwarded-For" exists-action="override">
      <value>@(context.Request.IpAddress)</value>
    </set-header>
    <cors allow-credentials="true">
      <allowed-origins>
        <origin>https://*.azurecontainerapps.io</origin>
        <origin>https://localhost:4200</origin>
      </allowed-origins>
      <allowed-methods>
        <method>GET</method>
        <method>POST</method>
        <method>PUT</method>
        <method>DELETE</method>
        <method>OPTIONS</method>
      </allowed-methods>
      <allowed-headers>
        <header>*</header>
      </allowed-headers>
    </cors>
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
    <set-header name="X-API-Source" exists-action="override">
      <value>TecSalud-APIM</value>
    </set-header>
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
XML

  depends_on = [azurerm_api_management_api.medical_api]
}

# =============================================================================
# DIAGNOSTIC SETTINGS
# =============================================================================

resource "azurerm_monitor_diagnostic_setting" "apim" {
  name                       = "apim-diagnostics"
  target_resource_id         = azurerm_api_management.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "GatewayLogs"
  }

  enabled_log {
    category = "WebSocketConnectionLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
} 