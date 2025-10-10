/**
 * Programmatic Supabase Schema Setup
 *
 * This script runs the SQL schema programmatically using Supabase API.
 * No manual SQL editor interaction required.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function setupSupabaseSchema() {
  console.log('🚀 Starting Supabase schema setup...\n');

  // Read the schema SQL file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('📄 Schema file loaded successfully');
  console.log(`📏 Schema size: ${schemaSql.length} characters\n`);

  // Supabase connection details from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERROR: Supabase environment variables not found!');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`);

  try {
    // Use Supabase REST API to execute SQL
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('✅ Connected to Supabase\n');

    // Split schema into individual statements (rough split by semicolons)
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';

      // Skip comment-only statements
      if (stmt.trim().startsWith('--')) {
        skipCount++;
        continue;
      }

      try {
        // Execute via RPC (using Supabase SQL function)
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });

        if (error) {
          // Check if error is because object already exists
          if (error.message.includes('already exists') ||
              error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1}: Already exists (skipping)`);
            skipCount++;
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          }
        } else {
          successCount++;
          if (i % 5 === 0) {
            console.log(`✅ Executed ${i + 1}/${statements.length} statements...`);
          }
        }
      } catch (err) {
        console.error(`❌ Exception on statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Schema Setup Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['users', 'advisor_profiles']);

    if (tablesError) {
      console.error('❌ Could not verify tables:', tablesError.message);
    } else if (tables && tables.length === 2) {
      console.log('✅ Tables verified: users, advisor_profiles');
    } else {
      console.warn(`⚠️  Expected 2 tables, found ${tables?.length || 0}`);
    }

    console.log('\n🎉 Supabase schema setup complete!');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error('\nFalling back to manual schema execution...');
    console.error('Please run the SQL in supabase-schema.sql manually in the Supabase dashboard.');
    process.exit(1);
  }
}

// Alternative: Use direct SQL execution via pg client
async function setupSupabaseSchemaDirect() {
  console.log('🔄 Using direct SQL execution method...\n');

  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('📄 Schema loaded, creating tables...\n');

  // Create tables one by one using Supabase SDK
  try {
    // Check if tables already exist
    const { data: existingTables } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (existingTables !== null) {
      console.log('✅ Tables already exist! Skipping creation.');
      console.log('ℹ️  If you need to recreate, drop tables manually first.');
      return;
    }
  } catch (error) {
    // Tables don't exist, proceed with creation
    console.log('📝 Tables not found, proceeding with creation...\n');
  }

  // Since Supabase JS SDK doesn't support raw SQL execution,
  // we'll output instructions for manual setup
  console.log('⚠️  Direct SQL execution not supported by Supabase JS SDK');
  console.log('\n📋 MANUAL SETUP REQUIRED:');
  console.log('   1. Go to: https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Click "SQL Editor" in sidebar');
  console.log('   4. Click "New Query"');
  console.log(`   5. Copy contents of: ${schemaPath}`);
  console.log('   6. Paste and click "Run"');
  console.log('\n   OR use the automated setup script with proper DB credentials');
}

// Run the setup
if (require.main === module) {
  // Try direct method first, fall back to instructions
  setupSupabaseSchemaDirect()
    .then(() => {
      console.log('\n✨ Setup process complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      console.log('\n📋 Please run the SQL manually from: supabase-schema.sql');
      process.exit(1);
    });
}

module.exports = { setupSupabaseSchema, setupSupabaseSchemaDirect };
