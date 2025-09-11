#!/usr/bin/env node

/**
 * Add Initial Advisors to Google Sheets
 * This script adds the first three advisors to start testing
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Advisor data provided by client
const INITIAL_ADVISORS = [
    {
        arn: 'ARN_001',
        name: 'Shruti Petkar',
        whatsapp: '9673758777',
        email: 'shruti.petkar@example.com',
        client_segment: 'families',
        tone: 'friendly',
        content_focus: 'balanced',
        brand_colors: '#4A90E2,#7ED321',
        logo_url: 'https://example.com/logos/shruti-logo.png',
        auto_send: 'TRUE',
        active: 'TRUE',
        subscription_status: 'active',
        subscription_plan: 'premium',
        payment_status: 'paid',
        onboarding_date: new Date().toISOString().split('T')[0],
        last_payment_date: new Date().toISOString().split('T')[0],
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
        arn: 'ARN_002',
        name: 'Shri Avalok Petkar',
        whatsapp: '9765071249',
        email: 'avalok.petkar@example.com',
        client_segment: 'entrepreneurs',
        tone: 'professional',
        content_focus: 'growth',
        brand_colors: '#FF6B6B,#4ECDC4',
        logo_url: 'https://example.com/logos/avalok-logo.png',
        auto_send: 'TRUE',
        active: 'TRUE',
        subscription_status: 'active',
        subscription_plan: 'premium',
        payment_status: 'paid',
        onboarding_date: new Date().toISOString().split('T')[0],
        last_payment_date: new Date().toISOString().split('T')[0],
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
        arn: 'ARN_003',
        name: 'Vidyadhar Petkar',
        whatsapp: '8975758513',
        email: 'vidyadhar.petkar@example.com',
        client_segment: 'retirees',
        tone: 'educational',
        content_focus: 'safety',
        brand_colors: '#2E7D32,#FFC107',
        logo_url: 'https://example.com/logos/vidyadhar-logo.png',
        auto_send: 'TRUE',
        active: 'TRUE',
        subscription_status: 'active',
        subscription_plan: 'premium',
        payment_status: 'paid',
        onboarding_date: new Date().toISOString().split('T')[0],
        last_payment_date: new Date().toISOString().split('T')[0],
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
];

/**
 * Initialize Google Sheets
 */
async function initializeGoogleSheets() {
    try {
        // Try to load credentials
        const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
                               path.join(process.cwd(), 'config', 'google-credentials.json');
        
        const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        return sheets;
    } catch (error) {
        console.error('Error initializing Google Sheets:', error.message);
        console.log('\nUsing mock mode for testing...\n');
        return null;
    }
}

/**
 * Add advisors to Google Sheets
 */
async function addAdvisorsToSheet(sheets) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    if (!spreadsheetId) {
        console.error('GOOGLE_SHEETS_ID not configured in environment');
        return false;
    }

    try {
        // Prepare data for Advisors sheet
        const advisorRows = INITIAL_ADVISORS.map(advisor => [
            advisor.arn,
            advisor.name,
            advisor.whatsapp,
            advisor.email,
            advisor.client_segment,
            advisor.tone,
            advisor.content_focus,
            advisor.brand_colors,
            advisor.logo_url,
            advisor.auto_send,
            advisor.active,
            advisor.subscription_status,
            advisor.subscription_plan,
            advisor.payment_status,
            advisor.onboarding_date,
            advisor.last_payment_date,
            advisor.next_payment_date
        ]);

        // Append to Advisors sheet
        const appendResult = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Advisors!A:Q',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: advisorRows
            }
        });

        console.log(`✅ Added ${advisorRows.length} advisors to Google Sheets`);
        console.log(`   Updated range: ${appendResult.data.updates.updatedRange}`);
        
        return true;
    } catch (error) {
        console.error('Error adding advisors to sheet:', error.message);
        return false;
    }
}

/**
 * Create local advisor data file for testing
 */
async function createLocalAdvisorFile() {
    const dataDir = path.join(process.cwd(), 'data');
    const advisorFile = path.join(dataDir, 'initial-advisors.json');
    
    try {
        // Create data directory if it doesn't exist
        await fs.mkdir(dataDir, { recursive: true });
        
        // Save advisor data
        await fs.writeFile(
            advisorFile, 
            JSON.stringify(INITIAL_ADVISORS, null, 2)
        );
        
        console.log(`✅ Saved advisor data to ${advisorFile}`);
        return true;
    } catch (error) {
        console.error('Error saving local advisor file:', error.message);
        return false;
    }
}

/**
 * Display advisor information
 */
function displayAdvisorInfo() {
    console.log('\n========================================');
    console.log('Initial Advisors Added');
    console.log('========================================\n');
    
    INITIAL_ADVISORS.forEach((advisor, index) => {
        console.log(`Advisor ${index + 1}:`);
        console.log(`  Name: ${advisor.name}`);
        console.log(`  ARN: ${advisor.arn}`);
        console.log(`  WhatsApp: +91-${advisor.whatsapp}`);
        console.log(`  Segment: ${advisor.client_segment}`);
        console.log(`  Content Focus: ${advisor.content_focus}`);
        console.log(`  Tone: ${advisor.tone}`);
        console.log(`  Status: ${advisor.subscription_status} (${advisor.payment_status})`);
        console.log('');
    });
}

/**
 * Create test trigger script
 */
async function createTestTriggerScript() {
    const scriptContent = `#!/bin/bash

# Test Content Generation for Initial Advisors
# Run this on the VM to test content generation

echo "================================================"
echo "Testing Content Generation for Initial Advisors"
echo "================================================"
echo ""

# Test each advisor
for ARN in ARN_001 ARN_002 ARN_003; do
    echo "Triggering content generation for \$ARN..."
    
    # Trigger content orchestrator
    node -e "
    const ContentOrchestrator = require('./agents/controllers/content-orchestrator');
    const orchestrator = new ContentOrchestrator();
    
    orchestrator.processAdvisor({
        arn: '\$ARN',
        action: 'GENERATE_CONTENT'
    }).then(result => {
        console.log('Result:', result);
    }).catch(error => {
        console.error('Error:', error.message);
    });
    " 2>&1
    
    echo "Waiting 5 seconds before next advisor..."
    sleep 5
done

echo ""
echo "Test complete. Check logs with: pm2 logs content-orchestrator"
`;

    const scriptPath = path.join(process.cwd(), 'scripts', 'test-initial-advisors.sh');
    
    try {
        await fs.writeFile(scriptPath, scriptContent);
        await fs.chmod(scriptPath, '755');
        console.log(`✅ Created test script: ${scriptPath}`);
        return true;
    } catch (error) {
        console.error('Error creating test script:', error.message);
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    console.log('========================================');
    console.log('Adding Initial Advisors to System');
    console.log('========================================\n');
    
    // Try to add to Google Sheets
    console.log('Attempting to add advisors to Google Sheets...');
    const sheets = await initializeGoogleSheets();
    
    if (sheets) {
        await addAdvisorsToSheet(sheets);
    } else {
        console.log('⚠️  Google Sheets not available - using local storage');
    }
    
    // Create local file for backup/testing
    await createLocalAdvisorFile();
    
    // Create test trigger script
    await createTestTriggerScript();
    
    // Display advisor information
    displayAdvisorInfo();
    
    console.log('========================================');
    console.log('Next Steps:');
    console.log('========================================');
    console.log('1. Deploy this script to VM:');
    console.log('   scp scripts/add-initial-advisors.js root@143.110.191.97:/home/mvp/scripts/');
    console.log('');
    console.log('2. Run on VM to add advisors:');
    console.log('   node /home/mvp/scripts/add-initial-advisors.js');
    console.log('');
    console.log('3. Test content generation:');
    console.log('   ./scripts/test-initial-advisors.sh');
    console.log('');
    console.log('4. Monitor the generation:');
    console.log('   pm2 logs content-orchestrator');
    console.log('');
    console.log('Note: Advisors are marked as PAID and ACTIVE');
    console.log('Content will be generated at 8:30 PM and sent at 5:00 AM');
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    INITIAL_ADVISORS,
    addAdvisorsToSheet,
    createLocalAdvisorFile
};