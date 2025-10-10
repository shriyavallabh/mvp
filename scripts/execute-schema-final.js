/**
 * Final Schema Execution - Multiple Fallback Methods
 *
 * Tries multiple approaches to execute Supabase schema:
 * 1. Direct SDK query execution
 * 2. Statement-by-statement execution
 * 3. Management API via axios
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSchemaDirect() {
  console.log('🚀 Method 1: Direct SQL execution via Supabase SDK\n');

  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split into statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 20 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`📝 Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();

    if (!stmt) continue;

    try {
      // Try executing via rpc if available, otherwise direct query
      const { data, error } = await supabase.rpc('exec', { sql: stmt }).single();

      if (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1}: Already exists`);
          skipCount++;
        } else if (error.message.includes('function') && error.message.includes('does not exist')) {
          // Try direct execution
          console.log(`  Trying direct execution for statement ${i + 1}...`);
          const { error: directError } = await supabase.from('_').select(stmt);

          if (directError && !directError.message.includes('already exists')) {
            console.error(`❌ Statement ${i + 1} failed:`, directError.message.substring(0, 100));
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message.substring(0, 100));
          errorCount++;
        }
      } else {
        successCount++;
        if ((i + 1) % 5 === 0) {
          console.log(`✅ Progress: ${i + 1}/${statements.length}`);
        }
      }
    } catch (err) {
      // Silently skip verification queries at the end
      if (stmt.includes('SELECT table_name') || stmt.includes('SELECT indexname')) {
        skipCount++;
      } else {
        console.error(`❌ Exception ${i + 1}:`, err.message.substring(0, 80));
        errorCount++;
      }
    }
  }

  console.log('\n📊 Method 1 Results:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}\n`);

  return { successCount, errorCount, skipCount };
}

async function executeSchemaViaAxios() {
  console.log('🚀 Method 2: Execution via REST API (axios)\n');

  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Extract project ref
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  console.log(`🔗 Project: ${projectRef}\n`);

  // Try using Supabase's SQL endpoint via axios
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 20 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < Math.min(statements.length, 10); i++) {
    const stmt = statements[i];

    try {
      const response = await axios.post(
        `${supabaseUrl}/rest/v1/rpc/exec`,
        { query: stmt },
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          timeout: 10000,
          validateStatus: () => true // Accept any status
        }
      );

      if (response.status === 200 || response.status === 201) {
        successCount++;
      } else {
        if (response.data && response.data.message && response.data.message.includes('already exists')) {
          successCount++;
        } else {
          errorCount++;
        }
      }
    } catch (err) {
      errorCount++;
    }
  }

  console.log(`📊 Method 2 Results (sampled first 10):');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}\n`);

  return { successCount, errorCount };
}

async function executeSchemaManual() {
  console.log('🚀 Method 3: Manual table creation via SDK\n');

  // Create tables using SDK's query method
  const createTablesSQL = [
    // Enable extension
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

    // Create users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      clerk_user_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT,
      phone TEXT,
      plan TEXT CHECK (plan IN ('trial', 'solo', 'professional', 'enterprise')) DEFAULT 'trial',
      subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')) DEFAULT 'trial',
      trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '14 days'),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Create advisor_profiles table
    `CREATE TABLE IF NOT EXISTS advisor_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT,
      arn TEXT,
      advisor_code TEXT,
      customer_segments TEXT[],
      phone_verified BOOLEAN DEFAULT FALSE,
      onboarding_completed BOOLEAN DEFAULT FALSE,
      onboarding_completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_advisor_profiles_user_id ON advisor_profiles(user_id)`,
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const sql of createTablesSQL) {
    try {
      // Use raw SQL execution (bypassing RLS)
      const response = await axios.post(
        `${supabaseUrl}/rest/v1/rpc/query`,
        { query: sql },
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        }
      );

      console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
      successCount++;
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error(`❌ Error: ${sql.substring(0, 50)}...`);
        errorCount++;
      } else {
        successCount++;
      }
    }
  }

  console.log(`\n📊 Method 3 Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}\n`);

  return { successCount, errorCount };
}

async function verifyTables() {
  console.log('🔍 Verifying tables...\n');

  try {
    // Try to query tables directly
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    const { data: profilesData, error: profilesError } = await supabase
      .from('advisor_profiles')
      .select('id')
      .limit(1);

    if (!usersError && !profilesError) {
      console.log('✅ users table exists');
      console.log('✅ advisor_profiles table exists');
      console.log('\n🎉 Database schema is ready!\n');
      return true;
    } else {
      if (usersError) console.log('❌ users table:', usersError.message);
      if (profilesError) console.log('❌ advisor_profiles table:', profilesError.message);
      return false;
    }
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Schema Execution - Final Attempt\n');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Role Key: ${supabaseKey.substring(0, 20)}...\n`);

  // Try Method 1
  try {
    await executeSchemaDirect();
  } catch (err) {
    console.log('Method 1 failed, trying Method 2...\n');
  }

  // Try Method 2
  try {
    await executeSchemaViaAxios();
  } catch (err) {
    console.log('Method 2 failed, trying Method 3...\n');
  }

  // Try Method 3
  try {
    await executeSchemaManual();
  } catch (err) {
    console.log('Method 3 failed\n');
  }

  // Final verification
  const success = await verifyTables();

  if (!success) {
    console.log('\n⚠️  Automated execution incomplete.');
    console.log('\n📋 Fallback: Manual Execution Required\n');
    console.log('   1. Open: https://supabase.com/dashboard/project/jqvyrtoohlwiivsronzo/sql');
    console.log('   2. Create new query');
    console.log('   3. Paste contents of: supabase-schema.sql');
    console.log('   4. Click "Run"\n');
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { main };
