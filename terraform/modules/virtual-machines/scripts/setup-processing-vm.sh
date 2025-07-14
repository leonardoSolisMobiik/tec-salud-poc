#!/bin/bash

# =============================================================================
# TECSALUD MVP - PROCESSING VM SETUP SCRIPT
# =============================================================================

set -e

# Variables
KEY_VAULT_NAME="${KEY_VAULT_NAME}"
LOG_FILE="/var/log/vm-setup.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "Starting Processing VM setup..."

# Update system
log "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install essential packages
log "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    python3 \
    python3-pip \
    python3-venv

# Install Docker
log "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add current user to docker group
usermod -aG docker azureuser

# Install Docker Compose
log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install Azure CLI
log "Installing Azure CLI..."
curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install Node.js 18
log "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Python packages for document processing
log "Installing Python packages for document processing..."
pip3 install --upgrade pip
pip3 install \
    azure-identity \
    azure-keyvault-secrets \
    azure-storage-blob \
    azure-ai-formrecognizer \
    azure-cognitiveservices-vision-computervision \
    Pillow \
    PyPDF2 \
    pdf2image \
    opencv-python-headless \
    pytesseract \
    numpy \
    pandas \
    requests \
    fastapi \
    uvicorn \
    python-multipart

# Install Tesseract OCR
log "Installing Tesseract OCR..."
apt-get install -y tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng

# Install additional OCR tools
log "Installing additional OCR tools..."
apt-get install -y \
    poppler-utils \
    imagemagick \
    ghostscript

# Configure ImageMagick policy for PDF processing
log "Configuring ImageMagick for PDF processing..."
sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml

# Create application directory
log "Creating application directories..."
mkdir -p /opt/tecsalud/processing
mkdir -p /opt/tecsalud/logs
mkdir -p /opt/tecsalud/temp
mkdir -p /opt/tecsalud/config

# Set permissions
chown -R azureuser:azureuser /opt/tecsalud
chmod -R 755 /opt/tecsalud

# Create systemd service for the processing application
log "Creating systemd service..."
cat > /etc/systemd/system/tecsalud-processing.service << EOF
[Unit]
Description=TecSalud Document Processing Service
After=network.target

[Service]
Type=simple
User=azureuser
WorkingDirectory=/opt/tecsalud/processing
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=PYTHONPATH=/opt/tecsalud/processing
ExecStart=/usr/bin/python3 /opt/tecsalud/processing/main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable the service (but don't start it yet)
systemctl daemon-reload
systemctl enable tecsalud-processing

# Create sample processing application
log "Creating sample processing application..."
cat > /opt/tecsalud/processing/main.py << 'EOF'
#!/usr/bin/env python3
"""
TecSalud Document Processing Service
Main application for processing medical documents with OCR
"""

import os
import sys
import asyncio
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/opt/tecsalud/logs/processing.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """Main application entry point"""
    logger.info("TecSalud Document Processing Service starting...")
    
    # TODO: Implement actual document processing logic
    # This is a placeholder for the actual implementation
    
    while True:
        logger.info(f"Processing service running - {datetime.now()}")
        await asyncio.sleep(60)  # Run every minute

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
    except Exception as e:
        logger.error(f"Service error: {e}")
        sys.exit(1)
EOF

# Make the script executable
chmod +x /opt/tecsalud/processing/main.py

# Create configuration file
log "Creating configuration file..."
cat > /opt/tecsalud/config/processing.conf << EOF
# TecSalud Processing VM Configuration
KEY_VAULT_NAME=${KEY_VAULT_NAME}
PROCESSING_TEMP_DIR=/opt/tecsalud/temp
PROCESSING_LOG_DIR=/opt/tecsalud/logs
AZURE_TENANT_ID=$(curl -H Metadata:true "http://169.254.169.254/metadata/instance/compute/tenantId?api-version=2021-02-01&format=text")
INSTANCE_METADATA=$(curl -H Metadata:true "http://169.254.169.254/metadata/instance?api-version=2021-02-01&format=json")
EOF

# Set up log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/tecsalud << EOF
/opt/tecsalud/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 azureuser azureuser
}
EOF

# Configure Azure CLI to use managed identity
log "Configuring Azure CLI with managed identity..."
sudo -u azureuser az login --identity

# Create health check script
log "Creating health check script..."
cat > /opt/tecsalud/health-check.sh << 'EOF'
#!/bin/bash
# TecSalud Processing VM Health Check

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "ERROR: Docker is not running"
    exit 1
fi

# Check if processing service is running
if ! systemctl is-active --quiet tecsalud-processing; then
    echo "WARNING: TecSalud processing service is not running"
fi

# Check disk space
DISK_USAGE=$(df /opt/tecsalud | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is $${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "WARNING: Memory usage is $${MEM_USAGE}%"
fi

echo "Health check completed successfully"
EOF

chmod +x /opt/tecsalud/health-check.sh

# Set up cron job for health checks
log "Setting up health check cron job..."
echo "*/5 * * * * azureuser /opt/tecsalud/health-check.sh >> /opt/tecsalud/logs/health-check.log 2>&1" | crontab -

# Final security updates
log "Applying final security updates..."
apt-get autoremove -y
apt-get autoclean

# Configure firewall
log "Configuring UFW firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow from 10.0.0.0/16

log "Processing VM setup completed successfully!"
log "Services installed:"
log "- Docker and Docker Compose"
log "- Azure CLI"
log "- Node.js 18"
log "- Python 3 with document processing libraries"
log "- Tesseract OCR"
log "- TecSalud Processing Service (placeholder)"

# Reboot to ensure all changes take effect
log "Rebooting system to apply all changes..."
reboot 