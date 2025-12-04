#!/usr/bin/env python3
"""
Convenience script to start the Agent API Server
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from api_server import main

if __name__ == "__main__":
    main()

