# =============================================================================
# TECSALUD MVP - NETWORKING MODULE
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
  vnet_name = "vnet-${var.project_name}-${var.environment}-${var.location_short}-main-001"
  
  subnet_names = {
    frontend = "snet-${var.project_name}-${var.environment}-${var.location_short}-frontend-001"
    backend  = "snet-${var.project_name}-${var.environment}-${var.location_short}-backend-001"
    data     = "snet-${var.project_name}-${var.environment}-${var.location_short}-data-001"
    bastion  = "AzureBastionSubnet"  # Required name for Bastion
  }
  
  nsg_names = {
    frontend = "nsg-${var.project_name}-${var.environment}-${var.location_short}-frontend-001"
    backend  = "nsg-${var.project_name}-${var.environment}-${var.location_short}-backend-001"
    data     = "nsg-${var.project_name}-${var.environment}-${var.location_short}-data-001"
    bastion  = "nsg-${var.project_name}-${var.environment}-${var.location_short}-bastion-001"
  }
  
  bastion_name = "bas-${var.project_name}-${var.environment}-${var.location_short}-main-001"
  pip_bastion_name = "pip-${var.project_name}-${var.environment}-${var.location_short}-bastion-001"
}

# =============================================================================
# VIRTUAL NETWORK
# =============================================================================

resource "azurerm_virtual_network" "main" {
  name                = local.vnet_name
  address_space       = var.vnet_address_space
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# =============================================================================
# SUBNETS
# =============================================================================

resource "azurerm_subnet" "frontend" {
  name                 = local.subnet_names.frontend
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_frontend]
}

resource "azurerm_subnet" "backend" {
  name                 = local.subnet_names.backend
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_backend]
  
  # Service endpoints for backend services
  service_endpoints = [
    "Microsoft.Storage",
    "Microsoft.KeyVault",
    "Microsoft.AzureCosmosDB"
  ]
}

resource "azurerm_subnet" "data" {
  name                 = local.subnet_names.data
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_data]
}

resource "azurerm_subnet" "bastion" {
  name                 = local.subnet_names.bastion
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_bastion]
}

# =============================================================================
# NETWORK SECURITY GROUPS
# =============================================================================

# Frontend NSG
resource "azurerm_network_security_group" "frontend" {
  name                = local.nsg_names.frontend
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Frontend NSG Rules
resource "azurerm_network_security_rule" "frontend_http" {
  name                        = "AllowHTTP"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "80"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.frontend.name
}

resource "azurerm_network_security_rule" "frontend_https" {
  name                        = "AllowHTTPS"
  priority                    = 110
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.frontend.name
}

# Application Gateway V2 requires these ports
resource "azurerm_network_security_rule" "frontend_appgw_management" {
  name                        = "AllowAppGWManagement"
  priority                    = 120
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "65200-65535"
  source_address_prefix       = "GatewayManager"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.frontend.name
}

# Backend NSG
resource "azurerm_network_security_group" "backend" {
  name                = local.nsg_names.backend
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Backend NSG Rules
resource "azurerm_network_security_rule" "backend_api" {
  name                        = "AllowAPIFromFrontend"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "8080"
  source_address_prefix       = var.subnet_frontend
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.backend.name
}

resource "azurerm_network_security_rule" "backend_https" {
  name                        = "AllowHTTPS"
  priority                    = 110
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = var.subnet_frontend
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.backend.name
}

# Data NSG
resource "azurerm_network_security_group" "data" {
  name                = local.nsg_names.data
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Data NSG Rules
resource "azurerm_network_security_rule" "data_backend_only" {
  name                        = "AllowFromBackendOnly"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "1433"
  source_address_prefix       = var.subnet_backend
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.data.name
}

# Bastion NSG
resource "azurerm_network_security_group" "bastion" {
  name                = local.nsg_names.bastion
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# Bastion NSG Rules (Required for Azure Bastion)
resource "azurerm_network_security_rule" "bastion_inbound_https" {
  name                        = "AllowHTTPS"
  priority                    = 120
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = "Internet"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.bastion.name
}

resource "azurerm_network_security_rule" "bastion_inbound_gatewaymgr" {
  name                        = "AllowGatewayManager"
  priority                    = 130
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = "GatewayManager"
  destination_address_prefix  = "*"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.bastion.name
}

resource "azurerm_network_security_rule" "bastion_outbound_ssh_rdp" {
  name                        = "AllowSSHRDP"
  priority                    = 100
  direction                   = "Outbound"
  access                      = "Allow"
  protocol                    = "*"
  source_port_range           = "*"
  destination_port_ranges     = ["22", "3389"]
  source_address_prefix       = "*"
  destination_address_prefix  = "VirtualNetwork"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.bastion.name
}

resource "azurerm_network_security_rule" "bastion_outbound_azurecloud" {
  name                        = "AllowAzureCloud"
  priority                    = 110
  direction                   = "Outbound"
  access                      = "Allow"
  protocol                    = "Tcp"
  source_port_range           = "*"
  destination_port_range      = "443"
  source_address_prefix       = "*"
  destination_address_prefix  = "AzureCloud"
  resource_group_name         = var.resource_group_name
  network_security_group_name = azurerm_network_security_group.bastion.name
}

# =============================================================================
# SUBNET NSG ASSOCIATIONS
# =============================================================================

resource "azurerm_subnet_network_security_group_association" "frontend" {
  subnet_id                 = azurerm_subnet.frontend.id
  network_security_group_id = azurerm_network_security_group.frontend.id
}

resource "azurerm_subnet_network_security_group_association" "backend" {
  subnet_id                 = azurerm_subnet.backend.id
  network_security_group_id = azurerm_network_security_group.backend.id
}

resource "azurerm_subnet_network_security_group_association" "data" {
  subnet_id                 = azurerm_subnet.data.id
  network_security_group_id = azurerm_network_security_group.data.id
}

resource "azurerm_subnet_network_security_group_association" "bastion" {
  subnet_id                 = azurerm_subnet.bastion.id
  network_security_group_id = azurerm_network_security_group.bastion.id
}

# =============================================================================
# AZURE BASTION
# =============================================================================

resource "azurerm_public_ip" "bastion" {
  name                = local.pip_bastion_name
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_bastion_host" "main" {
  name                = local.bastion_name
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags

  ip_configuration {
    name                 = "configuration"
    subnet_id            = azurerm_subnet.bastion.id
    public_ip_address_id = azurerm_public_ip.bastion.id
  }
} 