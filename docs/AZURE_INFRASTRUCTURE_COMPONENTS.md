# 🏗️ COMPONENTES DE INFRAESTRUCTURA AZURE - TecSalud MVP

**Proyecto:** Asistente Virtual Médico con IA - TecSalud MVP v3.0  
**Fecha:** 2025-01-07  
**Propósito:** Lista completa de componentes Azure a crear según arquitectura

---

## 📋 ÍNDICE
1. [Red y Conectividad](#red-y-conectividad)
2. [Servicios de Aplicación](#servicios-de-aplicación)
3. [Servicios de IA y Procesamiento](#servicios-de-ia-y-procesamiento)
4. [Almacenamiento y Base de Datos](#almacenamiento-y-base-de-datos)
5. [Seguridad](#seguridad)
6. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
7. [CI/CD y DevOps](#cicd-y-devops)
8. [Máquinas Virtuales](#máquinas-virtuales)
9. [Gestión de APIs](#gestión-de-apis)
10. [Estimación de Costos](#estimación-de-costos)

---

## 🌐 RED Y CONECTIVIDAD

### Azure Virtual Network (VNet)
- **Propósito:** Red privada principal para todos los servicios
- **Configuración:** 
  - CIDR: 10.0.0.0/16
  - Subnets: Frontend, Backend, Database, Gateway
- **Dependencias:** Base para todos los servicios

### Azure Bastion
- **Propósito:** Acceso seguro a VMs sin IP pública
- **Configuración:** Standard SKU
- **Dependencias:** Subnet dedicada AzureBastionSubnet

---

## 🔧 SERVICIOS DE APLICACIÓN

### Azure Container Apps (UI)
- **Propósito:** Hosting del frontend Angular
- **Configuración:**
  - Scaling: 1-10 instancias
  - CPU: 0.5 vCPU
  - Memory: 1GB
- **Imagen:** Angular + Bamboo framework

### Azure Container Apps (APIs Agent)
- **Propósito:** Backend principal para lógica de negocio
- **Configuración:**
  - Scaling: 2-20 instancias
  - CPU: 1 vCPU
  - Memory: 2GB
- **Funciones:** Chat, streaming, manejo de pacientes

### Azure Container Apps (APIs Document Manager)
- **Propósito:** Microservicio para gestión de documentos
- **Configuración:**
  - Scaling: 1-10 instancias
  - CPU: 1 vCPU
  - Memory: 2GB
- **Funciones:** Upload, OCR, matching de pacientes

### Azure Container Apps Environment
- **Propósito:** Entorno compartido para Container Apps
- **Configuración:** 
  - VNet integration
  - Log Analytics workspace
- **Dependencias:** Virtual Network, Log Analytics

---

## 🤖 SERVICIOS DE IA Y PROCESAMIENTO

### Azure OpenAI Service
- **Propósito:** Servicio de IA para consultas médicas
- **Configuración:**
  - Model: GPT-4 Turbo
  - Deployment: Standard
  - Tokens: 50K TPM mínimo
- **Funciones:** Chat médico, análisis de documentos

### Azure Document Intelligence (Form Recognizer)
- **Propósito:** OCR automático de documentos médicos
- **Configuración:**
  - Prebuilt models + Custom models
  - Standard S0 pricing tier
- **Funciones:** Extracción de texto, metadata

### Azure Speech Services
- **Propósito:** Speech-to-Text y Text-to-Speech
- **Configuración:**
  - Standard S0 pricing tier
  - Español (México) language support
- **Funciones:** Transcripción de audio médico

---

## 💾 ALMACENAMIENTO Y BASE DE DATOS

### Azure Cosmos DB
- **Propósito:** Base de datos principal NoSQL
- **Configuración:**
  - API: Core SQL
  - Consistency: Session
  - Autoscale: 400-4000 RU/s
- **Datos:** Pacientes, usuarios, historiales, metadatos

### Azure Data Lake Storage Gen2
- **Propósito:** Almacenamiento de documentos médicos
- **Configuración:**
  - Redundancy: GRS (Geo-redundant)
  - Access tier: Hot
  - Lifecycle management: Enabled
- **Datos:** PDFs, imágenes, contenido OCR


---

## 🔐 SEGURIDAD

### Azure Key Vault
- **Propósito:** Gestión de secretos y certificados
- **Configuración:**
  - Standard pricing tier
  - Access policies para Container Apps
- **Secretos:** API keys, connection strings, certificates

### Azure Network Security Groups (NSGs)
- **Propósito:** Firewall de red para subnets
- **Configuración:**
  - Rules para tráfico HTTP/HTTPS
  - Restricciones por IP ranges
- **Aplicación:** Todas las subnets

---

## 📊 MONITOREO Y OBSERVABILIDAD


### Azure Monitor
- **Propósito:** Monitoreo centralizado de infraestructura
- **Configuración:**
  - Log Analytics workspace
  - Alertas por métricas críticas
- **Funciones:** Logs, métricas, alertas

### Azure Cost Management
- **Propósito:** Control y optimización de costos
- **Configuración:**
  - Budgets por resource group
  - Alertas por threshold
- **Funciones:** Tracking, forecasting, optimization

---

## 🚀 CI/CD Y DEVOPS

### GitHub Actions Integration
- **Propósito:** CI/CD pipeline
- **Configuración:**
  - Service principal para deployment
  - Secrets en GitHub
- **Funciones:** Build, test, deploy

### Azure Container Registry (ACR)
- **Propósito:** Registry privado para Docker images
- **Configuración:**
  - Standard SKU
  - Geo-replication: Enabled
- **Funciones:** Storage de imágenes, vulnerability scanning

---

## 🖥️ MÁQUINAS VIRTUALES

### Azure Virtual Machine (Deployment Agent)
- **Propósito:** Agente de deployment y automatización
- **Configuración:**
  - Size: Standard_B2s (2 vCPU, 4GB RAM)
  - OS: Ubuntu 20.04 LTS
  - Managed disk: 128GB SSD
- **Funciones:** Deploy scripts, maintenance tasks

### Azure Virtual Machine (Monitoring and Bugs)
- **Propósito:** Monitoreo especializado y debugging
- **Configuración:**
  - Size: Standard_B2ms (2 vCPU, 8GB RAM)
  - OS: Windows 11
  - Managed disk: 256GB SSD
- **Funciones:** Log analysis, performance monitoring

---

## 🔗 GESTIÓN DE APIS

### Azure API Management
- **Propósito:** Gateway y gestión de APIs
- **Configuración:**
  - Developer tier para MVP
  - VNet integration
  - OAuth 2.0 authorization
- **Funciones:** Rate limiting, authentication, monitoring

---

## 💰 ESTIMACIÓN DE COSTOS MENSUAL (USD)

### Servicios Principales
| Servicio | Configuración | Costo Estimado |
|----------|---------------|----------------|
| Azure OpenAI | GPT-4 Turbo, 50K TPM | $500-1000 |
| Container Apps | 3 apps, scaling | $200-400 |
| Cosmos DB | 1000 RU/s average | $150-300 |
| Data Lake Storage | 1TB, GRS | $50-100 |
| Document Intelligence | 1000 pages/day | $100-200 |
| Virtual Machines | 2 x B2s/B2ms | $150-250 |
| API Management | Developer tier | $50-100 |
| Monitoring & Security | Full suite | $100-200 |

### **Total Estimado: $1,300 - $2,550 USD/mes**

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Red y Seguridad
- [ ] Azure Virtual Network
- [ ] Azure Bastion
- [ ] Azure Key Vault
- [ ] Network Security Groups (NSGs)

### Fase 2: Servicios Core
- [ ] Azure Container Apps Environment
- [ ] Azure OpenAI Service
- [ ] Azure Document Intelligence
- [ ] Azure Speech Services
- [ ] Azure Cosmos DB
- [ ] Azure Data Lake Storage

### Fase 3: Aplicaciones
- [ ] Azure Container Registry
- [ ] Container App - UI (Angular)
- [ ] Container App - APIs Agent
- [ ] Container App - Document Manager
- [ ] Azure API Management

### Fase 4: Máquinas Virtuales
- [ ] Azure Virtual Machine (Deployment Agent)
- [ ] Azure Virtual Machine (Monitoring and Bugs)

### Fase 5: Monitoreo y CI/CD
- [ ] Azure Monitor
- [ ] Azure Cost Management
- [ ] GitHub Actions integration
- [ ] Deployment pipelines
- [ ] Alertas y dashboards

---

## 🔧 PRÓXIMOS PASOS

1. **Revisión de arquitectura** con stakeholders
2. **Creación de Resource Groups** por ambiente
3. **Configuración de redes** y conectividad
4. **Implementación de servicios core** (OpenAI, Cosmos DB)
5. **Deployment de aplicaciones** (Container Apps)
6. **Configuración de monitoreo** y alertas
7. **Testing de integración** end-to-end
8. **Documentación** y handover

---

*Documento generado el 2025-01-07 para TecSalud MVP v3.0* 