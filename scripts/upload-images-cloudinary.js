#!/usr/bin/env node

/**
 * Upload status images to Cloudinary for reliable hosting
 * Cloudinary provides stable URLs that work in WhatsApp
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

async function uploadToCloudinary(imagePath, publicId) {
  const timestamp = Math.round(Date.now() / 1000);

  // Read image file
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Generate signature
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign)
    .digest('hex');

  // Prepare form data
  const formData = {
    file: `data:image/png;base64,${base64Image}`,
    api_key: API_KEY,
    timestamp: timestamp,
    signature: signature,
    public_id: publicId,
    folder: 'jarvisdaily/status-images'
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(formData);

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject(new Error(result.error?.message || 'Upload failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function uploadSessionImages(sessionPath) {
  const advisorsDir = path.join(sessionPath, 'advisors');

  try {
    const advisorIds = await fs.readdir(advisorsDir);
    const uploadResults = [];

    for (const advisorId of advisorIds) {
      const advisorPath = path.join(advisorsDir, advisorId);
      const files = await fs.readdir(advisorPath);

      // Find image file
      const imageFile = files.find(f =>
        (f.includes('status') || f.includes('image')) &&
        (f.endsWith('.png') || f.endsWith('.jpg'))
      );

      if (!imageFile) {
        console.log(`⚠️  No image found for ${advisorId}`);
        continue;
      }

      const imagePath = path.join(advisorPath, imageFile);
      const sessionDate = path.basename(sessionPath).replace('session_', '');
      const publicId = `${advisorId}_${sessionDate}`;

      try {
        console.log(`📤 Uploading ${advisorId}...`);
        const result = await uploadToCloudinary(imagePath, publicId);

        uploadResults.push({
          advisorId,
          url: result.secure_url,
          publicId: result.public_id
        });

        console.log(`✅ Uploaded: ${result.secure_url}`);

        // Save URL to a file for easy reference
        await fs.writeFile(
          path.join(advisorPath, 'cloudinary-url.txt'),
          result.secure_url
        );

      } catch (error) {
        console.error(`❌ Failed for ${advisorId}:`, error.message);
      }

      // Wait between uploads
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save all URLs
    const urlsPath = path.join(sessionPath, 'cloudinary-urls.json');
    await fs.writeFile(urlsPath, JSON.stringify(uploadResults, null, 2));

    console.log(`\n✨ Uploaded ${uploadResults.length} images`);
    console.log(`📄 URLs saved to: ${urlsPath}`);

    return uploadResults;

  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const sessionPath = process.argv[2];

  if (!sessionPath) {
    console.error('Usage: node upload-images-cloudinary.js <session-path>');
    console.error('Example: node upload-images-cloudinary.js ./output/session_2025-01-15');
    process.exit(1);
  }

  uploadSessionImages(sessionPath)
    .then(() => console.log('\n✅ Done!'))
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { uploadToCloudinary, uploadSessionImages };
