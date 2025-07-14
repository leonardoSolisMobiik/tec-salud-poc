# 🏗️ ORGANIZACIÓN DE RECURSOS AZURE - TecSalud MVP

**Proyecto:** Asistente Virtual Médico con IA - TecSalud MVP v3.0  
**Fecha:** 2025-01-07  
**Estándar:** Microsoft Azure Cloud Adoption Framework  
**Referencia:** [Resource Abbreviations](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations)

---

## 📋 ÍNDICE
1. [Naming Convention](#naming-convention)
2. [Resource Groups](#resource-groups)
3. [Tagging Strategy](#tagging-strategy)
4. [RBAC Boundaries](#rbac-boundaries)
5. [Naming Examples](#naming-examples)
6. [Implementation Order](#implementation-order)

---

## 📝 NAMING CONVENTION

### **Patrón Base:**
```
{resourcetype}-{workload}-{environment}-{region}-{instance}
```

### **Componentes:**
- **resourcetype:** Abreviación oficial de Microsoft
- **workload:** `tsalud` (TecSalud)
- **environment:** `dev`, `stg`, `prd`
- **region:** `cus` (Central US), `eus` (East US)
- **instance:** `001`, `002`, etc.

### **Ejemplo:**
```
oai-tsalud-prd-cus-001
```

---

## 🗂️ RESOURCE GROUPS

### **Estructura por Ambiente y Función:**

#### **1. PRODUCTION (PRD)**
```
rg-tsalud-prd-cus-network-001     # Red y conectividad
rg-tsalud-prd-cus-compute-001     # Container Apps y VMs
rg-tsalud-prd-cus-data-001        # Cosmos DB y Storage
rg-tsalud-prd-cus-ai-001          # OpenAI y Cognitive Services
rg-tsalud-prd-cus-security-001    # Key Vault y security
rg-tsalud-prd-cus-monitor-001     # Monitoring y observabilidad
```

#### **2. STAGING (STG)**
```
rg-tsalud-stg-cus-network-001     # Red y conectividad
rg-tsalud-stg-cus-compute-001     # Container Apps y VMs
rg-tsalud-stg-cus-data-001        # Cosmos DB y Storage
rg-tsalud-stg-cus-ai-001          # OpenAI y Cognitive Services
rg-tsalud-stg-cus-security-001    # Key Vault y security
rg-tsalud-stg-cus-monitor-001     # Monitoring y observabilidad
```

#### **3. DEVELOPMENT (DEV)**
```
rg-tsalud-dev-cus-network-001     # Red y conectividad
rg-tsalud-dev-cus-compute-001     # Container Apps y VMs
rg-tsalud-dev-cus-data-001        # Cosmos DB y Storage
rg-tsalud-dev-cus-ai-001          # OpenAI y Cognitive Services
rg-tsalud-dev-cus-security-001    # Key Vault y security
rg-tsalud-dev-cus-monitor-001     # Monitoring y observabilidad
```

#### **4. SHARED SERVICES**
```
rg-tsalud-shared-cus-devops-001   # Container Registry, GitHub integration
rg-tsalud-shared-cus-mgmt-001     # Management y governance
```

---

## 🏷️ TAGGING STRATEGY

### **Tags Obligatorios:**
```json
{
  "Environment": "prd|stg|dev",
  "Project": "TecSalud-MVP",
  "Owner": "equipo-responsable@tecsalud.com",
  "CostCenter": "IT-Healthcare-AI",
  "BusinessUnit": "TecSalud",
  "DataClassification": "Medical-Sensitive",
  "Backup": "Required|Optional",
  "Compliance": "HIPAA-Healthcare",
  "MaintenanceWindow": "Sun-02:00-06:00-CST",
  "CreatedDate": "2025-01-07"
}
```

### **Tags Opcionales:**
```json
{
  "Application": "Medical-AI-Assistant",
  "Version": "3.0",
  "Support": "24x7|BusinessHours",
  "DrTier": "Tier1|Tier2|Tier3",
  "AutoShutdown": "true|false",
  "MonitoringLevel": "Basic|Standard|Premium"
}
```

---

## 🔐 RBAC BOUNDARIES

### **1. PRODUCTION (PRD) - Acceso Restrictivo**
```
Resource Group: rg-tsalud-prd-cus-*
Roles:
├── Owner: IT-Azure-Admins
├── Contributor: DevOps-Team
├── Reader: Support-Team, Security-Team
└── Custom Roles:
    ├── Medical-Data-Reader (médicos)
    ├── AI-Service-Operator (administradores AI)
    └── Backup-Operator (operaciones)
```

### **2. STAGING (STG) - Acceso Controlado**
```
Resource Group: rg-tsalud-stg-cus-*
Roles:
├── Owner: IT-Azure-Admins
├── Contributor: DevOps-Team, QA-Team
├── Reader: Development-Team, Business-Users
└── Custom Roles:
    ├── Test-Data-Manager (QA)
    └── Deployment-Validator (DevOps)
```

### **3. DEVELOPMENT (DEV) - Acceso Amplio**
```
Resource Group: rg-tsalud-dev-cus-*
Roles:
├── Owner: IT-Azure-Admins
├── Contributor: Development-Team, DevOps-Team
├── Reader: All-Stakeholders
└── Custom Roles:
    └── Dev-Resource-Manager (desarrolladores)
```

### **4. SHARED SERVICES - Acceso Centralizado**
```
Resource Group: rg-tsalud-shared-cus-*
Roles:
├── Owner: IT-Azure-Admins
├── Contributor: DevOps-Team
├── Reader: All-Teams
└── Custom Roles:
    └── CI-CD-Operator (automation)
```

---

## 🎯 NAMING EXAMPLES

### **Red y Conectividad**
```
vnet-tsalud-prd-cus-main-001           # Virtual Network
snet-tsalud-prd-cus-frontend-001       # Subnet Frontend
snet-tsalud-prd-cus-backend-001        # Subnet Backend
snet-tsalud-prd-cus-data-001           # Subnet Database
snet-tsalud-prd-cus-bastion-001        # Subnet Bastion
bas-tsalud-prd-cus-main-001            # Azure Bastion
nsg-tsalud-prd-cus-frontend-001        # Network Security Group
nsg-tsalud-prd-cus-backend-001         # Network Security Group
nsg-tsalud-prd-cus-data-001            # Network Security Group
```

### **Servicios de Aplicación**
```
cae-tsalud-prd-cus-main-001            # Container App Environment
ca-tsalud-prd-cus-ui-001               # Container App UI (Angular)
ca-tsalud-prd-cus-api-001              # Container App APIs Agent
ca-tsalud-prd-cus-docs-001             # Container App Document Manager
acr-tsalud-prd-cus-main-001            # Azure Container Registry
```

### **Servicios de IA**
```
oai-tsalud-prd-cus-main-001            # Azure OpenAI Service
di-tsalud-prd-cus-ocr-001              # Document Intelligence
spch-tsalud-prd-cus-main-001           # Speech Services
```

### **Almacenamiento y Base de Datos**
```
cosmos-tsalud-prd-cus-main-001         # Cosmos DB Account
st-tsalud-prd-cus-docs-001             # Storage Account (Data Lake)
st-tsalud-prd-cus-logs-001             # Storage Account (Logs)
```

### **Seguridad**
```
kv-tsalud-prd-cus-main-001             # Key Vault
kv-tsalud-prd-cus-certs-001            # Key Vault (Certificates)
```

### **Máquinas Virtuales**
```
vm-tsalud-prd-cus-deploy-001           # VM Deployment Agent
vm-tsalud-prd-cus-monitor-001          # VM Monitoring and Bugs
osdisk-tsalud-prd-cus-deploy-001       # OS Disk
disk-tsalud-prd-cus-deploy-001         # Data Disk
nic-tsalud-prd-cus-deploy-001          # Network Interface
```

### **APIs y Networking**
```
apim-tsalud-prd-cus-main-001           # API Management
pip-tsalud-prd-cus-apim-001            # Public IP para API Management
```

### **Monitoreo**
```
log-tsalud-prd-cus-main-001            # Log Analytics Workspace
```

---

## 📊 IMPLEMENTATION ORDER

### **Fase 1: Fundación (Resource Groups + Networking)**
```bash
# 1. Crear Resource Groups
az group create --name rg-tsalud-prd-cus-network-001 --location centralus
az group create --name rg-tsalud-prd-cus-security-001 --location centralus
az group create --name rg-tsalud-prd-cus-compute-001 --location centralus
az group create --name rg-tsalud-prd-cus-data-001 --location centralus
az group create --name rg-tsalud-prd-cus-ai-001 --location centralus
az group create --name rg-tsalud-prd-cus-monitor-001 --location centralus

# 2. Aplicar tags a Resource Groups
az group update --name rg-tsalud-prd-cus-network-001 --tags Environment=prd Project=TecSalud-MVP Owner=equipo-infra@tecsalud.com

# 3. Crear Virtual Network
az network vnet create \
  --name vnet-tsalud-prd-cus-main-001 \
  --resource-group rg-tsalud-prd-cus-network-001 \
  --address-prefix 10.0.0.0/16

# 4. Crear Subnets
az network vnet subnet create \
  --name snet-tsalud-prd-cus-frontend-001 \
  --resource-group rg-tsalud-prd-cus-network-001 \
  --vnet-name vnet-tsalud-prd-cus-main-001 \
  --address-prefix 10.0.1.0/24
```

### **Fase 2: Seguridad (Key Vault + NSGs)**
```bash
# 1. Crear Key Vault
az keyvault create \
  --name kv-tsalud-prd-cus-main-001 \
  --resource-group rg-tsalud-prd-cus-security-001 \
  --location centralus

# 2. Crear Network Security Groups
az network nsg create \
  --name nsg-tsalud-prd-cus-frontend-001 \
  --resource-group rg-tsalud-prd-cus-network-001
```

### **Fase 3: Servicios Core (AI + Storage)**
```bash
# 1. Crear Cosmos DB
az cosmosdb create \
  --name cosmos-tsalud-prd-cus-main-001 \
  --resource-group rg-tsalud-prd-cus-data-001 \
  --kind GlobalDocumentDB

# 2. Crear Storage Account
az storage account create \
  --name sttsaludprdcusdocs001 \
  --resource-group rg-tsalud-prd-cus-data-001 \
  --location centralus \
  --sku Standard_GRS
```

### **Fase 4: Aplicaciones (Container Apps)**
```bash
# 1. Crear Container App Environment
az containerapp env create \
  --name cae-tsalud-prd-cus-main-001 \
  --resource-group rg-tsalud-prd-cus-compute-001 \
  --location centralus

# 2. Crear Container Registry
az acr create \
  --name acrtsaludprdcusmain001 \
  --resource-group rg-tsalud-prd-cus-compute-001 \
  --sku Standard
```

---

## ✅ VALIDACIÓN Y COMPLIANCE

### **Checklist de Naming:**
- [ ] Todos los nombres siguen el patrón `{resourcetype}-{workload}-{environment}-{region}-{instance}`
- [ ] Se usan abreviaciones oficiales de Microsoft
- [ ] Nombres son consistentes entre ambientes
- [ ] No hay caracteres especiales o espacios
- [ ] Longitud dentro de límites de Azure

### **Checklist de Tagging:**
- [ ] Todos los recursos tienen tags obligatorios
- [ ] Tags son consistentes entre recursos relacionados
- [ ] DataClassification es apropiada para datos médicos
- [ ] CostCenter está configurado para billing
- [ ] Compliance tags incluyen HIPAA

### **Checklist de RBAC:**
- [ ] Principio de menor privilegio aplicado
- [ ] Separación clara entre ambientes
- [ ] Roles custom definidos para necesidades específicas
- [ ] Acceso auditado y documentado
- [ ] Revisión periódica de permisos planificada

---

## 🔧 PRÓXIMOS PASOS

1. **Validar naming convention** con stakeholders
2. **Crear Resource Groups** para ambiente inicial (dev)
3. **Implementar tagging policy** con Azure Policy
4. **Configurar RBAC** con roles custom
5. **Crear Terraform templates** usando esta estructura
6. **Documentar runbooks** para mantenimiento

---

*Documento generado el 2025-01-07 siguiendo Microsoft Azure Cloud Adoption Framework* 