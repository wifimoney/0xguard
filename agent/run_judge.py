"""
Standalone script to run Judge agent
Can be invoked as a subprocess by the API server
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from judge import create_judge_agent


async def run_judge():
    """Run the Judge agent"""
    judge = create_judge_agent(port=8002)
    print(f"Judge agent started: {judge.address}", flush=True)
    await judge.run()


if __name__ == "__main__":
    try:
        asyncio.run(run_judge())
    except KeyboardInterrupt:
        print("\nJudge agent stopped.", flush=True)
    except Exception as e:
        print(f"Error running judge agent: {e}", file=sys.stderr, flush=True)
        sys.exit(1)

