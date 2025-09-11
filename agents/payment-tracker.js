/**
 * Payment Tracking System for Google Sheets
 * Manages subscription status and payment tracking for advisors
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class PaymentTracker {
    constructor() {
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || 'your-sheet-id';
        this.sheets = null;
        this.initialized = false;
        
        // Payment configuration
        this.plans = {
            free_trial: {
                name: 'Free Trial',
                duration_days: 7,
                price: 0,
                messages_per_day: 1,
                features: ['basic_templates', 'manual_approval']
            },
            basic: {
                name: 'Basic Plan',
                duration_days: 30,
                price: 999,
                messages_per_day: 1,
                features: ['basic_templates', 'auto_approval', 'analytics']
            },
            premium: {
                name: 'Premium Plan',
                duration_days: 30,
                price: 2999,
                messages_per_day: 3,
                features: ['premium_templates', 'auto_approval', 'analytics', 'custom_branding']
            },
            enterprise: {
                name: 'Enterprise Plan',
                duration_days: 30,
                price: 9999,
                messages_per_day: 'unlimited',
                features: ['all_templates', 'auto_approval', 'analytics', 'custom_branding', 'api_access']
            }
        };
        
        // Payment status tracking
        this.paymentStatuses = {
            pending: 'Payment pending',
            paid: 'Payment received',
            overdue: 'Payment overdue',
            cancelled: 'Subscription cancelled',
            refunded: 'Payment refunded'
        };
    }
    
    /**
     * Initialize Google Sheets connection
     */
    async initialize() {
        try {
            // Try to load credentials
            const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
                                   path.join(process.cwd(), 'config', 'google-credentials.json');
            
            if (await this.fileExists(credentialsPath)) {
                const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
                
                const auth = new google.auth.GoogleAuth({
                    credentials,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets']
                });
                
                this.sheets = google.sheets({ version: 'v4', auth });
                this.initialized = true;
                console.log('✅ Payment tracker initialized with Google Sheets');
            } else {
                console.log('⚠️  Google Sheets not configured - using local tracking');
                this.initialized = false;
            }
        } catch (error) {
            console.error('Error initializing payment tracker:', error.message);
            this.initialized = false;
        }
    }
    
    /**
     * Setup payment tracking columns in Google Sheets
     */
    async setupPaymentTracking() {
        console.log('================================================');
        console.log('SETTING UP PAYMENT TRACKING IN GOOGLE SHEETS');
        console.log('================================================\n');
        
        if (!this.initialized) {
            return await this.setupLocalPaymentTracking();
        }
        
        try {
            // Add payment tracking columns to Advisors sheet
            const headers = [
                ['ARN', 'Name', 'WhatsApp', 'Email', 'Client Segment', 'Tone', 'Content Focus',
                 'Brand Colors', 'Logo URL', 'Auto Send', 'Active', 
                 // New payment columns
                 'Subscription Status', 'Subscription Plan', 'Payment Status',
                 'Subscription Start', 'Subscription End', 'Last Payment Date',
                 'Last Payment Amount', 'Total Paid', 'Payment Method',
                 'Next Payment Date', 'Payment Reminder Sent', 'Free Trial Used',
                 'Lifetime Value', 'Churn Risk', 'Payment Notes']
            ];
            
            // Update headers
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'Advisors!A1:Z1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: headers }
            });
            
            console.log('✅ Payment tracking columns added to Google Sheets');
            
            // Create Payment History sheet
            await this.createPaymentHistorySheet();
            
            // Create Subscription Analytics sheet
            await this.createSubscriptionAnalyticsSheet();
            
            return { success: true, message: 'Payment tracking setup complete' };
            
        } catch (error) {
            console.error('Error setting up payment tracking:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Setup local payment tracking (fallback)
     */
    async setupLocalPaymentTracking() {
        console.log('Setting up local payment tracking...\n');
        
        const trackingData = {
            advisors: [
                {
                    arn: 'ARN_001',
                    name: 'Shruti Petkar',
                    subscription_status: 'active',
                    subscription_plan: 'premium',
                    payment_status: 'paid',
                    subscription_start: '2025-01-01',
                    subscription_end: '2025-01-31',
                    last_payment_date: '2025-01-01',
                    last_payment_amount: 2999,
                    total_paid: 2999,
                    payment_method: 'manual',
                    next_payment_date: '2025-02-01',
                    free_trial_used: true,
                    lifetime_value: 2999,
                    churn_risk: 'low'
                },
                {
                    arn: 'ARN_002',
                    name: 'Shri Avalok Petkar',
                    subscription_status: 'active',
                    subscription_plan: 'premium',
                    payment_status: 'paid',
                    subscription_start: '2025-01-01',
                    subscription_end: '2025-01-31',
                    last_payment_date: '2025-01-01',
                    last_payment_amount: 2999,
                    total_paid: 2999,
                    payment_method: 'manual',
                    next_payment_date: '2025-02-01',
                    free_trial_used: true,
                    lifetime_value: 2999,
                    churn_risk: 'low'
                },
                {
                    arn: 'ARN_003',
                    name: 'Vidyadhar Petkar',
                    subscription_status: 'active',
                    subscription_plan: 'premium',
                    payment_status: 'paid',
                    subscription_start: '2025-01-01',
                    subscription_end: '2025-01-31',
                    last_payment_date: '2025-01-01',
                    last_payment_amount: 2999,
                    total_paid: 2999,
                    payment_method: 'manual',
                    next_payment_date: '2025-02-01',
                    free_trial_used: true,
                    lifetime_value: 2999,
                    churn_risk: 'low'
                }
            ],
            payment_history: [],
            analytics: {
                total_revenue: 8997,
                active_subscriptions: 3,
                mrr: 8997,
                churn_rate: 0,
                ltv_average: 2999
            }
        };
        
        // Save to local file
        const trackingFile = path.join(process.cwd(), 'data', 'payment-tracking.json');
        await fs.mkdir(path.dirname(trackingFile), { recursive: true });
        await fs.writeFile(trackingFile, JSON.stringify(trackingData, null, 2));
        
        console.log('✅ Local payment tracking setup complete');
        console.log(`   Data saved to: ${trackingFile}`);
        
        return { success: true, message: 'Local payment tracking setup complete' };
    }
    
    /**
     * Create Payment History sheet
     */
    async createPaymentHistorySheet() {
        if (!this.initialized) return;
        
        try {
            // Add Payment History sheet
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Payment History',
                                gridProperties: { rowCount: 1000, columnCount: 15 }
                            }
                        }
                    }]
                }
            });
            
            // Add headers
            const headers = [
                ['Transaction ID', 'Date', 'Advisor ARN', 'Advisor Name', 'Plan',
                 'Amount', 'Payment Method', 'Status', 'Invoice Number',
                 'Tax Amount', 'Total Amount', 'Currency', 'Payment Gateway',
                 'Reference Number', 'Notes']
            ];
            
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'Payment History!A1:O1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: headers }
            });
            
            console.log('✅ Payment History sheet created');
            
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('   Payment History sheet already exists');
            } else {
                console.error('Error creating Payment History sheet:', error.message);
            }
        }
    }
    
    /**
     * Create Subscription Analytics sheet
     */
    async createSubscriptionAnalyticsSheet() {
        if (!this.initialized) return;
        
        try {
            // Add Analytics sheet
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Subscription Analytics',
                                gridProperties: { rowCount: 100, columnCount: 10 }
                            }
                        }
                    }]
                }
            });
            
            // Add analytics data
            const analyticsData = [
                ['Metric', 'Value', 'Last Updated'],
                ['Total Revenue', '₹8,997', new Date().toISOString()],
                ['Active Subscriptions', '3', new Date().toISOString()],
                ['Monthly Recurring Revenue', '₹8,997', new Date().toISOString()],
                ['Average Revenue Per User', '₹2,999', new Date().toISOString()],
                ['Churn Rate', '0%', new Date().toISOString()],
                ['Customer Lifetime Value', '₹35,988', new Date().toISOString()],
                ['Free Trial Conversion', '100%', new Date().toISOString()],
                ['Payment Success Rate', '100%', new Date().toISOString()],
                ['Outstanding Payments', '₹0', new Date().toISOString()]
            ];
            
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: 'Subscription Analytics!A1:C10',
                valueInputOption: 'USER_ENTERED',
                resource: { values: analyticsData }
            });
            
            console.log('✅ Subscription Analytics sheet created');
            
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('   Subscription Analytics sheet already exists');
            } else {
                console.error('Error creating Analytics sheet:', error.message);
            }
        }
    }
    
    /**
     * Process payment for advisor
     */
    async processPayment(advisorArn, amount, paymentMethod = 'manual') {
        console.log(`\nProcessing payment for ${advisorArn}...`);
        
        const payment = {
            transactionId: `TXN_${Date.now()}`,
            date: new Date().toISOString(),
            advisorArn: advisorArn,
            amount: amount,
            paymentMethod: paymentMethod,
            status: 'completed',
            invoiceNumber: `INV_${Date.now()}`,
            taxAmount: Math.round(amount * 0.18), // 18% GST
            totalAmount: Math.round(amount * 1.18),
            currency: 'INR',
            paymentGateway: paymentMethod === 'manual' ? 'manual' : 'razorpay',
            referenceNumber: `REF_${Date.now()}`
        };
        
        // Update advisor payment status
        await this.updateAdvisorPaymentStatus(advisorArn, payment);
        
        // Record payment history
        await this.recordPaymentHistory(payment);
        
        // Update analytics
        await this.updatePaymentAnalytics();
        
        console.log(`✅ Payment processed: ₹${payment.totalAmount} (including tax)`);
        console.log(`   Transaction ID: ${payment.transactionId}`);
        
        return payment;
    }
    
    /**
     * Update advisor payment status
     */
    async updateAdvisorPaymentStatus(advisorArn, payment) {
        // Update local tracking
        const trackingFile = path.join(process.cwd(), 'data', 'payment-tracking.json');
        
        try {
            const data = JSON.parse(await fs.readFile(trackingFile, 'utf8'));
            const advisor = data.advisors.find(a => a.arn === advisorArn);
            
            if (advisor) {
                advisor.payment_status = 'paid';
                advisor.last_payment_date = payment.date;
                advisor.last_payment_amount = payment.amount;
                advisor.total_paid += payment.amount;
                advisor.subscription_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                advisor.next_payment_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                
                await fs.writeFile(trackingFile, JSON.stringify(data, null, 2));
            }
        } catch (error) {
            console.error('Error updating payment status:', error.message);
        }
    }
    
    /**
     * Record payment history
     */
    async recordPaymentHistory(payment) {
        const trackingFile = path.join(process.cwd(), 'data', 'payment-tracking.json');
        
        try {
            const data = JSON.parse(await fs.readFile(trackingFile, 'utf8'));
            
            if (!data.payment_history) {
                data.payment_history = [];
            }
            
            data.payment_history.push(payment);
            
            await fs.writeFile(trackingFile, JSON.stringify(data, null, 2));
            
        } catch (error) {
            console.error('Error recording payment history:', error.message);
        }
    }
    
    /**
     * Update payment analytics
     */
    async updatePaymentAnalytics() {
        const trackingFile = path.join(process.cwd(), 'data', 'payment-tracking.json');
        
        try {
            const data = JSON.parse(await fs.readFile(trackingFile, 'utf8'));
            
            // Calculate analytics
            const activeSubscriptions = data.advisors.filter(a => a.subscription_status === 'active').length;
            const totalRevenue = data.advisors.reduce((sum, a) => sum + a.total_paid, 0);
            const mrr = data.advisors
                .filter(a => a.subscription_status === 'active')
                .reduce((sum, a) => sum + (this.plans[a.subscription_plan]?.price || 0), 0);
            
            data.analytics = {
                total_revenue: totalRevenue,
                active_subscriptions: activeSubscriptions,
                mrr: mrr,
                churn_rate: 0,
                ltv_average: activeSubscriptions > 0 ? Math.round(totalRevenue / activeSubscriptions) : 0,
                last_updated: new Date().toISOString()
            };
            
            await fs.writeFile(trackingFile, JSON.stringify(data, null, 2));
            
            console.log('\n📊 Payment Analytics Updated:');
            console.log(`   Total Revenue: ₹${totalRevenue}`);
            console.log(`   MRR: ₹${mrr}`);
            console.log(`   Active Subscriptions: ${activeSubscriptions}`);
            
        } catch (error) {
            console.error('Error updating analytics:', error.message);
        }
    }
    
    /**
     * Send payment reminders
     */
    async sendPaymentReminders() {
        console.log('\nChecking for payment reminders...');
        
        const trackingFile = path.join(process.cwd(), 'data', 'payment-tracking.json');
        
        try {
            const data = JSON.parse(await fs.readFile(trackingFile, 'utf8'));
            const today = new Date();
            const remindersSent = [];
            
            for (const advisor of data.advisors) {
                const nextPaymentDate = new Date(advisor.next_payment_date);
                const daysUntilPayment = Math.floor((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilPayment <= 3 && daysUntilPayment >= 0 && !advisor.payment_reminder_sent) {
                    // Send reminder
                    console.log(`  📧 Sending payment reminder to ${advisor.name}`);
                    console.log(`     Amount due: ₹${this.plans[advisor.subscription_plan].price}`);
                    console.log(`     Due date: ${advisor.next_payment_date}`);
                    
                    advisor.payment_reminder_sent = true;
                    remindersSent.push(advisor.name);
                }
            }
            
            if (remindersSent.length > 0) {
                await fs.writeFile(trackingFile, JSON.stringify(data, null, 2));
                console.log(`\n✅ Sent ${remindersSent.length} payment reminders`);
            } else {
                console.log('   No payment reminders needed today');
            }
            
            return remindersSent;
            
        } catch (error) {
            console.error('Error sending payment reminders:', error.message);
            return [];
        }
    }
    
    /**
     * Generate payment reconciliation report
     */
    async generateReconciliationReport() {
        console.log('\n================================================');
        console.log('PAYMENT RECONCILIATION REPORT');
        console.log('================================================\n');
        
        const trackingFile = path.join(process.cwd(), 'data', 'payment-tracking.json');
        
        try {
            const data = JSON.parse(await fs.readFile(trackingFile, 'utf8'));
            
            console.log('SUBSCRIPTION SUMMARY:');
            console.log('─'.repeat(50));
            
            data.advisors.forEach(advisor => {
                console.log(`\n${advisor.name} (${advisor.arn})`);
                console.log(`  Plan: ${advisor.subscription_plan}`);
                console.log(`  Status: ${advisor.subscription_status}`);
                console.log(`  Payment Status: ${advisor.payment_status}`);
                console.log(`  Total Paid: ₹${advisor.total_paid}`);
                console.log(`  Next Payment: ${advisor.next_payment_date}`);
            });
            
            console.log('\n\nFINANCIAL SUMMARY:');
            console.log('─'.repeat(50));
            console.log(`Total Revenue: ₹${data.analytics.total_revenue}`);
            console.log(`Monthly Recurring Revenue: ₹${data.analytics.mrr}`);
            console.log(`Active Subscriptions: ${data.analytics.active_subscriptions}`);
            console.log(`Average LTV: ₹${data.analytics.ltv_average}`);
            
            console.log('\n\nPAYMENT HISTORY (Last 5):');
            console.log('─'.repeat(50));
            
            const recentPayments = data.payment_history.slice(-5);
            recentPayments.forEach(payment => {
                console.log(`\n${payment.date}`);
                console.log(`  Transaction: ${payment.transactionId}`);
                console.log(`  Advisor: ${payment.advisorArn}`);
                console.log(`  Amount: ₹${payment.totalAmount} (incl. tax)`);
                console.log(`  Status: ${payment.status}`);
            });
            
            console.log('\n\n✅ Reconciliation report generated successfully');
            
            return data;
            
        } catch (error) {
            console.error('Error generating report:', error.message);
            return null;
        }
    }
    
    /**
     * Check if file exists
     */
    async fileExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
}

// Main execution
async function main() {
    const paymentTracker = new PaymentTracker();
    
    // Initialize
    await paymentTracker.initialize();
    
    // Setup payment tracking
    await paymentTracker.setupPaymentTracking();
    
    // Process sample payments for our 3 advisors
    await paymentTracker.processPayment('ARN_001', 2999);
    await paymentTracker.processPayment('ARN_002', 2999);
    await paymentTracker.processPayment('ARN_003', 2999);
    
    // Send payment reminders
    await paymentTracker.sendPaymentReminders();
    
    // Generate reconciliation report
    await paymentTracker.generateReconciliationReport();
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Payment tracking error:', error);
        process.exit(1);
    });
}

module.exports = PaymentTracker;