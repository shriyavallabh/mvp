/**
 * Direct Supabase Schema Setup
 * Uses Supabase REST API to execute schema
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log(`📄 Schema loaded (${(schema.length / 1024).toFixed(2)} KB)`);

  // Use Supabase PostgREST API
  const apiUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: schema })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);

      // If method not exists, schema needs to be applied manually
      console.log('\n📋 Please apply schema manually:');
      console.log('   1. Open Supabase Dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Run supabase-schema.sql');
      return;
    }

    console.log('✅ Schema applied successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Schema file ready at: supabase-schema.sql');
    console.log('   Apply it manually in Supabase SQL Editor');
  }
}

if (require.main === module) {
  setupDatabase();
}
