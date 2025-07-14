# =============================================================================
# TECSALUD MVP - VIRTUAL MACHINES MODULE
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
  vm_processing_name = "vm-${var.project_name}-${var.environment}-processing-001"
  vm_services_name   = "vm-${var.project_name}-${var.environment}-services-001"
  
  # Network Interface names
  nic_processing_name = "nic-${var.project_name}-${var.environment}-processing-001"
  nic_services_name   = "nic-${var.project_name}-${var.environment}-services-001"
  
  # OS Disk names
  disk_processing_name = "disk-${var.project_name}-${var.environment}-processing-001"
  disk_services_name   = "disk-${var.project_name}-${var.environment}-services-001"
  
  # VM tags
  vm_tags = merge(var.tags, {
    Module  = "Virtual-Machines"
    Purpose = "Document Processing and Services"
  })
}

# =============================================================================
# NETWORK INTERFACES
# =============================================================================

# Network Interface for Processing VM
resource "azurerm_network_interface" "processing" {
  name                = local.nic_processing_name
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.backend_subnet_id
    private_ip_address_allocation = "Dynamic"
  }

  tags = local.vm_tags
}

# Network Interface for Services VM
resource "azurerm_network_interface" "services" {
  name                = local.nic_services_name
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.data_subnet_id
    private_ip_address_allocation = "Dynamic"
  }

  tags = local.vm_tags
}

# =============================================================================
# NETWORK SECURITY GROUP ASSOCIATIONS
# =============================================================================

resource "azurerm_network_interface_security_group_association" "processing" {
  network_interface_id      = azurerm_network_interface.processing.id
  network_security_group_id = var.backend_nsg_id
}

resource "azurerm_network_interface_security_group_association" "services" {
  network_interface_id      = azurerm_network_interface.services.id
  network_security_group_id = var.data_nsg_id
}

# =============================================================================
# VIRTUAL MACHINES
# =============================================================================

# Processing VM for document processing and OCR
resource "azurerm_linux_virtual_machine" "processing" {
  name                = local.vm_processing_name
  location            = var.location
  resource_group_name = var.resource_group_name
  size                = var.vm_processing_size
  admin_username      = var.admin_username

  # Disable password authentication and use SSH keys
  disable_password_authentication = true

  network_interface_ids = [
    azurerm_network_interface.processing.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = var.os_disk_type
    name                 = local.disk_processing_name
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }

  # Managed identity for Key Vault access
  identity {
    type = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  # Note: Auto-shutdown is configured via DevTest Labs policy, not VM resource

  tags = merge(local.vm_tags, {
    Purpose = "Document Processing and OCR"
    Role    = "Processing"
  })
}

# Services VM for additional services and legacy systems
resource "azurerm_linux_virtual_machine" "services" {
  name                = local.vm_services_name
  location            = var.location
  resource_group_name = var.resource_group_name
  size                = var.vm_services_size
  admin_username      = var.admin_username

  # Disable password authentication and use SSH keys
  disable_password_authentication = true

  network_interface_ids = [
    azurerm_network_interface.services.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = var.os_disk_type
    name                 = local.disk_services_name
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }

  # Managed identity for Key Vault access
  identity {
    type = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  # Note: Auto-shutdown is configured via DevTest Labs policy, not VM resource

  tags = merge(local.vm_tags, {
    Purpose = "Services and Legacy Systems"
    Role    = "Services"
  })
}

# =============================================================================
# VIRTUAL MACHINE EXTENSIONS
# =============================================================================

# Azure Monitor Agent for Processing VM
resource "azurerm_virtual_machine_extension" "processing_monitor" {
  name                 = "AzureMonitorLinuxAgent"
  virtual_machine_id   = azurerm_linux_virtual_machine.processing.id
  publisher            = "Microsoft.Azure.Monitor"
  type                 = "AzureMonitorLinuxAgent"
  type_handler_version = "1.5"

  tags = local.vm_tags

  depends_on = [azurerm_linux_virtual_machine.processing]
}

# Azure Monitor Agent for Services VM
resource "azurerm_virtual_machine_extension" "services_monitor" {
  name                 = "AzureMonitorLinuxAgent"
  virtual_machine_id   = azurerm_linux_virtual_machine.services.id
  publisher            = "Microsoft.Azure.Monitor"
  type                 = "AzureMonitorLinuxAgent"
  type_handler_version = "1.5"

  tags = local.vm_tags

  depends_on = [azurerm_linux_virtual_machine.services]
}

# Custom Script Extension for Processing VM setup
resource "azurerm_virtual_machine_extension" "processing_setup" {
  name                 = "CustomScript"
  virtual_machine_id   = azurerm_linux_virtual_machine.processing.id
  publisher            = "Microsoft.Azure.Extensions"
  type                 = "CustomScript"
  type_handler_version = "2.1"

  settings = jsonencode({
    script = base64encode(templatefile("${path.module}/scripts/setup-processing-vm.sh", {
      KEY_VAULT_NAME = var.key_vault_name
    }))
  })

  tags = local.vm_tags

  depends_on = [azurerm_virtual_machine_extension.processing_monitor]
}

# Custom Script Extension for Services VM setup
resource "azurerm_virtual_machine_extension" "services_setup" {
  name                 = "CustomScript"
  virtual_machine_id   = azurerm_linux_virtual_machine.services.id
  publisher            = "Microsoft.Azure.Extensions"
  type                 = "CustomScript"
  type_handler_version = "2.1"

  settings = jsonencode({
    script = base64encode(templatefile("${path.module}/scripts/setup-services-vm.sh", {
      KEY_VAULT_NAME = var.key_vault_name
    }))
  })

  tags = local.vm_tags

  depends_on = [azurerm_virtual_machine_extension.services_monitor]
}

# =============================================================================
# BACKUP CONFIGURATION
# =============================================================================

# Recovery Services Vault for VM backups
resource "azurerm_recovery_services_vault" "main" {
  name                = "rsv-${var.project_name}-${var.environment}-${var.location_short}-001"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"

  storage_mode_type         = "LocallyRedundant"
  cross_region_restore_enabled = false

  tags = local.vm_tags
}

# Backup policy for VMs
resource "azurerm_backup_policy_vm" "main" {
  name                = "backup-policy-vm-daily"
  resource_group_name = var.resource_group_name
  recovery_vault_name = azurerm_recovery_services_vault.main.name

  backup {
    frequency = "Daily"
    time      = "02:00"
  }

  retention_daily {
    count = 7
  }

  retention_weekly {
    count    = 4
    weekdays = ["Sunday"]
  }

  retention_monthly {
    count    = 3
    weekdays = ["Sunday"]
    weeks    = ["First"]
  }
}

# VM backup protection for Processing VM
resource "azurerm_backup_protected_vm" "processing" {
  count               = var.enable_backup ? 1 : 0
  resource_group_name = var.resource_group_name
  recovery_vault_name = azurerm_recovery_services_vault.main.name
  source_vm_id        = azurerm_linux_virtual_machine.processing.id
  backup_policy_id    = azurerm_backup_policy_vm.main.id

  depends_on = [azurerm_linux_virtual_machine.processing]
}

# VM backup protection for Services VM
resource "azurerm_backup_protected_vm" "services" {
  count               = var.enable_backup ? 1 : 0
  resource_group_name = var.resource_group_name
  recovery_vault_name = azurerm_recovery_services_vault.main.name
  source_vm_id        = azurerm_linux_virtual_machine.services.id
  backup_policy_id    = azurerm_backup_policy_vm.main.id

  depends_on = [azurerm_linux_virtual_machine.services]
} 