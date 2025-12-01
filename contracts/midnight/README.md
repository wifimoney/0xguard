# 🏴‍☠️ 0xGuard: AuditVerifier Smart Contract

**0xGuard** is security verification system where attackers with sufficient risk scores can submit audits that get cryptographically verified and stored on-chain with expiration timestamps, without revealing sensitive exploit data.



## Contract Architecture

### Public Ledger State
```compact
export ledger proofs: Map<Bytes<32>, Bytes<32>>;          // audit_id -> proof_hash
export ledger is_verified: Map<Bytes<32>, Bool>;           // audit_id -> is_verified
export ledger auditor_id: Map<Bytes<32>, Bytes<32>>;      // audit_id -> auditor_id
```

### Private Witness Data (Never Revealed)
```compact
witness exploit_string(): Bytes<64>;  // The exploit payload string
witness risk_score(): Uint<64>;        // Risk score (0-100)
```

### Core Circuit Logic
The `submitAudit` circuit proves that:
1. `risk_score >= threshold` (without revealing the actual score or exploit)
2. Generates cryptographic proof hash from audit_id and exploit_string
3. Sets `is_verified[audit_id] = true` when proof succeeds
4. Stores `auditor_id` (Judge agent address) publicly
5. Keeps exploit_string and risk_score completely private

---

## Quick Setup

### Prerequisites
- **Midnight Network** development environment
- **Compact** compiler 

### Installation & Build
```bash
# Install dependencies
npm install

# Compile Compact contract and build TypeScript
npm run build

```

**Important**: Always run `npm run compact` before `npm run build` to ensure circuit compilation.

---

## Testing

The test suite (`src/test/AuditVerifier.test.ts`) validates:

### Core Functionality
- ✅ **Deterministic State Generation**: Identical inputs produce identical ledger states
- ✅ **Risk Score Validation**: Rejects audits below minimum thresholds
- ✅ **Multi-Audit Support**: Multiple audits from same/different attackers
- ✅ **Boundary Conditions**: Edge cases like maximum u64 values


### Running Tests

```bash
docker run -d -p 6300:6300 midnightnetwork/proof-server:latest

npm test

```

## Usage in 0xGuard Workflow

### Phase 1: Attack Discovery
1. **Red Team Agent** queries ASI.One for novel attack vectors
2. **Target Agent** simulates vulnerable smart contract
3. **Risk scoring** based on exploit complexity and impact

### Phase 2: Verification & Storage
1. **Judge Agent** validates successful exploits
2. **AuditVerifier Contract** proves risk_score >= threshold via ZK
   - Submits proof to Midnight devnet
   - Sets `is_verified = true` on-chain
   - Stores `auditor_id` (Judge address)
3. **Unibase** stores attack patterns for future reference
4. **Bounty tokens** awarded to Red Team via Unibase

## Judge Agent Integration

The Judge agent automatically integrates with this contract when vulnerabilities are discovered:

1. Judge detects SUCCESS response from Target
2. Judge calculates risk_score (98 for SECRET_KEY compromise)
3. Judge generates audit_id and calls `submit_audit_proof()`
4. Contract verifies risk_score >= 90 without revealing the score
5. Contract sets `is_verified = true` and stores `auditor_id`
6. Judge receives proof_hash and logs verification

See `agent/MIDNIGHT_INTEGRATION.md` for detailed integration guide.


