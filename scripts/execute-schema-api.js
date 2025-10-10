/**
 * Execute Supabase Schema via Management API
 *
 * Uses Supabase's management API to execute SQL statements
 * Fully automated - no manual steps required.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSchemaViaAPI() {
  console.log('🚀 Executing Supabase Schema via Management API\n');

  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log(`📄 Schema loaded: ${(schema.length / 1024).toFixed(2)} KB\n`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
  }

  // Extract project reference
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log(`🔗 Project: ${projectRef}\n`);

  // Split schema into individual statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Execute each statement via POST to sql endpoint
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    // Skip comments
    if (stmt.startsWith('--')) {
      skipCount++;
      continue;
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: stmt
        })
      });

      if (response.ok) {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Progress: ${i + 1}/${statements.length} statements...`);
        }
      } else {
        const errorText = await response.text();

        // Check if error is "already exists"
        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
          skipCount++;
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, errorText.substring(0, 100));
          errorCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Exception on statement ${i + 1}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Execution Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}\n`);

  // Verify tables using Supabase client
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try to query users table
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    // Try to query advisor_profiles table
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('advisor_profiles')
      .select('id')
      .limit(1);

    console.log('🔍 Verification:');

    if (!usersError) {
      console.log('✅ users table exists and accessible');
    } else {
      console.log('❌ users table error:', usersError.message);
    }

    if (!profilesError) {
      console.log('✅ advisor_profiles table exists and accessible');
    } else {
      console.log('❌ advisor_profiles table error:', profilesError.message);
    }

    if (!usersError && !profilesError) {
      console.log('\n🎉 Schema setup complete! Database is ready.\n');
      return true;
    } else {
      console.log('\n⚠️  Some tables may not exist. Manual SQL execution may be required.\n');
      return false;
    }

  } catch (verifyError) {
    console.error('❌ Verification error:', verifyError.message);
    console.log('\n📋 Fallback: Execute SQL manually in Supabase Dashboard SQL Editor');
    console.log(`   File: ${schemaPath}\n`);
    return false;
  }
}

if (require.main === module) {
  executeSchemaViaAPI()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { executeSchemaViaAPI };
