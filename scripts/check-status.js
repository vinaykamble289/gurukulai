const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkService(name, url, color) {
  try {
    const response = await axios.get(url, { timeout: 3000 });
    console.log(`${color}✅ ${name}${colors.reset} - Running (${response.data.status || 'ok'})`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ ${name}${colors.reset} - Not responding`);
    return false;
  }
}

async function checkSupabase() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    const { data, error } = await supabase.from('topics').select('count');
    
    if (error) {
      console.log(`${colors.red}❌ Supabase${colors.reset} - Connection error: ${error.message}`);
      return false;
    }
    
    console.log(`${colors.green}✅ Supabase${colors.reset} - Connected`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Supabase${colors.reset} - ${error.message}`);
    return false;
  }
}

async function checkEnvVars() {
  const required = [
    'GOOGLE_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GEMINI_MODEL'
  ];
  
  let allPresent = true;
  
  console.log(`\n${colors.cyan}Environment Variables:${colors.reset}`);
  required.forEach(key => {
    if (process.env[key]) {
      const value = key.includes('KEY') 
        ? process.env[key].substring(0, 10) + '...' 
        : process.env[key];
      console.log(`  ${colors.green}✅${colors.reset} ${key}: ${value}`);
    } else {
      console.log(`  ${colors.red}❌${colors.reset} ${key}: Missing`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

async function checkDependencies() {
  console.log(`\n${colors.cyan}Dependencies:${colors.reset}`);
  
  // Check Node.js
  const nodeVersion = process.version;
  console.log(`  ${colors.green}✅${colors.reset} Node.js: ${nodeVersion}`);
  
  // Check if Python is available
  const { spawn } = require('child_process');
  return new Promise((resolve) => {
    const python = spawn('python', ['--version']);
    
    python.stdout.on('data', (data) => {
      console.log(`  ${colors.green}✅${colors.reset} Python: ${data.toString().trim()}`);
      resolve(true);
    });
    
    python.stderr.on('data', (data) => {
      console.log(`  ${colors.green}✅${colors.reset} Python: ${data.toString().trim()}`);
      resolve(true);
    });
    
    python.on('error', () => {
      console.log(`  ${colors.red}❌${colors.reset} Python: Not found`);
      resolve(false);
    });
    
    setTimeout(() => resolve(false), 2000);
  });
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🔍 System Status Check');
  console.log('═'.repeat(60));
  
  // Check environment variables
  const envOk = checkEnvVars();
  
  // Check dependencies
  await checkDependencies();
  
  // Check services
  console.log(`\n${colors.cyan}Services:${colors.reset}`);
  const mlOk = await checkService('ML Service', 'http://localhost:5000/health', colors.blue);
  const backendOk = await checkService('Backend API', 'http://localhost:3000/health', colors.blue);
  const frontendOk = await checkService('Frontend', 'http://localhost:5173', colors.blue);
  const supabaseOk = await checkSupabase();
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Summary');
  console.log('═'.repeat(60));
  
  const allOk = envOk && mlOk && backendOk && frontendOk && supabaseOk;
  
  if (allOk) {
    console.log(`${colors.green}✅ All systems operational!${colors.reset}`);
    console.log('\n🎉 You can access the application at:');
    console.log(`   ${colors.cyan}http://localhost:5173${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some issues detected${colors.reset}`);
    console.log('\n💡 Suggestions:');
    
    if (!envOk) {
      console.log('   • Check your .env file has all required variables');
    }
    if (!mlOk) {
      console.log('   • Start ML service: cd ml-service && python app.py');
    }
    if (!backendOk) {
      console.log('   • Start backend: cd backend && npm run dev');
    }
    if (!frontendOk) {
      console.log('   • Start frontend: cd frontend && npm run dev');
    }
    if (!supabaseOk) {
      console.log('   • Check Supabase credentials in .env');
      console.log('   • Verify Supabase project is active');
    }
    
    console.log('\n   Or use: node start-debug.js');
  }
  
  console.log('═'.repeat(60));
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
