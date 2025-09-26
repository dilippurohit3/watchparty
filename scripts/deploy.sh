#!/bin/bash

# Boltzy Deployment Script
# This script helps with the initial deployment setup

set -e

echo "🚀 Boltzy Deployment Script"
echo "=========================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   echo "Please run as a regular user with sudo privileges"
   exit 1
fi

# Check if we're on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo "❌ This script is designed for Ubuntu"
    echo "Please use the manual deployment guide"
    exit 1
fi

echo "✅ Ubuntu detected"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "📦 Installing essential packages..."
sudo apt install -y curl wget git vim htop unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 20 (LTS for Ubuntu 22.04)
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 15 (Latest for Ubuntu 22.04)
echo "📦 Installing PostgreSQL 15..."
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Install Redis 7 (Latest for Ubuntu 22.04)
echo "📦 Installing Redis 7..."
sudo apt install -y redis-server redis-tools

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Start services
echo "🔄 Starting services..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis-server
sudo systemctl enable redis-server
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure PostgreSQL
echo "🗄️ Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE boltzy_production;"
sudo -u postgres psql -c "CREATE USER boltzy_user WITH PASSWORD 'boltzy_secure_password_2024';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE boltzy_production TO boltzy_user;"
sudo -u postgres psql -c "ALTER USER boltzy_user CREATEDB;"

# Configure Redis
echo "🗄️ Configuring Redis..."
sudo sed -i 's/# maxmemory <bytes>/maxmemory 512mb/' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
sudo systemctl restart redis-server

# Create application directory
echo "📁 Creating application directory..."
mkdir -p ~/apps
cd ~/apps

# Clone repository
echo "📥 Cloning WatchParty repository..."
git clone https://github.com/dilippurohit3/watchparty.git
cd watchparty

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Create environment file
echo "⚙️ Creating environment file..."
cp env.example .env

# Create upload directory
echo "📁 Creating upload directory..."
mkdir -p uploads
chmod 755 uploads

# Run database schema
echo "🗄️ Setting up database schema..."
psql -h localhost -U boltzy_user -d boltzy_production -f database/schema.sql

echo ""
echo "🎉 Initial setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit ~/apps/watchparty/.env with your configuration"
echo "2. Set up your domain and SSL certificate"
echo "3. Configure Nginx for your domain"
echo "4. Start the application with PM2"
echo ""
echo "For detailed instructions, see INSTALLATION_GUIDE.md"
echo ""
echo "Quick commands:"
echo "  cd ~/apps/watchparty"
echo "  vim .env  # Configure your environment"
echo "  pm2 start backend/src/server.ts --name watchparty-backend --interpreter ts-node"
echo "  pm2 start 'npm run preview' --name watchparty-frontend --cwd frontend"
echo "  pm2 save"
echo ""
echo "Happy deploying! 🚀"
