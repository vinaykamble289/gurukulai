const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const services = {
  ml: null,
  backend: null,
  frontend: null
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(service, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${service}]${colors.reset} ${message}`);
}

async function waitForService(url, serviceName, maxAttempts = 30) {
  log(serviceName, `Waiting for service at ${url}...`, colors.yellow);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(url, { timeout: 2000 });
      log(serviceName, '✅ Service is ready!', colors.green);
      return true;
    } catch (error) {
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  log(serviceName, '❌ Service failed to start', colors.red);
  return false;
}

function startMLService() {
  return new Promise((resolve) => {
    log('ML Service', '🚀 Starting ML Service...', colors.magenta);
    
    const mlProcess = spawn('python', ['app.py'], {
      cwd: path.join(__dirname, 'ml-service'),
      shell: true,
      env: { ...process.env }
    });
    
    mlProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('ML Service', line.trim(), colors.magenta);
        }
      });
    });
    
    mlProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('ML Service', line.trim(), colors.red);
        }
      });
    });
    
    mlProcess.on('error', (error) => {
      log('ML Service', `Error: ${error.message}`, colors.red);
    });
    
    services.ml = mlProcess;
    
    // Wait a bit for the service to start
    setTimeout(() => resolve(), 3000);
  });
}

function startBackend() {
  return new Promise((resolve) => {
    log('Backend', '🚀 Starting Backend...', colors.blue);
    
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      shell: true,
      env: { ...process.env }
    });
    
    backendProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('Backend', line.trim(), colors.blue);
        }
      });
    });
    
    backendProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('Backend', line.trim(), colors.red);
        }
      });
    });
    
    backendProcess.on('error', (error) => {
      log('Backend', `Error: ${error.message}`, colors.red);
    });
    
    services.backend = backendProcess;
    
    // Wait a bit for the service to start
    setTimeout(() => resolve(), 5000);
  });
}

function startFrontend() {
  return new Promise((resolve) => {
    log('Frontend', '🚀 Starting Frontend...', colors.cyan);
    
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      shell: true,
      env: { ...process.env }
    });
    
    frontendProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('Frontend', line.trim(), colors.cyan);
        }
      });
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log('Frontend', line.trim(), colors.red);
        }
      });
    });
    
    frontendProcess.on('error', (error) => {
      log('Frontend', `Error: ${error.message}`, colors.red);
    });
    
    services.frontend = frontendProcess;
    
    // Wait a bit for the service to start
    setTimeout(() => resolve(), 3000);
  });
}

function cleanup() {
  log('System', '🛑 Shutting down services...', colors.yellow);
  
  if (services.frontend) {
    services.frontend.kill();
    log('Frontend', 'Stopped', colors.cyan);
  }
  
  if (services.backend) {
    services.backend.kill();
    log('Backend', 'Stopped', colors.blue);
  }
  
  if (services.ml) {
    services.ml.kill();
    log('ML Service', 'Stopped', colors.magenta);
  }
  
  process.exit(0);
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🎓 Project Gurukul - Debug Startup');
  console.log('═'.repeat(60));
  console.log('');
  
  try {
    // Start ML Service first
    await startMLService();
    const mlReady = await waitForService('http://localhost:5000/health', 'ML Service');
    
    if (!mlReady) {
      log('System', '❌ ML Service failed to start. Exiting...', colors.red);
      cleanup();
      return;
    }
    
    // Start Backend
    await startBackend();
    const backendReady = await waitForService('http://localhost:3000/health', 'Backend');
    
    if (!backendReady) {
      log('System', '❌ Backend failed to start. Exiting...', colors.red);
      cleanup();
      return;
    }
    
    // Start Frontend
    await startFrontend();
    const frontendReady = await waitForService('http://localhost:5173', 'Frontend', 20);
    
    if (!frontendReady) {
      log('System', '⚠️  Frontend may still be starting...', colors.yellow);
    }
    
    console.log('');
    console.log('═'.repeat(60));
    log('System', '✅ All services started successfully!', colors.green);
    console.log('═'.repeat(60));
    console.log('');
    console.log(`${colors.magenta}ML Service:${colors.reset}  http://localhost:5000`);
    console.log(`${colors.blue}Backend:${colors.reset}     http://localhost:3000`);
    console.log(`${colors.cyan}Frontend:${colors.reset}    http://localhost:5173`);
    console.log('');
    console.log('Press Ctrl+C to stop all services');
    console.log('═'.repeat(60));
    
  } catch (error) {
    log('System', `Fatal error: ${error.message}`, colors.red);
    cleanup();
  }
}

// Handle shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

main();
