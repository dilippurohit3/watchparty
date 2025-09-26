#!/bin/bash

# Boltzy Admin Setup Script
# This script helps create an admin user for the Boltzy platform

set -e

echo "🔐 Boltzy Admin Setup Script"
echo "============================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the Boltzy project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run the deployment setup first."
    exit 1
fi

echo "📋 Admin User Setup Options:"
echo "1. Create admin user via database (quick setup)"
echo "2. Create admin user via Firebase Console (recommended)"
echo "3. Convert existing user to admin"
echo ""

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo "🗄️ Creating admin user via database..."
        
        # Get admin details
        read -p "Enter admin email: " admin_email
        read -p "Enter admin username (default: admin): " admin_username
        admin_username=${admin_username:-admin}
        
        # Create admin user in database
        psql -h localhost -U boltzy_user -d boltzy_production -c "
        INSERT INTO users (firebase_uid, username, email, avatar_url, is_online, created_at) 
        VALUES ('admin-uid-$(date +%s)', '$admin_username', '$admin_email', NULL, true, NOW());
        "
        
        echo "✅ Admin user created in database"
        echo "⚠️  Note: You'll need to create a Firebase user with the same email"
        echo "   Go to Firebase Console → Authentication → Users → Add user"
        ;;
        
    2)
        echo "🔥 Creating admin user via Firebase Console..."
        echo ""
        echo "Please follow these steps:"
        echo "1. Go to https://console.firebase.google.com/"
        echo "2. Select your project"
        echo "3. Go to Authentication → Users"
        echo "4. Click 'Add user'"
        echo "5. Enter admin email and password"
        echo "6. Copy the UID"
        echo ""
        
        read -p "Enter the Firebase UID: " firebase_uid
        read -p "Enter admin email: " admin_email
        read -p "Enter admin username (default: admin): " admin_username
        admin_username=${admin_username:-admin}
        
        # Create admin user in database with Firebase UID
        psql -h localhost -U boltzy_user -d boltzy_production -c "
        INSERT INTO users (firebase_uid, username, email, avatar_url, is_online, created_at) 
        VALUES ('$firebase_uid', '$admin_username', '$admin_email', NULL, true, NOW());
        "
        
        echo "✅ Admin user created with Firebase UID"
        ;;
        
    3)
        echo "👤 Converting existing user to admin..."
        
        # List existing users
        echo "Existing users:"
        psql -h localhost -U boltzy_user -d boltzy_production -c "SELECT id, username, email FROM users LIMIT 10;"
        echo ""
        
        read -p "Enter user ID to make admin: " user_id
        
        # Update user to admin
        psql -h localhost -U boltzy_user -d boltzy_production -c "
        UPDATE users SET username = 'admin' WHERE id = '$user_id';
        "
        
        echo "✅ User converted to admin"
        ;;
        
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🔍 Verifying admin user..."
psql -h localhost -U boltzy_user -d boltzy_production -c "SELECT id, firebase_uid, username, email FROM users WHERE username = 'admin';"

echo ""
echo "🎉 Admin setup complete!"
echo ""
echo "Next steps:"
echo "1. Start your application: pm2 start all"
echo "2. Go to https://yourdomain.com/admin"
echo "3. Login with admin credentials"
echo "4. Verify admin dashboard access"
echo ""
echo "Admin dashboard features:"
echo "- User management"
echo "- Room management"
echo "- Content moderation"
echo "- Analytics dashboard"
echo "- System health monitoring"
echo ""
echo "Happy administrating! 🎛️"
