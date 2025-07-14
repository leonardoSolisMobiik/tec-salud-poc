# =============================================================================
# TECSALUD MVP - DEVELOPMENT ENVIRONMENT CONFIGURATION
# =============================================================================

# =============================================================================
# COMMON CONFIGURATION
# =============================================================================

default_tags = {
  Project            = "TecSalud-MVP"
  BusinessUnit       = "TecSalud"
  DataClassification = "Medical-Sensitive"
  Compliance         = "HIPAA-Healthcare"
  CostCenter         = "IT-Healthcare-AI"
  MaintenanceWindow  = "Sun-02:00-06:00-CST"
  Owner              = "dev-team@tecsalud.com"
  Support            = "DevOps-Team"
}

owner_email  = "dev-team@tecsalud.com"
support_team = "DevOps-Team"

# =============================================================================
# NETWORKING CONFIGURATION
# =============================================================================

vnet_address_space = ["10.0.0.0/16"]
subnet_frontend    = "10.0.1.0/24"
subnet_backend     = "10.0.2.0/24"
subnet_data        = "10.0.3.0/24"
subnet_bastion     = "10.0.4.0/24"

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

key_vault_sku = "standard"

# =============================================================================
# COMPUTE CONFIGURATION (Development Sizing)
# =============================================================================

container_app_min_replicas = 1
container_app_max_replicas = 3
vm_size                    = "Standard_B2s"

# =============================================================================
# DATA CONFIGURATION (Development Sizing)
# =============================================================================

cosmos_throughput    = 400
storage_replication  = "LRS"

# =============================================================================
# AI SERVICES CONFIGURATION
# =============================================================================

openai_sku = "S0"

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================

log_retention_days = 7

# =============================================================================
# FEATURE FLAGS (Development Settings)
# =============================================================================

enable_backup        = false
enable_monitoring    = true
enable_auto_shutdown = true

# =============================================================================
# API MANAGEMENT CONFIGURATION (Development)
# =============================================================================

apim_publisher_name  = "TecSalud-Dev"
apim_publisher_email = "dev-team@tecsalud.com"
apim_sku            = "Developer_1"

# =============================================================================
# VIRTUAL MACHINES CONFIGURATION (Development)
# =============================================================================

vm_processing_size = "Standard_D2s_v3"
vm_services_size   = "Standard_D2s_v3"
ssh_public_key     = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD5DtQSBjvXz+6KmgLOLDbxlq1nPk4NVNbKvgPu75NRaNYxeewBq2u5xqW8OEw0D30azgdzB6GAJHGLhEGCvMuRHHScnIrc6kUq6fU7O70KnEb0UWFWyJm1jLK7C6UypvMEoFvrnoD0Puj8f6N7fwZdt3D56uP1UR5/YGrClYS0HN8xGTRNQGQvoovQWroWK45r5bPPlZE9zjN1dSfuokS8U4GPaVECSIlJDwEzEpj9oA1fs8dt8WLDyhAxATm8Z/jUxxlBw7Dbr4SPpWSOBh17hpTOuPb0Z7a1YWladPObd2HJb28JLC9E+6zNK6K20yl9j8dSCF7Z8RXU8VB9BEKJ tecsalud-dev-key"
admin_email        = "dev-team@tecsalud.com"

# =============================================================================
# DATA FACTORY CONFIGURATION (Development)
# =============================================================================

adf_public_network_enabled           = true
adf_integration_runtime_compute_type = "General"
adf_integration_runtime_core_count   = 8
adf_enable_self_hosted_ir            = false
adf_enable_scheduled_triggers        = true
adf_enable_blob_event_triggers       = true 