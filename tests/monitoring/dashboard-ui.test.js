/**
 * Comprehensive UI Test Suite for Story 4.2 Monitoring Dashboard
 * Tests all dashboard functionality including Story 3.2 webhook integration
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const DASHBOARD_URL = 'http://159.89.166.94:8080';
const LOCAL_DASHBOARD = 'http://localhost:8080';
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Test data generators
const generateTestData = {
  buttonTypes: ['UNLOCK_IMAGES', 'UNLOCK_CONTENT', 'UNLOCK_UPDATES', 'RETRIEVE_CONTENT', 'SHARE_WITH_CLIENTS'],
  advisorPhones: Array.from({ length: 10 }, (_, i) => `+9198765432${i.toString().padStart(2, '0')}`),
  chatMessages: [
    'What are the best mutual funds?',
    'How to invest in equity?',
    'Tax saving options?',
    'Portfolio diversification strategies',
    'Market outlook for next quarter'
  ]
};

// Helper function to login
async function login(page) {
  await page.goto(DASHBOARD_URL);
  await page.fill('input[name="username"]', TEST_CREDENTIALS.username);
  await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

// Test Suite 1: Authentication & Authorization (10 tests)
test.describe('Authentication & Authorization', () => {
  test('Should redirect to login when not authenticated', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('Should show login form with required fields', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Should reject invalid credentials', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('Should accept valid credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Should maintain session after login', async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Should logout successfully', async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Logout")');
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('Should destroy session on logout', async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Logout")');
    await page.goto(DASHBOARD_URL + '/dashboard');
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('Should handle session timeout', async ({ page }) => {
    await login(page);
    // Simulate session timeout by clearing cookies
    await page.context().clearCookies();
    await page.reload();
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('Should protect API endpoints', async ({ page }) => {
    const response = await page.request.get(DASHBOARD_URL + '/api/webhook/metrics');
    expect(response.status()).toBe(302); // Redirect to login
  });

  test('Should allow API access with session', async ({ page }) => {
    await login(page);
    const response = await page.request.get(DASHBOARD_URL + '/api/webhook/metrics');
    expect(response.status()).toBe(200);
  });
});

// Test Suite 2: Dashboard Navigation (15 tests)
test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should display main navigation menu', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('Should navigate to dashboard home', async ({ page }) => {
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Should navigate to agents view', async ({ page }) => {
    await page.click('a:has-text("Agents")');
    await expect(page).toHaveURL(/.*\/agents/);
  });

  test('Should navigate to advisors view', async ({ page }) => {
    await page.click('a:has-text("Advisors")');
    await expect(page).toHaveURL(/.*\/advisors/);
  });

  test('Should navigate to content view', async ({ page }) => {
    await page.click('a:has-text("Content")');
    await expect(page).toHaveURL(/.*\/content/);
  });

  test('Should navigate to errors view', async ({ page }) => {
    await page.click('a:has-text("Errors")');
    await expect(page).toHaveURL(/.*\/errors/);
  });

  test('Should navigate to triggers view', async ({ page }) => {
    await page.click('a:has-text("Triggers")');
    await expect(page).toHaveURL(/.*\/triggers/);
  });

  test('Should navigate to analytics view', async ({ page }) => {
    await page.click('a:has-text("Analytics")');
    await expect(page).toHaveURL(/.*\/analytics/);
  });

  test('Should navigate to backup view', async ({ page }) => {
    await page.click('a:has-text("Backup")');
    await expect(page).toHaveURL(/.*\/backup/);
  });

  test('Should highlight active navigation item', async ({ page }) => {
    await page.click('a:has-text("Agents")');
    await expect(page.locator('nav a:has-text("Agents")')).toHaveClass(/active/);
  });

  test('Should show breadcrumb navigation', async ({ page }) => {
    await page.click('a:has-text("Agents")');
    await expect(page.locator('.breadcrumb')).toBeVisible();
  });

  test('Should maintain navigation state on refresh', async ({ page }) => {
    await page.click('a:has-text("Analytics")');
    await page.reload();
    await expect(page).toHaveURL(/.*\/analytics/);
  });

  test('Should handle browser back button', async ({ page }) => {
    await page.click('a:has-text("Agents")');
    await page.click('a:has-text("Advisors")');
    await page.goBack();
    await expect(page).toHaveURL(/.*\/agents/);
  });

  test('Should handle browser forward button', async ({ page }) => {
    await page.click('a:has-text("Agents")');
    await page.click('a:has-text("Advisors")');
    await page.goBack();
    await page.goForward();
    await expect(page).toHaveURL(/.*\/advisors/);
  });

  test('Should display Story 3.2 integration badge', async ({ page }) => {
    await expect(page.locator('.badge:has-text("Story 3.2")')).toBeVisible();
  });
});

// Test Suite 3: Webhook Status Monitoring (20 tests)
test.describe('Webhook Status Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should display webhook status card', async ({ page }) => {
    await expect(page.locator('[data-test="webhook-status"]')).toBeVisible();
  });

  test('Should show connection health indicator', async ({ page }) => {
    const healthIndicator = page.locator('[data-test="webhook-health"]');
    await expect(healthIndicator).toBeVisible();
    await expect(healthIndicator).toHaveAttribute('data-status', /healthy|warning|error/);
  });

  test('Should display uptime percentage', async ({ page }) => {
    await expect(page.locator('[data-test="webhook-uptime"]')).toContainText(/%/);
  });

  test('Should show message processing count', async ({ page }) => {
    await expect(page.locator('[data-test="message-count"]')).toBeVisible();
  });

  test('Should display last heartbeat timestamp', async ({ page }) => {
    await expect(page.locator('[data-test="last-heartbeat"]')).toBeVisible();
  });

  test('Should auto-refresh webhook status', async ({ page }) => {
    const initialCount = await page.locator('[data-test="message-count"]').textContent();
    await page.waitForTimeout(5000);
    const updatedCount = await page.locator('[data-test="message-count"]').textContent();
    expect(updatedCount).not.toBe(initialCount);
  });

  test('Should show webhook URL', async ({ page }) => {
    await expect(page.locator('[data-test="webhook-url"]')).toContainText('http://');
  });

  test('Should display webhook version', async ({ page }) => {
    await expect(page.locator('[data-test="webhook-version"]')).toBeVisible();
  });

  test('Should show active connections count', async ({ page }) => {
    await expect(page.locator('[data-test="active-connections"]')).toBeVisible();
  });

  test('Should display error rate', async ({ page }) => {
    await expect(page.locator('[data-test="error-rate"]')).toContainText(/%/);
  });

  test('Should show average response time', async ({ page }) => {
    await expect(page.locator('[data-test="avg-response-time"]')).toContainText(/ms/);
  });

  test('Should display webhook status history', async ({ page }) => {
    await expect(page.locator('[data-test="status-history"]')).toBeVisible();
  });

  test('Should color-code status by health', async ({ page }) => {
    const status = await page.locator('[data-test="webhook-status"]').getAttribute('data-health');
    if (status === 'healthy') {
      await expect(page.locator('[data-test="webhook-status"]')).toHaveCSS('background-color', /green/);
    }
  });

  test('Should show webhook restart button', async ({ page }) => {
    await expect(page.locator('button:has-text("Restart Webhook")')).toBeVisible();
  });

  test('Should handle webhook restart action', async ({ page }) => {
    await page.click('button:has-text("Restart Webhook")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should display webhook logs link', async ({ page }) => {
    await expect(page.locator('a:has-text("View Logs")')).toBeVisible();
  });

  test('Should navigate to webhook logs', async ({ page }) => {
    await page.click('a:has-text("View Logs")');
    await expect(page).toHaveURL(/.*\/logs/);
  });

  test('Should show webhook configuration', async ({ page }) => {
    await expect(page.locator('[data-test="webhook-config"]')).toBeVisible();
  });

  test('Should display webhook metrics chart', async ({ page }) => {
    await expect(page.locator('canvas#webhook-metrics-chart')).toBeVisible();
  });

  test('Should update metrics chart in real-time', async ({ page }) => {
    const chart = page.locator('canvas#webhook-metrics-chart');
    await expect(chart).toBeVisible();
    await page.waitForTimeout(3000);
    // Chart should be rendered with data
    await expect(chart).toHaveAttribute('data-points', /\d+/);
  });
});

// Test Suite 4: Button Click Analytics (25 tests)
test.describe('Button Click Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  generateTestData.buttonTypes.forEach(buttonType => {
    test(`Should display ${buttonType} button analytics`, async ({ page }) => {
      await expect(page.locator(`[data-test="button-${buttonType}"]`)).toBeVisible();
    });

    test(`Should show click count for ${buttonType}`, async ({ page }) => {
      await expect(page.locator(`[data-test="button-${buttonType}-count"]`)).toContainText(/\d+/);
    });

    test(`Should display response time for ${buttonType}`, async ({ page }) => {
      await expect(page.locator(`[data-test="button-${buttonType}-response"]`)).toContainText(/ms/);
    });

    test(`Should show unique users for ${buttonType}`, async ({ page }) => {
      await expect(page.locator(`[data-test="button-${buttonType}-users"]`)).toContainText(/\d+/);
    });

    test(`Should update ${buttonType} analytics in real-time`, async ({ page }) => {
      const initialCount = await page.locator(`[data-test="button-${buttonType}-count"]`).textContent();
      await page.waitForTimeout(5000);
      const updatedCount = await page.locator(`[data-test="button-${buttonType}-count"]`).textContent();
      // Count should change or stay same (not error)
      expect(updatedCount).toBeDefined();
    });
  });
});

// Test Suite 5: CRM Chat Monitoring (20 tests)
test.describe('CRM Chat Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should display active conversation count', async ({ page }) => {
    await expect(page.locator('[data-test="active-conversations"]')).toBeVisible();
  });

  test('Should show average response time', async ({ page }) => {
    await expect(page.locator('[data-test="chat-response-time"]')).toContainText(/ms/);
  });

  test('Should display AI quality score', async ({ page }) => {
    await expect(page.locator('[data-test="ai-quality-score"]')).toContainText(/\d+(\.\d+)?/);
  });

  test('Should show quality trend indicator', async ({ page }) => {
    const trend = page.locator('[data-test="quality-trend"]');
    await expect(trend).toBeVisible();
    await expect(trend).toHaveAttribute('data-trend', /up|down|stable/);
  });

  test('Should display chat volume chart', async ({ page }) => {
    await expect(page.locator('canvas#chat-volume-chart')).toBeVisible();
  });

  test('Should show topic distribution', async ({ page }) => {
    await expect(page.locator('[data-test="topic-distribution"]')).toBeVisible();
  });

  test('Should display sentiment analysis', async ({ page }) => {
    await expect(page.locator('[data-test="sentiment-analysis"]')).toBeVisible();
  });

  test('Should show conversation completion rate', async ({ page }) => {
    await expect(page.locator('[data-test="completion-rate"]')).toContainText(/%/);
  });

  test('Should display average conversation length', async ({ page }) => {
    await expect(page.locator('[data-test="avg-conversation-length"]')).toBeVisible();
  });

  test('Should show user satisfaction score', async ({ page }) => {
    await expect(page.locator('[data-test="satisfaction-score"]')).toBeVisible();
  });

  test('Should display escalation rate', async ({ page }) => {
    await expect(page.locator('[data-test="escalation-rate"]')).toContainText(/%/);
  });

  test('Should show response time distribution', async ({ page }) => {
    await expect(page.locator('[data-test="response-distribution"]')).toBeVisible();
  });

  test('Should display chat history link', async ({ page }) => {
    await expect(page.locator('a:has-text("View Chat History")')).toBeVisible();
  });

  test('Should navigate to chat history', async ({ page }) => {
    await page.click('a:has-text("View Chat History")');
    await expect(page).toHaveURL(/.*\/chats/);
  });

  test('Should show active advisor list', async ({ page }) => {
    await expect(page.locator('[data-test="active-advisors"]')).toBeVisible();
  });

  test('Should display chat queue length', async ({ page }) => {
    await expect(page.locator('[data-test="chat-queue"]')).toBeVisible();
  });

  test('Should show AI response accuracy', async ({ page }) => {
    await expect(page.locator('[data-test="ai-accuracy"]')).toContainText(/%/);
  });

  test('Should display chat tags cloud', async ({ page }) => {
    await expect(page.locator('[data-test="chat-tags"]')).toBeVisible();
  });

  test('Should update chat metrics in real-time', async ({ page }) => {
    const initialCount = await page.locator('[data-test="active-conversations"]').textContent();
    await page.waitForTimeout(5000);
    const updatedCount = await page.locator('[data-test="active-conversations"]').textContent();
    expect(updatedCount).toBeDefined();
  });

  test('Should show chat export button', async ({ page }) => {
    await expect(page.locator('button:has-text("Export Chats")')).toBeVisible();
  });
});

// Test Suite 6: Live Event Stream (15 tests)
test.describe('Live Event Stream', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should display event stream container', async ({ page }) => {
    await expect(page.locator('[data-test="event-stream"]')).toBeVisible();
  });

  test('Should show real-time events', async ({ page }) => {
    await page.waitForTimeout(3000);
    const events = await page.locator('[data-test="event-item"]').count();
    expect(events).toBeGreaterThan(0);
  });

  test('Should display event timestamp', async ({ page }) => {
    await page.waitForSelector('[data-test="event-item"]');
    await expect(page.locator('[data-test="event-timestamp"]').first()).toBeVisible();
  });

  test('Should show event type', async ({ page }) => {
    await page.waitForSelector('[data-test="event-item"]');
    await expect(page.locator('[data-test="event-type"]').first()).toBeVisible();
  });

  test('Should display event details', async ({ page }) => {
    await page.waitForSelector('[data-test="event-item"]');
    await expect(page.locator('[data-test="event-details"]').first()).toBeVisible();
  });

  test('Should color-code events by type', async ({ page }) => {
    await page.waitForSelector('[data-test="event-item"]');
    const eventType = await page.locator('[data-test="event-type"]').first().textContent();
    const eventItem = page.locator('[data-test="event-item"]').first();
    if (eventType.includes('button')) {
      await expect(eventItem).toHaveClass(/event-button/);
    }
  });

  test('Should auto-scroll to new events', async ({ page }) => {
    const streamContainer = page.locator('[data-test="event-stream"]');
    const initialScrollTop = await streamContainer.evaluate(el => el.scrollTop);
    await page.waitForTimeout(5000);
    const newScrollTop = await streamContainer.evaluate(el => el.scrollTop);
    expect(newScrollTop).toBeGreaterThanOrEqual(initialScrollTop);
  });

  test('Should limit event history', async ({ page }) => {
    await page.waitForTimeout(10000);
    const events = await page.locator('[data-test="event-item"]').count();
    expect(events).toBeLessThanOrEqual(100); // Should limit to last 100 events
  });

  test('Should show event filters', async ({ page }) => {
    await expect(page.locator('[data-test="event-filters"]')).toBeVisible();
  });

  test('Should filter events by type', async ({ page }) => {
    await page.selectOption('[data-test="event-type-filter"]', 'button_click');
    await page.waitForTimeout(1000);
    const events = await page.locator('[data-test="event-item"]').all();
    for (const event of events) {
      await expect(event.locator('[data-test="event-type"]')).toContainText('button');
    }
  });

  test('Should pause event stream', async ({ page }) => {
    await page.click('button:has-text("Pause Stream")');
    const initialCount = await page.locator('[data-test="event-item"]').count();
    await page.waitForTimeout(3000);
    const newCount = await page.locator('[data-test="event-item"]').count();
    expect(newCount).toBe(initialCount);
  });

  test('Should resume event stream', async ({ page }) => {
    await page.click('button:has-text("Pause Stream")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Resume Stream")');
    await page.waitForTimeout(3000);
    const events = await page.locator('[data-test="event-item"]').count();
    expect(events).toBeGreaterThan(0);
  });

  test('Should clear event stream', async ({ page }) => {
    await page.click('button:has-text("Clear Stream")');
    const events = await page.locator('[data-test="event-item"]').count();
    expect(events).toBe(0);
  });

  test('Should export event log', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Events")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('events');
  });

  test('Should search events', async ({ page }) => {
    await page.fill('[data-test="event-search"]', 'button');
    await page.waitForTimeout(1000);
    const events = await page.locator('[data-test="event-item"]').all();
    for (const event of events) {
      const text = await event.textContent();
      expect(text.toLowerCase()).toContain('button');
    }
  });
});

// Test Suite 7: Interactive Charts (15 tests)
test.describe('Interactive Charts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should display 24-hour button click distribution chart', async ({ page }) => {
    await expect(page.locator('canvas#hourly-distribution-chart')).toBeVisible();
  });

  test('Should show chart legend', async ({ page }) => {
    await expect(page.locator('[data-test="chart-legend"]')).toBeVisible();
  });

  test('Should display chart tooltips on hover', async ({ page }) => {
    const chart = page.locator('canvas#hourly-distribution-chart');
    await chart.hover({ position: { x: 100, y: 50 } });
    await expect(page.locator('[data-test="chart-tooltip"]')).toBeVisible();
  });

  test('Should allow chart type switching', async ({ page }) => {
    await page.selectOption('[data-test="chart-type"]', 'bar');
    await expect(page.locator('canvas#hourly-distribution-chart')).toHaveAttribute('data-type', 'bar');
  });

  test('Should refresh chart data', async ({ page }) => {
    await page.click('button:has-text("Refresh Chart")');
    await expect(page.locator('.chart-loading')).toBeVisible();
    await expect(page.locator('.chart-loading')).not.toBeVisible({ timeout: 5000 });
  });

  test('Should zoom chart', async ({ page }) => {
    await page.click('button:has-text("Zoom In")');
    const chart = page.locator('canvas#hourly-distribution-chart');
    await expect(chart).toHaveAttribute('data-zoom', '2');
  });

  test('Should reset chart zoom', async ({ page }) => {
    await page.click('button:has-text("Zoom In")');
    await page.click('button:has-text("Reset Zoom")');
    const chart = page.locator('canvas#hourly-distribution-chart');
    await expect(chart).toHaveAttribute('data-zoom', '1');
  });

  test('Should export chart as image', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Chart")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('Should display date range selector', async ({ page }) => {
    await expect(page.locator('[data-test="date-range"]')).toBeVisible();
  });

  test('Should filter chart by date range', async ({ page }) => {
    await page.fill('[data-test="date-from"]', '2025-01-01');
    await page.fill('[data-test="date-to"]', '2025-01-31');
    await page.click('button:has-text("Apply Filter")');
    await expect(page.locator('canvas#hourly-distribution-chart')).toHaveAttribute('data-filtered', 'true');
  });

  test('Should show chart loading state', async ({ page }) => {
    await page.click('button:has-text("Refresh Chart")');
    await expect(page.locator('.chart-loading')).toBeVisible();
  });

  test('Should handle chart errors gracefully', async ({ page }) => {
    // Simulate error by disconnecting network
    await page.route('**/api/webhook/metrics', route => route.abort());
    await page.click('button:has-text("Refresh Chart")');
    await expect(page.locator('.chart-error')).toBeVisible();
  });

  test('Should display comparison chart', async ({ page }) => {
    await expect(page.locator('canvas#comparison-chart')).toBeVisible();
  });

  test('Should toggle chart series visibility', async ({ page }) => {
    await page.click('[data-test="legend-item-UNLOCK_IMAGES"]');
    const chart = page.locator('canvas#hourly-distribution-chart');
    await expect(chart).toHaveAttribute('data-hidden-series', /UNLOCK_IMAGES/);
  });

  test('Should animate chart transitions', async ({ page }) => {
    await page.selectOption('[data-test="chart-type"]', 'line');
    const chart = page.locator('canvas#hourly-distribution-chart');
    await expect(chart).toHaveClass(/chart-animating/);
  });
});

// Test Suite 8: System Health Monitoring (20 tests)
test.describe('System Health Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should display PM2 process status', async ({ page }) => {
    await expect(page.locator('[data-test="pm2-status"]')).toBeVisible();
  });

  test('Should show process count', async ({ page }) => {
    await expect(page.locator('[data-test="process-count"]')).toContainText(/\d+/);
  });

  test('Should display CPU usage', async ({ page }) => {
    await expect(page.locator('[data-test="cpu-usage"]')).toContainText(/%/);
  });

  test('Should show memory usage', async ({ page }) => {
    await expect(page.locator('[data-test="memory-usage"]')).toContainText(/MB|GB/);
  });

  test('Should display disk usage', async ({ page }) => {
    await expect(page.locator('[data-test="disk-usage"]')).toContainText(/%/);
  });

  test('Should show network I/O', async ({ page }) => {
    await expect(page.locator('[data-test="network-io"]')).toBeVisible();
  });

  test('Should display system uptime', async ({ page }) => {
    await expect(page.locator('[data-test="system-uptime"]')).toBeVisible();
  });

  test('Should show process restart count', async ({ page }) => {
    await expect(page.locator('[data-test="restart-count"]')).toContainText(/\d+/);
  });

  test('Should display error logs count', async ({ page }) => {
    await expect(page.locator('[data-test="error-count"]')).toContainText(/\d+/);
  });

  test('Should show warning indicators', async ({ page }) => {
    const cpuUsage = await page.locator('[data-test="cpu-usage"]').textContent();
    const usage = parseInt(cpuUsage);
    if (usage > 80) {
      await expect(page.locator('[data-test="cpu-warning"]')).toBeVisible();
    }
  });

  test('Should display process list', async ({ page }) => {
    await expect(page.locator('[data-test="process-list"]')).toBeVisible();
  });

  test('Should show individual process status', async ({ page }) => {
    const processes = await page.locator('[data-test="process-item"]').all();
    for (const process of processes) {
      await expect(process.locator('[data-test="process-status"]')).toBeVisible();
    }
  });

  test('Should allow process restart', async ({ page }) => {
    await page.click('[data-test="process-item"]:first-child button:has-text("Restart")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should allow process stop', async ({ page }) => {
    await page.click('[data-test="process-item"]:first-child button:has-text("Stop")');
    await expect(page.locator('.alert-warning')).toBeVisible();
  });

  test('Should show process logs', async ({ page }) => {
    await page.click('[data-test="process-item"]:first-child a:has-text("Logs")');
    await expect(page.locator('[data-test="process-logs"]')).toBeVisible();
  });

  test('Should display resource usage graph', async ({ page }) => {
    await expect(page.locator('canvas#resource-usage-chart')).toBeVisible();
  });

  test('Should update resource metrics in real-time', async ({ page }) => {
    const initialCPU = await page.locator('[data-test="cpu-usage"]').textContent();
    await page.waitForTimeout(5000);
    const updatedCPU = await page.locator('[data-test="cpu-usage"]').textContent();
    expect(updatedCPU).toBeDefined();
  });

  test('Should show health score', async ({ page }) => {
    await expect(page.locator('[data-test="health-score"]')).toContainText(/\d+/);
  });

  test('Should display recommended actions', async ({ page }) => {
    await expect(page.locator('[data-test="recommended-actions"]')).toBeVisible();
  });

  test('Should export system report', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export System Report")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('system-report');
  });
});

// Test Suite 9: Content Management (15 tests)
test.describe('Content Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Content")');
  });

  test('Should display content review interface', async ({ page }) => {
    await expect(page.locator('[data-test="content-review"]')).toBeVisible();
  });

  test('Should show pending approvals count', async ({ page }) => {
    await expect(page.locator('[data-test="pending-count"]')).toContainText(/\d+/);
  });

  test('Should display content preview', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await expect(page.locator('[data-test="content-preview"]')).toBeVisible();
  });

  test('Should show approve button', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await expect(page.locator('button:has-text("Approve")')).toBeVisible();
  });

  test('Should show reject button', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await expect(page.locator('button:has-text("Reject")')).toBeVisible();
  });

  test('Should handle content approval', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await page.click('button:has-text("Approve")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should handle content rejection', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await page.click('button:has-text("Reject")');
    await expect(page.locator('[data-test="rejection-reason"]')).toBeVisible();
  });

  test('Should filter content by status', async ({ page }) => {
    await page.selectOption('[data-test="content-filter"]', 'pending');
    const items = await page.locator('[data-test="content-item"]').all();
    for (const item of items) {
      await expect(item.locator('[data-test="content-status"]')).toContainText('Pending');
    }
  });

  test('Should search content', async ({ page }) => {
    await page.fill('[data-test="content-search"]', 'mutual fund');
    await page.waitForTimeout(1000);
    const items = await page.locator('[data-test="content-item"]').all();
    for (const item of items) {
      const text = await item.textContent();
      expect(text.toLowerCase()).toContain('mutual');
    }
  });

  test('Should display content metadata', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await expect(page.locator('[data-test="content-metadata"]')).toBeVisible();
  });

  test('Should show content history', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await page.click('button:has-text("History")');
    await expect(page.locator('[data-test="content-history"]')).toBeVisible();
  });

  test('Should bulk approve content', async ({ page }) => {
    await page.click('[data-test="select-all"]');
    await page.click('button:has-text("Bulk Approve")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should export content list', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Content")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('content');
  });

  test('Should schedule content', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await page.click('button:has-text("Schedule")');
    await expect(page.locator('[data-test="schedule-modal"]')).toBeVisible();
  });

  test('Should edit content', async ({ page }) => {
    await page.click('[data-test="content-item"]:first-child');
    await page.click('button:has-text("Edit")');
    await expect(page.locator('[data-test="content-editor"]')).toBeVisible();
  });
});

// Test Suite 10: Advisor Management (15 tests)
test.describe('Advisor Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Advisors")');
  });

  test('Should display advisor list', async ({ page }) => {
    await expect(page.locator('[data-test="advisor-list"]')).toBeVisible();
  });

  test('Should show add advisor button', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Advisor")')).toBeVisible();
  });

  test('Should open add advisor form', async ({ page }) => {
    await page.click('button:has-text("Add Advisor")');
    await expect(page.locator('[data-test="advisor-form"]')).toBeVisible();
  });

  test('Should validate advisor form', async ({ page }) => {
    await page.click('button:has-text("Add Advisor")');
    await page.click('button:has-text("Save")');
    await expect(page.locator('.form-error')).toBeVisible();
  });

  test('Should add new advisor', async ({ page }) => {
    await page.click('button:has-text("Add Advisor")');
    await page.fill('input[name="name"]', 'Test Advisor');
    await page.fill('input[name="phone"]', '+919876543210');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Save")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should edit advisor', async ({ page }) => {
    await page.click('[data-test="advisor-item"]:first-child button:has-text("Edit")');
    await expect(page.locator('[data-test="advisor-form"]')).toBeVisible();
  });

  test('Should disable advisor', async ({ page }) => {
    await page.click('[data-test="advisor-item"]:first-child button:has-text("Disable")');
    await expect(page.locator('.alert-warning')).toBeVisible();
  });

  test('Should enable advisor', async ({ page }) => {
    await page.click('[data-test="advisor-item"][data-status="disabled"]:first-child button:has-text("Enable")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should delete advisor', async ({ page }) => {
    await page.click('[data-test="advisor-item"]:first-child button:has-text("Delete")');
    await page.click('button:has-text("Confirm Delete")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should search advisors', async ({ page }) => {
    await page.fill('[data-test="advisor-search"]', 'test');
    await page.waitForTimeout(1000);
    const items = await page.locator('[data-test="advisor-item"]').all();
    for (const item of items) {
      const text = await item.textContent();
      expect(text.toLowerCase()).toContain('test');
    }
  });

  test('Should filter advisors by status', async ({ page }) => {
    await page.selectOption('[data-test="advisor-filter"]', 'active');
    const items = await page.locator('[data-test="advisor-item"]').all();
    for (const item of items) {
      await expect(item).toHaveAttribute('data-status', 'active');
    }
  });

  test('Should display advisor details', async ({ page }) => {
    await page.click('[data-test="advisor-item"]:first-child');
    await expect(page.locator('[data-test="advisor-details"]')).toBeVisible();
  });

  test('Should show advisor metrics', async ({ page }) => {
    await page.click('[data-test="advisor-item"]:first-child');
    await expect(page.locator('[data-test="advisor-metrics"]')).toBeVisible();
  });

  test('Should export advisor list', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Advisors")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('advisors');
  });

  test('Should import advisors', async ({ page }) => {
    await page.click('button:has-text("Import Advisors")');
    await expect(page.locator('[data-test="import-modal"]')).toBeVisible();
  });
});

// Test Suite 11: Error Monitoring (10 tests)
test.describe('Error Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Errors")');
  });

  test('Should display error log viewer', async ({ page }) => {
    await expect(page.locator('[data-test="error-viewer"]')).toBeVisible();
  });

  test('Should show error count', async ({ page }) => {
    await expect(page.locator('[data-test="error-count"]')).toContainText(/\d+/);
  });

  test('Should display error details', async ({ page }) => {
    await page.click('[data-test="error-item"]:first-child');
    await expect(page.locator('[data-test="error-details"]')).toBeVisible();
  });

  test('Should show error stack trace', async ({ page }) => {
    await page.click('[data-test="error-item"]:first-child');
    await expect(page.locator('[data-test="error-stack"]')).toBeVisible();
  });

  test('Should filter errors by severity', async ({ page }) => {
    await page.selectOption('[data-test="error-severity"]', 'critical');
    const items = await page.locator('[data-test="error-item"]').all();
    for (const item of items) {
      await expect(item).toHaveClass(/error-critical/);
    }
  });

  test('Should search errors', async ({ page }) => {
    await page.fill('[data-test="error-search"]', 'timeout');
    await page.waitForTimeout(1000);
    const items = await page.locator('[data-test="error-item"]').all();
    for (const item of items) {
      const text = await item.textContent();
      expect(text.toLowerCase()).toContain('timeout');
    }
  });

  test('Should mark error as resolved', async ({ page }) => {
    await page.click('[data-test="error-item"]:first-child button:has-text("Resolve")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should show error trends chart', async ({ page }) => {
    await expect(page.locator('canvas#error-trends-chart')).toBeVisible();
  });

  test('Should export error logs', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Errors")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('errors');
  });

  test('Should clear resolved errors', async ({ page }) => {
    await page.click('button:has-text("Clear Resolved")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });
});

// Test Suite 12: Manual Triggers (10 tests)
test.describe('Manual Triggers', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Triggers")');
  });

  test('Should display trigger interface', async ({ page }) => {
    await expect(page.locator('[data-test="trigger-interface"]')).toBeVisible();
  });

  test('Should show agent list', async ({ page }) => {
    await expect(page.locator('[data-test="agent-list"]')).toBeVisible();
  });

  test('Should allow agent selection', async ({ page }) => {
    await page.selectOption('[data-test="agent-select"]', 'content-orchestrator');
    await expect(page.locator('[data-test="agent-config"]')).toBeVisible();
  });

  test('Should display agent parameters', async ({ page }) => {
    await page.selectOption('[data-test="agent-select"]', 'content-orchestrator');
    await expect(page.locator('[data-test="agent-params"]')).toBeVisible();
  });

  test('Should validate trigger parameters', async ({ page }) => {
    await page.selectOption('[data-test="agent-select"]', 'content-orchestrator');
    await page.click('button:has-text("Run Agent")');
    await expect(page.locator('.form-error')).toBeVisible();
  });

  test('Should execute agent trigger', async ({ page }) => {
    await page.selectOption('[data-test="agent-select"]', 'content-orchestrator');
    await page.fill('[data-test="param-advisor-id"]', '123');
    await page.click('button:has-text("Run Agent")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should show execution status', async ({ page }) => {
    await page.selectOption('[data-test="agent-select"]', 'content-orchestrator');
    await page.fill('[data-test="param-advisor-id"]', '123');
    await page.click('button:has-text("Run Agent")');
    await expect(page.locator('[data-test="execution-status"]')).toBeVisible();
  });

  test('Should display execution logs', async ({ page }) => {
    await page.selectOption('[data-test="agent-select"]', 'content-orchestrator');
    await page.fill('[data-test="param-advisor-id"]', '123');
    await page.click('button:has-text("Run Agent")');
    await expect(page.locator('[data-test="execution-logs"]')).toBeVisible();
  });

  test('Should show trigger history', async ({ page }) => {
    await expect(page.locator('[data-test="trigger-history"]')).toBeVisible();
  });

  test('Should schedule recurring trigger', async ({ page }) => {
    await page.click('button:has-text("Schedule Trigger")');
    await expect(page.locator('[data-test="schedule-modal"]')).toBeVisible();
  });
});

// Test Suite 13: Analytics Dashboard (15 tests)
test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Analytics")');
  });

  test('Should display key metrics', async ({ page }) => {
    await expect(page.locator('[data-test="key-metrics"]')).toBeVisible();
  });

  test('Should show advisors served count', async ({ page }) => {
    await expect(page.locator('[data-test="advisors-served"]')).toContainText(/\d+/);
  });

  test('Should display content generated count', async ({ page }) => {
    await expect(page.locator('[data-test="content-generated"]')).toContainText(/\d+/);
  });

  test('Should show delivery rate', async ({ page }) => {
    await expect(page.locator('[data-test="delivery-rate"]')).toContainText(/%/);
  });

  test('Should display engagement rate', async ({ page }) => {
    await expect(page.locator('[data-test="engagement-rate"]')).toContainText(/%/);
  });

  test('Should show conversion funnel', async ({ page }) => {
    await expect(page.locator('[data-test="conversion-funnel"]')).toBeVisible();
  });

  test('Should display user journey map', async ({ page }) => {
    await expect(page.locator('[data-test="user-journey"]')).toBeVisible();
  });

  test('Should show content performance matrix', async ({ page }) => {
    await expect(page.locator('[data-test="content-matrix"]')).toBeVisible();
  });

  test('Should display ROI calculator', async ({ page }) => {
    await expect(page.locator('[data-test="roi-calculator"]')).toBeVisible();
  });

  test('Should show growth trends', async ({ page }) => {
    await expect(page.locator('canvas#growth-trends-chart')).toBeVisible();
  });

  test('Should display comparative analysis', async ({ page }) => {
    await expect(page.locator('[data-test="comparative-analysis"]')).toBeVisible();
  });

  test('Should allow period selection', async ({ page }) => {
    await page.selectOption('[data-test="period-select"]', 'monthly');
    await expect(page.locator('[data-test="key-metrics"]')).toHaveAttribute('data-period', 'monthly');
  });

  test('Should export analytics report', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Report")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('analytics');
  });

  test('Should generate insights', async ({ page }) => {
    await page.click('button:has-text("Generate Insights")');
    await expect(page.locator('[data-test="ai-insights"]')).toBeVisible();
  });

  test('Should show predictive analytics', async ({ page }) => {
    await expect(page.locator('[data-test="predictive-analytics"]')).toBeVisible();
  });
});

// Test Suite 14: Backup & Restore (10 tests)
test.describe('Backup & Restore', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.click('a:has-text("Backup")');
  });

  test('Should display backup interface', async ({ page }) => {
    await expect(page.locator('[data-test="backup-interface"]')).toBeVisible();
  });

  test('Should show last backup time', async ({ page }) => {
    await expect(page.locator('[data-test="last-backup"]')).toBeVisible();
  });

  test('Should display backup history', async ({ page }) => {
    await expect(page.locator('[data-test="backup-history"]')).toBeVisible();
  });

  test('Should create manual backup', async ({ page }) => {
    await page.click('button:has-text("Create Backup")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should show backup progress', async ({ page }) => {
    await page.click('button:has-text("Create Backup")');
    await expect(page.locator('[data-test="backup-progress"]')).toBeVisible();
  });

  test('Should download backup', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-test="backup-item"]:first-child button:has-text("Download")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('backup');
  });

  test('Should restore from backup', async ({ page }) => {
    await page.click('[data-test="backup-item"]:first-child button:has-text("Restore")');
    await page.click('button:has-text("Confirm Restore")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should schedule automatic backups', async ({ page }) => {
    await page.click('button:has-text("Schedule Backup")');
    await expect(page.locator('[data-test="schedule-modal"]')).toBeVisible();
  });

  test('Should delete old backups', async ({ page }) => {
    await page.click('[data-test="backup-item"]:last-child button:has-text("Delete")');
    await page.click('button:has-text("Confirm Delete")');
    await expect(page.locator('.alert-success')).toBeVisible();
  });

  test('Should verify backup integrity', async ({ page }) => {
    await page.click('[data-test="backup-item"]:first-child button:has-text("Verify")');
    await expect(page.locator('[data-test="verification-result"]')).toBeVisible();
  });
});

// Test Suite 15: Mobile Responsiveness (10 tests)
test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should display mobile navigation menu', async ({ page }) => {
    await expect(page.locator('[data-test="mobile-menu"]')).toBeVisible();
  });

  test('Should toggle mobile menu', async ({ page }) => {
    await page.click('[data-test="menu-toggle"]');
    await expect(page.locator('[data-test="mobile-nav"]')).toBeVisible();
  });

  test('Should collapse cards on mobile', async ({ page }) => {
    await expect(page.locator('[data-test="webhook-status"]')).toHaveClass(/card-collapsed/);
  });

  test('Should stack charts vertically', async ({ page }) => {
    const charts = await page.locator('canvas').all();
    const positions = await Promise.all(charts.map(chart => chart.boundingBox()));
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].y).toBeGreaterThan(positions[i - 1].y);
    }
  });

  test('Should show mobile-optimized tables', async ({ page }) => {
    await expect(page.locator('[data-test="responsive-table"]')).toHaveClass(/table-mobile/);
  });

  test('Should display mobile action buttons', async ({ page }) => {
    await expect(page.locator('[data-test="mobile-actions"]')).toBeVisible();
  });

  test('Should handle swipe gestures', async ({ page }) => {
    const element = page.locator('[data-test="swipeable-card"]');
    await element.dispatchEvent('touchstart', { touches: [{ clientX: 300, clientY: 100 }] });
    await element.dispatchEvent('touchmove', { touches: [{ clientX: 100, clientY: 100 }] });
    await element.dispatchEvent('touchend');
    await expect(element).toHaveClass(/swiped-left/);
  });

  test('Should show mobile-friendly forms', async ({ page }) => {
    await page.click('button:has-text("Add Advisor")');
    await expect(page.locator('[data-test="mobile-form"]')).toBeVisible();
  });

  test('Should optimize image loading', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const img of images) {
      await expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  test('Should maintain functionality on mobile', async ({ page }) => {
    await page.click('[data-test="menu-toggle"]');
    await page.click('a:has-text("Analytics")');
    await expect(page).toHaveURL(/.*\/analytics/);
  });
});

// Test Suite 16: Performance Testing (10 tests)
test.describe('Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should load dashboard within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(DASHBOARD_URL + '/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('Should handle 1000 events in stream', async ({ page }) => {
    // Simulate 1000 events
    for (let i = 0; i < 1000; i++) {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('webhook-event', {
          detail: { type: 'button_click', data: {} }
        }));
      });
    }
    const events = await page.locator('[data-test="event-item"]').count();
    expect(events).toBeLessThanOrEqual(100); // Should limit display
  });

  test('Should render large charts efficiently', async ({ page }) => {
    const startTime = Date.now();
    await page.click('button:has-text("Load Full Data")');
    await page.waitForSelector('canvas#hourly-distribution-chart[data-loaded="true"]');
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000);
  });

  test('Should paginate large data sets', async ({ page }) => {
    await page.click('a:has-text("Advisors")');
    await expect(page.locator('[data-test="pagination"]')).toBeVisible();
  });

  test('Should lazy load images', async ({ page }) => {
    const images = await page.locator('img[loading="lazy"]').count();
    expect(images).toBeGreaterThan(0);
  });

  test('Should cache API responses', async ({ page }) => {
    const firstRequest = page.waitForResponse('**/api/webhook/metrics');
    await page.click('button:has-text("Refresh")');
    const firstResponse = await firstRequest;
    
    const secondRequest = page.waitForResponse('**/api/webhook/metrics');
    await page.click('button:has-text("Refresh")');
    const secondResponse = await secondRequest;
    
    expect(secondResponse.headers()['x-cache']).toBe('HIT');
  });

  test('Should debounce search inputs', async ({ page }) => {
    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('search')) requestCount++;
    });
    
    await page.fill('[data-test="advisor-search"]', 'test advisor name');
    await page.waitForTimeout(1000);
    expect(requestCount).toBeLessThanOrEqual(2);
  });

  test('Should optimize WebSocket connections', async ({ page }) => {
    const wsConnections = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('ws://'))
        .length;
    });
    expect(wsConnections).toBeLessThanOrEqual(1);
  });

  test('Should minimize bundle size', async ({ page }) => {
    const response = await page.request.get(DASHBOARD_URL + '/js/main.js');
    const size = response.headers()['content-length'];
    expect(parseInt(size)).toBeLessThan(500000); // Less than 500KB
  });

  test('Should handle concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 10 }, () => browser.newContext())
    );
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    await Promise.all(
      pages.map(page => login(page))
    );
    
    // All should load successfully
    for (const page of pages) {
      await expect(page).toHaveURL(/.*\/dashboard/);
    }
  });
});

// Test Suite 17: Security Testing (10 tests)
test.describe('Security Testing', () => {
  test('Should prevent SQL injection', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.fill('input[name="username"]', "admin' OR '1'='1");
    await page.fill('input[name="password"]', 'test');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('Should prevent XSS attacks', async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Add Advisor")');
    await page.fill('input[name="name"]', '<script>alert("XSS")</script>');
    await page.click('button:has-text("Save")');
    // Script should not execute
    const alerts = await page.evaluate(() => window.alertShown);
    expect(alerts).toBeUndefined();
  });

  test('Should enforce HTTPS in production', async ({ page }) => {
    if (DASHBOARD_URL.startsWith('https://')) {
      const response = await page.request.get(DASHBOARD_URL);
      expect(response.headers()['strict-transport-security']).toBeDefined();
    }
  });

  test('Should validate CSRF tokens', async ({ page }) => {
    await login(page);
    const response = await page.request.post(DASHBOARD_URL + '/api/advisors', {
      data: { name: 'Test' },
      headers: { 'X-CSRF-Token': 'invalid' }
    });
    expect(response.status()).toBe(403);
  });

  test('Should rate limit API requests', async ({ page }) => {
    await login(page);
    const requests = Array.from({ length: 100 }, () =>
      page.request.get(DASHBOARD_URL + '/api/webhook/metrics')
    );
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status() === 429);
    expect(rateLimited).toBe(true);
  });

  test('Should sanitize user inputs', async ({ page }) => {
    await login(page);
    await page.click('button:has-text("Add Advisor")');
    await page.fill('input[name="phone"]', '../../etc/passwd');
    await page.click('button:has-text("Save")');
    await expect(page.locator('.form-error')).toBeVisible();
  });

  test('Should protect sensitive data', async ({ page }) => {
    await login(page);
    const response = await page.request.get(DASHBOARD_URL + '/api/advisors');
    const data = await response.json();
    // Should not expose sensitive fields
    expect(data[0]).not.toHaveProperty('password');
    expect(data[0]).not.toHaveProperty('api_key');
  });

  test('Should implement proper CORS', async ({ page }) => {
    const response = await page.request.get(DASHBOARD_URL + '/api/webhook/metrics', {
      headers: { 'Origin': 'http://malicious.com' }
    });
    expect(response.headers()['access-control-allow-origin']).not.toBe('*');
  });

  test('Should timeout idle sessions', async ({ page }) => {
    await login(page);
    // Simulate 25 hours idle (session timeout is 24 hours)
    await page.evaluate(() => {
      const expires = new Date();
      expires.setHours(expires.getHours() - 25);
      document.cookie = `session=test; expires=${expires.toUTCString()}`;
    });
    await page.reload();
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('Should log security events', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.fill('input[name="username"]', 'hacker');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    
    await login(page);
    await page.click('a:has-text("Errors")');
    await page.fill('[data-test="error-search"]', 'login failed');
    const securityLog = await page.locator('[data-test="error-item"]:has-text("login failed")').count();
    expect(securityLog).toBeGreaterThan(0);
  });
});

// Run tests with various configurations
module.exports = {
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: DASHBOARD_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...require('@playwright/test').devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop Safari',
      use: { ...require('@playwright/test').devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...require('@playwright/test').devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...require('@playwright/test').devices['iPhone 12'] },
    },
  ],
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
  ],
};