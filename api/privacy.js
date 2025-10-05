/**
 * Privacy Policy Page for Meta App Publishing
 * Required for Meta App Review if publishing app
 */

export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - JarvisDaily</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #1a73e8; }
        h2 { color: #555; margin-top: 30px; }
        p { margin: 15px 0; }
        .last-updated { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last Updated: January 2025</p>

    <h2>1. Introduction</h2>
    <p>
        JarvisDaily ("we", "our", "us") is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, and safeguard your information
        when you use our WhatsApp-based content delivery service for financial advisors.
    </p>

    <h2>2. Information We Collect</h2>
    <p><strong>Personal Information:</strong></p>
    <ul>
        <li>WhatsApp phone number (provided by you)</li>
        <li>Name and business information (optional)</li>
        <li>Preferences and interaction data with our service</li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <p>We use your information to:</p>
    <ul>
        <li>Deliver daily financial content and market insights via WhatsApp</li>
        <li>Personalize content based on your preferences</li>
        <li>Improve our service quality and user experience</li>
        <li>Comply with legal obligations</li>
    </ul>

    <h2>4. Data Sharing</h2>
    <p>
        We do NOT sell, trade, or rent your personal information to third parties.
        We may share information only:
    </p>
    <ul>
        <li>With Meta/WhatsApp to deliver messages (required for service)</li>
        <li>When required by law or legal process</li>
        <li>To protect our rights or safety</li>
    </ul>

    <h2>5. Data Security</h2>
    <p>
        We implement industry-standard security measures to protect your data, including:
    </p>
    <ul>
        <li>Encrypted data transmission (HTTPS/TLS)</li>
        <li>Secure server infrastructure</li>
        <li>Access controls and authentication</li>
        <li>Regular security audits</li>
    </ul>

    <h2>6. WhatsApp Specific</h2>
    <p>
        We use WhatsApp Business API to send you content. WhatsApp's own privacy
        policy also applies. Messages are end-to-end encrypted by WhatsApp.
    </p>

    <h2>7. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
        <li>Access your personal data</li>
        <li>Request correction or deletion of your data</li>
        <li>Opt-out of our service at any time (by sending "STOP")</li>
        <li>Request data portability</li>
    </ul>

    <h2>8. Opt-In and Opt-Out</h2>
    <p>
        Our service is opt-in only. You receive messages only after clicking
        a consent button. To opt-out, reply "STOP" to any message or contact us.
    </p>

    <h2>9. Data Retention</h2>
    <p>
        We retain your data only as long as necessary to provide our service
        or as required by law. You may request deletion at any time.
    </p>

    <h2>10. Children's Privacy</h2>
    <p>
        Our service is not intended for individuals under 18. We do not knowingly
        collect information from children.
    </p>

    <h2>11. Changes to This Policy</h2>
    <p>
        We may update this Privacy Policy periodically. We will notify you of
        significant changes via WhatsApp or email.
    </p>

    <h2>12. Contact Us</h2>
    <p>
        For privacy-related questions or requests:<br>
        Email: privacy@jarvisdaily.com<br>
        WhatsApp: +91 76666 84471
    </p>

    <hr style="margin: 40px 0;">
    <p style="text-align: center; color: #666;">
        © 2025 JarvisDaily. All rights reserved.
    </p>
</body>
</html>
    `);
}
