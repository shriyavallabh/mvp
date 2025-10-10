/**
 * Check if Supabase tables exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTables() {
  console.log('🔍 Checking Supabase database tables...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`🔗 Connected to: ${supabaseUrl}\n`);

  // Check users table
  console.log('Checking users table...');
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(5);

  if (usersError) {
    console.log('❌ users table:', usersError.message);
  } else {
    console.log(`✅ users table exists (${usersData.length} rows)`);
    if (usersData.length > 0) {
      console.log('   Sample columns:', Object.keys(usersData[0]).join(', '));
    }
  }

  console.log('');

  // Check advisor_profiles table
  console.log('Checking advisor_profiles table...');
  const { data: profilesData, error: profilesError } = await supabase
    .from('advisor_profiles')
    .select('*')
    .limit(5);

  if (profilesError) {
    console.log('❌ advisor_profiles table:', profilesError.message);
  } else {
    console.log(`✅ advisor_profiles table exists (${profilesData.length} rows)`);
    if (profilesData.length > 0) {
      console.log('   Sample columns:', Object.keys(profilesData[0]).join(', '));
    }
  }

  console.log('\n📊 Summary:');
  const usersExists = !usersError;
  const profilesExists = !profilesError;

  if (usersExists && profilesExists) {
    console.log('✅ All required tables exist!');
    console.log('✅ Database is ready for use\n');
    return true;
  } else {
    console.log('❌ Some tables are missing');
    console.log('\n📋 Required Action:');
    console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Select project: jqvyrtoohlwiivsronzo');
    console.log('   3. Go to: SQL Editor');
    console.log('   4. Create new query');
    console.log('   5. Copy-paste contents of: supabase-schema.sql');
    console.log('   6. Click "Run"\n');
    return false;
  }
}

if (require.main === module) {
  checkTables()
    .then((ready) => {
      process.exit(ready ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { checkTables };
