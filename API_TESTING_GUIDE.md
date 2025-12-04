# API Testing Guide

Quick reference guide for testing all API endpoints.

## Quick Start

### Run All Tests
```bash
cd frontend
npm run test:api
```

### Manual Testing

#### 1. Test GET /api/audits
```bash
# Basic request
curl http://localhost:3000/api/audits

# With filters
curl "http://localhost:3000/api/audits?status=active&limit=5"

# Invalid status (should return 400)
curl "http://localhost:3000/api/audits?status=invalid"
```

#### 2. Test POST /api/audit/start
```bash
# Valid request
curl -X POST http://localhost:3000/api/audit/start \
  -H "Content-Type: application/json" \
  -d '{"targetAddress":"0x1234567890123456789012345678901234567890","intensity":"quick"}'

# Missing address (should return 400)
curl -X POST http://localhost:3000/api/audit/start \
  -H "Content-Type: application/json" \
  -d '{"intensity":"quick"}'

# Invalid intensity (should return 400)
curl -X POST http://localhost:3000/api/audit/start \
  -H "Content-Type: application/json" \
  -d '{"targetAddress":"0x1234567890123456789012345678901234567890","intensity":"invalid"}'
```

#### 3. Test GET /api/logs
```bash
# Basic request
curl http://localhost:3000/api/logs

# With filters
curl "http://localhost:3000/api/logs?limit=10&type=info&actor=Judge"

# Invalid limit (should return 400)
curl "http://localhost:3000/api/logs?limit=99999"
```

#### 4. Test GET /api/agent-status
```bash
curl http://localhost:3000/api/agent-status
```

## Test Script Output

The test script provides:
- ✅ Color-coded results
- ⏱️ Response time for each endpoint
- 📊 Summary statistics
- 🔍 Detailed error messages

## Expected Results

When agent API is running:
- All endpoints should return 200/400 status codes
- Error cases should return 400 for validation errors
- Response times should be < 1000ms

When agent API is not running:
- `/api/agent-status` will return 503 (expected)
- `/api/audit/start` will return 503 (expected)
- Other endpoints should still work

## Debugging

Check console logs in your Next.js dev server for detailed debugging information. Each endpoint logs:
- Request received
- Query parameters/request body
- Validation results
- Response status and time

