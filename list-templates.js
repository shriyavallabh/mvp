#!/usr/bin/env node
require('dotenv').config();

const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function listTemplates() {
    const url = `https://graph.facebook.com/v17.0/${WABA_ID}/message_templates?fields=name,status,category,language,components`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
    });

    const result = await response.json();

    console.log('📋 Existing Templates:\n');
    console.log(JSON.stringify(result, null, 2));
}

listTemplates();
