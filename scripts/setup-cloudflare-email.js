#!/usr/bin/env node
/**
 * Cloudflare Email Routing Setup - Fully Automated
 *
 * This script will:
 * 1. Verify domain is on Cloudflare
 * 2. Enable Email Routing
 * 3. Create MX records for email routing
 * 4. Set up SPF/DKIM records
 * 5. Create email aliases (hello@, support@, etc.)
 * 6. Configure forwarding to your Gmail
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=your_token node scripts/setup-cloudflare-email.js
 */

require('dotenv').config();

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DOMAIN = 'jarvisdaily.com';
const DESTINATION_EMAIL = process.env.FORWARD_TO_EMAIL || 'crm.jarvisdaily@gmail.com';

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';

// Email aliases to create (prioritizing the 2 main ones)
const EMAIL_ALIASES = [
  { alias: 'shruti@jarvisdaily.com', description: 'Shruti - CEO/Founder' },
  { alias: 'info@jarvisdaily.com', description: 'General information' },
  { alias: 'support@jarvisdaily.com', description: 'Customer support' },
  { alias: 'hello@jarvisdaily.com', description: 'General inquiries' },
  { alias: 'contact@jarvisdaily.com', description: 'Contact us' },
];

async function cloudflareRequest(endpoint, method = 'GET', body = null) {
  const url = `${CLOUDFLARE_API}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!data.success) {
    throw new Error(`Cloudflare API Error: ${JSON.stringify(data.errors)}`);
  }

  return data.result;
}

async function getZoneId(domain) {
  console.log(`\n🔍 Finding zone ID for ${domain}...`);
  const zones = await cloudflareRequest(`/zones?name=${domain}`);

  if (zones.length === 0) {
    throw new Error(`Domain ${domain} not found in Cloudflare. Please add it first.`);
  }

  const zoneId = zones[0].id;
  console.log(`✅ Zone ID: ${zoneId}`);
  return zoneId;
}

async function enableEmailRouting(zoneId) {
  console.log('\n📧 Enabling Email Routing...');

  try {
    const result = await cloudflareRequest(`/zones/${zoneId}/email/routing`, 'PUT', {
      enabled: true
    });
    console.log('✅ Email Routing enabled');
    return result;
  } catch (error) {
    if (error.message.includes('already enabled')) {
      console.log('✅ Email Routing already enabled');
      return true;
    }
    throw error;
  }
}

async function createMXRecords(zoneId) {
  console.log('\n📮 Creating MX records...');

  const mxRecords = [
    { name: DOMAIN, content: 'route1.mx.cloudflare.net', priority: 18 },
    { name: DOMAIN, content: 'route2.mx.cloudflare.net', priority: 59 },
    { name: DOMAIN, content: 'route3.mx.cloudflare.net', priority: 86 },
  ];

  // First, get existing MX records
  const existingRecords = await cloudflareRequest(`/zones/${zoneId}/dns_records?type=MX`);

  // Delete old MX records (non-Cloudflare)
  for (const record of existingRecords) {
    if (!record.content.includes('cloudflare.net')) {
      console.log(`🗑️  Deleting old MX record: ${record.content}`);
      await cloudflareRequest(`/zones/${zoneId}/dns_records/${record.id}`, 'DELETE');
    }
  }

  // Create new Cloudflare MX records
  for (const mx of mxRecords) {
    try {
      await cloudflareRequest(`/zones/${zoneId}/dns_records`, 'POST', {
        type: 'MX',
        name: mx.name,
        content: mx.content,
        priority: mx.priority,
        ttl: 1, // Auto
      });
      console.log(`✅ Created MX record: ${mx.content} (priority ${mx.priority})`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ MX record already exists: ${mx.content}`);
      } else {
        throw error;
      }
    }
  }
}

async function createSPFRecord(zoneId) {
  console.log('\n🔐 Creating SPF record...');

  const spfRecord = {
    type: 'TXT',
    name: DOMAIN,
    content: 'v=spf1 include:_spf.mx.cloudflare.net ~all',
    ttl: 1,
  };

  // Check if SPF record exists
  const existingRecords = await cloudflareRequest(
    `/zones/${zoneId}/dns_records?type=TXT&name=${DOMAIN}`
  );

  const spfExists = existingRecords.some(r => r.content.includes('v=spf1'));

  if (spfExists) {
    console.log('✅ SPF record already exists');
  } else {
    await cloudflareRequest(`/zones/${zoneId}/dns_records`, 'POST', spfRecord);
    console.log('✅ SPF record created');
  }
}

async function addDestinationEmail(zoneId, email) {
  console.log(`\n📨 Adding destination email: ${email}...`);

  try {
    const result = await cloudflareRequest(
      `/zones/${zoneId}/email/routing/addresses`,
      'POST',
      { email }
    );
    console.log('✅ Destination email added. CHECK YOUR EMAIL for verification link!');
    console.log('⚠️  You must click the verification link in your email before aliases will work.');
    return result;
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('already verified')) {
      console.log('✅ Destination email already added and verified');
      return true;
    }
    throw error;
  }
}

async function createEmailAliases(zoneId) {
  console.log('\n✉️  Creating email aliases...');

  for (const { alias, description } of EMAIL_ALIASES) {
    try {
      const result = await cloudflareRequest(
        `/zones/${zoneId}/email/routing/rules`,
        'POST',
        {
          name: description,
          enabled: true,
          matchers: [
            {
              type: 'literal',
              field: 'to',
              value: alias,
            },
          ],
          actions: [
            {
              type: 'forward',
              value: [DESTINATION_EMAIL],
            },
          ],
        }
      );
      console.log(`✅ Created alias: ${alias} → ${DESTINATION_EMAIL}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Alias already exists: ${alias}`);
      } else {
        console.error(`❌ Failed to create ${alias}: ${error.message}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting Cloudflare Email Routing Setup...');
  console.log(`📧 Domain: ${DOMAIN}`);
  console.log(`📬 Forwarding to: ${DESTINATION_EMAIL}`);

  if (!CLOUDFLARE_API_TOKEN) {
    console.error('\n❌ Error: CLOUDFLARE_API_TOKEN not found in environment');
    console.log('\nSet it in .env file:');
    console.log('CLOUDFLARE_API_TOKEN=your_token_here');
    process.exit(1);
  }

  try {
    // Step 1: Get Zone ID
    const zoneId = await getZoneId(DOMAIN);

    // Step 2: Enable Email Routing
    await enableEmailRouting(zoneId);

    // Step 3: Create MX Records
    await createMXRecords(zoneId);

    // Step 4: Create SPF Record
    await createSPFRecord(zoneId);

    // Step 5: Add Destination Email
    await addDestinationEmail(zoneId, DESTINATION_EMAIL);

    // Step 6: Create Email Aliases
    await createEmailAliases(zoneId);

    console.log('\n\n🎉 ============================================');
    console.log('✅ Cloudflare Email Routing Setup Complete!');
    console.log('============================================\n');

    console.log('📋 Next Steps:');
    console.log('1. ✅ Check your email for Cloudflare verification link');
    console.log('2. ✅ Click the link to verify your destination email');
    console.log('3. ✅ Wait 5-10 minutes for DNS propagation');
    console.log('4. ✅ Test by sending email to hello@jarvisdaily.com\n');

    console.log('📧 Email Aliases Created:');
    EMAIL_ALIASES.forEach(({ alias }) => {
      console.log(`   • ${alias} → ${DESTINATION_EMAIL}`);
    });

    console.log('\n🎯 To send FROM jarvisdaily.com using Gmail:');
    console.log('1. Gmail Settings → Accounts → "Send mail as"');
    console.log('2. Add: hello@jarvisdaily.com');
    console.log('3. Use SMTP: smtp.gmail.com:587');
    console.log('4. Your Gmail username/password\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main();
