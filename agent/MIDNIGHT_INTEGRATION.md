# Midnight Integration Guide

## Overview

The Judge agent integrates with Midnight Network to submit zero-knowledge proofs when vulnerabilities are discovered. This allows the system to prove that a vulnerability has a high risk score (>= 90) without revealing the actual score or exploit details.

## Architecture

### Components

1. **AuditVerifier Contract** (`contracts/midnight/src/AuditVerifier.compact`)
   - Compact smart contract on Midnight Network
   - Private state: `exploit_string`, `risk_score`
   - Public state: `is_verified`, `auditor_id`, `proofs`
   - Circuit: Proves `risk_score >= threshold` without revealing values

2. **Midnight Client** (`agent/midnight_client.py`)
   - Python module for interacting with Midnight devnet
   - Functions: `submit_audit_proof()`, `verify_audit_status()`, etc.
   - Currently uses simulation mode (can be upgraded to real devnet)

3. **Judge Agent** (`agent/judge.py`)
   - Monitors Red Team and Target communications
   - Detects vulnerabilities (SUCCESS responses with SECRET_KEY)
   - Calls Midnight client to submit ZK proofs
   - Also saves bounty tokens to Unibase

## Integration Flow

```
1. Red Team → Target: AttackMessage(payload)
2. Target → Judge: ResponseMessage(status="SUCCESS", message contains SECRET_KEY)
3. Judge: Detects vulnerability
4. Judge: Calculates risk_score (98 for SECRET_KEY compromise)
5. Judge: Generates audit_id (hash of exploit + timestamp)
6. Judge: Calls submit_audit_proof():
   - Creates private state with exploit_string and risk_score
   - Submits to Midnight devnet (or simulates)
   - Receives proof_hash
7. Judge: Logs "Proof Minted. Hash: {proof_hash} (Verified)"
8. Judge: Also saves bounty token to Unibase
```

## Configuration

### Environment Variables

- `MIDNIGHT_DEVNET_URL`: Midnight devnet URL (default: `http://localhost:6300`)
- `MIDNIGHT_BRIDGE_URL`: Bridge service URL (default: `http://localhost:3000`)
- `MIDNIGHT_CONTRACT_ADDRESS`: Contract address on devnet (if deployed)

### Current Implementation

The current implementation uses **simulation mode** for development:
- Proof hashes are generated deterministically
- No actual Midnight devnet connection required
- Can be upgraded to real devnet when available

## Usage

### Judge Agent Integration

The Judge agent automatically integrates with Midnight when a vulnerability is detected:

```python
# In judge.py handle_target_response()
if msg.status == "SUCCESS" and SECRET_KEY in msg.message:
    # Submit ZK proof to Midnight
    proof_hash = await submit_audit_proof(
        audit_id=audit_id,
        exploit_string=exploit_payload,
        risk_score=98,
        auditor_id=judge.address,
        threshold=90
    )
```

### Manual Testing

Test the Midnight client directly:

```python
from midnight_client import submit_audit_proof, generate_audit_id

audit_id = generate_audit_id("fetch_ai_2024", "2024-01-01T00:00:00")
proof_hash = await submit_audit_proof(
    audit_id=audit_id,
    exploit_string="fetch_ai_2024",
    risk_score=98,
    auditor_id="0" * 64,
    threshold=90
)
```

## Contract Structure

### Private Witness Data
- `exploit_string`: Bytes<64> - The exploit payload (never revealed)
- `risk_score`: Uint<64> - Risk score (never revealed)

### Public Ledger State
- `is_verified`: Map<Bytes<32>, Bool> - Verification status
- `auditor_id`: Map<Bytes<32>, Bytes<32> - Judge/auditor identifier
- `proofs`: Map<Bytes<32>, Bytes<32> - Proof hashes

### Circuit Logic

The `submitAudit` circuit:
1. Retrieves private witness: `exploit_string`, `risk_score`
2. Asserts: `risk_score >= threshold` (proves > 90 without revealing)
3. Generates proof hash from `audit_id` + `exploit_string`
4. Sets public state:
   - `is_verified[audit_id] = true`
   - `auditor_id[audit_id] = auditor_id`
   - `proofs[audit_id] = proof_hash`

## Upgrading to Real Devnet

To upgrade from simulation to real Midnight devnet:

1. **Set up Midnight devnet**:
   ```bash
   # Start Midnight proof server
   docker run -d -p 6300:6300 midnightnetwork/proof-server:latest
   ```

2. **Create bridge service** (optional):
   - TypeScript/Node.js service that wraps Midnight SDK
   - Exposes HTTP API for Python agents
   - Handles contract deployment and proof submission

3. **Update midnight_client.py**:
   - Replace simulation functions with HTTP calls to bridge
   - Or use subprocess to call Node.js scripts directly
   - Add error handling for devnet connection failures

4. **Deploy contract**:
   - Compile contract: `npm run compact && npm run build`
   - Deploy to devnet
   - Set `MIDNIGHT_CONTRACT_ADDRESS` environment variable

## Error Handling

The integration includes graceful error handling:

- **Devnet unavailable**: Logs warning, continues with Unibase only
- **Proof generation fails**: Logs error, retries once
- **Contract call fails**: Logs error, falls back to Unibase storage

## Testing

Run integration tests:

```bash
cd agent
python test_midnight_integration.py
```

This tests:
- Audit ID generation
- Private state creation
- Proof submission
- Status verification
- Complete Judge-Midnight flow

## Troubleshooting

### Proof submission fails
- Check if devnet is running (if using real devnet)
- Verify environment variables are set correctly
- Check logs for specific error messages

### Contract compilation errors
- Ensure Compact compiler is installed
- Run `npm run compact` before `npm run build`
- Check contract syntax matches Compact language version

### Integration not working
- Verify Judge agent is receiving SUCCESS responses
- Check that `midnight_client.py` is imported correctly
- Review logs for error messages

## Future Enhancements

- Real Midnight devnet integration
- Bridge service for Python-JavaScript interop
- Contract deployment automation
- Proof verification on-chain
- Multi-auditor support
- Audit history tracking

