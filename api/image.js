// Image serving API
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const { session, advisor, file } = req.query;

  if (!session || !advisor || !file) {
    return res.status(400).send('Missing parameters');
  }

  try {
    const imagePath = path.join(
      process.cwd(),
      'output',
      session,
      'advisors',
      advisor,
      file
    );

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).send('Image not found');
    }

    // Read and serve image
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(file).toLowerCase();

    // Set content type
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    return res.status(200).send(imageBuffer);
  } catch (e) {
    console.error('Image serving error:', e);
    return res.status(500).send('Server error');
  }
};
