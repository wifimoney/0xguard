"""
Standalone script to run Target agent
Can be invoked as a subprocess by the API server
"""
import asyncio
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from judge import create_judge_agent
from target import create_target_agent


async def run_target():
    """Run the Target agent"""
    # Get judge address from environment (must be set by API server)
    judge_address = os.getenv("JUDGE_ADDRESS")
    if not judge_address:
        print("Error: JUDGE_ADDRESS environment variable not set", file=sys.stderr, flush=True)
        sys.exit(1)
    
    target = create_target_agent(port=8000, judge_address=judge_address)
    print(f"Target agent started: {target.address}", flush=True)
    await target.run()


if __name__ == "__main__":
    try:
        asyncio.run(run_target())
    except KeyboardInterrupt:
        print("\nTarget agent stopped.", flush=True)
    except Exception as e:
        print(f"Error running target agent: {e}", file=sys.stderr, flush=True)
        sys.exit(1)

