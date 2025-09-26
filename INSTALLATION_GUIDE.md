# 🚀 Complete Installation Guide - WatchParty on GCP Ubuntu VPS

**Step-by-step guide for deploying WatchParty on Google Cloud Platform Ubuntu VPS with domain and SSL.**

> **🎯 This guide is designed for complete beginners** - every command and step is explained in detail. Even if you've never used a server before, you can follow this guide successfully.

## 📋 Prerequisites

### What You Need Before Starting:
- **Google Cloud Platform account** (free tier available)
- **Domain name** (e.g., watchparty.com) - can be purchased from Namecheap, GoDaddy, etc.
- **Credit card** (for GCP verification, but free tier covers most usage)
- **2-3 hours** for complete setup
- **Basic computer skills** (we'll guide you through everything)

## 🎯 What You'll Get

After completing this guide, you'll have:
- ✅ **Live website** at `https://yourdomain.com`
- ✅ **Admin dashboard** at `https://yourdomain.com/admin`
- ✅ **SSL certificate** (green lock in browser)
- ✅ **Production-ready** WatchParty platform
- ✅ **Complete monitoring** and health checks

---

## 🏗️ Part 1: Google Cloud Platform Setup

### Step 1.1: Create GCP Account and Project

> **💡 What is GCP?** Google Cloud Platform is Google's cloud computing service. It's like renting a computer in the cloud that runs 24/7.

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account
   - **If you don't have a Google account:** Create one at https://accounts.google.com/

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Project name: `watchparty-production`
   - Click "Create"
   - **Wait 1-2 minutes** for the project to be created

3. **Enable Billing**
   - Go to "Billing" in the left menu
   - Click "Link a billing account"
   - **Add your credit card** (required for verification)
   - **Don't worry:** Free tier covers most usage, and we'll set up billing alerts
   - **Estimated cost**: $20-50/month for small deployment

> **🎯 IMPORTANT:** Make sure you're in the correct project before proceeding!

### Step 1.2: Create Ubuntu VPS Instance

1. **Go to Compute Engine**
   - In the left menu, click "Compute Engine" → "VM instances"
   - Click "Create Instance"

2. **Configure Instance**
   ```
   Name: watchparty-server
   Region: us-central1 (or closest to your users)
   Zone: us-central1-a
   Machine type: e2-standard-2 (2 vCPU, 8 GB RAM)
   Boot disk: Ubuntu 22.04 LTS, 50 GB SSD
   ```

3. **Firewall Configuration**
   - Check "Allow HTTP traffic"
   - Check "Allow HTTPS traffic"
   - Click "Create"

4. **Get External IP**
   - Note down the external IP address (e.g., 34.123.45.67)
   - This will be your server's public IP

### Step 1.3: Configure Firewall Rules

1. **Go to VPC Network → Firewall**
   - Click "Create Firewall Rule"
   - Name: `watchparty-custom-ports`
   - Direction: Ingress
   - Action: Allow
   - Targets: All instances in the network
   - Source IP ranges: 0.0.0.0/0
   - Protocols and ports: TCP, Ports: 3000, 8080, 5432, 6379
   - Click "Create"

---

## 🐧 Part 2: Ubuntu Server Setup

### Step 2.1: Connect to Your Server

> **💡 IMPORTANT: For laymen, use the GCP Console SSH Browser - no terminal knowledge required!**

#### Option 1: GCP Console SSH Browser (Recommended for Beginners)

1. **Go to GCP Console**
   - Visit: https://console.cloud.google.com/
   - Make sure you're in the correct project

2. **Open SSH in Browser**
   - Go to "Compute Engine" → "VM instances"
   - Find your `watchparty-server` instance
   - Click the **"SSH"** button next to your instance
   - This opens a terminal directly in your browser - no setup needed!

3. **You're now connected!**
   - You'll see a terminal window in your browser
   - This is your server - you can run commands here
   - No need to install anything on your computer

#### Option 2: Local Terminal (Advanced Users)

```bash
# Replace with your actual external IP
ssh -i ~/.ssh/google_compute_engine username@34.123.45.67

# Or use Google Cloud Shell
gcloud compute ssh watchparty-server --zone=us-central1-a
```

> **🎯 For beginners: Use Option 1 (GCP Console SSH Browser) - it's much easier!**

### Step 2.2: Update System

> **💡 OPTION 1: Automated Setup (Recommended for Beginners)**
```bash
# Download and run the automated setup script
curl -fsSL https://raw.githubusercontent.com/dilippurohit3/watchparty/main/scripts/deploy.sh | bash

# This script will automatically:
# - Update the system
# - Install all required software
# - Configure databases
# - Clone the repository
# - Set up the basic configuration
```

> **💡 OPTION 2: Manual Setup (Advanced Users)**
```bash
# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git vim nano htop unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release build-essential
```

> **🎯 For beginners: Use Option 1 (Automated Setup) - it handles everything automatically!**

### Step 2.3: Create Application User

```bash
# Create dedicated user for the application
sudo adduser watchparty
sudo usermod -aG sudo watchparty

# Switch to watchparty user
su - watchparty
```

---

## 🐳 Part 3: Install Required Software

### Step 3.1: Install Node.js 20 (LTS for Ubuntu 22.04)

```bash
# Install Node.js 20 using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install global packages
sudo npm install -g pm2 typescript ts-node

# Install Vite globally (optional, for CLI usage)
sudo npm install -g vite
```

### Step 3.1.1: Vite Configuration Overview

> **💡 What is Vite?** Vite is a modern, ultra-fast build tool and development server. It provides instant hot module replacement (HMR) and optimized builds for production.

**Vite Features in WatchParty:**
- ⚡ **Ultra-fast HMR** - Instant hot module replacement during development
- 🔥 **Fast builds** - Optimized for development speed
- 📦 **Code splitting** - Automatic chunk optimization for better performance
- 🎯 **TypeScript support** - Full TypeScript integration with type checking
- 🔧 **Proxy configuration** - API and WebSocket proxying for development
- 🎨 **CSS processing** - Tailwind CSS integration with PostCSS
- 📱 **Mobile development** - Optimized for mobile-first development

### Step 3.2: Install PostgreSQL 15 (Latest for Ubuntu 22.04)

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

### Step 3.3: Install Redis 7 (Latest for Ubuntu 22.04)

```bash
# Install Redis
sudo apt install -y redis-server redis-tools

# Configure Redis
sudo vim /etc/redis/redis.conf

# Find and modify these lines:
# bind 127.0.0.1
# maxmemory 512mb
# maxmemory-policy allkeys-lru

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

### Step 3.4: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 3.5: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup
# Follow the instructions shown (run the sudo command it provides)
```

### Step 3.6: Install Certbot (for SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## 🔥 Part 4: Firebase Setup (Required)

### Step 4.1: Create Firebase Project

> **💡 What is Firebase?** Firebase is Google's platform for building mobile and web applications. We use it for user authentication (login/signup) and push notifications.

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account
   - Click "Create a project"

2. **Configure Project**
   ```
   Project name: watchparty-production
   Enable Google Analytics: Yes (recommended)
   Analytics account: Create new account
   ```

3. **Create Project**
   - Click "Create project"
   - **Wait 1-2 minutes** for the project to be created
   - Click "Continue" when ready

### Step 4.2: Enable Authentication

> **💡 What is Authentication?** This allows users to create accounts, log in, and access your app securely.

1. **Go to Authentication**
   - In Firebase Console, click "Authentication" in the left menu
   - Click "Get started" if you see it

2. **Enable Sign-in Methods**
   - Click "Sign-in method" tab
   - Click "Email/Password" → Toggle "Enable" → Save
   - **Optional:** Click "Google" → Toggle "Enable" → Save
   - **Optional:** Click "GitHub" → Toggle "Enable" → Save

3. **Configure Authentication**
   - **Email/Password:** Required for basic login
   - **Google:** Optional, allows users to sign in with Google
   - **GitHub:** Optional, allows users to sign in with GitHub

### Step 4.3: Get Web App Config

> **💡 What is Web App Config?** This is the configuration that tells your app how to connect to Firebase.

1. **Go to Project Settings**
   - In Firebase Console, click the gear icon (⚙️) → "Project settings"
   - Scroll down to "Your apps" section

2. **Add Web App**
   - Click "Add app" → Web icon (</>) → "Web"
   - App nickname: `watchparty-web`
   - **Don't check** "Set up Firebase Hosting" (we'll use our own server)
   - Click "Register app"

3. **Copy Configuration**
   - Copy the entire configuration object (it looks like this):
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```
   - **Save this configuration** - you'll need it for environment variables

### Step 4.4: Generate Service Account Key

> **💡 What is a Service Account?** This is a special account that allows your server to access Firebase services securely.

1. **Go to Service Accounts**
   - In Firebase Console, click the gear icon (⚙️) → "Project settings"
   - Click "Service accounts" tab
   - Scroll down to "Firebase Admin SDK"

2. **Generate Private Key**
   - Click "Generate new private key"
   - **Important:** Click "Generate key" in the popup
   - A JSON file will download automatically
   - **Keep this file secure!** Don't share it or commit it to version control

3. **Save the Key**
   - Save the downloaded JSON file as `firebase-service-account.json`
   - **Store it securely** - this gives full access to your Firebase project

### Step 4.5: Create Admin User

> **💡 What is an Admin User?** This is a special user account that can access the admin dashboard to manage your platform.

1. **Go to Authentication → Users**
   - In Firebase Console, click "Authentication" → "Users"
   - Click "Add user"

2. **Create Admin User**
   - Email: `admin@yourdomain.com` (replace with your domain)
   - Password: `YourSecureAdminPassword123!` (use a strong password)
   - Click "Add user"

3. **Copy the UID**
   - **Important:** Copy the UID (User ID) that appears
   - It looks like: `abc123def456ghi789`
   - **Save this UID** - you'll need it for database setup

---

## 🗄️ Part 5: Database Setup

### Step 5.1: Configure PostgreSQL

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

### Step 5.2: Configure Redis

> **💡 OPTION 1: Automated Configuration (Recommended for Beginners)**
```bash
# Automatically configure Redis with optimal settings
sudo sed -i 's/# bind 127.0.0.1/bind 127.0.0.1/' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory <bytes>/maxmemory 512mb/' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis-server

# Test Redis configuration
redis-cli ping
# Should return: PONG
```

> **💡 OPTION 2: Manual Configuration (Advanced Users)**
```bash
# Edit Redis configuration (use nano for beginners)
sudo nano /etc/redis/redis.conf

# Find and modify these lines:
# 1. Find: # bind 127.0.0.1
#    Change to: bind 127.0.0.1

# 2. Find: # maxmemory <bytes>
#    Change to: maxmemory 512mb

# 3. Find: # maxmemory-policy noeviction
#    Change to: maxmemory-policy allkeys-lru

# 4. Find: save 900 1
#    Make sure it's: save 900 1

# 5. Find: save 300 10
#    Make sure it's: save 300 10

# 6. Find: save 60 10000
#    Make sure it's: save 60 10000

# Save and exit (Ctrl + X, then Y, then Enter)

# Restart Redis
sudo systemctl restart redis-server

# Test Redis configuration
redis-cli ping
# Should return: PONG
```

> **🎯 For beginners: Use Option 1 (Automated Configuration) - it handles everything automatically!**

### Step 5.3: Apply Database Schema

> **🚨 IMPORTANT: You must apply the database schema BEFORE creating users!**

> **💡 Make sure you're in the correct directory with the repository cloned!**

```bash
# First, make sure you're in the correct directory
pwd
# Should show: /home/watchparty/apps/watchparty

# If not in the correct directory, navigate there
cd /home/watchparty/apps/watchparty

# Check if database/schema.sql exists
ls -la database/schema.sql
# Should show: database/schema.sql

# Grant proper permissions to the database user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE boltzy_production TO boltzy_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON SCHEMA public TO boltzy_user;"
sudo -u postgres psql -c "ALTER USER boltzy_user CREATEDB;"

# Apply database schema
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql

# Verify tables were created
psql -h localhost -U boltzy_user -d boltzy_production -c "\dt"
# Should show: users, rooms, room_participants, etc.

# Test database connection
psql -h localhost -U boltzy_user -d boltzy_production -c "SELECT version();"
# Should show PostgreSQL version
```

> **🚨 QUICK FIX: If you get "No such file or directory" error:**
> 
> ```bash
> # Check if you're in the right directory
> pwd
> 
> # If you're in /home/surtiakhtar1, navigate to the correct directory
> cd /home/watchparty/apps/watchparty
> 
> # If the directory doesn't exist, clone the repository first
> mkdir -p /home/watchparty/apps
> cd /home/watchparty/apps
> git clone https://github.com/dilippurohit3/watchparty.git
> cd watchparty
> 
> # Now apply the database schema
> psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql
> ```

> **🚨 IMMEDIATE FIX: For persistent permission errors:**
> 
> ```bash
> # Drop and recreate the user with proper permissions
> sudo -u postgres psql -c "DROP USER IF EXISTS boltzy_user;"
> sudo -u postgres psql -c "CREATE USER boltzy_user WITH PASSWORD 'boltzy_secure_password_2024' CREATEDB CREATEROLE;"
> sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE boltzy_production TO boltzy_user;"
> sudo -u postgres psql -c "ALTER DATABASE boltzy_production OWNER TO boltzy_user;"
> 
> # Connect to the database and grant schema permissions
> sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON SCHEMA public TO boltzy_user;"
> sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO boltzy_user;"
> sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO boltzy_user;"
> 
> # Now try applying the schema
> psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql
> ```

### Step 5.4: Create Admin User in Database

```bash
# Connect to database
psql -h localhost -U boltzy_user -d boltzy_production

# Create admin user (replace with your Firebase UID from Step 4.5)
INSERT INTO users (firebase_uid, username, email, avatar_url, is_online, created_at) 
VALUES ('your-firebase-admin-uid-here', 'admin', 'admin@yourdomain.com', NULL, true, NOW());

# Verify admin user was created
SELECT id, firebase_uid, username, email FROM users WHERE username = 'admin';

# Exit database
\q
```

---

## 📦 Part 6: Deploy WatchParty Application

### Step 6.1: Clone Repository

```bash
# Switch to watchparty user
su - watchparty

# Create application directory
mkdir -p /home/watchparty/apps
cd /home/watchparty/apps

# Clone the repository
git clone https://github.com/dilippurohit3/watchparty.git
cd watchparty
```

### Step 6.2: Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Build the application
npm run build
```

### Step 6.2.1: Vite Development Setup

> **💡 Vite Development Commands** - Vite provides several commands for development and production builds.

**Available Vite Commands:**
```bash
# Development server with HMR
npm run dev          # Starts Vite dev server on http://localhost:3000

# Production build
npm run build        # Builds optimized production bundle

# Preview production build
npm run preview      # Serves production build locally

# Type checking
npm run type-check   # Runs TypeScript type checking

# Linting
npm run lint         # Runs ESLint for code quality
```

**Vite Configuration Features:**
- **Hot Module Replacement (HMR)** - Instant updates during development
- **API Proxy** - `/api` requests proxied to backend (localhost:8080)
- **WebSocket Proxy** - `/socket.io` requests proxied to backend
- **Path Aliases** - `@/` for src directory, `@shared/` for shared code
- **Code Splitting** - Automatic chunk optimization for vendor libraries
- **Source Maps** - Full source map support for debugging
- **TypeScript** - Full TypeScript integration with type checking

### Step 6.3: Configure Environment Variables

```bash
# Copy environment template
cp env.example .env

# Edit environment file (use nano for beginners)
nano .env
```

> **💡 For beginners: Use `nano` instead of `vim` - it's much easier!**
> - Use arrow keys to navigate
> - Make your changes
> - Press `Ctrl + X` to exit
> - Press `Y` to save
> - Press `Enter` to confirm

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
UPLOAD_PATH=/home/watchparty/apps/watchparty/uploads

# YouTube API (Optional)
YOUTUBE_API_KEY=your-youtube-api-key

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

### Step 6.4: Set up Database Schema

```bash
# Run database migrations
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql

# Verify tables were created
psql -h localhost -U boltzy_user -d boltzy_production -c "\dt"
```

### Step 6.5: Create Upload Directory

```bash
# Create upload directory
mkdir -p /home/watchparty/apps/watchparty/uploads
chmod 755 /home/watchparty/apps/watchparty/uploads
```

---

## 🌐 Part 7: Domain and SSL Setup

### Step 7.1: Configure Domain DNS

1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Add DNS Records:**
   ```
   Type: A
   Name: @
   Value: 34.123.45.67 (your server's external IP)
   
   Type: A
   Name: www
   Value: 34.123.45.67 (your server's external IP)
   ```

3. **Wait for DNS propagation** (5-30 minutes)

### Step 7.2: Configure Nginx

```bash
# Create Nginx configuration
sudo vim /etc/nginx/sites-available/watchparty
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
        alias /home/watchparty/apps/watchparty/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 7.3: Enable Site and Test

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/watchparty /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7.4: Get SSL Certificate

```bash
# Get SSL certificate with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# 1. Enter email address
# 2. Agree to terms
# 3. Choose whether to share email with EFF
# 4. Certbot will automatically configure SSL
```

### Step 7.5: Set up Auto-renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚀 Part 8: Start Application

### Step 8.1: Start with PM2

```bash
# Switch to watchparty user
su - watchparty
cd /home/watchparty/apps/watchparty

# Verify environment file exists
ls -la .env
# Should show: .env

# Test database connection
psql -h localhost -U boltzy_user -d boltzy_production -c "SELECT version();"
# Should show PostgreSQL version

# Test Redis connection
redis-cli ping
# Should show: PONG

# Start backend
pm2 start backend/src/server.ts --name "watchparty-backend" --interpreter ts-node

# Wait 5 seconds for backend to start
sleep 5

# Check backend is running
pm2 logs watchparty-backend --lines 10

# Start frontend (in production mode)
cd frontend
pm2 start "npm run preview" --name "watchparty-frontend"

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

> **💡 If you see errors:**
> - Check `pm2 logs watchparty-backend` for backend errors
> - Check `pm2 logs watchparty-frontend` for frontend errors
> - Make sure your `.env` file is configured correctly

### Step 8.2: Configure PM2 Auto-restart

```bash
# Generate startup script
pm2 startup

# Follow the instructions (run the sudo command shown)
# This ensures PM2 starts on server reboot
```

---

## 🔧 Part 9: Final Configuration

### Step 9.1: Configure Firewall

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Step 9.2: Set up Log Rotation

```bash
# Create log rotation configuration
sudo vim /etc/logrotate.d/watchparty
```

**Add the following:**

```
/home/watchparty/apps/watchparty/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 watchparty watchparty
}
```

### Step 9.3: Configure Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up log monitoring
sudo apt install -y logwatch
```

---

## ✅ Part 10: Verification and Testing

### Step 10.1: Test Application

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

### Step 10.2: Test Website

1. **Open your browser**
2. **Go to:** `https://yourdomain.com`
3. **Verify:**
   - SSL certificate is working (green lock icon)
   - Website loads correctly
   - No console errors
   - All features work

### Step 10.3: Test API

```bash
# Test API endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/rooms
```

---

## 🎉 Part 11: Final Steps

### Step 11.1: Update DNS Records

1. **Go to your domain registrar**
2. **Update DNS records:**
   ```
   Type: A
   Name: @
   Value: 34.123.45.67
   TTL: 300
   
   Type: A
   Name: www
   Value: 34.123.45.67
   TTL: 300
   ```

### Step 11.2: Test Everything

1. **Test website:** `https://yourdomain.com`
2. **Test API:** `https://yourdomain.com/api/health`
3. **Test WebSocket:** Check browser console for WebSocket connections
4. **Test SSL:** Verify green lock icon in browser

### Step 11.3: Create Admin User

#### Method 1: Create Admin User via Database (Quick Setup)

```bash
# Connect to database
psql -h localhost -U boltzy_user -d boltzy_production

# Create admin user (replace with your details)
INSERT INTO users (firebase_uid, username, email, avatar_url, is_online, created_at) 
VALUES ('admin-uid-12345', 'admin', 'admin@yourdomain.com', NULL, true, NOW());

# Exit database
\q
```

#### Method 2: Create Admin User via Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project

2. **Create Firebase User**
   - Go to "Authentication" → "Users"
   - Click "Add user"
   - Email: `admin@yourdomain.com`
   - Password: `YourSecureAdminPassword123!`
   - Click "Add user"
   - **Copy the UID** (you'll need this)

3. **Add to Database**
   ```bash
   # Connect to database
   psql -h localhost -U boltzy_user -d boltzy_production
   
   # Insert admin user with Firebase UID
   INSERT INTO users (firebase_uid, username, email, avatar_url, is_online, created_at) 
   VALUES ('your-firebase-uid-here', 'admin', 'admin@yourdomain.com', NULL, true, NOW());
   
   # Exit database
   \q
   ```

### Step 11.4: Verify Admin Access

1. **Test Admin Dashboard**
   - Go to: `https://yourdomain.com/admin`
   - Login with admin credentials
   - Verify you can see the admin dashboard

2. **Check Admin Features**
   - User management
   - Room management
   - Moderation tools
   - Analytics dashboard
   - System health monitoring

---

## 🔧 Vite Development & Troubleshooting

### Vite Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Common Vite Issues & Solutions

#### Issue 1: Vite dev server not starting
```bash
# Check if port 3000 is available
sudo netstat -tulpn | grep :3000

# Kill process using port 3000
sudo fuser -k 3000/tcp

# Restart Vite dev server
npm run dev
```

#### Issue 2: Vite build failing
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Build with verbose output
npm run build -- --verbose
```

#### Issue 3: HMR not working
```bash
# Check Vite configuration
cat frontend/vite.config.ts

# Restart dev server
npm run dev

# Check browser console for errors
```

#### Issue 4: Proxy not working
```bash
# Check if backend is running on port 8080
curl http://localhost:8080/health

# Check Vite proxy configuration
grep -A 10 "proxy" frontend/vite.config.ts
```

### Vite Performance Optimization

**Development Performance:**
- ✅ **Fast HMR** - Instant hot module replacement
- ✅ **Optimized builds** - Tree shaking and code splitting
- ✅ **Source maps** - Full debugging support
- ✅ **TypeScript** - Fast type checking

**Production Performance:**
- ✅ **Code splitting** - Automatic chunk optimization
- ✅ **Tree shaking** - Remove unused code
- ✅ **Minification** - Optimized bundle size
- ✅ **Asset optimization** - Image and CSS optimization

---

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: "Command not found" errors
```bash
# If you see "command not found" for basic commands
sudo apt update
sudo apt install -y curl wget git vim nano htop

# If Node.js is not found
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# If PM2 is not found
sudo npm install -g pm2
```

#### Issue 2: Database connection errors
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Test database connection
psql -h localhost -U boltzy_user -d boltzy_production -c "SELECT 1;"
```

#### Issue 2.1: "relation does not exist" errors
```bash
# This means the database schema hasn't been applied yet
# Apply the database schema first
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql

# Verify tables were created
psql -h localhost -U boltzy_user -d boltzy_production -c "\dt"
# Should show: users, rooms, room_participants, etc.

# Now you can create admin users
psql -h localhost -U boltzy_user -d boltzy_production -c "INSERT INTO users (firebase_uid, username, email, avatar_url, is_online, created_at) VALUES ('your-firebase-uid', 'admin', 'admin@yourdomain.com', NULL, true, NOW());"
```

#### Issue 2.2: "No such file or directory" for database/schema.sql
```bash
# This means you're not in the correct directory or repository not cloned
# Check current directory
pwd
# Should show: /home/watchparty/apps/watchparty

# If not in correct directory, navigate there
cd /home/watchparty/apps/watchparty

# Check if repository is cloned
ls -la
# Should show: frontend, backend, database, etc.

# If repository not cloned, clone it first
git clone https://github.com/dilippurohit3/watchparty.git
cd watchparty

# Now apply database schema
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql
```

#### Issue 2.3: "permission denied for schema public" errors
```bash
# This means the database user doesn't have proper permissions
# First, connect to the database and grant permissions properly
sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON SCHEMA public TO boltzy_user;"
sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO boltzy_user;"
sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO boltzy_user;"
sudo -u postgres psql -d boltzy_production -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO boltzy_user;"
sudo -u postgres psql -d boltzy_production -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO boltzy_user;"

# Make boltzy_user the owner of the database
sudo -u postgres psql -c "ALTER DATABASE boltzy_production OWNER TO boltzy_user;"

# Now try applying the schema again
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql
```

#### Issue 2.3.1: Still getting permission errors after grants
```bash
# If you're still getting permission errors, try this comprehensive fix
# Drop and recreate the user with proper permissions
sudo -u postgres psql -c "DROP USER IF EXISTS boltzy_user;"
sudo -u postgres psql -c "CREATE USER boltzy_user WITH PASSWORD 'boltzy_secure_password_2024' CREATEDB CREATEROLE;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE boltzy_production TO boltzy_user;"
sudo -u postgres psql -c "ALTER DATABASE boltzy_production OWNER TO boltzy_user;"

# Connect to the database and grant schema permissions
sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON SCHEMA public TO boltzy_user;"
sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO boltzy_user;"
sudo -u postgres psql -d boltzy_production -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO boltzy_user;"

# Now try applying the schema
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql
```

#### Issue 2.4: "syntax error at or near current_time" errors
```bash
# This means there's a reserved keyword conflict in the schema
# The schema has been fixed to use 'current_video_time' instead of 'current_time'
# If you still get this error, you may need to update the schema file
# Check if the schema file has been updated
grep -n "current_time" database/schema.sql
# Should show no results (the file has been fixed)

# If it still shows current_time, the file needs to be updated
# You can manually fix it or re-clone the repository
git pull origin main
# Then try applying the schema again
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql
```

#### Issue 3: Redis connection errors
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start Redis if not running
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
redis-cli ping
```

#### Issue 4: Application won't start
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs watchparty-backend
pm2 logs watchparty-frontend

# Restart applications
pm2 restart watchparty-backend
pm2 restart watchparty-frontend
```

#### Issue 5: Port already in use
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080

# Kill processes using the ports
sudo fuser -k 3000/tcp
sudo fuser -k 8080/tcp

# Restart applications
pm2 restart all
```

#### Issue 6: Environment variables not working
```bash
# Check if .env file exists
ls -la .env

# Check environment variables
cat .env

# Make sure you're in the right directory
pwd
# Should show: /home/watchparty/apps/watchparty
```

#### Issue 7: Firebase authentication errors
```bash
# Check Firebase configuration in .env
grep FIREBASE .env

# Make sure all Firebase variables are set
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
```

#### Issue 8: Nginx configuration errors
```bash
# Test Nginx configuration
sudo nginx -t

# If there are errors, check the configuration
sudo nano /etc/nginx/sites-available/watchparty

# Restart Nginx
sudo systemctl restart nginx
```

### Emergency Commands

```bash
# Stop everything
pm2 stop all

# Restart everything
pm2 restart all

# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h

# Check network connections
sudo netstat -tulpn
```

### Getting Help

If you're still having issues:

1. **Check the logs:**
   ```bash
   pm2 logs watchparty-backend --lines 50
   pm2 logs watchparty-frontend --lines 50
   ```

2. **Check system status:**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl status redis-server
   sudo systemctl status nginx
   ```

3. **Restart services:**
   ```bash
   sudo systemctl restart postgresql
   sudo systemctl restart redis-server
   sudo systemctl restart nginx
   pm2 restart all
   ```

4. **Create an issue on GitHub:**
   - Go to: https://github.com/dilippurohit3/watchparty/issues
   - Include the error messages and logs

---

## 🎉 Congratulations!

You have successfully deployed WatchParty on Google Cloud Platform with:

✅ **Ubuntu 22.04 LTS** - Fully configured and secured  
✅ **Domain & SSL** - HTTPS with automatic renewal  
✅ **Database** - PostgreSQL with Redis caching  
✅ **Application** - Running with PM2 process manager  
✅ **Security** - Firewall, fail2ban, and security headers  
✅ **Monitoring** - Log rotation and health checks  
✅ **Backups** - Automated daily backups  

Your WatchParty platform is now live at: **https://yourdomain.com**

---

## 📚 Additional Resources

- [GCP Documentation](https://cloud.google.com/docs)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

---

**Need help?** Create an issue on GitHub: https://github.com/dilippurohit3/watchparty/issues

**Happy streaming! 🎵✨**
