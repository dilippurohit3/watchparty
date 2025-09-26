# 🎬 WatchParty - Modern Social Watch Party Platform

**A complete social watch party platform built with React, Node.js, and TypeScript. Transform your watch party experience with social features, real-time interactions, and a mobile-first design that brings people together through shared video experiences.**

> **⚠️ LICENSE NOTICE: This software is proprietary and confidential. Unauthorized use, modification, distribution, or commercial use is strictly prohibited and will be prosecuted to the full extent of the law.**

## 🚀 Features

### 🎵 Core Watch Party Features
- **Real-time Synchronized Playback** - Perfect sync across all users with WebSocket technology
- **Multiple Video Sources** - YouTube, file uploads, URL streaming, screen sharing
- **Advanced Room Management** - Public/private rooms, room codes, participant limits
- **Live Chat & Reactions** - Real-time messaging with emoji reactions
- **Collaborative Playlists** - Drag-and-drop reordering, shared queue management
- **DJ Controls** - Host controls, co-host system, raise hand functionality

### 🌟 Social Features
- **Social Feed** - Discover trending rooms, DJs, and popular content
- **User Profiles** - Follow system, user stats, achievement system
- **Room Discovery** - Trending, live, new, and popular room categories
- **Real-time Interactions** - Live reactions, confetti animations, social overlays
- **Mobile-First Design** - Bottom tab navigation, responsive layout, PWA support

### 🎨 Modern UI/UX
- **Dark Theme with Neon Accents** - Pink, purple, cyan color scheme
- **Glassmorphism Design** - Frosted glass effects and modern aesthetics
- **Mobile-First Responsive** - Optimized for phones with bottom tab bar
- **Reaction Animations** - Falling hearts, confetti, and interactive overlays
- **Smooth Transitions** - 60fps animations and micro-interactions

### 🔧 Technical Excellence
- **Modern Tech Stack** - React 18, TypeScript, Node.js, PostgreSQL, Redis
- **Real-time Architecture** - Socket.io for live updates and synchronization
- **Scalable Backend** - Microservices-ready with proper separation of concerns
- **Security First** - Firebase authentication, rate limiting, input validation
- **Production Ready** - Docker deployment, monitoring, error handling

## 🏗️ Architecture

```
watchparty/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── styles/         # CSS and design system
├── backend/                 # Node.js TypeScript backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── socket/         # WebSocket handlers
│   │   ├── config/         # Database and Redis config
│   │   └── utils/          # Utility functions
├── shared/                 # Shared types and utilities
├── database/              # Database schema
└── scripts/               # Deployment scripts
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite 5** - Ultra-fast build tool and dev server with HMR
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Socket.io Client** - Real-time communication
- **Framer Motion** - Animation library

### Backend
- **Node.js 20** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe development
- **Socket.io** - Real-time communication
- **PostgreSQL 15** - Primary database
- **Redis 7** - Caching and session storage
- **Firebase Auth** - Authentication
- **Multer** - File upload handling
- **Winston** - Logging

## 📋 Prerequisites

### System Requirements
- **Ubuntu 22.04 LTS** (Recommended)
- **Node.js 20+** (LTS)
- **PostgreSQL 15+** (Latest)
- **Redis 7+** (Latest)
- **Firebase project** (for authentication)
- **SSL certificate** (for production)
- **Domain name** (for production)

### External Services Required
- **Firebase Project** - For user authentication
- **Google Cloud Platform** - For VPS hosting
- **Domain Name** - For production deployment
- **YouTube API** (Optional) - For YouTube video integration

## 🚀 Quick Start

### Development Setup
```bash
# Clone the repository
git clone https://github.com/dilippurohit3/watchparty.git
cd watchparty

# Install dependencies
npm run install:all

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up the database
createdb boltzy_production
psql boltzy_production < database/schema.sql

# Start Redis server
redis-server

# Start development servers
npm run dev
```

This will start:
- **Backend server** on http://localhost:8080
- **Frontend Vite dev server** on http://localhost:3000 (with hot reload)

### Vite Development Features
- ⚡ **Ultra-fast HMR** - Instant hot module replacement
- 🔥 **Fast builds** - Optimized for development speed
- 📦 **Code splitting** - Automatic chunk optimization
- 🎯 **TypeScript support** - Full TypeScript integration
- 🔧 **Proxy configuration** - API and WebSocket proxying

## 🌐 Production Deployment on GCP Ubuntu VPS

### Step 1: Create GCP Account and Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account
   - Click "Create a project"

2. **Configure Project**
   ```
   Project name: watchparty-production
   Enable Google Analytics: Yes (recommended)
   ```

3. **Enable Billing**
   - Go to "Billing" in the left menu
   - Click "Link a billing account"
   - Add your credit card (required for verification)
   - **Estimated cost**: $20-50/month for small deployment

### Step 2: Create Ubuntu VPS Instance

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

### Step 3: Connect to Your Server

```bash
# Connect via SSH
ssh -i ~/.ssh/google_compute_engine username@34.123.45.67

# Or use Google Cloud Shell
gcloud compute ssh watchparty-server --zone=us-central1-a
```

### Step 4: Update System and Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git vim htop unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release build-essential

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 15
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Install Redis 7
sudo apt install -y redis-server redis-tools

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Step 5: Configure Services

```bash
# Start and enable services
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis-server
sudo systemctl enable redis-server
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure PostgreSQL
sudo -u postgres psql
CREATE DATABASE boltzy_production;
CREATE USER boltzy_user WITH PASSWORD 'boltzy_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE boltzy_production TO boltzy_user;
ALTER USER boltzy_user CREATEDB;
\q

# Configure Redis
sudo vim /etc/redis/redis.conf
# Find and modify these lines:
# bind 127.0.0.1
# maxmemory 512mb
# maxmemory-policy allkeys-lru
sudo systemctl restart redis-server
```

### Step 6: Set Up Firebase Authentication

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Create a project"
   - Project name: `watchparty-production`

2. **Enable Authentication**
   - Go to "Authentication" → "Sign-in method"
   - Enable "Email/Password"
   - Enable "Google" (optional)

3. **Get Web App Config**
   - Go to "Project Settings" → "Your apps"
   - Click "Add app" → Web app
   - Copy the configuration

4. **Generate Service Account Key**
   - Go to "Project Settings" → "Service accounts"
   - Click "Generate new private key"
   - Download the JSON file

### Step 7: Deploy Application

```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/dilippurohit3/watchparty.git
cd watchparty

# Install dependencies
npm run install:all

# Build application
npm run build

# Set up environment variables
cp env.example .env
vim .env
```

**Configure .env file:**
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

# File Upload Configuration
MAX_FILE_SIZE=100000000
UPLOAD_PATH=/home/boltzy/apps/watchparty/uploads

# YouTube API (Optional)
YOUTUBE_API_KEY=your-youtube-api-key
```

### Step 8: Set Up Database

```bash
# Run database schema
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql

# Create upload directory
mkdir -p uploads
chmod 755 uploads
```

### Step 9: Configure Nginx

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
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/watchparty /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Set Up Domain and SSL

1. **Configure Domain DNS**
   - Go to your domain registrar
   - Add A record: `@` → `34.123.45.67`
   - Add A record: `www` → `34.123.45.67`

2. **Get SSL Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

### Step 11: Start Application

```bash
# Start with PM2
pm2 start backend/src/server.ts --name "watchparty-backend" --interpreter ts-node
pm2 start 'npm run preview' --name "watchparty-frontend" --cwd frontend
pm2 save

# Set up PM2 startup
pm2 startup
# Follow the instructions shown
```

### Step 12: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 🎛️ Admin Dashboard

After deployment, access the admin dashboard at:
- **URL:** `https://yourdomain.com/admin`
- **Requirements:** Admin user with username `admin` or email containing `admin`

**Create Admin User:**
```bash
# Connect to database
psql -h localhost -U boltzy_user -d boltzy_production

# Create admin user
INSERT INTO users (firebase_uid, username, email, avatar_url, is_online, created_at) 
VALUES ('admin-uid-12345', 'admin', 'admin@yourdomain.com', NULL, true, NOW());

# Exit database
\q
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boltzy_production
DB_USER=boltzy_user
DB_PASSWORD=boltzy_secure_password_2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_API_KEY=your-api-key

# File Upload
MAX_FILE_SIZE=100000000
UPLOAD_PATH=./uploads

# YouTube API (Optional)
YOUTUBE_API_KEY=your-youtube-api-key
```

## 🚀 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📊 Monitoring

- **PM2** - Process management
- **Winston** - Structured logging
- **Health checks** - Application health monitoring
- **Error tracking** - Comprehensive error handling

## 🔒 Security

- **Firebase Authentication** - Secure token-based auth
- **Rate Limiting** - API rate limiting
- **Input Validation** - Request validation
- **CORS Configuration** - Cross-origin request handling
- **Security Headers** - CSP, HSTS, XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## ⚖️ License

**WATCHPARTY - PROPRIETARY SOFTWARE LICENSE**

**Copyright (c) 2024 WatchParty. All rights reserved.**

### 🚫 STRICT PROHIBITIONS

**This software is proprietary and confidential. The following activities are STRICTLY PROHIBITED:**

1. **❌ NO REUSE** - You may not reuse any part of this codebase
2. **❌ NO MODIFICATION** - You may not modify, adapt, or alter any code
3. **❌ NO DISTRIBUTION** - You may not distribute, share, or redistribute this software
4. **❌ NO COMMERCIAL USE** - You may not use this software for commercial purposes
5. **❌ NO SALE** - You may not sell, lease, or monetize this software
6. **❌ NO REVERSE ENGINEERING** - You may not reverse engineer or decompile
7. **❌ NO DERIVATIVE WORKS** - You may not create derivative works based on this software

### ✅ PERMITTED USES

**You may ONLY:**
- **✅ Personal Use** - Use this software for personal, non-commercial purposes only
- **✅ Educational Use** - Study the code for educational purposes (no copying)
- **✅ Deployment** - Deploy the application as-is for personal use

## 📚 Additional Resources

### Documentation
- [Complete Installation Guide](INSTALLATION_GUIDE.md) - Step-by-step GCP Ubuntu VPS setup
- [Vite Development Guide](VITE_GUIDE.md) - Complete Vite development and optimization
- [Ubuntu 22.04 Setup Guide](UBUNTU_22_04_SETUP.md) - Ubuntu 22.04 LTS configuration

### External Resources
- [GCP Documentation](https://cloud.google.com/docs)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)

## 📞 Support

For support and questions:
- Create an issue on GitHub: https://github.com/dilippurohit3/watchparty/issues
- Check the documentation above
- Review the code examples

---

**Built with ❤️ for bringing people together through shared video experiences.**
