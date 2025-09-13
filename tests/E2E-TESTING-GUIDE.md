# Comprehensive E2E Testing Guide

## Overview
This guide provides complete instructions for running the FinAdvise Content Engine E2E testing suite, which validates 200+ test scenarios across all system components.

## Prerequisites

### System Requirements
- Node.js 14+ 
- npm or yarn
- SSH access to VM (143.110.191.97)
- Meta Business Account access (for webhook configuration)

### Environment Variables
Create a `.env.test` file with:
```env
# VM Configuration
VM_HOST=143.110.191.97
VM_USER=mvp
SSH_KEY_PATH=~/.ssh/id_rsa

# WhatsApp Configuration
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_VERIFY_TOKEN=your-verify-token
NGROK_DOMAIN=your-ngrok-domain

# Google Sheets
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_KEY=path/to/key.json

# API Keys
API_KEY=your-api-key
GEMINI_API_KEY=your-gemini-key

# Test Configuration
TEST_ENV=production
TEST_MODE=full
SEND_TEST_NOTIFICATIONS=false
```

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Test Execution

### Run Complete E2E Suite
```bash
npm run test:e2e
```

### Run Individual Test Suites
```bash
# VM Validation
npm run test:e2e:vm

# WhatsApp Integration
npm run test:e2e:whatsapp

# Agent Workflows
npm run test:e2e:agents

# Google Sheets
npm run test:e2e:sheets

# All Playwright tests
npm run test:e2e:playwright
```

### Run with Specific Configuration
```bash
# Debug mode
DEBUG=true npm run test:e2e

# Specific environment
TEST_ENV=staging npm run test:e2e

# Quick mode (reduced test set)
TEST_MODE=quick npm run test:e2e
```

## Test Coverage

### Acceptance Criteria Coverage
| AC | Description | Test Suite | Coverage |
|----|------------|------------|----------|
| 1 | VM deployment validation | VM Validation | ✅ 100% |
| 2 | Playwright framework | Framework Setup | ✅ 100% |
| 3 | WhatsApp integration | WhatsApp Tests | ✅ 100% |
| 4 | Agent workflows | Agent Tests | ✅ 100% |
| 5 | Google Sheets | Sheets Tests | ✅ 100% |
| 6 | PM2 scheduling | Scheduling Tests | 🔄 In Progress |
| 7 | Monitoring dashboard | Dashboard Tests | 🔄 In Progress |
| 8 | Error handling | Error Tests | 🔄 In Progress |
| 9 | Load testing | Performance Tests | 🔄 In Progress |
| 10 | Security | Security Tests | 🔄 In Progress |
| 11 | Backup/Recovery | Recovery Tests | 🔄 In Progress |
| 12 | API integrations | API Tests | ✅ 100% |
| 13 | Edge cases | Edge Tests | 🔄 In Progress |
| 14 | Compliance | Compliance Tests | ✅ 100% |
| 15 | Reporting | Report Generation | ✅ 100% |

### Test Categories (200+ Scenarios)

#### 1. VM Infrastructure (15 tests)
- Connectivity validation
- Ngrok tunnel status
- Webhook configuration
- PM2 process monitoring
- Resource utilization
- SSL certificates

#### 2. WhatsApp Integration (40 tests)
- Webhook verification
- Message types (text, media, buttons)
- Status callbacks
- Rate limiting
- Error handling
- Multi-user conversations

#### 3. Agent Workflows (35 tests)
- Content orchestration
- Topic selection
- Fatigue checking
- Content generation
- Image creation
- Compliance validation
- Approval workflow
- Distribution management
- State management

#### 4. Google Sheets (30 tests)
- CRUD operations
- Batch processing
- Concurrent access
- Data validation
- Formula preservation
- Export/Import
- Backup/Restore

#### 5. Scheduling (15 tests)
- Cron triggers
- Job execution
- State management
- Manual overrides
- Timezone handling

#### 6. Monitoring (20 tests)
- Real-time updates
- Metrics collection
- Alert triggers
- Dashboard UI
- Performance monitoring

#### 7. Error & Recovery (25 tests)
- Network failures
- API timeouts
- Service crashes
- Data corruption
- Recovery procedures

#### 8. Performance (15 tests)
- Load testing
- Concurrent users
- API rate limits
- Resource usage
- Response times

#### 9. Security (15 tests)
- Authentication
- Authorization
- Data encryption
- Input validation
- Audit logging

#### 10. Compliance (10 tests)
- SEBI regulations
- Content validation
- Disclaimer checks
- Audit trails

## Manual Testing Requirements

Some scenarios require manual verification:

1. **WhatsApp Business Configuration**
   - Verify webhook URL in Meta Business Suite
   - Test message template approval
   - Check phone number verification

2. **Ngrok URL Updates**
   ```bash
   # Check ngrok status
   curl http://localhost:4040/api/tunnels
   
   # Update webhook URL if expired
   # Go to Meta Business Suite > WhatsApp > Configuration > Webhooks
   ```

3. **Visual Content Verification**
   - Review generated images
   - Check content formatting
   - Verify WhatsApp message appearance

4. **Production Deployment**
   - VM access verification
   - Service health checks
   - Log monitoring

## Test Reports

### Generated Reports Location
```
tests/reports/
├── e2e-test-report.json       # Detailed JSON report
├── e2e-test-report.html       # HTML dashboard
├── e2e-test-summary.md        # Markdown summary
├── performance-report.json    # Performance metrics
├── playwright-report/         # Playwright HTML report
└── coverage/                  # Coverage reports
```

### Viewing Reports

```bash
# Open HTML report
open tests/reports/e2e-test-report.html

# View Playwright report
npx playwright show-report

# Print summary to console
cat tests/reports/e2e-test-summary.md
```

## CI/CD Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-reports
          path: tests/reports/
```

### Jenkins Pipeline
```groovy
pipeline {
  agent any
  stages {
    stage('Test') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install'
        sh 'npm run test:e2e'
      }
    }
  }
  post {
    always {
      archiveArtifacts 'tests/reports/**/*'
      publishHTML([
        reportDir: 'tests/reports',
        reportFiles: 'e2e-test-report.html',
        reportName: 'E2E Test Report'
      ])
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **VM Connection Failed**
   ```bash
   # Test SSH connection
   ssh mvp@143.110.191.97
   
   # Check firewall
   nc -zv 143.110.191.97 22
   ```

2. **Ngrok Tunnel Expired**
   ```bash
   # Start new ngrok tunnel on VM
   ssh mvp@143.110.191.97
   ngrok http 5001
   
   # Update webhook URL in Meta Business Suite
   ```

3. **Test Timeouts**
   ```bash
   # Increase timeout
   PLAYWRIGHT_TIMEOUT=120000 npm run test:e2e
   ```

4. **Permission Errors**
   ```bash
   # Fix permissions
   chmod +x tests/e2e/run-e2e-tests.js
   ```

### Debug Mode

```bash
# Enable debug output
DEBUG=true npm run test:e2e

# Playwright debug mode
PWDEBUG=1 npx playwright test

# Headed mode (see browser)
npx playwright test --headed
```

## Performance Benchmarks

### Expected Results
- VM ping: < 100ms
- Webhook response: < 3s
- Content generation: < 2min per advisor
- Batch processing: 1000 advisors in 30min
- Dashboard load: < 1s
- API response: < 500ms

### Performance Monitoring
```bash
# Monitor during tests
npm run test:e2e:performance

# View metrics
cat tests/reports/performance-report.json
```

## Best Practices

1. **Pre-Test Checklist**
   - [ ] VM is accessible
   - [ ] Ngrok URL is active
   - [ ] Test data is prepared
   - [ ] Environment variables set
   - [ ] No production data in test environment

2. **Test Execution**
   - Run tests in isolation first
   - Use parallel execution for speed
   - Monitor resource usage
   - Review logs for warnings

3. **Post-Test**
   - Review all reports
   - Archive test results
   - Clean up test data
   - Document any issues

## Support

For issues or questions:
- Check logs in `/tests/reports/`
- Review error messages in test output
- Consult the architecture documentation
- Contact the development team

---

*Last Updated: 2025-09-13*
*Version: 1.0*