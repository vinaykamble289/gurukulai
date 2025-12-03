#!/usr/bin/env node

/**
 * System Testing Script
 * Tests all endpoints and functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';
const ML_URL = 'http://localhost:5000/api/v1';

let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    testsPassed++;
    log(`✅ ${name}`, 'success');
    return true;
  } catch (error) {
    testsFailed++;
    log(`❌ ${name}`, 'error');
    log(`   Error: ${error.message}`, 'error');
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Starting System Tests...\n');
  console.log('='.repeat(60) + '\n');

  // Test 1: Backend Health
  await test('Backend Health Check', async () => {
    const res = await axios.get('http://localhost:3000/health');
    if (res.data.status !== 'ok') throw new Error('Backend not healthy');
  });

  // Test 2: ML Service Health
  await test('ML Service Health Check', async () => {
    const res = await axios.get('http://localhost:5000/health');
    if (res.data.status !== 'ok') throw new Error('ML Service not healthy');
  });

  // Test 3: Get Topics
  await test('Get Topics Endpoint', async () => {
    const res = await axios.get(`${API_URL}/topics`);
    if (!Array.isArray(res.data.topics)) throw new Error('Topics not returned as array');
  });

  // Test 4: Register User
  let authToken = null;
  const testEmail = `test${Date.now()}@example.com`;
  
  await test('User Registration', async () => {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: 'TestPassword123!',
      name: 'Test User'
    });
    if (!res.data.session) throw new Error('No session returned');
    authToken = res.data.session.access_token;
  });

  // Test 5: Login
  await test('User Login', async () => {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: 'TestPassword123!'
    });
    if (!res.data.session) throw new Error('No session returned');
    authToken = res.data.session.access_token;
  });

  if (!authToken) {
    log('\n⚠️  Skipping authenticated tests (no auth token)', 'warning');
  } else {
    const headers = { Authorization: `Bearer ${authToken}` };

    // Test 6: Get Profile
    await test('Get User Profile', async () => {
      const res = await axios.get(`${API_URL}/users/profile`, { headers });
      if (!res.data.profile) throw new Error('No profile returned');
    });

    // Test 7: Get Progress Overview
    await test('Get Progress Overview', async () => {
      const res = await axios.get(`${API_URL}/progress/overview`, { headers });
      if (!res.data.overview) throw new Error('No overview returned');
    });

    // Test 8: Start Session
    let sessionId = null;
    await test('Start Learning Session', async () => {
      // First get a topic
      const topicsRes = await axios.get(`${API_URL}/topics`);
      if (topicsRes.data.topics.length === 0) {
        throw new Error('No topics available');
      }
      
      const topicId = topicsRes.data.topics[0].id;
      const res = await axios.post(`${API_URL}/sessions/start`, 
        { topicId },
        { headers }
      );
      if (!res.data.session) throw new Error('No session returned');
      sessionId = res.data.session.id;
    });

    // Test 9: Get Session
    if (sessionId) {
      await test('Get Session Details', async () => {
        const res = await axios.get(`${API_URL}/sessions/${sessionId}`, { headers });
        if (!res.data.session) throw new Error('No session returned');
      });
    }

    // Test 10: ML Service - Generate Question
    await test('ML Service - Generate Question', async () => {
      const res = await axios.post(`${ML_URL}/generate-question`, {
        topic: 'Test Topic',
        concept: 'Test Concept',
        difficulty: 5
      });
      if (!res.data.question) throw new Error('No question generated');
    });

    // Test 11: ML Service - Evaluate Response
    await test('ML Service - Evaluate Response', async () => {
      const res = await axios.post(`${ML_URL}/evaluate-response`, {
        question: 'What is 2+2?',
        response: 'Four',
        concept: 'Math',
        difficulty: 1
      });
      if (typeof res.data.score !== 'number') throw new Error('No score returned');
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');
  log(`   Passed: ${testsPassed}`, 'success');
  if (testsFailed > 0) {
    log(`   Failed: ${testsFailed}`, 'error');
  }
  console.log(`   Total:  ${testsPassed + testsFailed}`);
  console.log('\n' + '='.repeat(60) + '\n');

  if (testsFailed === 0) {
    log('🎉 All tests passed!', 'success');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Check the errors above.', 'warning');
    process.exit(1);
  }
}

// Check if services are running
async function checkServices() {
  try {
    await axios.get('http://localhost:3000/health', { timeout: 2000 });
    await axios.get('http://localhost:5000/health', { timeout: 2000 });
    return true;
  } catch (error) {
    log('\n❌ Services are not running!', 'error');
    log('   Please start services first: npm start\n', 'warning');
    return false;
  }
}

// Main
(async () => {
  const servicesRunning = await checkServices();
  if (!servicesRunning) {
    process.exit(1);
  }
  
  await runTests();
})();
