/**
 * COMPLETE SETUP SCRIPT FOR shriyavallabh.ap@gmail.com
 * Sheet ID: 1zQ-J4MJ_PXknZSW8j9EpEU6z-0VEjXGSq8Vh1lK7DLY
 * 
 * INSTRUCTIONS:
 * 1. Copy ALL of this code
 * 2. In your Google Sheet, go to Extensions → Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire script
 * 5. Click Save (💾)
 * 6. Run the function: runCompleteSetup
 * 7. Authorize when prompted
 */

// CONFIGURATION - These values should be set in your environment
const CONFIG = {
  WEBHOOK_URL: 'WEBHOOK_URL_NOT_SET', // Set this to your webhook server URL
  WEBHOOK_SECRET: 'WEBHOOK_SECRET_NOT_SET', // Set this to match your webhook server secret
  SHEET_ID: 'SHEET_ID_NOT_SET', // Your Google Sheet ID
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000
};

// ============= MAIN SETUP FUNCTION - RUN THIS FIRST =============
function runCompleteSetup() {
  try {
    console.log('Starting complete setup for FinAdvise MVP...');
    
    // Step 1: Setup all sheets
    setupFinAdviseSheets();
    
    // Step 2: Add initial test data
    addTestData();
    
    // Step 3: Create custom menu
    onOpen();
    
    // Show success message
    SpreadsheetApp.getUi().alert(
      'Setup Complete!', 
      'FinAdvise MVP sheets have been set up successfully.\n\n' +
      'Next steps:\n' +
      '1. Check all 5 tabs are created\n' +
      '2. Test webhook connection from menu\n' +
      '3. Add your advisor data',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    console.log('Setup completed successfully!');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Setup Error', 'An error occurred: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
    console.error('Setup failed:', error);
  }
}

// ============= SHEET SETUP FUNCTIONS =============
function setupFinAdviseSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Clear existing sheets and create new ones
  const sheets = spreadsheet.getSheets();
  
  // Keep first sheet and rename it
  const advisorsSheet = sheets[0];
  advisorsSheet.setName('Advisors');
  
  // Delete other sheets if they exist
  for (let i = 1; i < sheets.length; i++) {
    spreadsheet.deleteSheet(sheets[i]);
  }
  
  // Create remaining sheets
  const contentSheet = spreadsheet.insertSheet('Content');
  const templatesSheet = spreadsheet.insertSheet('Templates');
  const analyticsSheet = spreadsheet.insertSheet('Analytics');
  const settingsSheet = spreadsheet.insertSheet('Settings');
  
  // Setup each sheet
  setupAdvisorsSheet(advisorsSheet);
  setupContentSheet(contentSheet);
  setupTemplatesSheet(templatesSheet);
  setupAnalyticsSheet(analyticsSheet);
  setupSettingsSheet(settingsSheet);
  
  console.log('All sheets created and configured');
}

function setupAdvisorsSheet(sheet) {
  const headers = [
    'arn', 'name', 'whatsapp', 'email', 'logo_url', 'brand_colors',
    'tone', 'client_segment', 'ticket_size', 'content_focus',
    'subscription_status', 'payment_mode', 'subscription_end_date',
    'review_mode', 'auto_send', 'override'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285F4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // arn
  sheet.setColumnWidth(2, 150); // name
  sheet.setColumnWidth(3, 120); // whatsapp
  sheet.setColumnWidth(4, 200); // email
  
  // Add data validation for dropdowns
  const validations = [
    {col: 7, values: ['professional', 'friendly', 'educational']}, // tone
    {col: 8, values: ['young', 'middle', 'senior', 'mixed']}, // client_segment
    {col: 9, values: ['small', 'medium', 'large', 'ultra']}, // ticket_size
    {col: 10, values: ['growth', 'safety', 'tax', 'balanced']}, // content_focus
    {col: 11, values: ['active', 'inactive', 'trial']}, // subscription_status
    {col: 12, values: ['monthly', 'annual']}, // payment_mode
    {col: 14, values: ['manual', 'auto']} // review_mode
  ];
  
  validations.forEach(v => {
    const range = sheet.getRange(2, v.col, 100, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(v.values)
      .build();
    range.setDataValidation(rule);
  });
  
  // Checkbox for auto_send
  const autoSendRange = sheet.getRange(2, 15, 100, 1);
  autoSendRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireCheckbox().build()
  );
  
  sheet.setFrozenRows(1);
}

function setupContentSheet(sheet) {
  const headers = [
    'id', 'date', 'advisor_arn', 'topic', 'whatsapp_text',
    'whatsapp_image_url', 'linkedin_post', 'linkedin_image_url',
    'status_image_url', 'fatigue_score', 'compliance_score',
    'quality_score', 'generation_time', 'approval_status',
    'approval_method', 'revision_count', 'delivered',
    'engagement_score', 'feedback'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  // Set column widths
  sheet.setColumnWidth(1, 100); // id
  sheet.setColumnWidth(2, 100); // date
  sheet.setColumnWidth(5, 300); // whatsapp_text
  sheet.setColumnWidth(7, 300); // linkedin_post
  
  // Add validations
  const approvalRange = sheet.getRange(2, 14, 100, 1);
  approvalRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['pending', 'approved', 'rejected'])
      .build()
  );
  
  const methodRange = sheet.getRange(2, 15, 100, 1);
  methodRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['manual', 'auto'])
      .build()
  );
  
  const deliveredRange = sheet.getRange(2, 17, 100, 1);
  deliveredRange.setDataValidation(
    SpreadsheetApp.newDataValidation().requireCheckbox().build()
  );
  
  sheet.setFrozenRows(1);
}

function setupTemplatesSheet(sheet) {
  const headers = [
    'template_id', 'template_name', 'category', 'content_type',
    'template_text', 'variables', 'tone_compatibility',
    'segment_compatibility', 'usage_count', 'effectiveness_score',
    'last_used', 'created_date', 'status'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#FBBC04')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  sheet.setColumnWidth(1, 120); // template_id
  sheet.setColumnWidth(2, 200); // template_name
  sheet.setColumnWidth(5, 400); // template_text
  
  // Validations
  const categoryRange = sheet.getRange(2, 3, 100, 1);
  categoryRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['investment', 'tax', 'insurance', 'retirement', 'general'])
      .build()
  );
  
  const typeRange = sheet.getRange(2, 4, 100, 1);
  typeRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['whatsapp', 'linkedin', 'both'])
      .build()
  );
  
  sheet.setFrozenRows(1);
}

function setupAnalyticsSheet(sheet) {
  const headers = [
    'date', 'advisor_arn', 'content_id', 'metric_type',
    'metric_value', 'platform', 'engagement_type',
    'audience_segment', 'time_of_day', 'day_of_week',
    'content_category', 'sentiment_score'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#EA4335')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
}

function setupSettingsSheet(sheet) {
  const headers = [
    'setting_key', 'setting_value', 'setting_type',
    'description', 'last_updated', 'updated_by'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#9333EA')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  // Add default settings
  const defaultSettings = [
    ['webhook_url', CONFIG.WEBHOOK_URL, 'string', 'Webhook server endpoint', new Date(), 'System'],
    ['webhook_secret', CONFIG.WEBHOOK_SECRET, 'string', 'Webhook authentication secret', new Date(), 'System'],
    ['daily_content_limit', '3', 'number', 'Maximum content pieces per advisor per day', new Date(), 'System'],
    ['auto_approval_threshold', '0.8', 'number', 'Minimum score for auto-approval', new Date(), 'System'],
    ['revision_max_attempts', '3', 'number', 'Maximum revision attempts per content', new Date(), 'System'],
    ['content_generation_timeout', '120', 'number', 'Timeout in seconds for content generation', new Date(), 'System'],
    ['enable_notifications', 'true', 'boolean', 'Enable email notifications', new Date(), 'System'],
    ['notification_email', 'ADMIN_EMAIL_NOT_SET', 'string', 'Admin notification email', new Date(), 'System']
  ];
  
  sheet.getRange(2, 1, defaultSettings.length, headers.length).setValues(defaultSettings);
  sheet.setFrozenRows(1);
}

// ============= TEST DATA FUNCTION =============
function addTestData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const advisorSheet = spreadsheet.getSheetByName('Advisors');
  
  // Add a test advisor
  const testAdvisor = [
    'TEST001', // arn
    'Demo Financial Advisor', // name
    '+919876543210', // whatsapp
    'demo@finadvise.com', // email
    'https://example.com/logo.png', // logo_url
    '#003366,#FFD700', // brand_colors
    'professional', // tone
    'middle', // client_segment
    'medium', // ticket_size
    'balanced', // content_focus
    'active', // subscription_status
    'monthly', // payment_mode
    new Date('2025-12-31'), // subscription_end_date
    'manual', // review_mode
    true, // auto_send
    '' // override
  ];
  
  advisorSheet.getRange(2, 1, 1, testAdvisor.length).setValues([testAdvisor]);
  console.log('Test data added');
}

// ============= WEBHOOK FUNCTIONS =============
function sendWebhook(payload) {
  const settings = getSettings();
  const webhookUrl = settings['webhook_url'] || CONFIG.WEBHOOK_URL;
  const webhookSecret = settings['webhook_secret'] || CONFIG.WEBHOOK_SECRET;
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'X-Webhook-Secret': webhookSecret
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      throw new Error(`HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}

function getSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  
  return settings;
}

// ============= TEST FUNCTIONS =============
function testWebhookConnection() {
  try {
    const response = sendWebhook({
      action: 'test',
      message: 'Testing connection from Google Sheets',
      timestamp: new Date().toISOString(),
      sheetId: CONFIG.SHEET_ID,
      user: Session.getActiveUser().getEmail()
    });
    
    SpreadsheetApp.getUi().alert(
      'Connection Successful!',
      'Webhook server responded successfully.\n\n' +
      'Response: ' + JSON.stringify(response),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Connection Failed',
      'Could not connect to webhook server.\n\n' +
      'Error: ' + error.toString() + '\n\n' +
      'Make sure the webhook server is running locally:\n' +
      'pm2 start config/ecosystem.config.js',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

function testContentGeneration() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Get first advisor from sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Advisors');
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      ui.alert('No Advisors', 'Please add an advisor to the Advisors sheet first.', ui.ButtonSet.OK);
      return;
    }
    
    const headers = data[0];
    const advisorRow = data[1];
    const advisor = {};
    
    headers.forEach((header, index) => {
      advisor[header] = advisorRow[index];
    });
    
    const response = sendWebhook({
      action: 'generate',
      timestamp: new Date().toISOString(),
      advisor: advisor,
      topic: 'Test Topic - Financial Planning',
      requestId: Utilities.getUuid()
    });
    
    ui.alert(
      'Content Generation Triggered',
      'Successfully triggered content generation for ' + advisor.name,
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('Error', 'Failed to trigger content generation: ' + error.toString(), ui.ButtonSet.OK);
  }
}

// ============= MENU SETUP =============
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 FinAdvise MVP')
    .addItem('📋 Run Complete Setup', 'runCompleteSetup')
    .addSeparator()
    .addItem('🔌 Test Webhook Connection', 'testWebhookConnection')
    .addItem('📝 Test Content Generation', 'testContentGeneration')
    .addSeparator()
    .addItem('ℹ️ Show Configuration', 'showConfiguration')
    .addItem('📊 Check System Status', 'checkSystemStatus')
    .addToUi();
}

function showConfiguration() {
  const settings = getSettings();
  const ui = SpreadsheetApp.getUi();
  
  const message = 
    'Current Configuration:\n\n' +
    '📋 Sheet ID: ' + CONFIG.SHEET_ID + '\n' +
    '🔗 Webhook URL: ' + (settings['webhook_url'] || CONFIG.WEBHOOK_URL) + '\n' +
    '🔑 Webhook Secret: ' + (settings['webhook_secret'] || CONFIG.WEBHOOK_SECRET).substring(0, 5) + '...\n' +
    '📧 Notification Email: ' + (settings['notification_email'] || 'Not set') + '\n' +
    '📊 Daily Content Limit: ' + (settings['daily_content_limit'] || '3') + '\n\n' +
    'You can modify these in the Settings tab.';
  
  ui.alert('Configuration', message, ui.ButtonSet.OK);
}

function checkSystemStatus() {
  const ui = SpreadsheetApp.getUi();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    const advisorCount = spreadsheet.getSheetByName('Advisors').getLastRow() - 1;
    const contentCount = spreadsheet.getSheetByName('Content').getLastRow() - 1;
    const templateCount = spreadsheet.getSheetByName('Templates').getLastRow() - 1;
    
    let webhookStatus = '❌ Not Connected';
    try {
      const response = sendWebhook({action: 'test', silent: true});
      if (response) webhookStatus = '✅ Connected';
    } catch (e) {
      // Webhook not connected
    }
    
    const message = 
      'System Status:\n\n' +
      '📊 Advisors: ' + advisorCount + '\n' +
      '📝 Content Items: ' + contentCount + '\n' +
      '📋 Templates: ' + templateCount + '\n' +
      '🔌 Webhook Server: ' + webhookStatus + '\n' +
      '👤 User: ' + Session.getActiveUser().getEmail() + '\n' +
      '📅 Last Check: ' + new Date().toLocaleString();
    
    ui.alert('System Status', message, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Could not check system status: ' + error.toString(), ui.ButtonSet.OK);
  }
}

// ============= AUTO-RUN ON SHEET OPEN =============
// This will create the menu when the sheet is opened
function onInstall(e) {
  onOpen(e);
}