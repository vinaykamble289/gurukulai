const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserProfiles() {
  console.log('🔧 Fixing User Profiles...\n');

  try {
    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`📊 Found ${users.length} users\n`);

    let fixed = 0;
    let alreadyExists = 0;

    for (const user of users) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.log(`🔨 Creating profile for: ${user.email}`);
        
        // Create profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            name: user.email.split('@')[0],
            level: 1,
            xp: 0,
            streak_days: 0
          });

        if (profileError) {
          console.error(`   ❌ Error: ${profileError.message}`);
        } else {
          console.log(`   ✅ Profile created`);
          fixed++;
        }

        // Create preferences
        const { error: prefError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id
          });

        if (prefError && !prefError.message.includes('duplicate')) {
          console.error(`   ⚠️  Preferences error: ${prefError.message}`);
        } else {
          console.log(`   ✅ Preferences created`);
        }
      } else {
        console.log(`✓ Profile exists for: ${user.email}`);
        alreadyExists++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Profiles created: ${fixed}`);
    console.log(`   Already existed: ${alreadyExists}`);
    console.log('='.repeat(60));

    if (fixed > 0) {
      console.log('\n✅ User profiles fixed! You can now start learning sessions.');
    } else {
      console.log('\n✅ All users already have profiles.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('\nMake sure:');
    console.error('1. SUPABASE_URL is set in .env');
    console.error('2. SUPABASE_SERVICE_ROLE_KEY is set in .env');
    console.error('3. Database schema is created (run supabase/schema.sql)');
  }
}

console.log('═'.repeat(60));
console.log('🔧 User Profile Fix Script');
console.log('═'.repeat(60));
console.log('');

fixUserProfiles().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
