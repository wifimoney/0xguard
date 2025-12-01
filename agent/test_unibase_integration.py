"""
Test script to verify Unibase integration and narrative check.
Tests that Red Team remembers exploits across sessions.
"""
import asyncio
import sys
import json
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from unibase import (
    get_known_exploits,
    save_exploit,
    load_exploits_from_file,
    save_exploits_to_file,
    format_exploit_message,
    parse_exploits_from_messages,
)


async def test_unibase_integration():
    """Test Unibase integration functionality."""
    print("\n" + "=" * 70)
    print("🧪 Testing Unibase Integration")
    print("=" * 70)
    
    # Test 1: Save exploits
    print("\n1️⃣  Testing exploit saving...")
    test_exploits = {"' OR '1'='1", "admin' --", "fetch_ai_2024"}
    known_exploits = set()
    
    for exploit in test_exploits:
        result = await save_exploit(exploit, known_exploits, use_mcp=False)
        if result:
            print(f"   ✅ Saved exploit: '{exploit}'")
        else:
            print(f"   ❌ Failed to save: '{exploit}'")
            return False
    
    # Test 2: Load exploits
    print("\n2️⃣  Testing exploit loading...")
    loaded_exploits = await get_known_exploits(use_mcp=False, mcp_messages=None)
    
    if loaded_exploits == test_exploits:
        print(f"   ✅ Loaded {len(loaded_exploits)} exploits correctly")
        for exploit in loaded_exploits:
            print(f"      - {exploit}")
    else:
        print(f"   ❌ Mismatch: Expected {test_exploits}, got {loaded_exploits}")
        return False
    
    # Test 3: Message parsing
    print("\n3️⃣  Testing message parsing...")
    test_messages = [
        {"content": "EXPLOIT: ' OR '1'='1"},
        {"content": "EXPLOIT: admin' --"},
        {"content": "Some other message"},
        {"content": "EXPLOIT: fetch_ai_2024"},
    ]
    
    parsed = parse_exploits_from_messages(test_messages)
    expected = {"' OR '1'='1", "admin' --", "fetch_ai_2024"}
    
    if parsed == expected:
        print(f"   ✅ Parsed {len(parsed)} exploits from messages correctly")
    else:
        print(f"   ❌ Parsing mismatch: Expected {expected}, got {parsed}")
        return False
    
    # Test 4: Format exploit message
    print("\n4️⃣  Testing message formatting...")
    exploit = "test_exploit"
    formatted = format_exploit_message(exploit)
    expected_format = "EXPLOIT: test_exploit"
    
    if formatted == expected_format:
        print(f"   ✅ Formatted correctly: '{formatted}'")
    else:
        print(f"   ❌ Format mismatch: Expected '{expected_format}', got '{formatted}'")
        return False
    
    print("\n" + "=" * 70)
    print("✅ All Unibase integration tests PASSED!")
    print("=" * 70)
    return True


async def test_narrative_check():
    """Test the narrative check: Red Team remembers exploits across sessions."""
    print("\n" + "=" * 70)
    print("📖 Testing Narrative Check (Cross-Session Memory)")
    print("=" * 70)
    
    # Simulate Session 1: Red Team finds an exploit
    print("\n📅 Session 1: Red Team discovers exploit...")
    session1_exploits = set()
    new_exploit = "fetch_ai_2024"
    
    print(f"   🔍 Red Team finds exploit: '{new_exploit}'")
    await save_exploit(new_exploit, session1_exploits, use_mcp=False)
    print(f"   💾 Exploit saved to Hivemind Memory")
    
    # Simulate Session 2: Red Team restarts
    print("\n📅 Session 2: Red Team restarts...")
    print("   🔄 Red Team queries Hivemind Memory on startup...")
    
    session2_exploits = await get_known_exploits(use_mcp=False, mcp_messages=None)
    
    if new_exploit in session2_exploits:
        print(f"   ✅ Red Team remembers exploit from previous session: '{new_exploit}'")
        print(f"   ✅ Red Team loaded {len(session2_exploits)} known exploit(s)")
        print(f"   ✅ Narrative check PASSED: Red Team 'remembers' without asking ASI again")
    else:
        print(f"   ❌ Red Team forgot the exploit!")
        print(f"   ❌ Narrative check FAILED")
        return False
    
    print("\n" + "=" * 70)
    print("✅ Narrative check PASSED!")
    print("=" * 70)
    return True


async def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("🔐 Unibase Integration & Narrative Check Test Suite")
    print("=" * 70)
    
    results = []
    
    # Run tests
    results.append(("Unibase Integration", await test_unibase_integration()))
    results.append(("Narrative Check", await test_narrative_check()))
    
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
        print("   • Unibase integration working correctly")
        print("   • Exploits can be saved and loaded")
        print("   • Red Team remembers exploits across sessions")
        print("   • Narrative check verified: Red Team 'remembers' without ASI")
    else:
        print("❌ Some tests FAILED!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())

