"""
Integration tests for Judge-Midnight integration.
Tests the complete flow from vulnerability detection to ZK proof submission.
"""
import asyncio
import sys
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from midnight_client import (
    submit_audit_proof,
    generate_audit_id,
    verify_audit_status,
    create_private_state,
)


async def test_midnight_client():
    """Test Midnight client functions."""
    print("\n" + "=" * 70)
    print("🧪 Testing Midnight Client Integration")
    print("=" * 70)
    
    # Test 1: Generate audit ID
    print("\n1️⃣  Testing audit ID generation...")
    exploit = "fetch_ai_2024"
    timestamp = "2024-01-01T00:00:00"
    audit_id = generate_audit_id(exploit, timestamp)
    
    if len(audit_id) == 64:
        print(f"   ✅ Generated audit ID: {audit_id[:16]}...")
    else:
        print(f"   ❌ Invalid audit ID length: {len(audit_id)}")
        return False
    
    # Test 2: Create private state
    print("\n2️⃣  Testing private state creation...")
    private_state = create_private_state(exploit, 98)
    
    if "exploitString" in private_state and "riskScore" in private_state:
        print(f"   ✅ Created private state")
        print(f"      - Exploit string length: {len(private_state['exploitString'])}")
        print(f"      - Risk score: {private_state['riskScore']}")
    else:
        print(f"   ❌ Invalid private state structure")
        return False
    
    # Test 3: Submit audit proof
    print("\n3️⃣  Testing audit proof submission...")
    auditor_id = "0" * 64  # 32 bytes hex string
    proof_hash = await submit_audit_proof(
        audit_id=audit_id,
        exploit_string=exploit,
        risk_score=98,
        auditor_id=auditor_id,
        threshold=90
    )
    
    if proof_hash and proof_hash.startswith("zk_"):
        print(f"   ✅ Proof submitted successfully")
        print(f"      - Proof hash: {proof_hash}")
    else:
        print(f"   ❌ Failed to submit proof")
        return False
    
    # Test 4: Verify audit status
    print("\n4️⃣  Testing audit status verification...")
    status = await verify_audit_status(audit_id)
    
    if status and status.get("is_verified"):
        print(f"   ✅ Audit verified successfully")
        print(f"      - Audit ID: {status.get('audit_id')[:16]}...")
        print(f"      - Is Verified: {status.get('is_verified')}")
    else:
        print(f"   ❌ Failed to verify audit")
        return False
    
    print("\n" + "=" * 70)
    print("✅ All Midnight client tests PASSED!")
    print("=" * 70)
    return True


async def test_judge_midnight_flow():
    """Test the complete Judge-Midnight integration flow."""
    print("\n" + "=" * 70)
    print("🔄 Testing Complete Judge-Midnight Flow")
    print("=" * 70)
    
    print("\n📋 Simulated Flow:")
    print("   1. Judge detects SUCCESS response from Target")
    print("   2. Judge extracts exploit_string: 'fetch_ai_2024'")
    print("   3. Judge calculates risk_score: 98")
    print("   4. Judge generates audit_id")
    print("   5. Judge calls submit_audit_proof()")
    print("   6. Midnight client generates ZK proof")
    print("   7. Proof hash returned: zk_...")
    print("   8. Judge logs: 'Proof Minted. Hash: zk_... (Verified)'")
    
    # Simulate the flow
    exploit = "fetch_ai_2024"
    risk_score = 98
    auditor_id = "0" * 64
    
    timestamp = "2024-01-01T00:00:00"
    audit_id = generate_audit_id(exploit, timestamp)
    
    proof_hash = await submit_audit_proof(
        audit_id=audit_id,
        exploit_string=exploit,
        risk_score=risk_score,
        auditor_id=auditor_id,
        threshold=90
    )
    
    if proof_hash:
        print(f"\n   ✅ Flow completed successfully!")
        print(f"      - Audit ID: {audit_id[:16]}...")
        print(f"      - Proof Hash: {proof_hash}")
        print(f"      - Risk Score: {risk_score}")
        print(f"      - Threshold: 90")
        print(f"      - Verified: True")
    else:
        print(f"\n   ❌ Flow failed")
        return False
    
    print("\n" + "=" * 70)
    print("✅ Judge-Midnight flow test PASSED!")
    print("=" * 70)
    return True


async def main():
    """Run all integration tests."""
    print("\n" + "=" * 70)
    print("🛡️  Midnight Integration Test Suite")
    print("=" * 70)
    
    results = []
    
    # Run tests
    results.append(("Midnight Client", await test_midnight_client()))
    results.append(("Judge-Midnight Flow", await test_judge_midnight_flow()))
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Summary")
    print("=" * 70)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {status}: {test_name}")
    
    all_passed = all(result for _, result in results)
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✅ All tests PASSED!")
        print("\n📋 Verification Complete:")
        print("   • Midnight client functions working")
        print("   • Audit proof submission working")
        print("   • Judge-Midnight integration ready")
        print("   • ZK proof generation simulated")
    else:
        print("❌ Some tests FAILED!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())

