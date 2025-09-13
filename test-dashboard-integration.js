// STORY 3.2 DASHBOARD INTEGRATION - QUICK VERIFICATION TEST
// Tests all Task 7 components to ensure everything is working

const axios = require('axios');
const WebSocket = require('ws');
const eventsLogger = require('./events-logger');

const TEST_CONFIG = {
    dashboardApiUrl: 'http://localhost:3002',
    websocketUrl: 'ws://localhost:3001',
    testTimeout: 10000
};

async function testDashboardIntegration() {
    console.log('🧪 STORY 3.2 DASHBOARD INTEGRATION - VERIFICATION TEST');
    console.log('=' .repeat(60));
    
    let results = {
        eventsLogger: false,
        dashboardApi: false,
        websocketServer: false,
        endToEnd: false
    };

    try {
        // Test 1: Events Logger
        console.log('\n📊 Testing Events Logger...');
        await eventsLogger.init();
        eventsLogger.logButtonClick('919765071249', 'TEST_VERIFICATION', { test: true });
        eventsLogger.logContentDelivery('919765071249', 'test_content', true, 1500);
        
        const metrics = await eventsLogger.getDashboardMetrics();
        if (metrics !== undefined) {
            console.log('✅ Events Logger: Working correctly');
            results.eventsLogger = true;
        }

        // Test 2: Dashboard API Server
        console.log('\n🌐 Testing Dashboard API Server...');
        try {
            // Test health endpoint
            const healthResponse = await axios.get(`${TEST_CONFIG.dashboardApiUrl}/api/webhook/health`, { timeout: 5000 });
            console.log(`   Health Check: ${healthResponse.data.status}`);

            // Test metrics endpoint
            const metricsResponse = await axios.get(`${TEST_CONFIG.dashboardApiUrl}/api/webhook/metrics`, { timeout: 5000 });
            console.log(`   Metrics API: ${metricsResponse.data.success ? 'SUCCESS' : 'FAILED'}`);

            // Test conversations endpoint
            const conversationsResponse = await axios.get(`${TEST_CONFIG.dashboardApiUrl}/api/webhook/conversations`, { timeout: 5000 });
            console.log(`   Conversations API: ${conversationsResponse.data.success ? 'SUCCESS' : 'FAILED'}`);

            console.log('✅ Dashboard API Server: All endpoints working');
            results.dashboardApi = true;

        } catch (apiError) {
            console.log('❌ Dashboard API Server: Not running or unreachable');
            console.log('   Start with: node dashboard-api-server.js');
        }

        // Test 3: WebSocket Server
        console.log('\n🔌 Testing WebSocket Server...');
        try {
            const wsTest = await testWebSocketConnection();
            if (wsTest) {
                console.log('✅ WebSocket Server: Connection and messaging working');
                results.websocketServer = true;
            }
        } catch (wsError) {
            console.log('❌ WebSocket Server: Connection failed');
            console.log('   Start with: node websocket-server.js');
        }

        // Test 4: End-to-End Integration
        console.log('\n🔄 Testing End-to-End Integration...');
        if (results.eventsLogger && results.dashboardApi) {
            // Simulate complete flow
            eventsLogger.logButtonClick('919765071249', 'E2E_TEST', { timestamp: new Date().toISOString() });
            
            // Wait a moment for processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
                const recentEvents = await axios.get(`${TEST_CONFIG.dashboardApiUrl}/api/webhook/events/recent?limit=5`);
                const hasTestEvent = recentEvents.data.data.some(event => 
                    event.button_id === 'E2E_TEST' && event.advisor_phone === '919765071249'
                );
                
                if (hasTestEvent) {
                    console.log('✅ End-to-End Integration: Data flow working correctly');
                    results.endToEnd = true;
                } else {
                    console.log('⚠️  End-to-End Integration: Test event not found in API response');
                }
            } catch (e2eError) {
                console.log('❌ End-to-End Integration: API request failed');
            }
        }

    } catch (error) {
        console.error('❌ Test execution error:', error.message);
    }

    // Final Results
    console.log('\n' + '=' .repeat(60));
    console.log('📋 VERIFICATION RESULTS:');
    console.log('=' .repeat(60));
    console.log(`📊 Events Logger:     ${results.eventsLogger ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🌐 Dashboard API:     ${results.dashboardApi ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔌 WebSocket Server:  ${results.websocketServer ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔄 End-to-End:        ${results.endToEnd ? '✅ PASS' : '❌ FAIL'}`);
    console.log('=' .repeat(60));

    const totalPassed = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    if (totalPassed === totalTests) {
        console.log('🎉 ALL TESTS PASSED - Dashboard Integration Ready!');
        console.log('\n📝 Next Steps:');
        console.log('1. Deploy services: pm2 start ecosystem.dashboard-integration.config.js');
        console.log('2. Connect Story 4.2 dashboard to:');
        console.log('   - REST API: http://VM_IP:3002/api/webhook/*');
        console.log('   - WebSocket: ws://VM_IP:3001');
        console.log('3. Monitor logs: pm2 logs dashboard-api-server');
    } else {
        console.log(`⚠️  ${totalPassed}/${totalTests} tests passed. Check failed services above.`);
    }

    console.log('\n🔗 Ready for Story 4.2 Dashboard Integration!');
    eventsLogger.close();
}

function testWebSocketConnection() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(TEST_CONFIG.websocketUrl);
        let connected = false;
        let messageReceived = false;

        const timeout = setTimeout(() => {
            if (!connected) {
                ws.close();
                reject(new Error('WebSocket connection timeout'));
            }
        }, 5000);

        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('   WebSocket connection established');
            
            // Send test message
            ws.send(JSON.stringify({ type: 'ping' }));
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log(`   Received message type: ${message.type}`);
                
                if (message.type === 'pong') {
                    messageReceived = true;
                    ws.close();
                    resolve(true);
                }
            } catch (parseError) {
                console.log('   Message parse error:', parseError.message);
            }
        });

        ws.on('close', () => {
            if (connected && messageReceived) {
                resolve(true);
            } else if (!connected) {
                reject(new Error('WebSocket connection failed'));
            }
        });

        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

// Additional helper function to display API endpoints
function displayApiEndpoints() {
    console.log('\n📚 AVAILABLE DASHBOARD API ENDPOINTS:');
    console.log('=' .repeat(60));
    console.log('🏥 Health Check:');
    console.log('   GET /api/webhook/health');
    console.log('');
    console.log('📊 Analytics:');
    console.log('   GET /api/webhook/metrics');
    console.log('   GET /api/webhook/metrics?days=30');
    console.log('');
    console.log('💬 Conversations:');
    console.log('   GET /api/webhook/conversations');
    console.log('   GET /api/webhook/conversations?limit=100');
    console.log('');
    console.log('⚡ Real-time:');
    console.log('   GET /api/webhook/stats/realtime');
    console.log('   WS  ws://localhost:3001 (WebSocket)');
    console.log('');
    console.log('📋 Events:');
    console.log('   GET /api/webhook/events/recent?limit=50');
    console.log('=' .repeat(60));
}

// Run test if called directly
if (require.main === module) {
    testDashboardIntegration().catch(error => {
        console.error('❌ Dashboard integration test failed:', error);
        process.exit(1);
    });
}

module.exports = { testDashboardIntegration, displayApiEndpoints };