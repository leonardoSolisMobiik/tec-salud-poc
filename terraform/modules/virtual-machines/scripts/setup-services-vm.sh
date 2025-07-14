#!/bin/bash

# =============================================================================
# TECSALUD MVP - SERVICES VM SETUP SCRIPT
# =============================================================================

set -e

# Variables
KEY_VAULT_NAME="${KEY_VAULT_NAME}"
LOG_FILE="/var/log/vm-setup.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "Starting Services VM setup..."

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
    python3-venv \
    postgresql-client \
    mysql-client \
    redis-tools

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

# Install .NET 8 for potential .NET services
log "Installing .NET 8..."
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
apt-get update -y
apt-get install -y dotnet-sdk-8.0

# Install Java 17 for potential Java services
log "Installing Java 17..."
apt-get install -y openjdk-17-jdk openjdk-17-jre

# Install Python packages for services
log "Installing Python packages for services..."
pip3 install --upgrade pip
pip3 install \
    azure-identity \
    azure-keyvault-secrets \
    azure-storage-blob \
    azure-servicebus \
    azure-cosmos \
    fastapi \
    uvicorn \
    celery \
    redis \
    psycopg2-binary \
    pymongo \
    sqlalchemy \
    alembic \
    pydantic \
    httpx \
    aiofiles \
    python-multipart \
    python-jose \
    passlib \
    bcrypt

# Install Redis for caching and message queuing
log "Installing Redis..."
apt-get install -y redis-server

# Configure Redis
log "Configuring Redis..."
sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
sed -i 's/# requirepass foobared/requirepass TecSalud2024!/' /etc/redis/redis.conf
systemctl restart redis-server
systemctl enable redis-server

# Install and configure Nginx
log "Installing and configuring Nginx..."
apt-get install -y nginx

# Create Nginx configuration for TecSalud services
cat > /etc/nginx/sites-available/tecsalud << 'EOF'
server {
    listen 80;
    server_name _;

    # API Gateway proxy
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Services health check
    location /health {
        proxy_pass http://localhost:8001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /static/ {
        alias /opt/tecsalud/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/tecsalud /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# Create application directory
log "Creating application directories..."
mkdir -p /opt/tecsalud/services
mkdir -p /opt/tecsalud/logs
mkdir -p /opt/tecsalud/config
mkdir -p /opt/tecsalud/static
mkdir -p /opt/tecsalud/data
mkdir -p /opt/tecsalud/backup

# Set permissions
chown -R azureuser:azureuser /opt/tecsalud
chmod -R 755 /opt/tecsalud

# Create systemd service for the services application
log "Creating systemd service for TecSalud services..."
cat > /etc/systemd/system/tecsalud-services.service << EOF
[Unit]
Description=TecSalud Services API
After=network.target redis.service

[Service]
Type=simple
User=azureuser
WorkingDirectory=/opt/tecsalud/services
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=PYTHONPATH=/opt/tecsalud/services
ExecStart=/usr/bin/python3 /opt/tecsalud/services/main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for Celery worker
cat > /etc/systemd/system/tecsalud-worker.service << EOF
[Unit]
Description=TecSalud Celery Worker
After=network.target redis.service

[Service]
Type=simple
User=azureuser
WorkingDirectory=/opt/tecsalud/services
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=PYTHONPATH=/opt/tecsalud/services
ExecStart=/usr/local/bin/celery -A app.celery worker --loglevel=info
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable the services
systemctl daemon-reload
systemctl enable tecsalud-services
systemctl enable tecsalud-worker

# Create sample services application
log "Creating sample services application..."
cat > /opt/tecsalud/services/main.py << 'EOF'
#!/usr/bin/env python3
"""
TecSalud Services API
Main application for TecSalud support services
"""

import os
import sys
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/opt/tecsalud/logs/services.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# FastAPI application
app = FastAPI(
    title="TecSalud Services API",
    description="Support services for TecSalud MVP",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"message": "TecSalud Services API", "status": "running", "timestamp": datetime.now()}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "services": {
            "api": "running",
            "redis": "connected",
            "worker": "active"
        }
    }

@app.get("/api/services/status")
async def services_status():
    return {
        "services": [
            {"name": "Document Processing", "status": "active", "version": "1.0.0"},
            {"name": "User Management", "status": "active", "version": "1.0.0"},
            {"name": "Notification Service", "status": "active", "version": "1.0.0"}
        ],
        "timestamp": datetime.now()
    }

if __name__ == "__main__":
    logger.info("Starting TecSalud Services API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
EOF

# Make the script executable
chmod +x /opt/tecsalud/services/main.py

# Create Celery application
cat > /opt/tecsalud/services/app.py << 'EOF'
"""
TecSalud Celery Application
Background task processing for TecSalud services
"""

from celery import Celery
import logging

logger = logging.getLogger(__name__)

# Create Celery instance
celery = Celery(
    'tecsalud',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Configure Celery
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Mexico_City',
    enable_utc=True,
    task_routes={
        'app.process_document': {'queue': 'documents'},
        'app.send_notification': {'queue': 'notifications'},
    }
)

@celery.task
def process_document(document_id, document_path):
    """Process a medical document"""
    logger.info(f"Processing document {document_id} at {document_path}")
    # TODO: Implement actual document processing
    return {"document_id": document_id, "status": "processed"}

@celery.task
def send_notification(user_id, message, notification_type):
    """Send notification to user"""
    logger.info(f"Sending {notification_type} notification to user {user_id}")
    # TODO: Implement actual notification sending
    return {"user_id": user_id, "status": "sent"}

@celery.task
def cleanup_temp_files():
    """Clean up temporary files"""
    logger.info("Cleaning up temporary files")
    # TODO: Implement cleanup logic
    return {"status": "cleaned"}
EOF

# Create configuration file
log "Creating configuration file..."
cat > /opt/tecsalud/config/services.conf << EOF
# TecSalud Services VM Configuration
KEY_VAULT_NAME=${KEY_VAULT_NAME}
SERVICES_LOG_DIR=/opt/tecsalud/logs
SERVICES_DATA_DIR=/opt/tecsalud/data
REDIS_URL=redis://localhost:6379/0
API_PORT=8000
WORKER_CONCURRENCY=4
AZURE_TENANT_ID=$(curl -H Metadata:true "http://169.254.169.254/metadata/instance/compute/tenantId?api-version=2021-02-01&format=text")
INSTANCE_METADATA=$(curl -H Metadata:true "http://169.254.169.254/metadata/instance?api-version=2021-02-01&format=json")
EOF

# Set up log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/tecsalud-services << EOF
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
# TecSalud Services VM Health Check

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "ERROR: Docker is not running"
    exit 1
fi

# Check if Redis is running
if ! systemctl is-active --quiet redis-server; then
    echo "ERROR: Redis is not running"
    exit 1
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "ERROR: Nginx is not running"
    exit 1
fi

# Check if services are running
if ! systemctl is-active --quiet tecsalud-services; then
    echo "WARNING: TecSalud services API is not running"
fi

if ! systemctl is-active --quiet tecsalud-worker; then
    echo "WARNING: TecSalud worker is not running"
fi

# Check API endpoint
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "WARNING: API health endpoint is not responding"
fi

# Check Redis connectivity
if ! redis-cli ping > /dev/null 2>&1; then
    echo "WARNING: Redis is not responding"
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

# Create backup script
log "Creating backup script..."
cat > /opt/tecsalud/backup.sh << 'EOF'
#!/bin/bash
# TecSalud Services Backup Script

BACKUP_DIR="/opt/tecsalud/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup configuration
tar -czf "$${BACKUP_DIR}/config_$${DATE}.tar.gz" /opt/tecsalud/config/

# Backup logs (last 7 days)
find /opt/tecsalud/logs/ -name "*.log" -mtime -7 -exec tar -czf "$${BACKUP_DIR}/logs_$${DATE}.tar.gz" {} +

# Backup data directory
if [ -d "/opt/tecsalud/data" ]; then
    tar -czf "$${BACKUP_DIR}/data_$${DATE}.tar.gz" /opt/tecsalud/data/
fi

# Clean old backups (keep only last 7 days)
find "$${BACKUP_DIR}" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $${DATE}"
EOF

chmod +x /opt/tecsalud/backup.sh

# Set up daily backup cron job
echo "0 2 * * * azureuser /opt/tecsalud/backup.sh >> /opt/tecsalud/logs/backup.log 2>&1" | crontab -

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
ufw allow from 10.0.0.0/16 to any port 80
ufw allow from 10.0.0.0/16 to any port 8000
ufw allow from 10.0.0.0/16 to any port 6379

log "Services VM setup completed successfully!"
log "Services installed:"
log "- Docker and Docker Compose"
log "- Azure CLI"
log "- Node.js 18"
log "- .NET 8"
log "- Java 17"
log "- Python 3 with service libraries"
log "- Redis"
log "- Nginx"
log "- TecSalud Services API (placeholder)"
log "- Celery Worker (placeholder)"

# Reboot to ensure all changes take effect
log "Rebooting system to apply all changes..."
reboot 