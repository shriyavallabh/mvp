#!/usr/bin/env node

/**
 * Google Drive OAuth Setup Script
 * This script helps generate the refresh token for Google Drive API
 */

const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Configuration
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata'
];

const TOKEN_PATH = path.join(__dirname, 'drive-token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'drive-oauth-credentials.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}${colors.bright}
===========================================
Google Drive OAuth Setup for FinAdvise
===========================================
${colors.reset}`);

async function checkPrerequisites() {
  console.log(`${colors.yellow}Checking prerequisites...${colors.reset}\n`);
  
  // Check if credentials file exists
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log(`${colors.red}❌ OAuth credentials file not found!${colors.reset}`);
    console.log(`
Please follow these steps:

1. Go to: https://console.cloud.google.com
2. Select your project: finadvise-mvp
3. Navigate to: APIs & Services → Credentials
4. Click: "+ CREATE CREDENTIALS" → "OAuth client ID"
5. Choose: "Desktop app"
6. Name: "FinAdvise Drive Client"
7. Download the JSON file
8. Save it as: ${CREDENTIALS_PATH}

Then run this script again.
`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ Found OAuth credentials file${colors.reset}`);
  
  // Check if Google Drive API is mentioned
  console.log(`
${colors.yellow}Make sure you have enabled Google Drive API:${colors.reset}
1. Go to: https://console.cloud.google.com
2. APIs & Services → Library
3. Search for: "Google Drive API"
4. Click: ENABLE (if not already enabled)
`);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question('Have you enabled Google Drive API? (yes/no): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\nPlease enable Google Drive API first, then run this script again.');
        process.exit(1);
      }
      resolve();
    });
  });
}

async function authorize() {
  console.log(`\n${colors.blue}Starting OAuth authorization...${colors.reset}\n`);
  
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || 'urn:ietf:wg:oauth:2.0:oob'
    );
    
    // Check if token already exists
    if (fs.existsSync(TOKEN_PATH)) {
      console.log(`${colors.yellow}Token file already exists. Overwriting...${colors.reset}`);
    }
    
    // Generate auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force to get refresh token
    });
    
    console.log(`${colors.bright}Please authorize this app by visiting this URL:${colors.reset}\n`);
    console.log(`${colors.blue}${authUrl}${colors.reset}\n`);
    console.log('After authorization, you will see a code.\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question('Enter the authorization code here: ', async (code) => {
      rl.close();
      
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        
        // Save token
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        
        console.log(`\n${colors.green}✅ Success! Token saved to ${TOKEN_PATH}${colors.reset}\n`);
        
        // Display environment variables
        console.log(`${colors.bright}Add these to your .env file:${colors.reset}\n`);
        console.log(`${colors.yellow}# Google Drive API${colors.reset}`);
        console.log(`GOOGLE_DRIVE_CLIENT_ID=${client_id}`);
        console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${client_secret}`);
        console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
        
        // Create Drive folder
        await createDriveFolder(oAuth2Client);
        
      } catch (err) {
        console.error(`${colors.red}Error retrieving access token:${colors.reset}`, err.message);
        console.log('\nPlease try again. Make sure you copied the entire code.');
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error(`${colors.red}Error reading credentials:${colors.reset}`, error.message);
    process.exit(1);
  }
}

async function createDriveFolder(auth) {
  console.log(`\n${colors.yellow}Creating root folder in Google Drive...${colors.reset}`);
  
  const drive = google.drive({ version: 'v3', auth });
  
  try {
    // Check if folder already exists
    const searchResponse = await drive.files.list({
      q: "name='finadvise-content-backup' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
    });
    
    let folderId;
    
    if (searchResponse.data.files.length > 0) {
      folderId = searchResponse.data.files[0].id;
      console.log(`${colors.green}✅ Found existing folder: ${folderId}${colors.reset}`);
    } else {
      // Create new folder
      const fileMetadata = {
        name: 'finadvise-content-backup',
        mimeType: 'application/vnd.google-apps.folder',
      };
      
      const folder = await drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });
      
      folderId = folder.data.id;
      console.log(`${colors.green}✅ Created new folder: ${folderId}${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}Add this to your .env file:${colors.reset}`);
    console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID=${folderId}`);
    
    // Test by creating a test file
    console.log(`\n${colors.yellow}Testing write access...${colors.reset}`);
    
    const testContent = {
      name: 'test-' + new Date().toISOString() + '.txt',
      parents: [folderId],
    };
    
    const media = {
      mimeType: 'text/plain',
      body: 'Test file created by FinAdvise setup script',
    };
    
    await drive.files.create({
      resource: testContent,
      media: media,
      fields: 'id',
    });
    
    console.log(`${colors.green}✅ Successfully created test file in Drive${colors.reset}`);
    
    console.log(`
${colors.green}${colors.bright}
===========================================
Setup Complete!
===========================================
${colors.reset}

${colors.bright}Your Google Drive integration is ready.${colors.reset}

${colors.yellow}Next steps:${colors.reset}
1. Copy the environment variables shown above to your .env file
2. The root folder has been created in your Google Drive
3. You can view it at: https://drive.google.com/drive/folders/${folderId}

${colors.green}All set! Your Google Drive backup system is configured.${colors.reset}
`);
    
  } catch (error) {
    console.error(`${colors.red}Error creating folder:${colors.reset}`, error.message);
  }
}

// Run the setup
async function main() {
  try {
    await checkPrerequisites();
    await authorize();
  } catch (error) {
    console.error(`${colors.red}Setup failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

main();