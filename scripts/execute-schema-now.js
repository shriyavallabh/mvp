const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSchema() {
  console.log('Starting Supabase schema execution...\n');

  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 20 && !s.startsWith('--') && !s.includes('SELECT table_name'));

  console.log('Found ' + statements.length + ' SQL statements\n');

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('Statement ' + (i + 1) + ': Already exists (OK)');
        } else if (error.message.includes('does not exist')) {
          console.log('Statement ' + (i + 1) + ': Skipped (RPC not available)');
        } else {
          console.log('Statement ' + (i + 1) + ': ' + error.message.substring(0, 80));
        }
      } else {
        console.log('Statement ' + (i + 1) + ': Success');
      }
    } catch (err) {
      console.log('Statement ' + (i + 1) + ': Exception - ' + err.message.substring(0, 60));
    }
  }

  console.log('\nVerifying tables...\n');

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  const { data: profiles, error: profilesError } = await supabase
    .from('advisor_profiles')
    .select('id')
    .limit(1);

  if (!usersError && !profilesError) {
    console.log('SUCCESS: All tables exist!');
    console.log('  - users table: OK');
    console.log('  - advisor_profiles table: OK\n');
    return true;
  } else {
    console.log('FAILED: Tables not created');
    if (usersError) console.log('  - users: ' + usersError.message);
    if (profilesError) console.log('  - advisor_profiles: ' + profilesError.message);
    console.log('\nManual execution required via Supabase Dashboard SQL Editor\n');
    return false;
  }
}

executeSchema()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
