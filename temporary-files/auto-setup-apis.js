#!/usr/bin/env node

/**
 * Automated API Setup Assistant
 * This script guides through setting up all APIs with automatic URL opening
 */

const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Configuration URLs
const urls = {
  googleConsole: 'https://console.cloud.google.com',
  googleDriveAPI: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
  googleDrive: 'https://drive.google.com',
  geminiAPI: 'https://aistudio.google.com/app/apikey',
  twilio: 'https://www.twilio.com/try-twilio',
  twilioConsole: 'https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn',
  gmailSecurity: 'https://myaccount.google.com/security',
  gmailAppPasswords: 'https://myaccount.google.com/apppasswords'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to open URL
function openURL(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`${colors.yellow}Please open manually: ${url}${colors.reset}`);
    }
  });
}

// Helper function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to prompt for secret
function promptSecret(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    stdin.on('data', (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write('\n');
        resolve(password);
      } else if (ch === '\u0003') {
        process.exit();
      } else if (ch === '\u007f' || ch === '\b') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.clearLine();
          stdout.cursorTo(0);
          stdout.write(question + '*'.repeat(password.length));
        }
      } else {
        password += ch;
        stdout.write('*');
      }
    });
  });
}

// Check or create .env file
function setupEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(process.cwd(), '.env.backup.' + Date.now());
    fs.copyFileSync(envPath, backupPath);
    console.log(`${colors.yellow}Backed up existing .env to: ${backupPath}${colors.reset}`);
  } else {
    fs.writeFileSync(envPath, '');
    console.log(`${colors.green}Created new .env file${colors.reset}`);
  }
  
  return envPath;
}

// Add or update environment variable
function updateEnvVar(key, value) {
  const envPath = path.join(process.cwd(), '.env');
  let content = fs.readFileSync(envPath, 'utf8');
  
  const regex = new RegExp(`^${key}=.*$`, 'gm');
  
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  
  fs.writeFileSync(envPath, content);
}

// Main setup flow
async function main() {
  console.log(`${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════╗
║   FinAdvise Content Engine - Auto Setup     ║
║         API Credentials Assistant            ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

  setupEnvFile();
  
  console.log(`${colors.yellow}This script will help you set up all required APIs.${colors.reset}`);
  console.log(`${colors.yellow}It will open browser tabs for each service.${colors.reset}\n`);
  
  await prompt('Press Enter to begin...');
  
  // Step 1: Google Drive Setup
  console.log(`\n${colors.blue}${colors.bright}Step 1: Google Drive Setup${colors.reset}`);
  console.log('We need to set up Google Drive for content backup.\n');
  
  const driveChoice = await prompt('Use [1] Service Account or [2] OAuth? (1/2): ');
  
  if (driveChoice === '1') {
    console.log(`\n${colors.yellow}Using Service Account for Google Drive${colors.reset}`);
    console.log('Opening Google Console to enable Drive API...\n');
    
    openURL(urls.googleDriveAPI);
    await prompt('Press Enter after enabling Google Drive API...');
    
    console.log('\n1. Now opening Google Drive to create a folder...');
    openURL(urls.googleDrive);
    
    console.log(`
${colors.yellow}Please do the following:${colors.reset}
1. Create a new folder called: ${colors.bright}finadvise-content-backup${colors.reset}
2. Right-click → Share
3. Add: ${colors.bright}finadvise-agent@finadvise-mvp.iam.gserviceaccount.com${colors.reset}
4. Give 'Editor' access
5. Open the folder and copy the ID from URL
`);
    
    const folderId = await prompt('Enter the folder ID: ');
    updateEnvVar('GOOGLE_DRIVE_ROOT_FOLDER_ID', folderId);
    
    // Check for existing credentials
    const credsPath = '/home/mvp/config/google-credentials.json';
    if (fs.existsSync(credsPath)) {
      updateEnvVar('GOOGLE_DRIVE_CREDENTIALS', credsPath);
      console.log(`${colors.green}✓ Using existing credentials${colors.reset}`);
    } else {
      const customPath = await prompt('Enter path to google-credentials.json: ');
      updateEnvVar('GOOGLE_DRIVE_CREDENTIALS', customPath);
    }
    
    console.log(`${colors.green}✓ Google Drive configured${colors.reset}`);
    
  } else {
    console.log('Please run: node setup-google-drive-oauth.js');
  }
  
  // Step 2: Gemini API
  console.log(`\n${colors.blue}${colors.bright}Step 2: Gemini API Setup${colors.reset}`);
  console.log('Opening Google AI Studio to get Gemini API key...\n');
  
  openURL(urls.geminiAPI);
  
  console.log(`
${colors.yellow}Please do the following:${colors.reset}
1. Click: ${colors.bright}Create API Key${colors.reset}
2. Select project: ${colors.bright}finadvise-mvp${colors.reset} (or create new)
3. Copy the API key
`);
  
  const geminiKey = await promptSecret('Enter Gemini API key: ');
  if (geminiKey) {
    updateEnvVar('GEMINI_API_KEY', geminiKey);
    console.log(`${colors.green}✓ Gemini API configured${colors.reset}`);
  }
  
  // Step 3: WhatsApp (Twilio)
  console.log(`\n${colors.blue}${colors.bright}Step 3: WhatsApp Setup (Twilio)${colors.reset}`);
  
  const whatsappChoice = await prompt('Set up WhatsApp? (y/n): ');
  
  if (whatsappChoice.toLowerCase() === 'y') {
    console.log('Opening Twilio signup page...\n');
    openURL(urls.twilio);
    
    console.log(`
${colors.yellow}Please do the following:${colors.reset}
1. Sign up for free account (get $15 credit)
2. Verify your phone number
3. Complete signup process
`);
    
    await prompt('Press Enter after signing up...');
    
    console.log('\nOpening Twilio WhatsApp sandbox...');
    openURL(urls.twilioConsole);
    
    console.log(`
${colors.yellow}In Twilio Console:${colors.reset}
1. Follow WhatsApp Sandbox setup
2. Get your credentials from Account Info
`);
    
    const twilioSid = await prompt('Enter Account SID: ');
    const twilioToken = await promptSecret('Enter Auth Token: ');
    const twilioNumber = await prompt('Enter WhatsApp Number [whatsapp:+14155238886]: ') || 'whatsapp:+14155238886';
    
    updateEnvVar('WHATSAPP_ACCOUNT_SID', twilioSid);
    updateEnvVar('WHATSAPP_AUTH_TOKEN', twilioToken);
    updateEnvVar('WHATSAPP_FROM_NUMBER', twilioNumber);
    
    console.log(`${colors.green}✓ WhatsApp configured${colors.reset}`);
  }
  
  // Step 4: Gmail SMTP
  console.log(`\n${colors.blue}${colors.bright}Step 4: Gmail SMTP Setup${colors.reset}`);
  
  const emailChoice = await prompt('Set up email notifications? (y/n): ');
  
  if (emailChoice.toLowerCase() === 'y') {
    console.log('Opening Gmail security settings...\n');
    openURL(urls.gmailSecurity);
    
    console.log(`
${colors.yellow}Please do the following:${colors.reset}
1. Enable 2-Step Verification
2. Complete the setup
`);
    
    await prompt('Press Enter after enabling 2FA...');
    
    console.log('\nOpening App Passwords page...');
    openURL(urls.gmailAppPasswords);
    
    console.log(`
${colors.yellow}Generate App Password:${colors.reset}
1. Select app: ${colors.bright}Mail${colors.reset}
2. Select device: ${colors.bright}Other${colors.reset}
3. Name it: ${colors.bright}FinAdvise${colors.reset}
4. Copy the 16-character password
`);
    
    const gmailUser = await prompt('Enter Gmail address: ');
    const gmailPass = await promptSecret('Enter App Password (no spaces): ');
    
    updateEnvVar('SMTP_HOST', 'smtp.gmail.com');
    updateEnvVar('SMTP_PORT', '587');
    updateEnvVar('SMTP_USER', gmailUser);
    updateEnvVar('SMTP_PASS', gmailPass.replace(/\s/g, ''));
    
    console.log(`${colors.green}✓ Gmail SMTP configured${colors.reset}`);
  }
  
  // Step 5: Additional settings
  console.log(`\n${colors.blue}${colors.bright}Step 5: Additional Settings${colors.reset}`);
  
  const adminPhone = await prompt('Enter admin WhatsApp number (+919876543210): ');
  if (adminPhone) {
    updateEnvVar('ADMIN_WHATSAPP_NUMBERS', adminPhone);
  }
  
  // Final test
  console.log(`\n${colors.cyan}${colors.bright}Running configuration test...${colors.reset}\n`);
  
  // Create and run test
  const testScript = `
const colors = {g:'\\x1b[32m',r:'\\x1b[31m',y:'\\x1b[33m',x:'\\x1b[0m'};
require('dotenv').config();
const results = [];
if(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) results.push(colors.g+'✓ Google Drive'+colors.x);
else results.push(colors.r+'✗ Google Drive'+colors.x);
if(process.env.GEMINI_API_KEY) results.push(colors.g+'✓ Gemini API'+colors.x);
else results.push(colors.r+'✗ Gemini API'+colors.x);
if(process.env.WHATSAPP_ACCOUNT_SID) results.push(colors.g+'✓ WhatsApp'+colors.x);
else results.push(colors.r+'✗ WhatsApp'+colors.x);
if(process.env.SMTP_USER) results.push(colors.g+'✓ Email'+colors.x);
else results.push(colors.r+'✗ Email'+colors.x);
console.log(results.join('\\n'));
`;
  
  fs.writeFileSync('quick-test.js', testScript);
  exec('node quick-test.js', (error, stdout) => {
    console.log(stdout);
    fs.unlinkSync('quick-test.js');
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`${colors.green}${colors.bright}
╔══════════════════════════════════════════════╗
║            Setup Complete! 🎉               ║
╚══════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`
${colors.yellow}Next Steps:${colors.reset}
1. Test locally: ${colors.bright}npm test${colors.reset}
2. Deploy to VM: ${colors.bright}./deploy-story-2.1.sh${colors.reset}
3. Monitor: ${colors.bright}ssh root@143.110.191.97${colors.reset}

${colors.green}Your .env file has been configured with all credentials.${colors.reset}
`);
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});

// Run the setup
main().catch(console.error);