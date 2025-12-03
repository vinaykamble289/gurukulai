#!/usr/bin/env node

/**
 * Debug and Fix Script
 * Identifies and fixes common issues
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Debug and Fix Script\n');
console.log('='.repeat(60) + '\n');

let fixes = [];

// Check 1: ML Service Python dependencies
console.log('1️⃣ Checking ML Service dependencies...');
try {
  execSync('python -c "import google.generativeai"', { stdio: 'ignore' });
  console.log('   ✅ google-generativeai installed');
} catch (e) {
  console.log('   ❌ google-generativeai not installed');
  fixes.push('cd ml-service && pip install google-generativeai');
}

// Check 2: Frontend Tailwind
console.log('\n2️⃣ Checking Frontend Tailwind CSS...');
if (fs.existsSync('frontend/node_modules/tailwindcss')) {
  console.log('   ✅ Tailwind CSS installed');
} else {
  console.log('   ❌ Tailwind CSS not installed');
  fixes.push('cd frontend && npm install tailwindcss autoprefixer postcss');
}

// Check 3: Backend dependencies
console.log('\n3️⃣ Checking Backend dependencies...');
const requiredPackages = [
  '@google/generative-ai',
  'winston',
  'morgan',
  '@supabase/supabase-js'
];

requiredPackages.forEach(pkg => {
  if (fs.existsSync(`node_modules/${pkg}`)) {
    console.log(`   ✅ ${pkg}`);
  } else {
    console.log(`   ❌ ${pkg} missing`);
    fixes.push('npm install');
  }
});

// Check 4: Environment variables
console.log('\n4️⃣ Checking Environment Variables...');
require('dotenv').config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_API_KEY'];
required.forEach(key => {
  if (process.env[key]) {
    console.log(`   ✅ ${key} is set`);
  } else {
    console.log(`   ❌ ${key} not set`);
    fixes.push(`Set ${key} in .env file`);
  }
});

// Check 5: Logs directory
console.log('\n5️⃣ Checking Logs directories...');
['logs', 'ml-service/logs'].forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir} exists`);
  } else {
    console.log(`   ⚠️  ${dir} missing (will be created)`);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ Created ${dir}`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
if (fixes.length === 0) {
  console.log('\n✅ No issues found! System is ready.\n');
  console.log('Run: npm start\n');
} else {
  console.log('\n🔧 Fixes needed:\n');
  fixes.forEach((fix, i) => {
    console.log(`   ${i + 1}. ${fix}`);
  });
  console.log('\nApply fixes and run this script again.\n');
}
console.log('='.repeat(60) + '\n');
