# 🚀 GETTING STARTED - TecSalud MVP Infrastructure

**Proyecto:** Asistente Virtual Médico con IA - TecSalud MVP v3.0  
**Fecha:** 2025-01-07  
**Herramienta:** Terraform + Azure Provider

---

## 📁 LO QUE HEMOS CREADO

### **Estructura Completa:**
```
terraform/
├── environments/
│   └── dev/
│       ├── main.tf              ✅ Configuración principal
│       ├── variables.tf         ✅ Variables del ambiente
│       ├── dev.tfvars          ✅ Valores específicos de dev
│       ├── backend.tf          ✅ Configuración de state
│       └── outputs.tf          ✅ Outputs importantes
├── modules/
│   └── networking/
│       ├── main.tf             ✅ VNet, Subnets, NSGs, Bastion
│       ├── variables.tf        ✅ Variables del módulo
│       └── outputs.tf          ✅ Outputs del módulo
├── scripts/
│   ├── setup.sh               ✅ Setup inicial de infraestructura
│   └── deploy.sh              ✅ Deployment automatizado
└── README.md                  ✅ Documentación completa
```

### **Recursos Configurados:**
- **✅ 6 Resource Groups** (network, compute, data, ai, security, monitor)
- **✅ Virtual Network** con 4 subnets (frontend, backend, data, bastion)
- **✅ Network Security Groups** con reglas específicas
- **✅ Azure Bastion** para acceso seguro
- **✅ Naming Convention** siguiendo estándares de Microsoft
- **✅ Tagging Strategy** para compliance médico

---

## 🚀 GUÍA DE INICIO RÁPIDO

### **1. Prerrequisitos**
```bash
# Instalar Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Instalar Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Login a Azure
az login
```

### **2. Setup Inicial (Solo una vez)**
```bash
# Ir al directorio de Terraform
cd terraform

# Ejecutar setup inicial
./scripts/setup.sh

# Esto creará:
# - Resource Group para Terraform state
# - Storage Account para state files
# - Service Principal para autenticación
# - Archivo de credenciales
```

### **3. Configurar Credenciales**
```bash
# Cargar credenciales en el shell
source terraform_credentials.env

# Verificar que las variables estén cargadas
echo $ARM_CLIENT_ID
echo $ARM_SUBSCRIPTION_ID
```

### **4. Desplegar Infraestructura**
```bash
# Desplegar ambiente completo de desarrollo
./scripts/deploy.sh dev

# O paso a paso:
./scripts/deploy.sh dev plan      # Solo mostrar plan
./scripts/deploy.sh dev apply     # Aplicar cambios
./scripts/deploy.sh dev output    # Mostrar outputs
```

---

## 🔧 COMANDOS ÚTILES

### **Deployment Commands**
```bash
# Validar configuración
./scripts/deploy.sh dev validate

# Formatear código
./scripts/deploy.sh dev format

# Destruir recursos (¡CUIDADO!)
./scripts/deploy.sh dev destroy
```

### **Terraform Commands Directos**
```bash
# Ir al ambiente específico
cd environments/dev

# Comandos básicos
terraform init
terraform plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars"
terraform destroy -var-file="dev.tfvars"
```

---

## 📊 VERIFICACIÓN POST-DEPLOYMENT

### **Recursos Creados en Azure:**
Después del deployment, deberías ver:

```
Resource Groups:
├── rg-tsalud-dev-cus-network-001
├── rg-tsalud-dev-cus-compute-001
├── rg-tsalud-dev-cus-data-001
├── rg-tsalud-dev-cus-ai-001
├── rg-tsalud-dev-cus-security-001
└── rg-tsalud-dev-cus-monitor-001

Networking:
├── vnet-tsalud-dev-cus-main-001
├── 4 subnets (frontend, backend, data, bastion)
├── 4 NSGs con reglas específicas
└── bas-tsalud-dev-cus-main-001 (Azure Bastion)
```

### **Verificar en Azure Portal:**
1. Ir a [portal.azure.com](https://portal.azure.com)
2. Buscar Resource Groups con "tsalud"
3. Verificar que todos los recursos estén creados
4. Revisar tags y naming convention

---

## 🎯 PRÓXIMOS PASOS

### **Módulos Pendientes:**
```bash
# Crear módulos adicionales
modules/
├── security/       # Key Vault, RBAC
├── data/          # Cosmos DB, Storage
├── ai/            # OpenAI, Document Intelligence
├── compute/       # Container Apps, VMs
└── monitoring/    # Log Analytics, Monitoring
```

### **Ambientes Adicionales:**
```bash
# Copiar y adaptar para staging y producción
environments/
├── stg/           # Staging environment
└── prd/           # Production environment
```

---

## 🚨 TROUBLESHOOTING

### **Problemas Comunes:**

#### **1. Error de Autenticación**
```bash
# Verificar login
az account show

# Re-login si es necesario
az login

# Verificar variables de entorno
echo $ARM_CLIENT_ID
```

#### **2. Error de State Lock**
```bash
# Forzar unlock (solo si es necesario)
terraform force-unlock <lock-id>
```

#### **3. Error de Naming**
```bash
# Verificar nombres únicos
az resource list --name "storage-account-name"

# Cambiar nombres si hay conflictos
```

### **Logs y Debugging:**
```bash
# Logs detallados
export TF_LOG=DEBUG
terraform apply

# Logs específicos de Azure
export TF_LOG_PROVIDER=DEBUG
```

---

## 🔐 SEGURIDAD Y COMPLIANCE

### **Archivos Sensibles:**
```bash
# NUNCA committear estos archivos:
terraform_credentials.env
*.tfplan
*.tfstate
*.tfstate.backup
```

### **Gitignore Recomendado:**
```gitignore
# Terraform
*.tfstate
*.tfstate.*
*.tfplan
*.tfplan.*
.terraform/
.terraform.lock.hcl
terraform_credentials.env

# Azure
.azure/
```

### **Rotación de Credenciales:**
```bash
# Rotar Service Principal cada 90 días
az ad sp credential reset --name "sp-tsalud-terraform"
```

---

## 📞 SOPORTE

### **Recursos Útiles:**
- [Azure Terraform Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [Terraform Documentation](https://www.terraform.io/docs)

### **Contacto:**
- **DevOps Team:** devops-team@tecsalud.com
- **IT Support:** it-support@tecsalud.com
- **Emergency:** +52-xxx-xxx-xxxx

---

## ✅ CHECKLIST FINAL

- [ ] Prerrequisitos instalados (Azure CLI, Terraform)
- [ ] Login a Azure exitoso
- [ ] Setup inicial ejecutado (`./scripts/setup.sh`)
- [ ] Credenciales cargadas (`source terraform_credentials.env`)
- [ ] Deployment exitoso (`./scripts/deploy.sh dev`)
- [ ] Recursos verificados en Azure Portal
- [ ] Outputs revisados
- [ ] Documentación leída
- [ ] Archivos sensibles en `.gitignore`

---

*Guía generada el 2025-01-07 para TecSalud MVP v3.0*

¡Listo para producir infraestructura de clase mundial! 🚀 