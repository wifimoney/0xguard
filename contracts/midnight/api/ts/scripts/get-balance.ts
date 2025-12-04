#!/usr/bin/env tsx
/**
 * Get wallet balance - Standalone script for Python API
 */
import "dotenv/config";
import { createWalletProviders } from "../src/wallet-provider.js";
import { getConfig } from "../src/config.js";
import * as Rx from "rxjs";

// Silence console logs from wallet-provider
const originalLog = console.log;
const originalInfo = console.info;
console.log = () => {};
console.info = () => {};

async function getBalance() {
  try {
    const config = getConfig("testnet");
    config.setNetworkId();

    const mnemonic = process.env.MIDNIGHT_MNEMONIC;
    if (!mnemonic) {
      throw new Error("MIDNIGHT_MNEMONIC not found");
    }

    const { wallet, address } = await createWalletProviders(
      {
        indexer: config.indexer,
        indexerWS: config.indexerWS,
        node: config.node,
        proofServer: config.proofServer,
        networkId: config.networkId,
      },
      mnemonic
    );

    // Wait for initial sync
    await new Promise(resolve => setTimeout(resolve, 3000));

    let synced = false;
    let attempts = 0;
    const maxAttempts = 40;

    while (!synced && attempts < maxAttempts) {
      const state = await Rx.firstValueFrom(wallet.state());
      const syncProgress = (state as any).syncProgress;

      // If we have balances, return them even if not fully synced
      if (state.balances && (typeof state.balances === 'object' && Object.keys(state.balances).length > 0 ||
                             state.balances instanceof Map && state.balances.size > 0)) {
        synced = true;
      }
      // Or if fully synced (ideal case)
      else if (syncProgress && syncProgress.synced) {
        synced = true;
      }

      if (synced) {

        const balances: Record<string, string> = {};
        if (state.balances) {
          // Handle both Map and object types
          if (state.balances instanceof Map) {
            for (const [token, amount] of state.balances.entries()) {
              balances[token] = (amount as bigint).toString();
            }
          } else if (typeof state.balances === 'object') {
            for (const [token, amount] of Object.entries(state.balances)) {
              balances[token] = typeof amount === 'bigint' ? amount.toString() : String(amount);
            }
          }
        }

        // Restore console and output JSON
        console.log = originalLog;
        console.log(JSON.stringify({
          address,
          balances,
          available_coins: state.availableCoins.length,
          pending_coins: state.pendingCoins.length,
          total_coins: state.coins.length,
          synced: true
        }));

        process.exit(0);
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error("Wallet failed to sync");
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}

getBalance();
