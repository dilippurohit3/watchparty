# ✅ WatchParty Deployment Checklist

**Complete validation checklist to ensure layman can deploy without errors on GCP Ubuntu VPS.**

## 🎯 Pre-Deployment Checklist

### ✅ GCP Account Setup
- [ ] **GCP Account Created** - Google Cloud Platform account with billing enabled
- [ ] **Project Created** - Project named `watchparty-production`
- [ ] **Billing Enabled** - Credit card added and billing account linked
- [ ] **Correct Project Selected** - Make sure you're in the right project

### ✅ Domain Setup (Optional but Recommended)
- [ ] **Domain Purchased** - From Namecheap, GoDaddy, or similar
- [ ] **DNS Access** - Access to domain DNS settings
- [ ] **Domain Ready** - Domain is active and accessible

## 🚀 GCP VPS Setup Checklist

### ✅ VM Instance Creation
- [ ] **Instance Created** - VM instance named `watchparty-server`
- [ ] **Ubuntu 22.04 LTS** - Boot disk is Ubuntu 22.04 LTS
- [ ] **Machine Type** - e2-standard-2 (2 vCPU, 8 GB RAM)
- [ ] **Firewall Rules** - HTTP and HTTPS traffic allowed
- [ ] **External IP** - Note down the external IP address

### ✅ SSH Connection
- [ ] **GCP Console SSH** - Use browser-based SSH (recommended for beginners)
- [ ] **Connection Successful** - Can run commands in terminal
- [ ] **User Permissions** - Can run `sudo` commands

## 🐧 Ubuntu Server Setup Checklist

### ✅ System Update
- [ ] **System Updated** - `sudo apt update && sudo apt upgrade -y`
- [ ] **Essential Packages** - curl, wget, git, nano, htop installed
- [ ] **Build Tools** - build-essential, python3, make, g++ installed

### ✅ Node.js 20 Installation
- [ ] **NodeSource Repository** - Added Node.js 20 repository
- [ ] **Node.js Installed** - `node --version` shows v20.x.x
- [ ] **npm Installed** - `npm --version` shows 10.x.x
- [ ] **PM2 Installed** - `sudo npm install -g pm2`

### ✅ PostgreSQL 15 Installation
- [ ] **PostgreSQL Repository** - Added PostgreSQL 15 repository
- [ ] **PostgreSQL Installed** - `sudo apt install postgresql-15`
- [ ] **Service Running** - `sudo systemctl status postgresql`
- [ ] **Database Created** - `boltzy_production` database exists
- [ ] **User Created** - `boltzy_user` with password `boltzy_secure_password_2024`
- [ ] **Permissions Set** - User has all privileges on database

### ✅ Redis 7 Installation
- [ ] **Redis Installed** - `sudo apt install redis-server`
- [ ] **Service Running** - `sudo systemctl status redis-server`
- [ ] **Configuration Set** - maxmemory 512mb, maxmemory-policy allkeys-lru
- [ ] **Connection Test** - `redis-cli ping` returns PONG

### ✅ Nginx Installation
- [ ] **Nginx Installed** - `sudo apt install nginx`
- [ ] **Service Running** - `sudo systemctl status nginx`
- [ ] **Firewall Configured** - Ports 80 and 443 open

### ✅ Certbot Installation
- [ ] **Certbot Installed** - `sudo apt install certbot python3-certbot-nginx`
- [ ] **Ready for SSL** - Can generate SSL certificates

## 📦 Application Setup Checklist

### ✅ Repository Setup
- [ ] **Repository Cloned** - `git clone https://github.com/dilippurohit3/watchparty.git`
- [ ] **Correct Directory** - In `/home/watchparty/apps/watchparty/`
- [ ] **Dependencies Installed** - `npm run install:all` completed successfully
- [ ] **Build Successful** - `npm run build` completed without errors

### ✅ Environment Configuration
- [ ] **Environment File** - `.env` file created from `env.example`
- [ ] **Database Config** - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD set
- [ ] **Redis Config** - REDIS_HOST, REDIS_PORT set
- [ ] **Firebase Config** - All Firebase variables configured
- [ ] **Server Config** - NODE_ENV=production, PORT=8080, FRONTEND_URL set

### ✅ Database Schema
- [ ] **Schema Applied** - `psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql`
- [ ] **Tables Created** - All tables exist in database
- [ ] **Admin User** - Admin user created in database

### ✅ Upload Directory
- [ ] **Directory Created** - `uploads` directory exists
- [ ] **Permissions Set** - Directory is writable (chmod 755)

## 🔥 Firebase Setup Checklist

### ✅ Firebase Project
- [ ] **Project Created** - Firebase project created
- [ ] **Authentication Enabled** - Email/Password authentication enabled
- [ ] **Web App Added** - Web application added to Firebase project
- [ ] **Config Copied** - Firebase configuration copied to .env file

### ✅ Service Account
- [ ] **Service Account Created** - Firebase service account created
- [ ] **Private Key Downloaded** - JSON key file downloaded
- [ ] **Key Configured** - Private key added to .env file
- [ ] **Permissions Set** - Service account has necessary permissions

### ✅ Admin User
- [ ] **Admin User Created** - Admin user created in Firebase
- [ ] **UID Copied** - Firebase UID copied
- [ ] **Database Entry** - Admin user added to database

## 🌐 Domain and SSL Checklist

### ✅ Domain Configuration
- [ ] **DNS Records Set** - A records pointing to server IP
- [ ] **Propagation Complete** - DNS changes propagated (5-30 minutes)
- [ ] **Domain Accessible** - Domain resolves to server IP

### ✅ SSL Certificate
- [ ] **Certificate Generated** - `sudo certbot --nginx -d yourdomain.com`
- [ ] **Auto-renewal Set** - Certificate auto-renewal configured
- [ ] **HTTPS Working** - Website accessible via HTTPS
- [ ] **Green Lock** - Browser shows green lock icon

### ✅ Nginx Configuration
- [ ] **Site Enabled** - Nginx site configuration enabled
- [ ] **SSL Redirect** - HTTP redirects to HTTPS
- [ ] **Proxy Setup** - Backend and frontend proxying configured
- [ ] **WebSocket Support** - Socket.io proxying configured

## 🚀 Application Startup Checklist

### ✅ PM2 Configuration
- [ ] **Backend Started** - `pm2 start backend/src/server.ts --name watchparty-backend`
- [ ] **Frontend Started** - `pm2 start 'npm run preview' --name watchparty-frontend`
- [ ] **PM2 Saved** - `pm2 save` configuration saved
- [ ] **Auto-start Set** - `pm2 startup` configured

### ✅ Service Status
- [ ] **Backend Running** - `pm2 status` shows watchparty-backend online
- [ ] **Frontend Running** - `pm2 status` shows watchparty-frontend online
- [ ] **Database Connected** - Backend can connect to PostgreSQL
- [ ] **Redis Connected** - Backend can connect to Redis

### ✅ Health Checks
- [ ] **Backend Health** - `curl http://localhost:8080/health` returns OK
- [ ] **Frontend Access** - `curl http://localhost:3000` returns HTML
- [ ] **API Endpoints** - API endpoints responding correctly
- [ ] **WebSocket** - Socket.io connections working

## 🔧 Final Validation Checklist

### ✅ Website Access
- [ ] **HTTP Redirect** - http://yourdomain.com redirects to HTTPS
- [ ] **HTTPS Working** - https://yourdomain.com loads correctly
- [ ] **No Console Errors** - Browser console shows no errors
- [ ] **All Features Work** - Login, registration, room creation work

### ✅ Admin Dashboard
- [ ] **Admin Access** - https://yourdomain.com/admin accessible
- [ ] **Admin Login** - Can login with admin credentials
- [ ] **Dashboard Loads** - Admin dashboard displays correctly
- [ ] **User Management** - Can view and manage users

### ✅ Security Validation
- [ ] **Firewall Active** - Only necessary ports open
- [ ] **SSL Certificate** - Valid SSL certificate
- [ ] **Security Headers** - Security headers present
- [ ] **Rate Limiting** - API rate limiting active

## 🚨 Troubleshooting Checklist

### ✅ Common Issues
- [ ] **Port Conflicts** - No port conflicts (3000, 8080, 5432, 6379)
- [ ] **Permission Issues** - All files have correct permissions
- [ ] **Environment Variables** - All required variables set
- [ ] **Service Dependencies** - All services running and connected

### ✅ Log Monitoring
- [ ] **Backend Logs** - `pm2 logs watchparty-backend` shows no errors
- [ ] **Frontend Logs** - `pm2 logs watchparty-frontend` shows no errors
- [ ] **System Logs** - No critical errors in system logs
- [ ] **Database Logs** - PostgreSQL logs show no errors

### ✅ Performance Check
- [ ] **Memory Usage** - System has sufficient memory
- [ ] **Disk Space** - Sufficient disk space available
- [ ] **CPU Usage** - CPU usage within normal limits
- [ ] **Network Connectivity** - All network connections working

## 🎉 Success Criteria

### ✅ Deployment Successful When:
- [ ] **Website Live** - https://yourdomain.com loads and works
- [ ] **Admin Dashboard** - Admin can access and manage the platform
- [ ] **User Registration** - Users can register and login
- [ ] **Room Creation** - Users can create and join rooms
- [ ] **Real-time Features** - Chat, reactions, and synchronization work
- [ ] **Mobile Responsive** - Website works on mobile devices
- [ ] **SSL Certificate** - Green lock icon in browser
- [ ] **All Services Running** - PM2 shows all processes online

## 📞 Support Resources

### ✅ If Issues Occur:
- [ ] **Check Logs** - Review PM2 logs for errors
- [ ] **Verify Services** - Ensure all services are running
- [ ] **Test Connections** - Verify database and Redis connections
- [ ] **Check Configuration** - Verify environment variables
- [ ] **Restart Services** - Restart PM2 processes if needed
- [ ] **GitHub Issues** - Create issue at https://github.com/dilippurohit3/watchparty/issues

---

**🎯 This checklist ensures a layman can successfully deploy WatchParty without errors!**

**Follow this checklist step-by-step, and you'll have a fully functional WatchParty platform running on GCP Ubuntu VPS! 🚀**
