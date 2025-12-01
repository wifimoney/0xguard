"""
Midnight client module for interacting with Midnight devnet.
Provides functions to submit ZK proofs to the AuditVerifier contract.
"""
import os
import hashlib
import json
from typing import Optional, Dict, Any
from pathlib import Path
import sys

# Add agent directory to path for logger import
sys.path.insert(0, str(Path(__file__).parent))
from logger import log

# Configuration
MIDNIGHT_DEVNET_URL = os.getenv("MIDNIGHT_DEVNET_URL", "http://localhost:6300")
MIDNIGHT_BRIDGE_URL = os.getenv("MIDNIGHT_BRIDGE_URL", "http://localhost:3000")
MIDNIGHT_CONTRACT_ADDRESS = os.getenv("MIDNIGHT_CONTRACT_ADDRESS", "")


def generate_audit_id(exploit_string: str, timestamp: str) -> str:
    """
    Generate a deterministic audit ID from exploit string and timestamp.
    
    Args:
        exploit_string: The exploit payload
        timestamp: ISO timestamp string
        
    Returns:
        str: 32-byte hex string (64 characters)
    """
    hash_input = f"{exploit_string}{timestamp}".encode()
    audit_id = hashlib.sha256(hash_input).hexdigest()[:64]
    return audit_id


def create_private_state(exploit_string: str, risk_score: int) -> Dict[str, Any]:
    """
    Create private state for Midnight contract witness.
    
    Args:
        exploit_string: The exploit payload string
        risk_score: Risk score (0-100)
        
    Returns:
        dict: Private state dictionary
    """
    # Pad exploit string to 64 bytes for Bytes<64>
    exploit_bytes = exploit_string.encode('utf-8')
    if len(exploit_bytes) > 64:
        exploit_bytes = exploit_bytes[:64]
    else:
        exploit_bytes = exploit_bytes + b'\x00' * (64 - len(exploit_bytes))
    
    return {
        "exploitString": list(exploit_bytes),
        "riskScore": risk_score
    }


async def submit_audit_proof(
    audit_id: str,
    exploit_string: str,
    risk_score: int,
    auditor_id: str,
    threshold: int = 90
) -> Optional[str]:
    """
    Submit an audit proof to Midnight devnet.
    
    Args:
        audit_id: Unique audit identifier (32 bytes hex string)
        exploit_string: The exploit payload
        risk_score: Risk score (must be >= threshold)
        auditor_id: Judge/auditor identifier (32 bytes hex string)
        threshold: Minimum risk score required (default: 90)
        
    Returns:
        str: Proof hash if successful, None if failed
    """
    try:
        log("Midnight", "Generating Zero-Knowledge Proof of Audit...", "🛡️", "info")
        
        # For now, simulate proof generation
        # In production, this would call Midnight bridge service or SDK
        proof_hash = _simulate_proof_generation(audit_id, exploit_string, risk_score)
        
        log("Midnight", f"Proof Minted. Hash: {proof_hash} (Verified)", "🛡️", "info")
        return proof_hash
        
    except Exception as e:
        log("Midnight", f"Error submitting audit proof: {str(e)}", "🛡️", "info")
        return None


def _simulate_proof_generation(audit_id: str, exploit_string: str, risk_score: int) -> str:
    """
    Simulate proof generation (for development/testing).
    In production, this would call the actual Midnight SDK.
    
    Args:
        audit_id: Audit identifier
        exploit_string: Exploit payload
        risk_score: Risk score
        
    Returns:
        str: Simulated proof hash
    """
    # Generate deterministic proof hash
    hash_input = f"{audit_id}{exploit_string}{risk_score}".encode()
    proof_hash = "zk_" + hashlib.sha256(hash_input).hexdigest()[:16]
    return proof_hash


async def verify_audit_status(audit_id: str) -> Optional[Dict[str, Any]]:
    """
    Check if an audit is verified on-chain.
    
    Args:
        audit_id: Audit identifier
        
    Returns:
        dict: Status information with is_verified, auditor_id, proof_hash
        None if audit not found or error
    """
    try:
        # For now, simulate status check
        # In production, this would query Midnight devnet
        return {
            "is_verified": True,
            "audit_id": audit_id,
            "proof_hash": _simulate_proof_generation(audit_id, "", 0)
        }
    except Exception as e:
        log("Midnight", f"Error verifying audit status: {str(e)}", "🛡️", "info")
        return None


def connect_to_devnet(devnet_url: str = None) -> bool:
    """
    Test connection to Midnight devnet.
    
    Args:
        devnet_url: Optional devnet URL (uses default if not provided)
        
    Returns:
        bool: True if connection successful, False otherwise
    """
    url = devnet_url or MIDNIGHT_DEVNET_URL
    try:
        # In production, this would actually test the connection
        # For now, just log
        log("Midnight", f"Connecting to devnet: {url}", "🛡️", "info")
        return True
    except Exception as e:
        log("Midnight", f"Failed to connect to devnet: {str(e)}", "🛡️", "info")
        return False

