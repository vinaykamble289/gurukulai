#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Validates that all required environment variables are set correctly
 */

require('dotenv').config();

console.log('🔍 Checking Environment Variables...\n');
console.log('='.repeat(60));

let errors = [];
let warnings = [];

// Helper to decode JWT and get project ref
function getProjectRefFromJWT(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.ref || null;
  } catch (e) {
    return null;
  }
}

// Check Supabase URL
console.log('\n📦 Supabase Configuration:');
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  errors.push('SUPABASE_URL is not set');
  console.log('❌ SUPABASE_URL: Not set');
} else {
  console.log(`✅ SUPABASE_URL: ${supabaseUrl}`);
  
  // Extract project ref from URL
  const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const urlProjectRef = urlMatch ? urlMatch[1] : null;
  
  if (urlProjectRef) {
    console.log(`   Project Reference: ${urlProjectRef}`);
    
    // Check anon key
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!anonKey) {
      errors.push('SUPABASE_ANON_KEY is not set');
      console.log('❌ SUPABASE_ANON_KEY: Not set');
    } else {
      const anonRef = getProjectRefFromJWT(anonKey);
      if (anonRef === urlProjectRef) {
        console.log(`✅ SUPABASE_ANON_KEY: Matches project (${anonRef})`);
      } else {
        errors.push(`SUPABASE_ANON_KEY is for project '${anonRef}' but URL is for '${urlProjectRef}'`);
        console.log(`❌ SUPABASE_ANON_KEY: Mismatch! Key is for project '${anonRef}'`);
      }
    }
    
    // Check service role key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is not set');
      console.log('❌ SUPABASE_SERVICE_ROLE_KEY: Not set');
    } else {
      const serviceRef = getProjectRefFromJWT(serviceKey);
      if (serviceRef === urlProjectRef) {
        console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: Matches project (${serviceRef})`);
      } else {
        errors.push(`SUPABASE_SERVICE_ROLE_KEY is for project '${serviceRef}' but URL is for '${urlProjectRef}'`);
        console.log(`❌ SUPABASE_SERVICE_ROLE_KEY: Mismatch! Key is for project '${serviceRef}'`);
        console.log(`   ⚠️  This is the problem! Get the correct key from your Supabase dashboard.`);
      }
    }
  }
}

// Check Google API Key
console.log('\n🤖 Google Gemini Configuration:');
const googleKey = process.env.GOOGLE_API_KEY;
if (!googleKey) {
  errors.push('GOOGLE_API_KEY is not set');
  console.log('❌ GOOGLE_API_KEY: Not set');
} else if (googleKey.includes('your_google_api_key')) {
  errors.push('GOOGLE_API_KEY still has example value');
  console.log('❌ GOOGLE_API_KEY: Still has example value');
} else {
  console.log(`✅ GOOGLE_API_KEY: Set (${googleKey.substring(0, 10)}...)`);
}

const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
console.log(`✅ GEMINI_MODEL: ${geminiModel}`);

// Check other important vars
console.log('\n⚙️  Other Configuration:');
console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`✅ PORT: ${process.env.PORT || 3000}`);
console.log(`✅ FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

// Summary
console.log('\n' + '='.repeat(60));
if (errors.length === 0) {
  console.log('\n✅ All environment variables are correctly configured!\n');
  console.log('You can now run: npm run dev');
} else {
  console.log('\n❌ Configuration Issues Found:\n');
  errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err}`);
  });
  
  console.log('\n📚 How to Fix:');
  console.log('  1. Go to https://supabase.com');
  console.log('  2. Open your project dashboard');
  console.log('  3. Go to Settings > API');
  console.log('  4. Copy the correct keys for your project');
  console.log('  5. Update your .env file');
  console.log('\n  See SETUP_SUPABASE_KEYS.md for detailed instructions');
}
console.log('='.repeat(60) + '\n');

process.exit(errors.length > 0 ? 1 : 0);
