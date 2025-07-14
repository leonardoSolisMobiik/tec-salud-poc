# 🚀 TERRAFORM INFRASTRUCTURE - TecSalud MVP

**Proyecto:** Asistente Virtual Médico con IA - TecSalud MVP v3.0  
**Fecha:** 2025-01-07  
**Herramienta:** Terraform + Azure Provider

---

## 📁 ESTRUCTURA DEL PROYECTO

```
terraform/
├── environments/          # Configuraciones por ambiente
│   ├── dev/              # Desarrollo
│   ├── stg/              # Staging
│   └── prd/              # Producción
├── modules/              # Módulos reutilizables
│   ├── networking/       # VNet, Subnets, NSGs, Bastion
│   ├── compute/          # Container Apps, VMs, Container Registry
│   ├── data/             # Cosmos DB, Storage Accounts
│   ├── ai/               # OpenAI, Document Intelligence, Speech
│   ├── security/         # Key Vault, RBAC, Managed Identity
│   └── monitoring/       # Azure Monitor, Log Analytics
├── shared/               # Recursos compartidos entre ambientes
│   └── devops/           # Container Registry, GitHub integration
└── scripts/              # Scripts de automatización
    ├── init.sh           # Inicialización de Terraform
    ├── deploy.sh         # Deployment automatizado
    └── destroy.sh        # Cleanup de recursos
```

---

## 🎯 FILOSOFÍA DE ORGANIZACIÓN

### **1. Separación por Ambientes**
- Cada ambiente (`dev`, `stg`, `prd`) tiene su propia configuración
- Variables específicas por ambiente en archivos `.tfvars`
- State files separados para aislamiento completo

### **2. Módulos Reutilizables**
- Cada módulo encapsula un grupo lógico de recursos
- Reutilización entre ambientes con diferentes configuraciones
- Versionado independiente de módulos

### **3. Recursos Compartidos**
- Container Registry compartido entre ambientes
- Configuración de CI/CD centralizada
- Recursos de governance y compliance

---

## 🚀 GUÍA DE USO

### **Prerrequisitos**
```bash
# Instalar Terraform
brew install terraform  # macOS
# o
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Instalar Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login a Azure
az login
```

### **Inicialización**
```bash
# Ir al directorio del ambiente deseado
cd environments/dev

# Inicializar Terraform
terraform init

# Revisar plan
terraform plan -var-file="dev.tfvars"

# Aplicar cambios
terraform apply -var-file="dev.tfvars"
```

### **Deployment por Fases**
```bash
# Fase 1: Networking y Security
./scripts/deploy.sh dev networking
./scripts/deploy.sh dev security

# Fase 2: Data y AI Services
./scripts/deploy.sh dev data
./scripts/deploy.sh dev ai

# Fase 3: Compute y Applications
./scripts/deploy.sh dev compute

# Fase 4: Monitoring
./scripts/deploy.sh dev monitoring
```

---

## 🔧 CONFIGURACIÓN DE VARIABLES

### **Variables Globales** (`terraform.tfvars`)
```hcl
# Configuración general
project_name = "tsalud"
location = "Central US"
location_short = "cus"

# Networking
vnet_address_space = ["10.0.0.0/16"]
subnet_frontend = "10.0.1.0/24"
subnet_backend = "10.0.2.0/24"
subnet_data = "10.0.3.0/24"
subnet_bastion = "10.0.4.0/24"

# Tags obligatorios
default_tags = {
  Project = "TecSalud-MVP"
  BusinessUnit = "TecSalud"
  DataClassification = "Medical-Sensitive"
  Compliance = "HIPAA-Healthcare"
  CostCenter = "IT-Healthcare-AI"
  MaintenanceWindow = "Sun-02:00-06:00-CST"
}
```

### **Variables por Ambiente** (`dev.tfvars`)
```hcl
environment = "dev"
environment_short = "dev"

# Sizing para development
cosmos_throughput = 400
container_app_min_replicas = 1
container_app_max_replicas = 3
vm_size = "Standard_B2s"

# Configuración específica de dev
openai_sku = "S0"
enable_backup = false
enable_monitoring = true
log_retention_days = 7

# Owners y responsables
owner_email = "dev-team@tecsalud.com"
support_team = "DevOps-Team"
```

---

## 🔐 GESTIÓN DE ESTADOS

### **Backend Configuration** (`backend.tf`)
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tsalud-shared-cus-tfstate-001"
    storage_account_name = "sttsaludsharedcustfstate001"
    container_name       = "tfstate"
    key                  = "dev/terraform.tfstate"
  }
}
```

### **State Files por Ambiente**
- `dev/terraform.tfstate` - Estado de desarrollo
- `stg/terraform.tfstate` - Estado de staging
- `prd/terraform.tfstate` - Estado de producción

---

## 🧪 TESTING Y VALIDACIÓN

### **Validación Pre-Deploy**
```bash
# Formatear código
terraform fmt -recursive

# Validar configuración
terraform validate

# Security scan
tfsec .

# Plan detallado
terraform plan -detailed-exitcode
```

### **Testing por Módulos**
```bash
# Test de módulo específico
cd modules/networking
terraform init
terraform validate
terraform plan
```

---

## 📊 MONITOREO Y OBSERVABILIDAD

### **Métricas de Terraform**
- **Plan Duration:** Tiempo de generación de plan
- **Apply Duration:** Tiempo de aplicación
- **Resource Count:** Número de recursos gestionados
- **Drift Detection:** Detección de cambios fuera de Terraform

### **Alertas Configuradas**
- Fallos en `terraform apply`
- Cambios no autorizados en recursos
- Costos fuera de presupuesto
- Recursos no taggeados correctamente

---

## 🚨 TROUBLESHOOTING

### **Problemas Comunes**
```bash
# State lock
terraform force-unlock <lock-id>

# Refresh state
terraform refresh

# Import recurso existente
terraform import <resource_type.name> <azure_resource_id>

# Destruir recurso específico
terraform destroy -target=<resource_type.name>
```

### **Logs y Debugging**
```bash
# Logs detallados
export TF_LOG=DEBUG
terraform apply

# Logs de Azure Provider
export TF_LOG_PROVIDER=DEBUG
```

---

## 🔧 PRÓXIMOS PASOS

1. **Crear módulos base** (networking, security)
2. **Configurar backend** para state management
3. **Implementar CI/CD** con GitHub Actions
4. **Documentar runbooks** específicos
5. **Configurar monitoreo** de infrastructure drift

---

*Documentación generada el 2025-01-07 para TecSalud MVP v3.0* 