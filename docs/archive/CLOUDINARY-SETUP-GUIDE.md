# Cloudinary Setup Guide (5 Minutes)

## Step 1: Create FREE Cloudinary Account

1. Go to: https://cloudinary.com/users/register/free
2. Fill in:
   - Email: your email
   - Choose a cloud name (e.g., "jarvisdaily" or "finadvise-content")
   - Password
3. Click "Create Account"
4. **NO CREDIT CARD REQUIRED**

## Step 2: Get Your API Credentials

1. After signup, you'll see the Dashboard
2. Look for "Account Details" section (usually top-right)
3. You'll see:
   ```
   Cloud name: your-cloud-name
   API Key: 123456789012345
   API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
   ```
4. Copy all three values

## Step 3: Add to .env File

Open `/Users/shriyavallabh/Desktop/mvp/.env` and add:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here

# AiSensy Configuration (already exists)
AISENSY_API_KEY=your-aisensy-key-here
```

## Step 4: Install Cloudinary Package

```bash
cd /Users/shriyavallabh/Desktop/mvp
npm install cloudinary
```

## Step 5: Test Upload

Create test file: `test-cloudinary.js`

```javascript
require('dotenv').config();
const { uploadStatusImage } = require('./utils/cloudinary-upload');
const path = require('path');

async function test() {
  try {
    // Test with an existing image from your session
    const testImage = '/Users/shriyavallabh/Desktop/mvp/output/session_20251002_180551/images/status/compliant/avalok_langer_status_1_branded.png';

    console.log('Testing Cloudinary upload...');
    const url = await uploadStatusImage(testImage, 'test_avalok');
    console.log('✅ Success! Image URL:', url);
    console.log('\nYou can view it at:', url);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run test:
```bash
node test-cloudinary.js
```

Expected output:
```
Testing Cloudinary upload...
  ✅ Uploaded: test_avalok → https://res.cloudinary.com/jarvisdaily/image/upload/...
✅ Success! Image URL: https://res.cloudinary.com/jarvisdaily/...
```

## Step 6: Verify on Cloudinary Dashboard

1. Go back to cloudinary.com
2. Click "Media Library" (left sidebar)
3. You should see folder: `jarvisdaily/20251002/`
4. Inside: `test_avalok_...png`
5. Click image to view full size

## Troubleshooting

### Error: "Invalid cloud_name"
- Check CLOUDINARY_CLOUD_NAME in .env
- Remove quotes if present
- Should be: `CLOUDINARY_CLOUD_NAME=jarvisdaily` (not "jarvisdaily")

### Error: "Invalid API credentials"
- Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET
- Make sure no spaces or quotes
- Copy-paste directly from Cloudinary dashboard

### Error: "Image not found"
- Check test image path exists
- Use absolute path (not relative)

### Error: "Module not found: cloudinary"
- Run: `npm install cloudinary`
- Make sure you're in correct directory

## Free Tier Limits

- ✅ 25 GB storage OR bandwidth OR transformations
- ✅ No time limit
- ✅ 3 users
- ✅ Enough for 100+ advisors

## Next Steps

Once Cloudinary works:
1. ✅ Setup complete!
2. Ready to test `send-daily-templates.js`
3. Run dry run first: `DRY_RUN=true node send-daily-templates.js`
