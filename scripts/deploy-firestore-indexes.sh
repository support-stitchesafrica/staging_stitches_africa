#!/bin/bash

# Deploy Firestore Indexes Script
# This script deploys the Firestore indexes for the unified backoffice system and VVIP Shopper Program

echo "🔥 Deploying Firestore indexes for unified backoffice system and VVIP Shopper Program..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    echo "   or"
    echo "   npm install firebase-tools --save-dev"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase. Please login first:"
    echo "   firebase login"
    exit 1
fi

# Deploy the indexes
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully!"
    echo ""
    echo "📋 Deployed indexes for:"
    echo "   • backoffice_users (email, role, isActive, departments)"
    echo "   • backoffice_invitations (email, status, token, expiresAt)"
    echo "   • orders (isVvip, payment_status, created_at) - VVIP Program"
    echo "   • vvip_audit_logs (affected_user, timestamp) - VVIP Program"
    echo "   • Composite indexes for common queries"
    echo ""
    echo "🎉 Firestore indexes are now active!"
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi