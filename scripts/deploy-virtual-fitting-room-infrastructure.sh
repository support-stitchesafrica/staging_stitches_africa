#!/bin/bash

# Deploy Virtual Fitting Room Infrastructure
# This script deploys Firestore indexes and security rules for the virtual fitting room feature

set -e

echo "🚀 Deploying Virtual Fitting Room Infrastructure..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase."
    echo "Please login with: firebase login"
    exit 1
fi

echo "📋 Current Firebase project:"
firebase use

echo ""
read -p "Is this the correct project? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please switch to the correct project with: firebase use <project-id>"
    exit 1
fi

echo ""
echo "📦 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo ""
echo "🔒 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

echo ""
echo "✅ Virtual Fitting Room infrastructure deployed successfully!"
echo ""
echo "📊 Next steps:"
echo "1. Verify indexes are being built in Firebase Console"
echo "2. Test security rules with the Firebase Emulator"
echo "3. Configure cloud storage buckets in Firebase Console"
echo "4. Set up AI/ML service endpoints"
echo ""
echo "For more information, see: lib/virtual-fitting-room/README.md"
