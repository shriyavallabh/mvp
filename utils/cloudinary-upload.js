require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload status image to Cloudinary
 * @param {string} imagePath - Local file path
 * @param {string} advisorId - Advisor identifier
 * @returns {Promise<string>} - Cloudinary URL
 */
async function uploadStatusImage(imagePath, advisorId) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  try {
    const filename = path.basename(imagePath, path.extname(imagePath));
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: `jarvisdaily/${dateStr}`,
      public_id: `${advisorId}_${filename}`,
      overwrite: true,
      transformation: [
        { width: 1080, height: 1920, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      resource_type: 'image'
    });

    console.log(`  ✅ Uploaded: ${advisorId} → ${result.secure_url.slice(0, 60)}...`);
    return result.secure_url;
  } catch (error) {
    console.error(`  ❌ Upload failed for ${advisorId}:`, error.message);
    throw error;
  }
}

/**
 * Cleanup old images (30+ days)
 */
async function cleanupOldImages() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldDate = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '');

  try {
    const result = await cloudinary.api.delete_resources_by_prefix(
      `jarvisdaily/${oldDate}`,
      { resource_type: 'image' }
    );
    if (result.deleted && Object.keys(result.deleted).length > 0) {
      console.log(`🗑️  Cleaned up ${Object.keys(result.deleted).length} old images`);
    }
  } catch (error) {
    // Ignore errors (folder might not exist yet)
    console.log(`⚠️  Cleanup skipped: ${error.message}`);
  }
}

module.exports = {
  uploadStatusImage,
  cleanupOldImages
};
