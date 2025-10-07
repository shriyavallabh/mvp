// Dashboard API - Serves advisor-specific content
const fs = require('fs').promises;
const path = require('path');

// Helper to get latest session for advisor
async function getLatestSession(advisorId) {
  const outputDir = path.join(process.cwd(), 'output');

  try {
    const sessions = await fs.readdir(outputDir);
    const sessionDirs = sessions
      .filter(s => s.startsWith('session_'))
      .sort()
      .reverse();

    for (const sessionDir of sessionDirs) {
      const advisorDir = path.join(outputDir, sessionDir, 'advisors', advisorId);
      try {
        await fs.access(advisorDir);
        return path.join(outputDir, sessionDir);
      } catch (e) {
        continue;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Helper to read advisor content
async function getAdvisorContent(advisorId) {
  const sessionPath = await getLatestSession(advisorId);
  if (!sessionPath) {
    return null;
  }

  const advisorPath = path.join(sessionPath, 'advisors', advisorId);

  try {
    // Read WhatsApp message
    let whatsappMessage = '';
    try {
      const whatsappFiles = await fs.readdir(advisorPath);
      const whatsappFile = whatsappFiles.find(f => f.includes('whatsapp') && f.endsWith('.txt'));
      if (whatsappFile) {
        whatsappMessage = await fs.readFile(path.join(advisorPath, whatsappFile), 'utf-8');
      }
    } catch (e) {}

    // Read LinkedIn post
    let linkedinPost = '';
    try {
      const linkedinFiles = await fs.readdir(advisorPath);
      const linkedinFile = linkedinFiles.find(f => f.includes('linkedin') && f.endsWith('.txt'));
      if (linkedinFile) {
        linkedinPost = await fs.readFile(path.join(advisorPath, linkedinFile), 'utf-8');
      }
    } catch (e) {}

    // Find WhatsApp image
    let whatsappImage = '';
    try {
      const imageFiles = await fs.readdir(advisorPath);
      const waImageFile = imageFiles.find(f => f.includes('whatsapp') && (f.endsWith('.png') || f.endsWith('.jpg')));
      if (waImageFile) {
        whatsappImage = `/api/image?session=${path.basename(sessionPath)}&advisor=${advisorId}&file=${waImageFile}`;
      }
    } catch (e) {}

    // Find status image
    let statusImage = '';
    try {
      const imageFiles = await fs.readdir(advisorPath);
      const imageFile = imageFiles.find(f => f.includes('status') && (f.endsWith('.png') || f.endsWith('.jpg')));
      if (imageFile) {
        statusImage = `/api/image?session=${path.basename(sessionPath)}&advisor=${advisorId}&file=${imageFile}`;
      }
    } catch (e) {}

    return {
      whatsappMessage,
      whatsappImage,
      linkedinPost,
      statusImage,
      sessionDate: path.basename(sessionPath).replace('session_', '')
    };
  } catch (e) {
    console.error('Error reading content:', e);
    return null;
  }
}

// Helper to send JSON response (works with both Vercel and Node.js)
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Main handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const { phone } = req.query;

  if (!phone) {
    return sendJson(res, 400, { error: 'Phone number required' });
  }

  try {
    // Load advisors
    const advisorsPath = path.join(process.cwd(), 'data', 'advisors.json');
    const advisorsData = await fs.readFile(advisorsPath, 'utf-8');
    const advisors = JSON.parse(advisorsData);

    // Find advisor by phone
    const advisor = advisors.find(a => a.phone === phone || a.phone === `91${phone}` || `91${a.phone}` === phone);

    if (!advisor) {
      return sendJson(res, 404, { error: 'Advisor not found' });
    }

    // Get content
    const content = await getAdvisorContent(advisor.id);

    if (!content) {
      return sendJson(res, 404, { error: 'No content available yet' });
    }

    return sendJson(res, 200, {
      advisor: {
        id: advisor.id,
        name: advisor.name,
        branding: advisor.branding
      },
      content
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    return sendJson(res, 500, { error: 'Server error' });
  }
};
