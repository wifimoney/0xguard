#!/usr/bin/env tsx
/**
 * Check network health - Standalone script for Python API
 */
import "dotenv/config";
import { getConfig } from "../src/config.js";

async function checkHealth() {
  try {
    const config = getConfig("testnet");
    const indexerUrl = config.indexer;

    // Get latest block
    const response = await fetch(indexerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ block { height hash timestamp } }`
      })
    });

    const data = await response.json();
    const latestBlock = data.data.block;

    // Check recent blocks for success rate
    let totalTxs = 0;
    let succeededTxs = 0;

    for (let i = 0; i < 10; i++) {
      const blockHeight = latestBlock.height - i;

      const blockResponse = await fetch(indexerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetBlock($height: Int!) {
              block(offset: {height: $height}) {
                transactions {
                  applyStage
                }
              }
            }
          `,
          variables: { height: blockHeight }
        })
      });

      const blockData = await blockResponse.json();
      if (blockData.data?.block?.transactions) {
        for (const tx of blockData.data.block.transactions) {
          totalTxs++;
          if (tx.applyStage === "SucceedEntirely") {
            succeededTxs++;
          }
        }
      }
    }

    const successRate = totalTxs > 0 ? (succeededTxs / totalTxs) * 100 : 0;

    console.log(JSON.stringify({
      latest_block: latestBlock.height,
      block_hash: latestBlock.hash,
      timestamp: latestBlock.timestamp,
      total_transactions_checked: totalTxs,
      succeeded: succeededTxs,
      failed: totalTxs - succeededTxs,
      success_rate: successRate.toFixed(2),
      healthy: successRate > 50
    }));

    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}

checkHealth();
