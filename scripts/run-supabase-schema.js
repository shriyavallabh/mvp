/**
 * Execute Supabase Schema using PostgreSQL Client
 *
 * This script connects directly to Supabase Postgres and executes the schema.
 * Fully automated - no manual steps required.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config();

async function runSupabaseSchema() {
  console.log('🚀 Supabase Schema Setup - Programmatic Execution\n');

  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log(`📄 Loaded schema: ${schemaPath}`);
  console.log(`📏 Size: ${(schemaSql.length / 1024).toFixed(2)} KB\n`);

  // Parse Supabase URL to get connection string
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env');
    process.exit(1);
  }

  // Extract project ref from Supabase URL
  // Format: https://[project-ref].supabase.co
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Could not parse project ref from Supabase URL');
    process.exit(1);
  }

  console.log(`🔗 Project: ${projectRef}`);

  // Construct PostgreSQL connection string
  // Supabase Postgres connection format
  const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('🔌 Connecting to Supabase Postgres...\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('📝 Executing SQL schema...\n');

    // Execute the entire schema as a transaction
    await client.query('BEGIN');

    try {
      await client.query(schemaSql);
      await client.query('COMMIT');

      console.log('✅ Schema executed successfully!\n');

      // Verify tables
      const { rows: tables } = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('users', 'advisor_profiles')
        ORDER BY table_name;
      `);

      console.log('🔍 Verification:');
      if (tables.length === 2) {
        console.log('✅ Tables created:');
        tables.forEach(t => console.log(`   - ${t.table_name}`));
      } else {
        console.warn(`⚠️  Expected 2 tables, found ${tables.length}`);
      }

      // Check indexes
      const { rows: indexes } = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename IN ('users', 'advisor_profiles')
        ORDER BY indexname;
      `);

      if (indexes.length > 0) {
        console.log(`\n✅ Indexes created: ${indexes.length}`);
      }

      // Check triggers
      const { rows: triggers } = await client.query(`
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE event_object_table IN ('users', 'advisor_profiles');
      `);

      if (triggers.length > 0) {
        console.log(`✅ Triggers created: ${triggers.length}`);
      }

      console.log('\n🎉 Supabase schema setup complete!');

    } catch (execError) {
      await client.query('ROLLBACK');

      // Check if error is due to objects already existing
      if (execError.message.includes('already exists')) {
        console.log('ℹ️  Schema objects already exist - skipping creation');
        console.log('✅ Database is ready!\n');
      } else {
        throw execError;
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection failed. Possible issues:');
      console.error('   1. Check SUPABASE_SERVICE_ROLE_KEY in .env');
      console.error('   2. Verify Supabase project is active');
      console.error('   3. Check network/firewall settings');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Authentication failed:');
      console.error('   - Verify SUPABASE_SERVICE_ROLE_KEY is correct');
      console.error('   - Key should start with: eyJ...');
    }

    process.exit(1);

  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  runSupabaseSchema()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runSupabaseSchema };
