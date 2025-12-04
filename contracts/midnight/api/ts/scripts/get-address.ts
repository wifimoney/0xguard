#!/usr/bin/env tsx
/**
 * Get wallet address - Standalone script for Python API
 */
import "dotenv/config";
import { createWalletProviders } from "../src/wallet-provider.js";
import { getConfig } from "../src/config.js";

// Silence console logs from wallet-provider
const originalLog = console.log;
const originalInfo = console.info;
console.log = () => {};
console.info = () => {};

async function getAddress() {
  try {
    const config = getConfig("testnet");
    config.setNetworkId();

    const mnemonic = process.env.MIDNIGHT_MNEMONIC;
    if (!mnemonic) {
      throw new Error("MIDNIGHT_MNEMONIC not found");
    }

    const { address } = await createWalletProviders(config, mnemonic);

    // Restore console and output JSON
    console.log = originalLog;
    console.log(JSON.stringify({ address }));
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}

getAddress();
