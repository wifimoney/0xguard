#!/usr/bin/env node
/**
 * API Endpoint Test Script
 * Tests all frontend API endpoints with sample data
 * 
 * Usage:
 *   node test-api-endpoints.js
 *   or
 *   npm run test:api
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8003';

const results = [];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(result) {
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  const color = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
  
  log(`${icon} [${result.method}] ${result.endpoint} - ${result.status}`, color);
  if (result.statusCode) {
    log(`   Status: ${result.statusCode}`, 'cyan');
  }
  if (result.responseTime) {
    log(`   Time: ${result.responseTime}ms`, 'cyan');
  }
  if (result.error) {
    log(`   Error: ${result.error}`, 'red');
  }
  if (result.message) {
    log(`   ${result.message}`, 'yellow');
  }
}

async function testEndpoint(endpoint, method = 'GET', body, expectedStatus) {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { text: await response.text() };
    }

    const result = {
      endpoint,
      method,
      status: expectedStatus
        ? response.status === expectedStatus
          ? 'PASS'
          : 'FAIL'
        : response.status < 400
        ? 'PASS'
        : 'FAIL',
      statusCode: response.status,
      responseTime,
    };

    if (result.status === 'FAIL') {
      result.error = responseData.error || responseData.message || 'Unexpected status code';
    }

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      endpoint,
      method,
      status: 'FAIL',
      responseTime,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function checkService(url, name) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(url, { 
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function runTests() {
  log('\n🚀 Starting API Endpoint Tests\n', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Agent API URL: ${AGENT_API_URL}\n`, 'blue');

  // Check if services are running
  log('📡 Checking service availability...', 'blue');
  const frontendRunning = await checkService(BASE_URL, 'Frontend');
  const agentApiRunning = await checkService(`${AGENT_API_URL}/health`, 'Agent API');

  log(`Frontend: ${frontendRunning ? '✅ Running' : '❌ Not running'}`, frontendRunning ? 'green' : 'red');
  log(`Agent API: ${agentApiRunning ? '✅ Running' : '❌ Not running'}`, agentApiRunning ? 'green' : 'red');
  log('');

  if (!frontendRunning) {
    log('⚠️  Frontend server is not running. Please start it first:', 'yellow');
    log('   cd frontend && npm run dev\n', 'yellow');
    return;
  }

  log('📋 Running endpoint tests...\n', 'cyan');

  // Test 1: GET /api/audits
  log('Test 1: GET /api/audits', 'blue');
  results.push(await testEndpoint('/api/audits', 'GET', undefined, 200));

  // Test 2: GET /api/audits with filters
  log('Test 2: GET /api/audits?status=active', 'blue');
  results.push(await testEndpoint('/api/audits?status=active', 'GET', undefined, 200));

  // Test 3: GET /api/audits with pagination
  log('Test 3: GET /api/audits?limit=5&offset=0', 'blue');
  results.push(await testEndpoint('/api/audits?limit=5&offset=0', 'GET', undefined, 200));

  // Test 4: GET /api/audits with invalid status
  log('Test 4: GET /api/audits?status=invalid (should fail)', 'blue');
  results.push(await testEndpoint('/api/audits?status=invalid', 'GET', undefined, 400));

  // Test 5: GET /api/audits with invalid limit
  log('Test 5: GET /api/audits?limit=invalid (should fail)', 'blue');
  results.push(await testEndpoint('/api/audits?limit=invalid', 'GET', undefined, 400));

  // Test 6: GET /api/logs
  log('Test 6: GET /api/logs', 'blue');
  results.push(await testEndpoint('/api/logs', 'GET', undefined, 200));

  // Test 7: GET /api/logs with filters
  log('Test 7: GET /api/logs?limit=10&type=info', 'blue');
  results.push(await testEndpoint('/api/logs?limit=10&type=info', 'GET', undefined, 200));

  // Test 8: GET /api/logs with invalid limit
  log('Test 8: GET /api/logs?limit=99999 (should fail)', 'blue');
  results.push(await testEndpoint('/api/logs?limit=99999', 'GET', undefined, 400));

  // Test 9: GET /api/agent-status
  log('Test 9: GET /api/agent-status', 'blue');
  let agentStatusResult = await testEndpoint('/api/agent-status', 'GET', undefined);
  if (agentStatusResult.status === 'FAIL' && agentStatusResult.statusCode === 503) {
    agentStatusResult.status = 'SKIP';
    agentStatusResult.message = 'Agent API not available (expected if not running)';
  }
  results.push(agentStatusResult);

  // Test 10: POST /api/audit/start - Valid request
  log('Test 10: POST /api/audit/start (valid)', 'blue');
  results.push(
    await testEndpoint(
      '/api/audit/start',
      'POST',
      {
        targetAddress: '0x1234567890123456789012345678901234567890',
        intensity: 'quick',
      },
      agentApiRunning ? 200 : 503
    )
  );

  // Test 11: POST /api/audit/start - Missing targetAddress
  log('Test 11: POST /api/audit/start (missing targetAddress - should fail)', 'blue');
  results.push(
    await testEndpoint(
      '/api/audit/start',
      'POST',
      { intensity: 'quick' },
      400
    )
  );

  // Test 12: POST /api/audit/start - Invalid intensity
  log('Test 12: POST /api/audit/start (invalid intensity - should fail)', 'blue');
  results.push(
    await testEndpoint(
      '/api/audit/start',
      'POST',
      {
        targetAddress: '0x1234567890123456789012345678901234567890',
        intensity: 'invalid',
      },
      400
    )
  );

  // Test 13: POST /api/audit/start - Invalid address format
  log('Test 13: POST /api/audit/start (invalid address - should fail)', 'blue');
  results.push(
    await testEndpoint(
      '/api/audit/start',
      'POST',
      {
        targetAddress: '0x123', // Invalid length
        intensity: 'quick',
      },
      400
    )
  );

  // Test 14: POST /api/audit/start - Empty address
  log('Test 14: POST /api/audit/start (empty address - should fail)', 'blue');
  results.push(
    await testEndpoint(
      '/api/audit/start',
      'POST',
      {
        targetAddress: '',
        intensity: 'quick',
      },
      400
    )
  );

  // Print results summary
  log('\n📊 Test Results Summary\n', 'cyan');
  
  results.forEach((result) => {
    logResult(result);
  });

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const total = results.length;

  log('\n' + '='.repeat(50), 'cyan');
  log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`, 'cyan');
  log('='.repeat(50) + '\n', 'cyan');

  if (failed > 0) {
    log('❌ Some tests failed. Check the errors above.', 'red');
    process.exit(1);
  } else {
    log('✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

