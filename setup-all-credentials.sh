#!/bin/bash

# Complete Setup Script for Story 2.1 APIs
# This script guides through setting up all required credentials

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}
===========================================
FinAdvise Content Engine - Complete Setup
===========================================
${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value="${value:-$default}"
    else
        read -p "$prompt: " value
    fi
    
    eval "$var_name='$value'"
}

# Function to prompt for secret input
prompt_secret() {
    local prompt="$1"
    local var_name="$2"
    
    echo -n "$prompt: "
    read -s value
    echo
    eval "$var_name='$value'"
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}\n"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    touch .env
    echo -e "${GREEN}✓ Created .env file${NC}\n"
else
    echo -e "${YELLOW}Found existing .env file${NC}"
    echo -e "${YELLOW}Creating backup at .env.backup...${NC}"
    cp .env .env.backup
    echo -e "${GREEN}✓ Backup created${NC}\n"
fi

# Install required npm packages
echo -e "${YELLOW}Installing required npm packages...${NC}"
npm install googleapis axios nodemailer dotenv twilio --save
echo -e "${GREEN}✓ Packages installed${NC}\n"

# Step 1: Check existing Google setup
echo -e "${BLUE}${BOLD}Step 1: Google Cloud Configuration${NC}"
echo -e "${YELLOW}Checking for existing Google credentials...${NC}"

EXISTING_CREDS=""
if [ -f "/home/mvp/config/google-credentials.json" ]; then
    EXISTING_CREDS="/home/mvp/config/google-credentials.json"
    echo -e "${GREEN}✓ Found credentials at: $EXISTING_CREDS${NC}"
elif [ -f "./config/google-credentials.json" ]; then
    EXISTING_CREDS="./config/google-credentials.json"
    echo -e "${GREEN}✓ Found credentials at: $EXISTING_CREDS${NC}"
else
    echo -e "${YELLOW}No existing Google credentials found${NC}"
fi

echo -e "\n${BOLD}Google Setup Options:${NC}"
echo "1) Use existing service account (simplest)"
echo "2) Set up OAuth for Google Drive (more features)"
echo "3) Skip Google Drive setup"

prompt_input "Choose option (1-3)" GOOGLE_OPTION "1"

case $GOOGLE_OPTION in
    1)
        echo -e "\n${YELLOW}Using existing service account...${NC}"
        
        if [ -z "$EXISTING_CREDS" ]; then
            prompt_input "Enter path to google-credentials.json" GOOGLE_CREDS_PATH
        else
            GOOGLE_CREDS_PATH="$EXISTING_CREDS"
        fi
        
        echo -e "\n${BOLD}Now we need to set up a Google Drive folder:${NC}"
        echo "1. Go to: https://drive.google.com"
        echo "2. Create a new folder called: finadvise-content-backup"
        echo "3. Right-click the folder → Share"
        echo "4. Add email: finadvise-agent@finadvise-mvp.iam.gserviceaccount.com"
        echo "5. Give 'Editor' access"
        echo "6. Open the folder and copy the ID from the URL"
        echo "   URL format: https://drive.google.com/drive/folders/[FOLDER_ID]"
        echo ""
        
        prompt_input "Enter the Google Drive folder ID" DRIVE_FOLDER_ID
        
        # Add to .env
        echo "GOOGLE_DRIVE_CREDENTIALS=$GOOGLE_CREDS_PATH" >> .env
        echo "GOOGLE_DRIVE_ROOT_FOLDER_ID=$DRIVE_FOLDER_ID" >> .env
        
        echo -e "${GREEN}✓ Google Drive configured with service account${NC}"
        ;;
        
    2)
        echo -e "\n${YELLOW}Setting up OAuth for Google Drive...${NC}"
        echo "Running OAuth setup script..."
        node setup-google-drive-oauth.js
        ;;
        
    3)
        echo -e "${YELLOW}Skipping Google Drive setup${NC}"
        ;;
esac

# Step 2: Gemini API
echo -e "\n${BLUE}${BOLD}Step 2: Gemini API Setup${NC}"
echo -e "${YELLOW}Getting Gemini API key...${NC}"
echo ""
echo "1. Open: https://aistudio.google.com/app/apikey"
echo "2. Click: 'Create API Key'"
echo "3. Select your project: finadvise-mvp (or create new)"
echo "4. Copy the API key"
echo ""

prompt_secret "Enter your Gemini API key (starts with AIzaSy)" GEMINI_KEY

if [ -n "$GEMINI_KEY" ]; then
    echo "GEMINI_API_KEY=$GEMINI_KEY" >> .env
    echo -e "${GREEN}✓ Gemini API configured${NC}"
else
    echo -e "${YELLOW}Skipping Gemini API${NC}"
fi

# Step 3: WhatsApp Setup
echo -e "\n${BLUE}${BOLD}Step 3: WhatsApp Business API Setup${NC}"
echo -e "${YELLOW}Choose WhatsApp provider:${NC}"
echo "1) Twilio (recommended - free trial available)"
echo "2) Official WhatsApp Business API"
echo "3) Skip WhatsApp setup"

prompt_input "Choose option (1-3)" WHATSAPP_OPTION "1"

case $WHATSAPP_OPTION in
    1)
        echo -e "\n${YELLOW}Setting up Twilio WhatsApp...${NC}"
        echo ""
        echo "1. Sign up at: https://www.twilio.com/try-twilio"
        echo "2. You'll get $15 free credit"
        echo "3. Go to Console → Messaging → Try it out → WhatsApp"
        echo "4. Follow the sandbox setup instructions"
        echo "5. Get your credentials from the Twilio Console"
        echo ""
        
        prompt_input "Enter Twilio Account SID (starts with AC)" TWILIO_SID
        prompt_secret "Enter Twilio Auth Token" TWILIO_TOKEN
        prompt_input "Enter WhatsApp From Number" WHATSAPP_FROM "whatsapp:+14155238886"
        
        echo "WHATSAPP_ACCOUNT_SID=$TWILIO_SID" >> .env
        echo "WHATSAPP_AUTH_TOKEN=$TWILIO_TOKEN" >> .env
        echo "WHATSAPP_FROM_NUMBER=$WHATSAPP_FROM" >> .env
        
        echo -e "${GREEN}✓ Twilio WhatsApp configured${NC}"
        ;;
        
    2)
        echo -e "\n${YELLOW}Setting up Official WhatsApp Business API...${NC}"
        prompt_secret "Enter WhatsApp Bearer Token" WHATSAPP_TOKEN
        echo "WHATSAPP_BEARER_TOKEN=$WHATSAPP_TOKEN" >> .env
        echo -e "${GREEN}✓ WhatsApp Business API configured${NC}"
        ;;
        
    3)
        echo -e "${YELLOW}Skipping WhatsApp setup${NC}"
        ;;
esac

# Step 4: Email SMTP Setup
echo -e "\n${BLUE}${BOLD}Step 4: Email SMTP Setup (Gmail)${NC}"
echo -e "${YELLOW}Setting up email fallback...${NC}"
echo ""
echo "To use Gmail SMTP:"
echo "1. Enable 2-Factor Authentication at: https://myaccount.google.com/security"
echo "2. Generate App Password at: https://myaccount.google.com/apppasswords"
echo "3. Select 'Mail' and 'Other device'"
echo "4. Copy the 16-character password"
echo ""

prompt_input "Enter your Gmail address" GMAIL_USER
prompt_secret "Enter Gmail App Password (16 chars, no spaces)" GMAIL_PASS

if [ -n "$GMAIL_USER" ] && [ -n "$GMAIL_PASS" ]; then
    echo "SMTP_HOST=smtp.gmail.com" >> .env
    echo "SMTP_PORT=587" >> .env
    echo "SMTP_USER=$GMAIL_USER" >> .env
    echo "SMTP_PASS=$GMAIL_PASS" >> .env
    echo -e "${GREEN}✓ Email SMTP configured${NC}"
else
    echo -e "${YELLOW}Skipping email setup${NC}"
fi

# Step 5: Additional Configuration
echo -e "\n${BLUE}${BOLD}Step 5: Additional Configuration${NC}"

prompt_input "Enter admin WhatsApp number (with country code, e.g., +919876543210)" ADMIN_PHONE
if [ -n "$ADMIN_PHONE" ]; then
    echo "ADMIN_WHATSAPP_NUMBERS=$ADMIN_PHONE" >> .env
fi

# Step 6: Test Configuration
echo -e "\n${BLUE}${BOLD}Step 6: Testing Configuration${NC}"
echo -e "${YELLOW}Creating test script...${NC}"

cat > test-all-apis.js << 'EOF'
require('dotenv').config();
const { google } = require('googleapis');
const axios = require('axios');
const nodemailer = require('nodemailer');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testGoogleDrive() {
  console.log('Testing Google Drive...');
  
  if (!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    console.log(`${colors.yellow}⚠ Google Drive not configured${colors.reset}`);
    return;
  }
  
  try {
    if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
      // Service account
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_DRIVE_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive']
      });
      const drive = google.drive({ version: 'v3', auth });
      await drive.files.list({ pageSize: 1 });
    } else {
      // OAuth
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      await drive.files.list({ pageSize: 1 });
    }
    console.log(`${colors.green}✓ Google Drive connected${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Google Drive: ${error.message}${colors.reset}`);
  }
}

async function testGemini() {
  console.log('Testing Gemini API...');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log(`${colors.yellow}⚠ Gemini API not configured${colors.reset}`);
    return;
  }
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: 'Say "test successful" in 3 words' }]
        }]
      }
    );
    console.log(`${colors.green}✓ Gemini API connected${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Gemini API: ${error.response?.data?.error?.message || error.message}${colors.reset}`);
  }
}

async function testWhatsApp() {
  console.log('Testing WhatsApp...');
  
  if (process.env.WHATSAPP_ACCOUNT_SID) {
    console.log(`${colors.green}✓ Twilio WhatsApp configured${colors.reset}`);
  } else if (process.env.WHATSAPP_BEARER_TOKEN) {
    console.log(`${colors.green}✓ WhatsApp Business API configured${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ WhatsApp not configured${colors.reset}`);
  }
}

async function testSMTP() {
  console.log('Testing Email SMTP...');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`${colors.yellow}⚠ Email SMTP not configured${colors.reset}`);
    return;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.verify();
    console.log(`${colors.green}✓ Email SMTP connected${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Email SMTP: ${error.message}${colors.reset}`);
  }
}

async function runTests() {
  console.log('\n=== Testing All APIs ===\n');
  
  await testGoogleDrive();
  await testGemini();
  await testWhatsApp();
  await testSMTP();
  
  console.log('\n=== Configuration Summary ===\n');
  
  const configured = [];
  const notConfigured = [];
  
  if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) configured.push('Google Drive');
  else notConfigured.push('Google Drive');
  
  if (process.env.GEMINI_API_KEY) configured.push('Gemini API');
  else notConfigured.push('Gemini API');
  
  if (process.env.WHATSAPP_ACCOUNT_SID || process.env.WHATSAPP_BEARER_TOKEN) configured.push('WhatsApp');
  else notConfigured.push('WhatsApp');
  
  if (process.env.SMTP_USER) configured.push('Email SMTP');
  else notConfigured.push('Email SMTP');
  
  if (configured.length > 0) {
    console.log(`${colors.green}Configured:${colors.reset}`, configured.join(', '));
  }
  
  if (notConfigured.length > 0) {
    console.log(`${colors.yellow}Not configured:${colors.reset}`, notConfigured.join(', '));
  }
  
  if (configured.length === 4) {
    console.log(`\n${colors.green}✓ All APIs configured successfully!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Some APIs are not configured. The system will use mock mode for those.${colors.reset}`);
  }
}

runTests().catch(console.error);
EOF

echo -e "${GREEN}✓ Test script created${NC}"

echo -e "\n${YELLOW}Running API tests...${NC}"
node test-all-apis.js

# Final summary
echo -e "\n${GREEN}${BOLD}
===========================================
Setup Complete!
===========================================
${NC}"

echo -e "${YELLOW}Your .env file has been updated with the credentials.${NC}"
echo -e "${YELLOW}Backup saved at: .env.backup${NC}"

echo -e "\n${BOLD}Next Steps:${NC}"
echo "1. Review your .env file"
echo "2. Test locally: npm test"
echo "3. Deploy to VM: ./deploy-story-2.1.sh"
echo "4. Monitor on VM: ssh root@143.110.191.97"

echo -e "\n${GREEN}Ready to deploy!${NC}"