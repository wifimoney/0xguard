"""
Agent Backend API Server

FastAPI server to manage agent lifecycle, start/stop agents, and return status.
Provides REST API endpoints for frontend to interact with agents.
"""
import os
import sys
import asyncio
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Add agent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Global state for agent processes
class AgentState:
    """Global state to track running agent processes"""
    judge_process: Optional[subprocess.Popen] = None
    target_process: Optional[subprocess.Popen] = None
    red_team_process: Optional[subprocess.Popen] = None
    judge_address: Optional[str] = None
    target_address: Optional[str] = None
    red_team_address: Optional[str] = None
    started_at: Optional[datetime] = None
    target_address_config: Optional[str] = None
    intensity: Optional[str] = None


agent_state = AgentState()


# Pydantic models
class StartAgentsRequest(BaseModel):
    targetAddress: str = Field(..., description="Target contract address to audit")
    intensity: str = Field(default="quick", description="Audit intensity: 'quick' or 'deep'")


class AgentStatus(BaseModel):
    is_running: bool
    port: Optional[int] = None
    address: Optional[str] = None
    last_seen: Optional[str] = None
    health_status: str = Field(default="down", description="healthy | degraded | down")


class AgentsStatusResponse(BaseModel):
    judge: AgentStatus
    target: AgentStatus
    red_team: AgentStatus
    started_at: Optional[str] = None


class StartAgentsResponse(BaseModel):
    success: bool
    message: str
    agents: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


async def check_process_health(process: Optional[subprocess.Popen]) -> str:
    """Check if a process is healthy"""
    if process is None:
        return "down"
    
    poll_result = process.poll()
    if poll_result is None:
        return "healthy"
    else:
        return "down"


def get_agent_address_from_logs(agent_name: str) -> Optional[str]:
    """Try to extract agent address from logs.json"""
    try:
        logs_path = Path(__file__).parent.parent / "logs.json"
        if not logs_path.exists():
            return None
        
        import json
        with open(logs_path, 'r') as f:
            logs = json.load(f)
        
        # Search for agent startup log
        for log_entry in reversed(logs[-100:]):  # Check last 100 entries
            if isinstance(log_entry, dict):
                actor = log_entry.get('actor', '')
                message = log_entry.get('message', '')
                
                if agent_name.lower() in actor.lower():
                    # Try to extract address from message
                    if 'started' in message.lower() and 'agent' in message.lower():
                        # Look for address pattern
                        import re
                        # Pattern for agent addresses (fetch addresses)
                        address_pattern = r'fetch1[a-z0-9]{38}'
                        match = re.search(address_pattern, message)
                        if match:
                            return match.group(0)
        
        return None
    except Exception:
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    yield
    # Shutdown - cleanup agent processes
    if agent_state.judge_process:
        agent_state.judge_process.terminate()
    if agent_state.target_process:
        agent_state.target_process.terminate()
    if agent_state.red_team_process:
        agent_state.red_team_process.terminate()


# Initialize FastAPI app
app = FastAPI(
    title="0xGuard Agent API",
    description="API for managing 0xGuard agents lifecycle",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/agents/start", response_model=StartAgentsResponse, tags=["Agents"])
async def start_agents(request: StartAgentsRequest):
    """
    Start all three agents (Judge, Target, Red Team)
    
    Args:
        request: StartAgentsRequest with targetAddress and intensity
        
    Returns:
        StartAgentsResponse with agent addresses and status
    """
    # Check if agents are already running
    if agent_state.judge_process and agent_state.judge_process.poll() is None:
        return StartAgentsResponse(
            success=False,
            message="Agents are already running. Stop them first before starting new ones.",
            error="Agents already running"
        )
    
    try:
        agent_dir = Path(__file__).parent
        python_executable = sys.executable
        
        # Store configuration
        agent_state.target_address_config = request.targetAddress
        agent_state.intensity = request.intensity
        agent_state.started_at = datetime.now()
        
        # Start Judge agent first (needs to be running first)
        print(f"Starting Judge agent...")
        judge_script = agent_dir / "run_judge.py"
        agent_state.judge_process = subprocess.Popen(
            [python_executable, str(judge_script)],
            cwd=str(agent_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=os.environ.copy(),
            text=True
        )
        
        # Wait a moment for judge to initialize and read address from stdout
        await asyncio.sleep(3)
        
        # Try to get judge address from stdout or logs
        judge_address = None
        if agent_state.judge_process.stdout:
            try:
                line = agent_state.judge_process.stdout.readline()
                if "Judge agent started:" in line:
                    import re
                    address_match = re.search(r'fetch1[a-z0-9]{38}', line)
                    if address_match:
                        judge_address = address_match.group(0)
            except:
                pass
        
        if not judge_address:
            judge_address = get_agent_address_from_logs("judge") or "fetch1..."  # Fallback
        
        agent_state.judge_address = judge_address
        
        # Start Target agent (needs judge address)
        print(f"Starting Target agent...")
        target_script = agent_dir / "run_target.py"
        env = os.environ.copy()
        env["JUDGE_ADDRESS"] = judge_address
        agent_state.target_process = subprocess.Popen(
            [python_executable, str(target_script)],
            cwd=str(agent_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True
        )
        
        # Wait a moment for target to initialize
        await asyncio.sleep(3)
        
        # Try to get target address
        target_address = None
        if agent_state.target_process.stdout:
            try:
                line = agent_state.target_process.stdout.readline()
                if "Target agent started:" in line:
                    import re
                    address_match = re.search(r'fetch1[a-z0-9]{38}', line)
                    if address_match:
                        target_address = address_match.group(0)
            except:
                pass
        
        if not target_address:
            target_address = get_agent_address_from_logs("target") or "fetch1..."  # Fallback
        
        agent_state.target_address = target_address
        
        # Start Red Team agent (needs target and judge addresses)
        print(f"Starting Red Team agent...")
        red_team_script = agent_dir / "run_red_team.py"
        env = os.environ.copy()
        env["TARGET_ADDRESS"] = target_address
        env["JUDGE_ADDRESS"] = judge_address
        agent_state.red_team_process = subprocess.Popen(
            [python_executable, str(red_team_script)],
            cwd=str(agent_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True
        )
        
        # Wait a moment for red team to initialize
        await asyncio.sleep(3)
        
        # Try to get red team address
        red_team_address = None
        if agent_state.red_team_process.stdout:
            try:
                line = agent_state.red_team_process.stdout.readline()
                if "Red Team agent started:" in line:
                    import re
                    address_match = re.search(r'fetch1[a-z0-9]{38}', line)
                    if address_match:
                        red_team_address = address_match.group(0)
            except:
                pass
        
        if not red_team_address:
            red_team_address = get_agent_address_from_logs("red_team") or "fetch1..."  # Fallback
        
        agent_state.red_team_address = red_team_address
        
        # Update state
        agent_state.judge_address = judge_address
        agent_state.target_address = target_address
        agent_state.red_team_address = red_team_address
        
        return StartAgentsResponse(
            success=True,
            message="All agents started successfully",
            agents={
                "judge": {
                    "address": judge_address,
                    "port": 8002,
                    "status": "running"
                },
                "target": {
                    "address": target_address,
                    "port": 8000,
                    "status": "running"
                },
                "red_team": {
                    "address": red_team_address,
                    "port": 8001,
                    "status": "running"
                }
            }
        )
        
    except Exception as e:
        # Cleanup on error
        if agent_state.judge_process:
            agent_state.judge_process.terminate()
        if agent_state.target_process:
            agent_state.target_process.terminate()
        if agent_state.red_team_process:
            agent_state.red_team_process.terminate()
        
        return StartAgentsResponse(
            success=False,
            message=f"Failed to start agents: {str(e)}",
            error=str(e)
        )


@app.get("/api/agents/status", response_model=AgentsStatusResponse, tags=["Agents"])
async def get_agents_status():
    """
    Get status of all running agents
    
    Returns:
        AgentsStatusResponse with status of each agent
    """
    judge_health = await check_process_health(agent_state.judge_process)
    target_health = await check_process_health(agent_state.target_process)
    red_team_health = await check_process_health(agent_state.red_team_process)
    
    # Try to get addresses from logs if not already stored
    if not agent_state.judge_address:
        agent_state.judge_address = get_agent_address_from_logs("judge")
    if not agent_state.target_address:
        agent_state.target_address = get_agent_address_from_logs("target")
    if not agent_state.red_team_address:
        agent_state.red_team_address = get_agent_address_from_logs("red_team")
    
    return AgentsStatusResponse(
        judge=AgentStatus(
            is_running=judge_health != "down",
            port=8002,
            address=agent_state.judge_address,
            last_seen=agent_state.started_at.isoformat() if agent_state.started_at else None,
            health_status=judge_health
        ),
        target=AgentStatus(
            is_running=target_health != "down",
            port=8000,
            address=agent_state.target_address,
            last_seen=agent_state.started_at.isoformat() if agent_state.started_at else None,
            health_status=target_health
        ),
        red_team=AgentStatus(
            is_running=red_team_health != "down",
            port=8001,
            address=agent_state.red_team_address,
            last_seen=agent_state.started_at.isoformat() if agent_state.started_at else None,
            health_status=red_team_health
        ),
        started_at=agent_state.started_at.isoformat() if agent_state.started_at else None
    )


@app.post("/api/agents/stop", tags=["Agents"])
async def stop_agents():
    """
    Stop all running agents
    
    Returns:
        Success message
    """
    stopped = []
    
    if agent_state.judge_process and agent_state.judge_process.poll() is None:
        agent_state.judge_process.terminate()
        agent_state.judge_process.wait(timeout=5)
        stopped.append("judge")
    
    if agent_state.target_process and agent_state.target_process.poll() is None:
        agent_state.target_process.terminate()
        agent_state.target_process.wait(timeout=5)
        stopped.append("target")
    
    if agent_state.red_team_process and agent_state.red_team_process.poll() is None:
        agent_state.red_team_process.terminate()
        agent_state.red_team_process.wait(timeout=5)
        stopped.append("red_team")
    
    # Reset state
    agent_state.judge_process = None
    agent_state.target_process = None
    agent_state.red_team_process = None
    agent_state.judge_address = None
    agent_state.target_address = None
    agent_state.red_team_address = None
    agent_state.started_at = None
    
    return {
        "success": True,
        "message": f"Stopped agents: {', '.join(stopped) if stopped else 'none were running'}",
        "stopped": stopped
    }


def main():
    """Run the API server"""
    port = int(os.getenv("AGENT_API_PORT", "8003"))
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload for production
        log_level="info",
    )


if __name__ == "__main__":
    main()

