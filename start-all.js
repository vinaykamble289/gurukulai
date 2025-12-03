#!/usr/bin/env node

/**
 * Single Command Startup Script
 * Starts Backend, Frontend, and ML Service with health checks
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Socratic Learning Platform...\n');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(service, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${service}]${colors.reset} ${message}`);
}

// Check if logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const mlLogsDir = path.join(__dirname, 'ml-service', 'logs');
if (!fs.existsSync(mlLogsDir)) {
  fs.mkdirSync(mlLogsDir, { recursive: true });
}

// Process tracking
const processes = {
  backend: null,
  frontend: null,
  mlService: null,
};

let backendReady = false;
let frontendReady = false;
let mlServiceReady = false;

// Start Backend
function startBackend() {
  log('BACKEND', 'Starting...', colors.blue);
  
  const backend = spawn('npm', ['run', 'dev:backend'], {
    shell: true,
    cwd: __dirname,
  });

  backend.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`${colors.blue}[BACKEND]${colors.reset} ${output.trim()}`);
    
    if (output.includes('Server running on port') || output.includes('🚀')) {
      backendReady = true;
      log('BACKEND', '✅ Ready on http://localhost:3000', colors.green);
      checkAllReady();
    }
  });

  backend.stderr.on('data', (data) => {
    const output = data.toString();
    if (!output.includes('[nodemon]') && !output.includes('watching')) {
      console.error(`${colors.red}[BACKEND ERROR]${colors.reset} ${output.trim()}`);
    }
  });

  backend.on('close', (code) => {
    log('BACKEND', `Process exited with code ${code}`, colors.red);
    cleanup();
  });

  processes.backend = backend;
}

// Start Frontend
function startFrontend() {
  log('FRONTEND', 'Starting...', colors.cyan);
  
  const frontend = spawn('npm', ['run', 'dev'], {
    shell: true,
    cwd: path.join(__dirname, 'frontend'),
  });

  frontend.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`${colors.cyan}[FRONTEND]${colors.reset} ${output.trim()}`);
    
    if (output.includes('Local:') || output.includes('ready in')) {
      frontendReady = true;
      log('FRONTEND', '✅ Ready on http://localhost:5173', colors.green);
      checkAllReady();
    }
  });

  frontend.stderr.on('data', (data) => {
    const output = data.toString();
    // Vite outputs to stderr, so only show actual errors
    if (output.includes('error') || output.includes('Error')) {
      console.error(`${colors.red}[FRONTEND ERROR]${colors.reset} ${output.trim()}`);
    }
  });

  frontend.on('close', (code) => {
    log('FRONTEND', `Process exited with code ${code}`, colors.red);
    cleanup();
  });

  processes.frontend = frontend;
}

// Start ML Service
function startMLService() {
  log('ML-SERVICE', 'Starting...', colors.magenta);
  
  const mlService = spawn('python', ['app.py'], {
    shell: true,
    cwd: path.join(__dirname, 'ml-service'),
  });

  mlService.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`${colors.magenta}[ML-SERVICE]${colors.reset} ${output.trim()}`);
    
    if (output.includes('Running on') || output.includes('ML Service starting')) {
      mlServiceReady = true;
      log('ML-SERVICE', '✅ Ready on http://localhost:5000', colors.green);
      checkAllReady();
    }
  });

  mlService.stderr.on('data', (data) => {
    const output = data.toString();
    // Flask outputs to stderr, filter noise
    if (!output.includes('WARNING') && (output.includes('error') || output.includes('Error'))) {
      console.error(`${colors.red}[ML-SERVICE ERROR]${colors.reset} ${output.trim()}`);
    }
  });

  mlService.on('close', (code) => {
    log('ML-SERVICE', `Process exited with code ${code}`, colors.red);
    cleanup();
  });

  processes.mlService = mlService;
}

function checkAllReady() {
  if (backendReady && frontendReady && mlServiceReady) {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.green}${colors.bright}✅ ALL SERVICES READY!${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`\n${colors.cyan}🌐 Open your browser:${colors.reset}`);
    console.log(`   ${colors.bright}http://localhost:5173${colors.reset}\n`);
    console.log(`${colors.yellow}📝 API Documentation:${colors.reset}`);
    console.log(`   Backend:    http://localhost:3000/health`);
    console.log(`   ML Service: http://localhost:5000/health\n`);
    console.log(`${colors.magenta}💡 Tips:${colors.reset}`);
    console.log(`   - Press Ctrl+C to stop all services`);
    console.log(`   - Check logs/ directory for detailed logs`);
    console.log(`   - Run 'npm run check-env' to verify configuration\n`);
    console.log('='.repeat(60) + '\n');
  }
}

function cleanup() {
  log('SYSTEM', 'Shutting down all services...', colors.yellow);
  
  Object.entries(processes).forEach(([name, process]) => {
    if (process && !process.killed) {
      log(name.toUpperCase(), 'Stopping...', colors.yellow);
      process.kill();
    }
  });
  
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n');
  cleanup();
});

process.on('SIGTERM', () => {
  cleanup();
});

// Start all services
console.log('Starting services in sequence...\n');

// Start backend first (others depend on it)
startBackend();

// Wait a bit, then start frontend and ML service
setTimeout(() => {
  startFrontend();
  startMLService();
}, 2000);

// Timeout check
setTimeout(() => {
  if (!backendReady || !frontendReady || !mlServiceReady) {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.yellow}⚠️  Some services are taking longer than expected${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Backend:    ${backendReady ? '✅' : '⏳ Starting...'}`);
    console.log(`Frontend:   ${frontendReady ? '✅' : '⏳ Starting...'}`);
    console.log(`ML Service: ${mlServiceReady ? '✅' : '⏳ Starting...'}`);
    console.log('\nPlease wait or check for errors above.\n');
  }
}, 15000);
