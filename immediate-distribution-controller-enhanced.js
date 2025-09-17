const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import research-backed modules
const CircuitBreaker = require('./services/distribution/circuit-breaker');
const KPIMonitor = require('./services/distribution/kpi-monitor');

// Distribution Controller Agent - Production-Grade Implementation
console.log('🚀 DISTRIBUTION CONTROLLER AGENT - PRODUCTION MODE');
console.log('📊 KPI-Driven Delivery with Circuit Breaker Protection');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    maxRetries: 3,
    retryDelay: 2000,
    circuitBreakerThreshold: 0.20, // 20% failure rate
    circuitBreakerTimeout: 600000   // 10 minutes
};

const APPROVED_CONTENT_FILE = path.join(__dirname, 'data/approved-content.json');
const DELIVERY_REPORT_FILE = path.join(__dirname, 'data/delivery-report.json');
const FAILED_DELIVERIES_FILE = path.join(__dirname, 'data/failed-deliveries.log');
const TRACEABILITY_MATRIX_FILE = path.join(__dirname, 'data/traceability-matrix.json');

// Initialize monitoring systems
const circuitBreaker = new CircuitBreaker({
    threshold: CONFIG.circuitBreakerThreshold,
    timeout: CONFIG.circuitBreakerTimeout
});

const kpiMonitor = new KPIMonitor();

// Circuit breaker state change listener
circuitBreaker.onStateChange((oldState, newState, stats) => {
    console.log(`🔄 Circuit Breaker state changed: ${oldState} → ${newState}`);
    console.log(`   Failure rate: ${(stats.failureRate * 100).toFixed(2)}%`);
    if (newState === 'OPEN') {
        kpiMonitor.recordCircuitBreakerTrigger();
    }
});

/**
 * Categorize error for proper handling
 */
function categorizeError(errorMessage) {
    if (!errorMessage) return 'UNKNOWN';

    const message = errorMessage.toLowerCase();

    if (message.includes('invalid') || message.includes('not found')) {
        return 'PERMANENT'; // Invalid phone number
    }
    if (message.includes('timeout') || message.includes('network')) {
        return 'TRANSIENT'; // Network issues
    }
    if (message.includes('rate') || message.includes('limit')) {
        return 'TRANSIENT'; // API throttling
    }
    if (message.includes('auth') || message.includes('token')) {
        return 'SYSTEMIC'; // Authentication failure
    }

    return 'TRANSIENT';
}

// Advanced WhatsApp message sender with retry logic and jitter
async function sendWhatsAppMessage(to, message, retryCount = 0) {
    const startTime = Date.now();

    try {
        console.log(`   📤 [Attempt ${retryCount + 1}/${CONFIG.maxRetries + 1}] Sending message to ${to}...`);
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const messageId = response.data.messages?.[0]?.id;
        const deliveryTimeMs = Date.now() - startTime;
        console.log(`   ✅ Text delivered! ID: ${messageId} (${deliveryTimeMs}ms)`);
        return { success: true, messageId, retryCount, deliveryTimeMs };
    } catch (error) {
        console.error(`   ❌ Delivery failed (attempt ${retryCount + 1}):`, error.response?.data?.error?.message || error.message);

        // Exponential backoff retry logic with jitter
        if (retryCount < CONFIG.maxRetries) {
            const baseDelay = CONFIG.retryDelay * Math.pow(2, retryCount);
            const jitter = Math.random() * 1000; // Add 0-1000ms jitter
            const delay = baseDelay + jitter;
            console.log(`   ⏳ Retrying in ${Math.round(delay)}ms (base: ${baseDelay}ms, jitter: ${Math.round(jitter)}ms)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return await sendWhatsAppMessage(to, message, retryCount + 1);
        }

        const deliveryTimeMs = Date.now() - startTime;
        const errorDetail = error.response?.data?.error?.message || error.message;

        // Categorize error type
        const errorCategory = categorizeError(errorDetail);
        console.log(`   ❌ Delivery failed - Category: ${errorCategory}`);

        return {
            success: false,
            error: errorDetail,
            errorCategory,
            retryCount,
            deliveryTimeMs
        };
    }
}

// Advanced WhatsApp image sender with retry logic and jitter
async function sendWhatsAppImage(to, imageUrl, caption, retryCount = 0) {
    const startTime = Date.now();

    try {
        console.log(`   🖼️ [Attempt ${retryCount + 1}/${CONFIG.maxRetries + 1}] Sending image to ${to}...`);
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: {
                    link: imageUrl,
                    caption: caption || ''
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        const messageId = response.data.messages?.[0]?.id;
        const deliveryTimeMs = Date.now() - startTime;
        console.log(`   ✅ Image delivered! ID: ${messageId} (${deliveryTimeMs}ms)`);
        return { success: true, messageId, retryCount, deliveryTimeMs };
    } catch (error) {
        console.error(`   ❌ Image delivery failed (attempt ${retryCount + 1}):`, error.response?.data?.error?.message || error.message);

        // Exponential backoff retry logic with jitter
        if (retryCount < CONFIG.maxRetries) {
            const baseDelay = CONFIG.retryDelay * Math.pow(2, retryCount);
            const jitter = Math.random() * 1000;
            const delay = baseDelay + jitter;
            console.log(`   ⏳ Retrying in ${Math.round(delay)}ms (base: ${baseDelay}ms, jitter: ${Math.round(jitter)}ms)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return await sendWhatsAppImage(to, imageUrl, caption, retryCount + 1);
        }

        const deliveryTimeMs = Date.now() - startTime;
        const errorDetail = error.response?.data?.error?.message || error.message;
        const errorCategory = categorizeError(errorDetail);

        return {
            success: false,
            error: errorDetail,
            errorCategory,
            retryCount,
            deliveryTimeMs
        };
    }
}

// Load approved content
async function loadApprovedContent() {
    try {
        const data = await fs.readFile(APPROVED_CONTENT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Failed to load approved content:', error);
        throw new Error('Unable to load approved content for distribution');
    }
}

// Update delivery status in approved content file
async function updateDeliveryStatus(content) {
    try {
        await fs.writeFile(APPROVED_CONTENT_FILE, JSON.stringify(content, null, 2));
        console.log('✅ Delivery status updated in approved content file');
    } catch (error) {
        console.error('❌ Failed to update delivery status:', error);
    }
}

/**
 * Log failed delivery for manual follow-up
 */
async function logFailedDelivery(advisor, error) {
    const failureEntry = {
        timestamp: new Date().toISOString(),
        arn: advisor.arn,
        name: advisor.name,
        whatsapp: advisor.whatsapp,
        error: error.error,
        errorCategory: error.errorCategory,
        retryCount: error.retryCount,
        needsManualFollowup: true
    };

    try {
        let existingFailures = [];
        try {
            const data = await fs.readFile(FAILED_DELIVERIES_FILE, 'utf8');
            existingFailures = JSON.parse(data);
        } catch (e) {
            // File doesn't exist or is empty
        }

        existingFailures.push(failureEntry);
        await fs.writeFile(FAILED_DELIVERIES_FILE, JSON.stringify(existingFailures, null, 2));
        console.log(`   📁 Logged failed delivery for manual follow-up`);
    } catch (error) {
        console.error('❌ Failed to log delivery failure:', error);
    }
}

/**
 * Update traceability matrix with distribution results
 */
async function updateTraceabilityMatrix(phase, agentData) {
    try {
        let matrix = {};
        try {
            const data = await fs.readFile(TRACEABILITY_MATRIX_FILE, 'utf8');
            matrix = JSON.parse(data);
        } catch (e) {
            // File doesn't exist, create new matrix
            matrix = { phases: {} };
        }

        if (!matrix.phases[phase]) {
            matrix.phases[phase] = {
                name: 'DISTRIBUTION & TRACKING',
                agents: []
            };
        }

        matrix.phases[phase].agents.push(agentData);
        matrix.lastUpdated = new Date().toISOString();

        await fs.writeFile(TRACEABILITY_MATRIX_FILE, JSON.stringify(matrix, null, 2));
    } catch (error) {
        console.error('❌ Failed to update traceability matrix:', error);
    }
}

/**
 * Create worklog entry for distribution run
 */
async function createWorklogEntry(summary) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const worklogFile = path.join(__dirname, 'worklog', `worklog-${timestamp}.md`);

    const entry = `# Distribution Run Worklog
Date: ${new Date().toISOString()}

## Summary
- Total Advisors: ${summary.totalAdvisors}
- Successful Deliveries: ${summary.successful}
- Failed Deliveries: ${summary.failed}
- Success Rate: ${summary.deliveryRate}
- Circuit Breaker Triggers: ${summary.circuitBreakerTriggers || 0}

## KPI Compliance
- First Attempt Success Rate: ${summary.firstAttemptSuccessRate || 'N/A'}
- Average Delivery Time: ${summary.avgDeliveryTime || 'N/A'}
- SLA Compliant: ${summary.slaCompliant || 'N/A'}

## Research-Backed Improvements Applied
- Exponential backoff with jitter for retry logic
- Circuit breaker pattern for systemic failure prevention
- Error categorization for proper handling
- KPI monitoring for SLA compliance
- Traceability matrix integration for audit trail
`;

    try {
        await fs.mkdir(path.dirname(worklogFile), { recursive: true });
        await fs.writeFile(worklogFile, entry);
        console.log(`📋 Worklog entry created: ${worklogFile}`);
    } catch (error) {
        console.error('❌ Failed to create worklog entry:', error);
    }
}

// Generate delivery report with KPI metrics
async function generateDeliveryReport(results) {
    const kpiReport = kpiMonitor.generateReport();

    const report = {
        distributionId: `DIST_${Date.now()}`,
        timestamp: new Date().toISOString(),
        totalAdvisors: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        deliveryRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(2)}%`,
        averageRetries: (results.reduce((sum, r) => sum + (r.retryCount || 0), 0) / results.length).toFixed(1),
        kpiCompliance: kpiReport.summary,
        violations: kpiReport.violations,
        results: results,
        generatedAt: new Date().toISOString()
    };

    try {
        await fs.writeFile(DELIVERY_REPORT_FILE, JSON.stringify(report, null, 2));
        console.log('📊 Delivery report generated:', DELIVERY_REPORT_FILE);
        return report;
    } catch (error) {
        console.error('❌ Failed to save delivery report:', error);
        return report;
    }
}

// Main distribution function with circuit breaker and KPI monitoring
async function distributeContent() {
    console.log('\n🎯 INITIATING PRODUCTION-GRADE DISTRIBUTION');
    console.log('=' .repeat(60));

    // Start KPI monitoring
    kpiMonitor.reset();
    kpiMonitor.startDistribution();

    // Initialize traceability
    const distributionStartTime = new Date().toISOString();
    await updateTraceabilityMatrix('5', {
        name: 'distribution-controller',
        status: 'started',
        startTime: distributionStartTime,
        color: 'teal'
    });

    try {
        // Load approved content
        const approvedContent = await loadApprovedContent();
        const advisors = Object.keys(approvedContent);

        console.log(`📊 Found ${advisors.length} advisors with approved content`);
        console.log(`🔄 Circuit Breaker Status: ${circuitBreaker.state}`);

        if (advisors.length === 0) {
            console.log('❌ No approved content found for distribution');
            return;
        }

        const distributionResults = [];
        let successCount = 0;
        let failCount = 0;
        let skippedDueToCircuitBreaker = 0;

        // Process each advisor
        for (const arn of advisors) {
            // Check circuit breaker before each delivery
            if (circuitBreaker.isOpen()) {
                console.log(`\n⚠️ Circuit breaker OPEN - Skipping ${arn}`);
                skippedDueToCircuitBreaker++;
                continue;
            }

            const advisorData = approvedContent[arn];
            const advisor = advisorData.advisor;

            console.log(`\n📤 PROCESSING: ${advisor.name} (${arn})`);
            console.log(`   WhatsApp: ${advisor.whatsapp}`);

            const advisorResult = {
                arn,
                name: advisor.name,
                whatsapp: advisor.whatsapp,
                messages: [],
                success: true,
                timestamp: new Date().toISOString()
            };

            // Send WhatsApp message content
            console.log('   📱 Sending WhatsApp message...');
            const whatsappResult = await sendWhatsAppMessage(
                advisor.whatsapp,
                advisorData.whatsapp.text
            );
            advisorResult.messages.push({ type: 'whatsapp_text', ...whatsappResult });

            // Record delivery metrics
            kpiMonitor.recordDelivery(whatsappResult);
            if (whatsappResult.success) {
                circuitBreaker.recordSuccess();
            } else {
                circuitBreaker.recordFailure();
            }

            // Send marketing image if available
            if (advisorData.images?.marketing?.url) {
                console.log('   🖼️ Sending marketing image...');
                const imageResult = await sendWhatsAppImage(
                    advisor.whatsapp,
                    advisorData.images.marketing.url,
                    `📊 Today's Market Insights from ${advisor.name}`
                );
                advisorResult.messages.push({ type: 'marketing_image', ...imageResult });

                // Record metrics for image
                kpiMonitor.recordDelivery(imageResult);
                if (imageResult.success) {
                    circuitBreaker.recordSuccess();
                } else {
                    circuitBreaker.recordFailure();
                }
            }

            // Send LinkedIn post as formatted message
            console.log('   📝 Sending LinkedIn post...');
            const linkedInMsg = `📝 *Your LinkedIn Post for Today*\n\n` +
                `${advisorData.linkedIn.text.substring(0, 700)}...\n\n` +
                `📱 _Full post (${advisorData.linkedIn.characterCount} chars) ready to copy-paste_`;

            const linkedInResult = await sendWhatsAppMessage(advisor.whatsapp, linkedInMsg);
            advisorResult.messages.push({ type: 'linkedin_post', ...linkedInResult });

            // Record metrics for LinkedIn
            kpiMonitor.recordDelivery(linkedInResult);
            if (linkedInResult.success) {
                circuitBreaker.recordSuccess();
            } else {
                circuitBreaker.recordFailure();
            }

            // Check if all messages were successful
            const allSuccessful = advisorResult.messages.every(msg => msg.success);
            advisorResult.success = allSuccessful;

            if (allSuccessful) {
                console.log(`   ✅ ALL CONTENT DELIVERED to ${advisor.name}`);
                successCount++;

                // Update delivery status in approved content
                approvedContent[arn].immediateDeliveredAt = new Date().toISOString();
                approvedContent[arn].immediateDeliveryStatus = 'completed';
                approvedContent[arn].awaitingDelivery = false;
            } else {
                console.log(`   ❌ PARTIAL/FAILED DELIVERY to ${advisor.name}`);
                failCount++;
                approvedContent[arn].immediateDeliveryStatus = 'failed';

                // Log failed delivery for manual follow-up
                const failedMessages = advisorResult.messages.filter(m => !m.success);
                if (failedMessages.length > 0) {
                    await logFailedDelivery(advisor, failedMessages[0]);
                }
            }

            distributionResults.push(advisorResult);

            // Small delay between advisors to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // End KPI monitoring
        kpiMonitor.endDistribution();

        // Update delivery status file
        await updateDeliveryStatus(approvedContent);

        // Generate delivery report
        const report = await generateDeliveryReport(distributionResults);

        // Update traceability matrix with completion
        await updateTraceabilityMatrix('5', {
            name: 'distribution-controller',
            status: 'completed',
            startTime: distributionStartTime,
            endTime: new Date().toISOString(),
            output: {
                totalAdvisors: advisors.length,
                successful: successCount,
                failed: failCount,
                skipped: skippedDueToCircuitBreaker,
                circuitBreakerStatus: circuitBreaker.getStatus()
            },
            color: 'teal'
        });

        // Create worklog entry
        await createWorklogEntry({
            totalAdvisors: advisors.length,
            successful: successCount,
            failed: failCount,
            deliveryRate: report.deliveryRate,
            circuitBreakerTriggers: report.kpiCompliance?.circuitBreakerTriggersThisMonth || 0,
            firstAttemptSuccessRate: report.kpiCompliance?.firstAttemptSuccessRate,
            avgDeliveryTime: report.kpiCompliance?.avgDeliveryTime,
            slaCompliant: report.kpiCompliance?.slaCompliant
        });

        // Print final results
        console.log('\n' + '='.repeat(60));
        console.log('🏁 DISTRIBUTION COMPLETE');
        console.log('='.repeat(60));
        console.log(`📊 Total Advisors: ${advisors.length}`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`⚠️ Skipped (Circuit Breaker): ${skippedDueToCircuitBreaker}`);
        console.log(`📈 Success Rate: ${report.deliveryRate}`);
        console.log(`🔄 Average Retries: ${report.averageRetries}`);
        console.log(`⚡ Circuit Breaker Status: ${circuitBreaker.state}`);
        console.log(`📁 Report saved: ${DELIVERY_REPORT_FILE}`);

        // Print KPI violations if any
        if (report.violations && report.violations.length > 0) {
            console.log('\n⚠️ KPI VIOLATIONS DETECTED:');
            report.violations.forEach(v => {
                console.log(`   - ${v.kpi}: ${v.actual} (target: ${v.target}) [${v.severity}]`);
            });
        } else {
            console.log('\n✅ ALL KPIs MET');
        }

        console.log('='.repeat(60));

        return report;

    } catch (error) {
        console.error('💥 CRITICAL ERROR in distribution:', error);

        // Update traceability with error
        await updateTraceabilityMatrix('5', {
            name: 'distribution-controller',
            status: 'failed',
            startTime: distributionStartTime,
            endTime: new Date().toISOString(),
            error: error.message,
            color: 'teal'
        });

        throw error;
    }
}

// Main execution
if (require.main === module) {
    console.log('🧠 PRODUCTION-GRADE DISTRIBUTION ORCHESTRATION');
    console.log('📊 With Circuit Breaker Protection & KPI Monitoring');

    distributeContent()
        .then(report => {
            console.log('\n✨ Distribution orchestration completed successfully!');
            if (report.kpiCompliance?.slaCompliant) {
                console.log(`🏆 All SLAs met - ${report.deliveryRate} success rate`);
            } else {
                console.log(`⚠️ Some KPIs missed - Review violations in report`);
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Distribution orchestration failed:', error.message);
            process.exit(1);
        });
}

module.exports = { distributeContent, sendWhatsAppMessage, sendWhatsAppImage };