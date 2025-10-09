const { test, expect } = require('@playwright/test');

test.describe('OTP Authentication System', () => {
  const testPhone = '+919876543210';
  const invalidPhone = '1234567890';

  test.beforeEach(async ({ page }) => {
    // Set bypass header for Vercel protection
    await page.setExtraHTTPHeaders({
      'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
    });
  });

  test('should successfully send OTP to valid Indian phone number', async ({ request }) => {
    const response = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('OTP sent successfully');

    // In development, OTP should be returned for testing
    if (process.env.NODE_ENV === 'development') {
      expect(data.debug).toBeDefined();
      expect(data.debug).toMatch(/^\d{6}$/); // 6-digit OTP
    }
  });

  test('should reject invalid phone number format', async ({ request }) => {
    const response = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: invalidPhone
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid phone number');
  });

  test('should reject phone number without +91 prefix', async ({ request }) => {
    const response = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: '9876543210' // Missing +91
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid phone number');
  });

  test('should verify correct OTP', async ({ request }) => {
    // Step 1: Send OTP
    const sendResponse = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone
      }
    });

    expect(sendResponse.status()).toBe(200);
    const sendData = await sendResponse.json();
    const otp = sendData.debug; // Get OTP from debug field

    // Step 2: Verify OTP
    const verifyResponse = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone,
        otp: otp
      }
    });

    expect(verifyResponse.status()).toBe(200);
    const verifyData = await verifyResponse.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.phoneVerified).toBe(true);
    expect(verifyData.message).toBe('Phone number verified successfully');
  });

  test('should reject incorrect OTP', async ({ request }) => {
    // Step 1: Send OTP
    await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone
      }
    });

    // Step 2: Try to verify with wrong OTP
    const verifyResponse = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone,
        otp: '000000' // Wrong OTP
      }
    });

    expect(verifyResponse.status()).toBe(400);
    const data = await verifyResponse.json();
    expect(data.error).toContain('Invalid OTP');
  });

  test('should reject OTP verification for non-existent phone number', async ({ request }) => {
    const response = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: '+919999999999', // Phone that didn't request OTP
        otp: '123456'
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('OTP expired or not found');
  });

  test('should reject OTP reuse (one-time use)', async ({ request }) => {
    // Step 1: Send OTP
    const sendResponse = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone
      }
    });

    const sendData = await sendResponse.json();
    const otp = sendData.debug;

    // Step 2: Verify OTP (first time - should succeed)
    await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone,
        otp: otp
      }
    });

    // Step 3: Try to use same OTP again (should fail)
    const reVerifyResponse = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone,
        otp: otp
      }
    });

    expect(reVerifyResponse.status()).toBe(400);
    const data = await reVerifyResponse.json();
    expect(data.error).toContain('OTP expired or not found');
  });

  test('should reject missing phone number in send-otp', async ({ request }) => {
    const response = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {}
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid phone number');
  });

  test('should reject missing parameters in verify-otp', async ({ request }) => {
    // Test missing phone
    const response1 = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        otp: '123456'
      }
    });

    expect(response1.status()).toBe(400);
    const data1 = await response1.json();
    expect(data1.error).toContain('Phone and OTP are required');

    // Test missing OTP
    const response2 = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone
      }
    });

    expect(response2.status()).toBe(400);
    const data2 = await response2.json();
    expect(data2.error).toContain('Phone and OTP are required');
  });

  test('should handle multiple simultaneous OTP requests', async ({ request }) => {
    // Send OTP twice for same number
    const response1 = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone
      }
    });

    const data1 = await response1.json();
    const otp1 = data1.debug;

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send OTP again (should overwrite previous)
    const response2 = await request.post('/api/auth/send-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone
      }
    });

    const data2 = await response2.json();
    const otp2 = data2.debug;

    // First OTP should be invalid
    const verifyOld = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone,
        otp: otp1
      }
    });

    expect(verifyOld.status()).toBe(400);

    // Second OTP should work
    const verifyNew = await request.post('/api/auth/verify-otp', {
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8'
      },
      data: {
        phone: testPhone,
        otp: otp2
      }
    });

    expect(verifyNew.status()).toBe(200);
  });
});
