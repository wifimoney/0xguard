"""
Example script to run all agents together: Red Team, Target, and Judge.
Demonstrates the complete 0xGuard swarm in action.
"""
import asyncio
import sys
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from red_team import create_red_team_agent
from target import create_target_agent
from judge import create_judge_agent


async def run_all_agents():
    """Run Red Team, Target, and Judge agents together."""
    print("\n" + "=" * 70)
    print("🚀 Starting 0xGuard Agent Swarm")
    print("=" * 70)
    
    # Create agents
    print("\n📦 Creating agents...")
    
    # Judge first (needs to be running to receive messages)
    judge = create_judge_agent(port=8002)
    judge_address = judge.address
    print(f"   ⚖️  Judge Agent: {judge_address}")
    
    # Target (needs Judge address to forward responses)
    target = create_target_agent(port=8000, judge_address=judge_address)
    target_address = target.address
    print(f"   🎯 Target Agent: {target_address}")
    
    # Red Team (needs Target and Judge addresses)
    red_team = create_red_team_agent(
        target_address=target_address,
        port=8001,
        judge_address=judge_address
    )
    print(f"   🔴 Red Team Agent: {red_team.address}")
    
    print("\n✅ All agents created!")
    print("\n📋 Agent Configuration:")
    print(f"   Red Team → Target: {target_address}")
    print(f"   Red Team → Judge: {judge_address}")
    print(f"   Target → Judge: {judge_address}")
    print(f"   Target → Red Team: {red_team.address}")
    
    print("\n" + "=" * 70)
    print("🔄 Starting agents...")
    print("=" * 70)
    print("\n💡 Agents are now running. Watch the logs for:")
    print("   • Red Team generating attacks via ASI")
    print("   • Target processing attacks")
    print("   • Judge monitoring and awarding bounty tokens")
    print("\n🛑 Press Ctrl+C to stop all agents\n")
    
    # Run all agents concurrently
    try:
        await asyncio.gather(
            red_team.run(),
            target.run(),
            judge.run(),
        )
    except KeyboardInterrupt:
        print("\n\n👋 Stopping all agents...")


if __name__ == "__main__":
    try:
        asyncio.run(run_all_agents())
    except KeyboardInterrupt:
        print("\n👋 Agents stopped.")

