/**
 * Terms of Service Page for Meta App Publishing
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
    <title>Terms of Service - JarvisDaily</title>
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
    <h1>Terms of Service</h1>
    <p class="last-updated">Last Updated: January 2025</p>

    <h2>1. Acceptance of Terms</h2>
    <p>
        By using JarvisDaily's WhatsApp content delivery service ("Service"),
        you agree to these Terms of Service. If you do not agree, please do not use the Service.
    </p>

    <h2>2. Description of Service</h2>
    <p>
        JarvisDaily provides AI-generated financial content, market insights, and
        educational materials delivered via WhatsApp to opted-in financial advisors.
    </p>

    <h2>3. Eligibility</h2>
    <p>
        You must be:
    </p>
    <ul>
        <li>At least 18 years old</li>
        <li>A registered financial advisor or professional</li>
        <li>Authorized to receive financial content for business purposes</li>
    </ul>

    <h2>4. User Obligations</h2>
    <p>You agree to:</p>
    <ul>
        <li>Provide accurate contact information</li>
        <li>Use content responsibly and in compliance with regulations</li>
        <li>Not share content inappropriately or without attribution</li>
        <li>Respect intellectual property rights</li>
        <li>Comply with applicable financial advisory regulations (SEBI, etc.)</li>
    </ul>

    <h2>5. Content and Intellectual Property</h2>
    <p>
        All content provided by JarvisDaily is:
    </p>
    <ul>
        <li>Protected by copyright and intellectual property laws</li>
        <li>Licensed to you for personal business use only</li>
        <li>Not to be resold, redistributed, or claimed as your own</li>
        <li>Subject to our attribution requirements</li>
    </ul>

    <h2>6. Disclaimer of Financial Advice</h2>
    <p>
        <strong>IMPORTANT:</strong> Content provided is for informational and
        educational purposes only. It does NOT constitute financial advice,
        investment recommendations, or professional guidance. You are responsible
        for your own investment decisions and due diligence.
    </p>

    <h2>7. Compliance and Regulatory Notice</h2>
    <p>
        Our content is designed to comply with SEBI guidelines for mutual fund
        advisors. However, YOU are responsible for ensuring your use of the
        content complies with all applicable regulations in your jurisdiction.
    </p>

    <h2>8. Opt-In and Consent</h2>
    <p>
        By clicking "Get Content" or similar buttons:
    </p>
    <ul>
        <li>You consent to receive WhatsApp messages from us</li>
        <li>You acknowledge this is opt-in based communication</li>
        <li>You can opt-out anytime by replying "STOP"</li>
    </ul>

    <h2>9. Service Availability</h2>
    <p>
        We strive for 99%+ uptime but cannot guarantee uninterrupted service.
        We reserve the right to:
    </p>
    <ul>
        <li>Modify or discontinue the Service (with notice)</li>
        <li>Perform maintenance and updates</li>
        <li>Suspend access for violations of these Terms</li>
    </ul>

    <h2>10. Limitation of Liability</h2>
    <p>
        JarvisDaily is NOT liable for:
    </p>
    <ul>
        <li>Investment losses or financial decisions based on our content</li>
        <li>Errors or omissions in content (though we strive for accuracy)</li>
        <li>Service interruptions or technical issues</li>
        <li>Third-party services (WhatsApp, etc.)</li>
    </ul>

    <h2>11. Indemnification</h2>
    <p>
        You agree to indemnify JarvisDaily from claims arising from:
    </p>
    <ul>
        <li>Your misuse of the Service</li>
        <li>Violations of these Terms</li>
        <li>Your violation of applicable laws or regulations</li>
    </ul>

    <h2>12. Pricing and Payment</h2>
    <p>
        Service pricing (if applicable) will be clearly communicated.
        Payment terms, refund policies, and billing details are provided separately.
    </p>

    <h2>13. Termination</h2>
    <p>
        We may terminate or suspend your access:
    </p>
    <ul>
        <li>For violations of these Terms</li>
        <li>For fraudulent or abusive behavior</li>
        <li>At our discretion with reasonable notice</li>
    </ul>

    <h2>14. Governing Law</h2>
    <p>
        These Terms are governed by the laws of India. Disputes will be
        resolved in the courts of [Your Jurisdiction].
    </p>

    <h2>15. Changes to Terms</h2>
    <p>
        We may update these Terms periodically. Continued use after changes
        constitutes acceptance of new Terms.
    </p>

    <h2>16. WhatsApp Business Policy Compliance</h2>
    <p>
        Our use of WhatsApp complies with Meta's WhatsApp Business API policies.
        We respect user privacy and message limits.
    </p>

    <h2>17. Contact Information</h2>
    <p>
        For questions about these Terms:<br>
        Email: legal@jarvisdaily.com<br>
        WhatsApp: +91 76666 84471<br>
        Website: https://jarvisdaily.com
    </p>

    <hr style="margin: 40px 0;">
    <p style="text-align: center; color: #666;">
        © 2025 JarvisDaily. All rights reserved.
    </p>
</body>
</html>
    `);
}
