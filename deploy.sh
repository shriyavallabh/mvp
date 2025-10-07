#!/bin/bash

# JarvisDaily - Complete Deployment Script
# Run this to deploy everything to Vercel

echo "🚀 JarvisDaily Deployment Script"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel..."
    vercel login
fi

# Deploy to production
echo ""
echo "📦 Deploying to Vercel..."
vercel --prod --yes

# Get the deployment URL
DEPLOYMENT_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "⚠️  Could not get deployment URL automatically"
    echo "Please check 'vercel ls' to see your deployments"
    exit 1
fi

echo ""
echo "✅ Deployed to: $DEPLOYMENT_URL"
echo ""

# Set environment variables
echo "🔧 Setting environment variables..."

# Read from .env file
source .env

vercel env add AISENSY_API_KEY production <<< "$AISENSY_API_KEY"
vercel env add CLOUDINARY_CLOUD_NAME production <<< "$CLOUDINARY_CLOUD_NAME"
vercel env add CLOUDINARY_API_KEY production <<< "$CLOUDINARY_API_KEY"
vercel env add CLOUDINARY_API_SECRET production <<< "$CLOUDINARY_API_SECRET"
vercel env add GEMINI_API_KEY production <<< "$GEMINI_API_KEY"
vercel env add DASHBOARD_URL production <<< "$DEPLOYMENT_URL"

echo ""
echo "✅ Environment variables set!"
echo ""

# Redeploy with env vars
echo "🔄 Redeploying with environment variables..."
vercel --prod --yes

echo ""
echo "================================="
echo "🎉 Deployment Complete!"
echo "================================="
echo ""
echo "📱 Dashboard URL:"
echo "   $DEPLOYMENT_URL/dashboard"
echo ""
echo "🧪 Test with your phone:"
echo "   $DEPLOYMENT_URL/dashboard?phone=919765071249"
echo ""
echo "📊 Next steps:"
echo "   1. Test dashboard: open $DEPLOYMENT_URL/dashboard?phone=919765071249"
echo "   2. Generate content: npm run test-content"
echo "   3. Send test notification: node scripts/send-aisensy.js"
echo ""
