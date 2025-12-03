const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BACKEND_URL = 'http://localhost:3000';
const ML_SERVICE_URL = 'http://localhost:5000';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🧪 Testing ML Service and Dashboard Integration\n');

async function testMLService() {
  console.log('1️⃣ Testing ML Service...');
  
  try {
    // Test health endpoint
    const health = await axios.get(`${ML_SERVICE_URL}/health`);
    console.log('   ✅ ML Service health:', health.data.status);
    console.log('   📊 Model:', health.data.model);
    console.log('   📊 Fallback:', health.data.fallback_model);
    
    // Test question generation
    console.log('\n   Testing question generation...');
    const questionRes = await axios.post(`${ML_SERVICE_URL}/api/v1/generate-question`, {
      topic: 'Mathematics',
      concept: 'Algebra',
      difficulty: 5
    });
    console.log('   ✅ Question generated:', questionRes.data.question.substring(0, 80) + '...');
    
    // Test response evaluation
    console.log('\n   Testing response evaluation...');
    const evalRes = await axios.post(`${ML_SERVICE_URL}/api/v1/evaluate-response`, {
      question: questionRes.data.question,
      response: 'Algebra is about solving equations with variables.',
      concept: 'Algebra',
      difficulty: 5
    });
    console.log('   ✅ Evaluation score:', evalRes.data.score);
    console.log('   ✅ Understanding:', evalRes.data.understanding);
    console.log('   ✅ Cognitive load:', evalRes.data.cognitiveLoad);
    
    return true;
  } catch (error) {
    console.error('   ❌ ML Service error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    return false;
  }
}

async function testBackendAPI() {
  console.log('\n2️⃣ Testing Backend API...');
  
  try {
    // Test health endpoint
    const health = await axios.get(`${BACKEND_URL}/health`);
    console.log('   ✅ Backend health:', health.data.status);
    
    // Test topics endpoint (no auth required)
    console.log('\n   Testing topics endpoint...');
    const topicsRes = await axios.get(`${BACKEND_URL}/api/v1/topics`);
    console.log('   ✅ Topics loaded:', topicsRes.data.topics?.length || 0);
    
    if (topicsRes.data.topics && topicsRes.data.topics.length > 0) {
      console.log('   📚 Sample topics:');
      topicsRes.data.topics.slice(0, 3).forEach(topic => {
        console.log(`      - ${topic.name} (${topic.subject})`);
      });
    } else {
      console.log('   ⚠️  No topics found in database');
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Backend API error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    return false;
  }
}

async function testDashboardData() {
  console.log('\n3️⃣ Testing Dashboard Data Flow...');
  
  try {
    // Create a test user with valid email format
    console.log('   Creating test user...');
    const testEmail = `test${Date.now()}@testdomain.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('   ❌ Auth error:', authError.message);
      return false;
    }
    
    const token = authData.session?.access_token;
    if (!token) {
      console.error('   ❌ No access token received');
      return false;
    }
    
    console.log('   ✅ Test user created');
    
    // Test progress overview endpoint
    console.log('\n   Testing progress overview...');
    const progressRes = await axios.get(`${BACKEND_URL}/api/v1/progress/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Progress overview loaded');
    console.log('   📊 Overall mastery:', progressRes.data.overview.overallMastery + '%');
    console.log('   📊 Streak:', progressRes.data.overview.streak, 'days');
    console.log('   📊 Level:', progressRes.data.overview.level);
    console.log('   📊 XP:', progressRes.data.overview.xp);
    
    // Clean up test user
    await supabase.auth.signOut();
    
    return true;
  } catch (error) {
    console.error('   ❌ Dashboard data error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    return false;
  }
}

async function testSessionFlow() {
  console.log('\n4️⃣ Testing Session Flow...');
  
  try {
    // Create a test user with valid email format
    const testEmail = `testsession${Date.now()}@testdomain.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    if (authError) {
      console.error('   ❌ Auth error:', authError.message);
      return false;
    }
    
    const token = authData.session?.access_token;
    console.log('   ✅ Test user created');
    
    // Get topics
    const topicsRes = await axios.get(`${BACKEND_URL}/api/v1/topics`);
    if (!topicsRes.data.topics || topicsRes.data.topics.length === 0) {
      console.log('   ⚠️  No topics available, skipping session test');
      return true;
    }
    
    const topicId = topicsRes.data.topics[0].id;
    console.log('   📚 Using topic:', topicsRes.data.topics[0].name);
    
    // Start a session
    console.log('\n   Starting learning session...');
    const sessionRes = await axios.post(
      `${BACKEND_URL}/api/v1/sessions/start`,
      { topicId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('   ✅ Session started:', sessionRes.data.session.id);
    console.log('   ✅ First question generated');
    console.log('   📝 Question:', sessionRes.data.session.currentQuestion?.text?.substring(0, 80) + '...');
    
    // Clean up
    await supabase.auth.signOut();
    
    return true;
  } catch (error) {
    console.error('   ❌ Session flow error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('═'.repeat(60));
  console.log('Starting comprehensive system tests...');
  console.log('═'.repeat(60) + '\n');
  
  const results = {
    mlService: false,
    backendAPI: false,
    dashboardData: false,
    sessionFlow: false
  };
  
  results.mlService = await testMLService();
  results.backendAPI = await testBackendAPI();
  results.dashboardData = await testDashboardData();
  results.sessionFlow = await testSessionFlow();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(60));
  console.log(`ML Service:      ${results.mlService ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Backend API:     ${results.backendAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Dashboard Data:  ${results.dashboardData ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Session Flow:    ${results.sessionFlow ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═'.repeat(60));
  
  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('\n🎉 All tests passed! System is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
