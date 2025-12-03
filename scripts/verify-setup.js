#!/usr/bin/env node

/**
 * Setup Verification Script
 * Run this to verify your environment is configured correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying Socratic Learning Platform Setup...\n');
console.log('=' .repeat(60));

let errors = [];
let warnings = [];
let info = [];

// Check Node.js version
console.log('\n📦 Checking Node.js...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 20) {
  errors.push(`Node.js version ${nodeVersion} is too old. Please upgrade to v20 or higher.`);
  console.log(`❌ Node.js version: ${nodeVersion} (need v20+)`);
} else {
  console.log(`✅ Node.js version: ${nodeVersion}`);
}

// Check for .env file
console.log('\n🔐 Checking environment configuration...');
if (!fs.existsSync('.env')) {
  errors.push('.env file not found. Copy .env.example to .env and configure it.');
  console.log('❌ .env file not found');
} else {
  console.log('✅ .env file exists');
  
  // Check required environment variables
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    { name: 'SUPABASE_URL', example: 'https://your-project.supabase.co' },
    { name: 'SUPABASE_ANON_KEY', example: 'your-anon-key' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', example: 'your-service-role-key' },
    { name: 'GOOGLE_API_KEY', example: 'your_google_api_key' }
  ];
  
  requiredVars.forEach(({ name, example }) => {
    if (!envContent.includes(name)) {
      errors.push(`${name} not found in .env`);
      console.log(`❌ ${name} not found`);
    } else if (envContent.includes(`${name}=${example}`) || envContent.includes(`${name}=your`)) {
      errors.push(`${name} not configured (still has example value)`);
      console.log(`❌ ${name} not configured`);
    } else {
      console.log(`✅ ${name} is set`);
    }
  });

  // Check optional but recommended vars
  const optionalVars = ['GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL', 'LOG_LEVEL'];
  optionalVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} is set`);
    } else {
      info.push(`${varName} not set (will use default)`);
    }
  });
}

// Check frontend .env
console.log('\n🎨 Checking frontend configuration...');
if (!fs.existsSync('frontend/.env')) {
  warnings.push('frontend/.env file not found. Copy frontend/.env.example to frontend/.env');
  console.log('⚠️  frontend/.env file not found');
} else {
  console.log('✅ frontend/.env file exists');
  
  const frontendEnv = fs.readFileSync('frontend/.env', 'utf8');
  const frontendVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_URL'];
  
  frontendVars.forEach(varName => {
    if (!frontendEnv.includes(varName) || frontendEnv.includes(`${varName}=your`)) {
      warnings.push(`${varName} not configured in frontend/.env`);
      console.log(`⚠️  ${varName} not configured`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  });
}

// Check if node_modules exists
console.log('\n📚 Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  errors.push('Backend dependencies not installed. Run: npm install');
  console.log('❌ Backend dependencies not installed');
} else {
  console.log('✅ Backend dependencies installed');
  
  // Check for specific important packages
  const importantPackages = [
    '@google/generative-ai',
    '@supabase/supabase-js',
    'winston',
    'express'
  ];
  
  importantPackages.forEach(pkg => {
    if (fs.existsSync(`node_modules/${pkg}`)) {
      console.log(`  ✅ ${pkg}`);
    } else {
      warnings.push(`Package ${pkg} not found. Run: npm install`);
      console.log(`  ⚠️  ${pkg} not found`);
    }
  });
}

if (!fs.existsSync('frontend/node_modules')) {
  errors.push('Frontend dependencies not installed. Run: cd frontend && npm install');
  console.log('❌ Frontend dependencies not installed');
} else {
  console.log('✅ Frontend dependencies installed');
}

// Check Python
console.log('\n🐍 Checking Python...');
try {
  const pythonVersion = execSync('python --version 2>&1', { encoding: 'utf8' }).trim();
  const pythonMajor = parseInt(pythonVersion.match(/\d+/)[0]);
  const pythonMinor = parseInt(pythonVersion.match(/\d+\.\d+/)[0].split('.')[1]);
  
  if (pythonMajor < 3 || (pythonMajor === 3 && pythonMinor < 11)) {
    warnings.push(`Python ${pythonVersion} found, but 3.11+ recommended`);
    console.log(`⚠️  Python version: ${pythonVersion} (recommend 3.11+)`);
  } else {
    console.log(`✅ Python version: ${pythonVersion}`);
  }
  
  // Check if requirements are installed
  try {
    execSync('python -c "import flask; import google.generativeai" 2>&1', { encoding: 'utf8' });
    console.log('✅ Python dependencies installed');
  } catch (e) {
    warnings.push('Python dependencies not installed. Run: cd ml-service && pip install -r requirements.txt');
    console.log('⚠️  Python dependencies not installed');
  }
} catch (e) {
  warnings.push('Python not found. Install Python 3.11+ for ML service.');
  console.log('⚠️  Python not found');
}

// Check directory structure
console.log('\n📁 Checking directory structure...');
const requiredDirs = [
  'backend/src',
  'backend/src/config',
  'backend/src/controllers',
  'backend/src/services',
  'backend/src/routes',
  'backend/src/middleware',
  'backend/src/utils',
  'frontend/src',
  'frontend/src/pages',
  'frontend/src/store',
  'frontend/src/lib',
  'ml-service',
  'supabase',
  'docs'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    errors.push(`${dir} directory not found`);
    console.log(`❌ ${dir} not found`);
  }
});

// Check for logs directory
console.log('\n📝 Checking logs directory...');
if (!fs.existsSync('logs')) {
  console.log('⚠️  logs directory not found (will be created automatically)');
  info.push('logs directory will be created on first run');
} else {
  console.log('✅ logs directory exists');
}

if (!fs.existsSync('ml-service/logs')) {
  console.log('⚠️  ml-service/logs directory not found (will be created automatically)');
} else {
  console.log('✅ ml-service/logs directory exists');
}

// Check key files
console.log('\n📄 Checking key files...');
const keyFiles = [
  'backend/src/index.ts',
  'backend/src/config/gemini.ts',
  'backend/src/config/supabase.ts',
  'backend/src/utils/logger.ts',
  'frontend/src/App.tsx',
  'frontend/src/main.tsx',
  'ml-service/app.py',
  'supabase/schema.sql',
  'supabase/seed.sql'
];

keyFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    errors.push(`${file} not found`);
    console.log(`❌ ${file} not found`);
  }
});

// Check documentation
console.log('\n📖 Checking documentation...');
const docs = [
  'README.md',
  'START_HERE.md',
  'QUICKSTART.md',
  'SUPABASE_SETUP.md',
  'TROUBLESHOOTING.md',
  'LOGGING_GUIDE.md',
  'GEMINI_MIGRATION.md'
];

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`✅ ${doc}`);
  } else {
    warnings.push(`${doc} not found`);
    console.log(`⚠️  ${doc} not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 VERIFICATION SUMMARY\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 ✅ All checks passed! You\'re ready to start.\n');
  console.log('Next steps:');
  console.log('1. Setup Supabase database (see SUPABASE_SETUP.md)');
  console.log('2. Start backend:  npm run dev:backend');
  console.log('3. Start frontend: npm run dev:frontend (new terminal)');
  console.log('4. Start ML service: cd ml-service && python app.py (new terminal)');
  console.log('5. Open browser: http://localhost:5173');
  console.log('\nFor detailed instructions, see START_HERE.md');
} else {
  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND (' + errors.length + '):\n');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (' + warnings.length + '):\n');
    warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
  }
  
  if (info.length > 0) {
    console.log('\nℹ️  INFO:\n');
    info.forEach((inf, i) => console.log(`  ${i + 1}. ${inf}`));
  }
  
  console.log('\n📚 Resources:');
  console.log('  - START_HERE.md - Complete setup guide');
  console.log('  - QUICKSTART.md - Quick setup');
  console.log('  - TROUBLESHOOTING.md - Common issues');
  
  if (errors.length > 0) {
    console.log('\n⚠️  Please fix the errors above before proceeding.');
  }
}

console.log('\n' + '='.repeat(60) + '\n');

// Exit with appropriate code
process.exit(errors.length > 0 ? 1 : 0);
