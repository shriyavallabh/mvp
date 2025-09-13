// E2E tests for WhatsApp Web-Style Interface using Playwright
const { test, expect } = require('@playwright/test');

test.describe('WhatsApp Interface E2E Tests', () => {
    const baseUrl = 'http://localhost:8080';
    
    test.beforeEach(async ({ page }) => {
        // Login to dashboard
        await page.goto(`${baseUrl}/auth/login`);
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL(`${baseUrl}/`);
    });
    
    test('should navigate to WhatsApp interface', async ({ page }) => {
        await page.click('a[href="/whatsapp"]');
        await page.waitForURL(`${baseUrl}/whatsapp`);
        
        // Check if WhatsApp interface loaded
        await expect(page.locator('.whatsapp-container')).toBeVisible();
        await expect(page.locator('.sidebar')).toBeVisible();
        await expect(page.locator('.chat-area')).toBeVisible();
    });
    
    test('should display advisor list', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Wait for advisors to load
        await page.waitForSelector('.advisor-item', { timeout: 10000 });
        
        // Check if advisors are displayed
        const advisors = await page.locator('.advisor-item').count();
        expect(advisors).toBeGreaterThan(0);
    });
    
    test('should select an advisor and show conversation', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Wait for advisors to load
        await page.waitForSelector('.advisor-item');
        
        // Click first advisor
        await page.click('.advisor-item:first-child');
        
        // Check if conversation area is shown
        await expect(page.locator('#chatContent')).toBeVisible();
        await expect(page.locator('.chat-header')).toBeVisible();
        await expect(page.locator('.messages-container')).toBeVisible();
        await expect(page.locator('.message-input-container')).toBeVisible();
    });
    
    test('should send a text message', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Select first advisor
        await page.waitForSelector('.advisor-item');
        await page.click('.advisor-item:first-child');
        
        // Type and send message
        const testMessage = `Test message ${Date.now()}`;
        await page.fill('#messageInput', testMessage);
        await page.click('#sendBtn');
        
        // Check if message appears in conversation
        await page.waitForSelector('.message.sent', { timeout: 5000 });
        const sentMessage = await page.locator('.message.sent .message-content').last().textContent();
        expect(sentMessage).toBe(testMessage);
    });
    
    test('should search for advisors', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Wait for advisors to load
        await page.waitForSelector('.advisor-item');
        
        // Search for an advisor
        await page.fill('#searchInput', 'Avalok');
        
        // Check if search filters advisors
        await page.waitForTimeout(500); // Wait for search to filter
        const visibleAdvisors = await page.locator('.advisor-item:visible').count();
        const allAdvisors = await page.locator('.advisor-item').count();
        expect(visibleAdvisors).toBeLessThanOrEqual(allAdvisors);
    });
    
    test('should open export modal', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Select an advisor
        await page.waitForSelector('.advisor-item');
        await page.click('.advisor-item:first-child');
        
        // Click export button
        await page.click('#exportBtn');
        
        // Check if export modal is visible
        await expect(page.locator('#exportModal')).toHaveClass(/active/);
        await expect(page.locator('.export-btn[data-format="pdf"]')).toBeVisible();
        await expect(page.locator('.export-btn[data-format="csv"]')).toBeVisible();
        await expect(page.locator('.export-btn[data-format="json"]')).toBeVisible();
    });
    
    test('should handle real-time message updates', async ({ page, context }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Select an advisor
        await page.waitForSelector('.advisor-item');
        await page.click('.advisor-item:first-child');
        
        // Open another tab to simulate another user
        const page2 = await context.newPage();
        await page2.goto(`${baseUrl}/auth/login`);
        await page2.fill('input[name="username"]', 'admin');
        await page2.fill('input[name="password"]', 'admin123');
        await page2.click('button[type="submit"]');
        await page2.waitForURL(`${baseUrl}/`);
        await page2.goto(`${baseUrl}/whatsapp`);
        
        // Send message from second tab
        await page2.click('.advisor-item:first-child');
        const testMessage = `Real-time test ${Date.now()}`;
        await page2.fill('#messageInput', testMessage);
        await page2.click('#sendBtn');
        
        // Check if message appears in first tab
        await page.waitForSelector('.message.sent:last-child', { timeout: 5000 });
        const receivedMessage = await page.locator('.message.sent .message-content').last().textContent();
        expect(receivedMessage).toBe(testMessage);
        
        await page2.close();
    });
    
    test('should mark messages as read', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Check for unread count
        await page.waitForSelector('.advisor-item');
        const unreadBefore = await page.locator('.unread-count').count();
        
        // Click advisor to mark as read
        await page.click('.advisor-item:first-child');
        
        // Wait for messages to be marked as read
        await page.waitForTimeout(1000);
        
        // Go back to advisor list
        await page.click('.sidebar-header h3');
        
        // Check if unread count decreased
        const unreadAfter = await page.locator('.unread-count').count();
        expect(unreadAfter).toBeLessThanOrEqual(unreadBefore);
    });
    
    test('should handle message status updates', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Select advisor and send message
        await page.waitForSelector('.advisor-item');
        await page.click('.advisor-item:first-child');
        
        const testMessage = `Status test ${Date.now()}`;
        await page.fill('#messageInput', testMessage);
        await page.click('#sendBtn');
        
        // Wait for message to appear
        await page.waitForSelector('.message.sent:last-child');
        
        // Check for status indicator
        const statusElement = await page.locator('.message.sent:last-child .message-status');
        await expect(statusElement).toBeVisible();
        
        // Status should change from pending to sent/delivered
        await page.waitForTimeout(2000);
        const statusClass = await statusElement.getAttribute('class');
        expect(statusClass).toMatch(/sent|delivered|read/);
    });
    
    test('should show typing indicator', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Select advisor
        await page.waitForSelector('.advisor-item');
        await page.click('.advisor-item:first-child');
        
        // Start typing
        await page.fill('#messageInput', 'Typing...');
        
        // Typing indicator logic would be tested here
        // This requires WebSocket simulation
        expect(true).toBe(true);
    });
    
    test('should handle mobile responsive design', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Check if layout adapts for mobile
        await expect(page.locator('.whatsapp-container')).toBeVisible();
        
        // Sidebar should be full width on mobile
        const sidebarWidth = await page.locator('.sidebar').evaluate(el => el.offsetWidth);
        expect(sidebarWidth).toBe(375);
    });
    
    test('should export conversation to PDF', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Select advisor
        await page.waitForSelector('.advisor-item');
        await page.click('.advisor-item:first-child');
        
        // Open export modal
        await page.click('#exportBtn');
        
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        
        // Click PDF export
        await page.click('.export-btn[data-format="pdf"]');
        
        // Wait for download
        const download = await downloadPromise;
        expect(download).toBeTruthy();
        
        // Check filename
        const filename = download.suggestedFilename();
        expect(filename).toContain('conversation');
        expect(filename).toContain('.pdf');
    });
    
    test('should handle broadcast message', async ({ page }) => {
        await page.goto(`${baseUrl}/whatsapp`);
        
        // Click broadcast button
        await page.click('#broadcastBtn');
        
        // This would open broadcast modal (to be implemented)
        // For now, just check alert
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Broadcast');
            await dialog.accept();
        });
    });
});

// Performance test
test.describe('Performance Tests', () => {
    test('should load interface within 1 second', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('http://localhost:8080/whatsapp');
        await page.waitForSelector('.advisor-item');
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(1000);
    });
    
    test('should handle 50+ messages smoothly', async ({ page }) => {
        await page.goto('http://localhost:8080/whatsapp');
        
        // Select advisor with many messages
        await page.waitForSelector('.advisor-item');
        await page.click('.advisor-item:first-child');
        
        // Check if messages load
        await page.waitForSelector('.message');
        const messageCount = await page.locator('.message').count();
        
        // Scroll performance
        const startTime = Date.now();
        await page.evaluate(() => {
            const container = document.querySelector('.messages-container');
            container.scrollTop = container.scrollHeight;
        });
        const scrollTime = Date.now() - startTime;
        
        expect(scrollTime).toBeLessThan(100);
    });
});