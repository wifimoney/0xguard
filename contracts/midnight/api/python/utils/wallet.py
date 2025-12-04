"""
Wallet utilities for Midnight Network
"""

import json
import subprocess
import asyncio
from typing import Dict, List, Any, Optional
from pathlib import Path


class WalletUtils:
    """Utilities for interacting with Midnight wallet"""

    def __init__(self, api_root: Path):
        """
        Initialize wallet utilities

        Args:
            api_root: Root directory of the API (where src/ folder is located)
        """
        self.api_root = api_root
        # tsx is in the root workspace node_modules (/Users/godson/Desktop/0xguard/node_modules)
        self.tsx_bin = "/usr/bin/tsx"

    async def _run_ts_script(self, script_path: str) -> Dict[str, Any]:
        """
        Run a TypeScript script file and return JSON output

        Args:
            script_path: Path to the TypeScript file to execute (relative to api_root)

        Returns:
            Parsed JSON output from the script
        """
        full_path = self.api_root / script_path

        process = await asyncio.create_subprocess_exec(
            str(self.tsx_bin),
            str(full_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(self.api_root),
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            raise RuntimeError(f"Script failed: {stderr.decode()}")

        return json.loads(stdout.decode())

    async def get_balance(self) -> Dict[str, Any]:
        """
        Get wallet balance

        Returns:
            Dictionary containing balance information:
            {
                "address": str,
                "balances": Dict[str, int],
                "available_coins": int,
                "pending_coins": int,
                "synced": bool
            }
        """
        return await self._run_ts_script("ts/scripts/get-balance.ts")

    async def get_transaction_history(self) -> List[Dict[str, Any]]:
        """
        Get wallet transaction history

        Returns:
            List of transactions with details
        """
        script = """
import "dotenv/config";
import { createWalletProviders, getWalletCredentials } from "./src/wallet-provider.js";
import { getConfig } from "./src/config.js";
import * as Rx from "rxjs";

async function getTxHistory() {
  const config = getConfig("testnet");
  config.setNetworkId();
  const credentials = getWalletCredentials();
  const { wallet, address } = await createWalletProviders(config, credentials);

  await new Promise(resolve => setTimeout(resolve, 5000));

  const state = await Rx.firstValueFrom(wallet.state());

  const transactions = state.transactionHistory.map((tx) => ({
    ...tx,
    // Convert BigInt to string for JSON serialization
  }));

  console.log(JSON.stringify({
    address,
    transaction_count: state.transactionHistory.length,
    transactions: JSON.parse(JSON.stringify(transactions, (k, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))
  }));

  process.exit(0);
}

getTxHistory().catch(error => {
  console.error(JSON.stringify({ error: error.message }));
  process.exit(1);
});
"""
        return await self._run_ts_script(script)

    async def query_transaction(
        self, tx_id: str, search_type: str = "hash"
    ) -> Optional[Dict[str, Any]]:
        """
        Query a transaction by hash or identifier

        Args:
            tx_id: Transaction hash or identifier
            search_type: "hash" or "identifier"

        Returns:
            Transaction details if found, None otherwise
        """
        script = f"""
import "dotenv/config";
import {{ getConfig }} from "./src/config.js";

async function queryTransaction() {{
  const config = getConfig("testnet");
  const indexerUrl = config.indexer;
  const txId = "{tx_id}";

  const query = `
    query GetTransaction($hash: String!) {{
      transactions(offset: {{hash: $hash}}) {{
        hash
        protocolVersion
        applyStage
        identifiers
        block {{
          height
          timestamp
          hash
        }}
      }}
    }}
  `;

  const response = await fetch(indexerUrl, {{
    method: "POST",
    headers: {{ "Content-Type": "application/json" }},
    body: JSON.stringify({{
      query,
      variables: {{ hash: txId }}
    }})
  }});

  const data = await response.json();

  if (data.data?.transactions) {{
    console.log(JSON.stringify({{
      found: true,
      transaction: data.data.transactions
    }}));
  }} else {{
    console.log(JSON.stringify({{ found: false }}));
  }}

  process.exit(0);
}}

queryTransaction().catch(error => {{
  console.error(JSON.stringify({{ error: error.message }}));
  process.exit(1);
}});
"""
        return await self._run_ts_script(script)

    async def get_address(self) -> str:
        """
        Get the wallet address

        Returns:
            Midnight address string
        """
        result = await self._run_ts_script("ts/scripts/get-address.ts")
        return result["address"]

    async def check_network_health(self) -> Dict[str, Any]:
        """
        Check Midnight network health

        Returns:
            Network health statistics
        """
        return await self._run_ts_script("ts/scripts/check-health.ts")
