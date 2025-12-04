"""
Standalone script to run Red Team agent
Can be invoked as a subprocess by the API server
"""
import asyncio
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from judge import create_judge_agent
from target import create_target_agent
from red_team import create_red_team_agent


async def run_red_team():
    """Run the Red Team agent"""
    # Get addresses from environment (must be set by API server)
    judge_address = os.getenv("JUDGE_ADDRESS")
    target_address = os.getenv("TARGET_ADDRESS")
    
    if not judge_address:
        print("Error: JUDGE_ADDRESS environment variable not set", file=sys.stderr, flush=True)
        sys.exit(1)
    
    if not target_address:
        print("Error: TARGET_ADDRESS environment variable not set", file=sys.stderr, flush=True)
        sys.exit(1)
    
    red_team = create_red_team_agent(
        target_address=target_address,
        port=8001,
        judge_address=judge_address
    )
    print(f"Red Team agent started: {red_team.address}", flush=True)
    await red_team.run()


if __name__ == "__main__":
    try:
        asyncio.run(run_red_team())
    except KeyboardInterrupt:
        print("\nRed Team agent stopped.", flush=True)
    except Exception as e:
        print(f"Error running red team agent: {e}", file=sys.stderr, flush=True)
        sys.exit(1)

