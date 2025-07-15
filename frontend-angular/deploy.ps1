<#
.SYNOPSIS
    Deployment script for TecSalud Frontend Angular Application

.DESCRIPTION
    This PowerShell script manages the complete lifecycle of the TecSalud Angular frontend
    application Docker container, including building, running, stopping, and monitoring.

.PARAMETER Action
    Specifies the action to perform. Valid values are:
    - build: Build the Docker image only
    - run: Run the container only
    - stop: Stop and remove the container
    - logs: Show container logs
    - status: Check container status and health
    - clean: Remove all resources (container and image)
    - all: Complete deployment (build + run + status check)

.EXAMPLE
    .\deploy.ps1
    Performs a complete deployment (default action: all)

.EXAMPLE
    .\deploy.ps1 build
    Builds the Docker image only

.EXAMPLE
    .\deploy.ps1 status
    Checks the current status of the running container

.NOTES
    Author: TecSalud Development Team
    Version: 1.0.0
    Requires: Docker Desktop or Docker Engine
#>

param(
    [Parameter(Position=0, HelpMessage="Action to perform: build, run, stop, logs, status, clean, or all")]
    [ValidateSet("build", "run", "stop", "logs", "status", "clean", "all")]
    [string]$Action = "all"
)

# =============================================================================
# Configuration Variables
# =============================================================================
$IMAGE_NAME = "crtsaluddevcus001.azurecr.io/tecsalud-frontend"        # Docker image name
$IMAGE_TAG = "latest"                    # Docker image tag
$CONTAINER_NAME = "tecsalud-frontend"    # Docker container name
$PORT = "8080"                             # Host port to expose the application

# =============================================================================
# Utility Functions for Console Output
# =============================================================================

<#
.SYNOPSIS
    Writes an informational message to the console
.PARAMETER Message
    The message to display
#>
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

<#
.SYNOPSIS
    Writes a success message to the console
.PARAMETER Message
    The message to display
#>
function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

<#
.SYNOPSIS
    Writes an error message to the console
.PARAMETER Message
    The message to display
#>
function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Stop-Container {
    Write-Info "Verificando y eliminando contenedor existente..."

    # Buscar contenedores con el mismo nombre (en cualquier estado: running, stopped, created, etc.)
    $existing = docker ps -aq --filter "name=$CONTAINER_NAME"
    if ($existing) {
        Write-Info "Encontrado contenedor existente: $CONTAINER_NAME"

        # Detener si está corriendo
        $running = docker ps -q --filter "name=$CONTAINER_NAME"
        if ($running) {
            Write-Info "Deteniendo contenedor..."
            docker stop $CONTAINER_NAME
        }

        # Eliminar contenedor (ya sea que estuviera corriendo, stopped, o created)
        Write-Info "Eliminando contenedor..."
        docker rm $CONTAINER_NAME
        Write-Success "Contenedor anterior eliminado exitosamente"
    } else {
        Write-Info "No se encontró contenedor existente con nombre: $CONTAINER_NAME"
    }
}

function Build-Image {
    Write-Info "Construyendo imagen Docker..."

    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Imagen construida exitosamente"
    } else {
        Write-Error "Error al construir la imagen"
        exit 1
    }
}

function Run-Container {
    Write-Info "Ejecutando contenedor..."

    docker run -d `
        --name $CONTAINER_NAME `
        --restart unless-stopped `
        -p "${PORT}:8080" `
        "${IMAGE_NAME}:${IMAGE_TAG}"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Contenedor ejecutandose exitosamente"
        Write-Info "Aplicacion disponible en: http://localhost:${PORT}"
    } else {
        Write-Error "Error al ejecutar el contenedor"
        exit 1
    }
}

function Check-Status {
    Write-Info "Verificando estado..."

    $running = docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    if ($running) {
        Write-Success "Contenedor está corriendo:"
        Write-Host $running

        # Test health check
        Start-Sleep -Seconds 3
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:${PORT}/" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check OK - Aplicacion funcionando correctamente"
            }
        } catch {
            Write-Error "Health check fallo - Aplicacion puede no estar lista aun"
            Write-Info "Intentando verificar el contenedor..."

            # Verificar si el contenedor sigue corriendo
            $stillRunning = docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}"
            if ($stillRunning) {
                Write-Info "Contenedor sigue activo. La aplicacion puede tardar unos momentos en cargar."
                Write-Info "Prueba acceder manualmente a: http://localhost:${PORT}"
            } else {
                Write-Error "El contenedor se detuvo inesperadamente. Verifica los logs:"
                Write-Host "docker logs $CONTAINER_NAME" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Error "Contenedor no esta corriendo"
    }
}

function Show-Logs {
    Write-Info "Mostrando logs del contenedor..."
    docker logs -f $CONTAINER_NAME
}

function Clean-Resources {
    Write-Info "Limpiando recursos Docker..."

    # Detener y eliminar contenedor
    Stop-Container

    # Eliminar imagen
    $image = docker images -q "${IMAGE_NAME}:${IMAGE_TAG}"
    if ($image) {
        docker rmi "${IMAGE_NAME}:${IMAGE_TAG}"
        Write-Success "Imagen eliminada"
    }

    # Limpiar imágenes sin usar
    docker system prune -f
    Write-Success "Limpieza completada"
}

function Show-Help {
    Write-Host "Script de despliegue para TecSalud Frontend Angular"
    Write-Host ""
    Write-Host "Uso: .\deploy.ps1 [ACCION]"
    Write-Host ""
    Write-Host "Acciones:"
    Write-Host "  all       Construir y desplegar (por defecto)"
    Write-Host "  build     Solo construir la imagen"
    Write-Host "  run       Solo ejecutar el contenedor"
    Write-Host "  stop      Detener el contenedor"
    Write-Host "  logs      Mostrar logs del contenedor"
    Write-Host "  status    Verificar estado del contenedor"
    Write-Host "  clean     Limpiar todos los recursos"
    Write-Host ""
    Write-Host "Ejemplos:"
    Write-Host "  .\deploy.ps1              # Despliegue completo"
    Write-Host "  .\deploy.ps1 build        # Solo construir"
    Write-Host "  .\deploy.ps1 status       # Ver estado"
    Write-Host "  .\deploy.ps1 logs         # Ver logs"
}

# Ejecutar acción según el parámetro
switch ($Action) {
    "build" {
        Build-Image
    }
    "run" {
        Stop-Container
        Run-Container
        Start-Sleep -Seconds 3
        Check-Status
    }
    "stop" {
        Stop-Container
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Check-Status
    }
    "clean" {
        Clean-Resources
    }
    "all" {
        Stop-Container
        Build-Image
        Run-Container
        Start-Sleep -Seconds 5
        Check-Status
        Write-Success "Despliegue completado exitosamente!"
        Write-Info "Tu aplicacion TecSalud esta disponible en: http://localhost:${PORT}"
    }
    default {
        Show-Help
    }
}
