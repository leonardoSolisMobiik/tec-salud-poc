# =============================================================================
# TECSALUD MVP - COMPUTE MODULE
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
  container_registry_name = "cr${var.project_name}${var.environment}${var.location_short}001"
  container_env_name      = "cae-${var.project_name}-${var.environment}-${var.location_short}-001"
  
  # Container Apps names
  frontend_app_name = "ca-${var.project_name}-${var.environment}-frontend-001"
  backend_app_name  = "ca-${var.project_name}-${var.environment}-backend-001"
}

# =============================================================================
# AZURE CONTAINER REGISTRY
# =============================================================================

resource "azurerm_container_registry" "main" {
  name                = local.container_registry_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.acr_sku
  
  admin_enabled                 = true
  public_network_access_enabled = true
  zone_redundancy_enabled       = false
  
  # Network rules not available for Basic SKU
  
  tags = var.tags
}

# =============================================================================
# CONTAINER APPS ENVIRONMENT
# =============================================================================

resource "azurerm_container_app_environment" "main" {
  name                = local.container_env_name
  location            = var.location
  resource_group_name = var.resource_group_name
  
  # For development, we'll use consumption plan
  # In production, you might want dedicated plan
  
  tags = var.tags
}

# =============================================================================
# FRONTEND CONTAINER APP (ANGULAR)
# =============================================================================

resource "azurerm_container_app" "frontend" {
  name                         = local.frontend_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    min_replicas = var.frontend_min_replicas
    max_replicas = var.frontend_max_replicas

    container {
      name   = "tecsalud-frontend"
      image  = var.frontend_image
      cpu    = var.frontend_cpu
      memory = var.frontend_memory

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "API_URL"
        value = "https://${local.backend_app_name}.${azurerm_container_app_environment.main.default_domain}"
      }

      # Backend URL will be set after deployment
      env {
        name  = "BACKEND_URL"
        value = "/api"
      }
    }

    # Scale rules based on HTTP requests
    http_scale_rule {
      name                = "http-requests"
      concurrent_requests = 100
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = var.frontend_port

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Connect to backend services via managed identity
  identity {
    type = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  tags = var.tags

  depends_on = [
    azurerm_container_app_environment.main
  ]
}

# =============================================================================
# BACKEND CONTAINER APP (API)
# =============================================================================

resource "azurerm_container_app" "backend" {
  name                         = local.backend_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    min_replicas = var.backend_min_replicas
    max_replicas = var.backend_max_replicas

    container {
      name   = "tecsalud-backend"
      image  = var.backend_image
      cpu    = var.backend_cpu
      memory = var.backend_memory

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = tostring(var.backend_port)
      }

      # Key Vault references for secrets
      env {
        name        = "COSMOS_CONNECTION_STRING"
        secret_name = "cosmos-connection"
      }

      env {
        name        = "STORAGE_CONNECTION_STRING" 
        secret_name = "storage-connection"
      }

      env {
        name        = "OPENAI_API_KEY"
        secret_name = "openai-key"
      }

      env {
        name        = "DOCUMENT_INTELLIGENCE_KEY"
        secret_name = "doc-intelligence-key"
      }

      env {
        name        = "SPEECH_API_KEY"
        secret_name = "speech-key"
      }

      # Public endpoints
      env {
        name  = "COSMOS_ENDPOINT"
        value = var.cosmos_endpoint
      }

      env {
        name  = "STORAGE_ENDPOINT"
        value = var.storage_primary_endpoint
      }

      # Search endpoint removed - not needed for MVP

      env {
        name  = "DOCUMENT_INTELLIGENCE_ENDPOINT"
        value = var.document_intelligence_endpoint
      }

      env {
        name  = "SPEECH_ENDPOINT"
        value = var.speech_service_endpoint
      }
    }

    # Scale rules based on HTTP requests
    http_scale_rule {
      name                = "http-requests"
      concurrent_requests = 50
    }
  }

  # Internal ingress for backend
  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = var.backend_port

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Managed identity for Azure services access
  identity {
    type = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  # Secrets from Key Vault
  secret {
    name  = "cosmos-connection"
    value = var.cosmos_connection_string
  }

  secret {
    name  = "storage-connection"
    value = var.storage_connection_string
  }

  secret {
    name  = "openai-key"
    value = var.openai_api_key
  }

  secret {
    name  = "doc-intelligence-key"
    value = var.document_intelligence_key
  }

  secret {
    name  = "speech-key"
    value = var.speech_api_key
  }

  tags = var.tags

  depends_on = [azurerm_container_app_environment.main]
}

# Application Gateway and Public IP removed - not needed for MVP
# Container Apps have direct HTTPS endpoints that can be used directly 