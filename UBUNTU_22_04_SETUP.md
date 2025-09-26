# 🐧 Ubuntu 22.04 LTS Setup Guide

**Complete step-by-step guide for setting up Boltzy on Ubuntu 22.04 LTS with all dependencies and optimizations.**

> **🎯 This guide is specifically designed for Ubuntu 22.04 LTS** - the latest LTS version with long-term support until 2027.

> **⚠️ LICENSE NOTICE: This software is proprietary and confidential. Unauthorized use, modification, distribution, or commercial use is strictly prohibited and will be prosecuted to the full extent of the law.**

## 📋 System Requirements

### Minimum Requirements
- **OS:** Ubuntu 22.04 LTS (64-bit)
- **RAM:** 4GB (8GB recommended)
- **Storage:** 20GB free space (50GB recommended)
- **CPU:** 2 cores (4 cores recommended)
- **Network:** Stable internet connection

### Recommended Requirements
- **OS:** Ubuntu 22.04 LTS (64-bit)
- **RAM:** 8GB or more
- **Storage:** 50GB SSD
- **CPU:** 4 cores or more
- **Network:** High-speed internet connection

## 🚀 Quick Installation (Automated)

### Option 1: Automated Script (Recommended)

```bash
# Download and run the automated setup script
curl -fsSL https://raw.githubusercontent.com/dilippurohit3/cpanel-watchparty/main/scripts/deploy.sh | bash

# Follow the post-installation steps below
```

### Option 2: Manual Installation

Follow the detailed steps below for manual installation.

## 🔧 Manual Installation Steps

### Step 1: Update System

```bash
# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git vim htop unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release build-essential
```

### Step 2: Install Node.js 20 (LTS)

```bash
# Install Node.js 20 using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install global packages
sudo npm install -g pm2 typescript ts-node
```

### Step 3: Install PostgreSQL 15

```bash
# Add PostgreSQL repository
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Update and install PostgreSQL
sudo apt update
sudo apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql -c "SELECT version();"
```

### Step 4: Install Redis 7

```bash
# Install Redis
sudo apt install -y redis-server redis-tools

# Configure Redis
sudo vim /etc/redis/redis.conf

# Find and modify these lines:
# bind 127.0.0.1 ::1
# maxmemory 512mb
# maxmemory-policy allkeys-lru

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

### Step 5: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 6: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup
# Follow the instructions shown (run the sudo command it provides)
```

### Step 7: Install Certbot (for SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

## 🗄️ Database Setup

### Step 1: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE boltzy_production;
CREATE USER boltzy_user WITH PASSWORD 'boltzy_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE boltzy_production TO boltzy_user;
ALTER USER boltzy_user CREATEDB;

# Exit PostgreSQL
\q
```

### Step 2: Configure Redis

```bash
# Edit Redis configuration
sudo vim /etc/redis/redis.conf

# Find and modify these lines:
bind 127.0.0.1
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis-server
```

## 📦 Application Setup

### Step 1: Clone Repository

```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone the repository
git clone https://github.com/dilippurohit3/cpanel-watchparty.git
cd cpanel-watchparty
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Build the application
npm run build
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit environment file
vim .env
```

**Configure the following variables:**

```bash
# Server Configuration
NODE_ENV=production
PORT=8080
FRONTEND_URL=https://yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boltzy_production
DB_USER=boltzy_user
DB_PASSWORD=boltzy_secure_password_2024

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_characters
JWT_EXPIRES_IN=24h

# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_API_KEY=your-api-key
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# Security Configuration
SECURITY_HEADERS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
WEBSOCKET_RATE_LIMIT=10
MAX_MESSAGE_LENGTH=1000
MAX_ROOM_NAME_LENGTH=100
MAX_USERNAME_LENGTH=20

# File Upload Configuration
MAX_FILE_SIZE=100000000
UPLOAD_PATH=/home/boltzy/apps/cpanel-watchparty/uploads

# YouTube API (Optional)
YOUTUBE_API_KEY=your-youtube-api-key
```

### Step 4: Set up Database Schema

```bash
# Run database migrations
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql

# Verify tables were created
psql -h localhost -U boltzy_user -d boltzy_production -c "\dt"
```

### Step 5: Create Upload Directory

```bash
# Create upload directory
mkdir -p uploads
chmod 755 uploads
```

## 🌐 Nginx Configuration

### Step 1: Create Nginx Configuration

```bash
# Create Nginx configuration
sudo vim /etc/nginx/sites-available/boltzy
```

**Add the following configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be added by Certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static {
        alias /home/boltzy/apps/cpanel-watchparty/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 2: Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/boltzy /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 SSL Certificate Setup

### Step 1: Get SSL Certificate

```bash
# Get SSL certificate with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# 1. Enter email address
# 2. Agree to terms
# 3. Choose whether to share email with EFF
# 4. Certbot will automatically configure SSL
```

### Step 2: Set up Auto-renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Start Application

### Step 1: Start with PM2

```bash
# Start backend
pm2 start backend/src/server.ts --name "boltzy-backend" --interpreter ts-node

# Start frontend (in production mode)
cd frontend
pm2 start "npm run preview" --name "boltzy-frontend"

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

### Step 2: Configure PM2 Auto-restart

```bash
# Generate startup script
pm2 startup

# Follow the instructions (run the sudo command shown)
# This ensures PM2 starts on server reboot
```

## 🔧 Security Configuration

### Step 1: Configure Firewall

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Step 2: Configure Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure Fail2Ban
sudo vim /etc/fail2ban/jail.local
```

**Add the following:**

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
```

```bash
# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

## 📊 Monitoring Setup

### Step 1: Set up Log Rotation

```bash
# Create log rotation configuration
sudo vim /etc/logrotate.d/boltzy
```

**Add the following:**

```
/home/boltzy/apps/cpanel-watchparty/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 boltzy boltzy
}
```

### Step 2: Set up Health Checks

```bash
# Create health check script
sudo vim /home/boltzy/health_check.sh
```

**Add the following:**

```bash
#!/bin/bash
# Health check script for Boltzy

# Check if services are running
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is not running"
    exit 1
fi

if ! systemctl is-active --quiet postgresql; then
    echo "PostgreSQL is not running"
    exit 1
fi

if ! systemctl is-active --quiet redis-server; then
    echo "Redis is not running"
    exit 1
fi

if ! pm2 status | grep -q "online"; then
    echo "PM2 processes are not running"
    exit 1
fi

echo "All services are running"
exit 0
```

```bash
# Make executable
chmod +x /home/boltzy/health_check.sh

# Add to crontab for every 5 minutes
crontab -e

# Add this line:
*/5 * * * * /home/boltzy/health_check.sh
```

## ✅ Verification

### Step 1: Test Application

1. **Check if services are running:**
   ```bash
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status postgresql
   sudo systemctl status redis-server
   ```

2. **Test database connection:**
   ```bash
   psql -h localhost -U boltzy_user -d boltzy_production -c "SELECT version();"
   ```

3. **Test Redis:**
   ```bash
   redis-cli ping
   ```

### Step 2: Test Website

1. **Open your browser**
2. **Go to:** `https://yourdomain.com`
3. **Verify:**
   - SSL certificate is working (green lock icon)
   - Website loads correctly
   - No console errors
   - All features work

### Step 3: Test API

```bash
# Test API endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/rooms
```

## 🆘 Troubleshooting

### Common Issues

#### Issue 1: Website not loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

#### Issue 2: Database connection failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Test connection
psql -h localhost -U boltzy_user -d boltzy_production
```

#### Issue 3: PM2 processes not starting
```bash
# Check PM2 logs
pm2 logs

# Restart all processes
pm2 restart all

# Check system resources
htop
```

## 🎉 Success!

You have successfully set up Boltzy on Ubuntu 22.04 LTS with:

✅ **Ubuntu 22.04 LTS** - Latest LTS version  
✅ **Node.js 20** - Latest LTS version  
✅ **PostgreSQL 15** - Latest version  
✅ **Redis 7** - Latest version  
✅ **Nginx** - Web server with SSL  
✅ **PM2** - Process manager  
✅ **Security** - Firewall and fail2ban  
✅ **Monitoring** - Health checks and log rotation  

Your Boltzy platform is now ready for production use!

## 📚 Additional Resources

- [Ubuntu 22.04 LTS Documentation](https://ubuntu.com/server/docs)
- [Node.js 20 Documentation](https://nodejs.org/docs)
- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)
- [Redis 7 Documentation](https://redis.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

**Need help?** Check the TROUBLESHOOTING.md guide or create an issue on GitHub.

**Happy streaming! 🎵✨**
