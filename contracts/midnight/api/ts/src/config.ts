/**
 * 0xGuard API Configuration
 * Manages network settings for Midnight Network
 */

import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUILD_PATH = resolve(__dirname, "../../build");

export interface Config {
  networkId: NetworkId;
  privateStateStoreName: string;
  zkConfigPath: string;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  setNetworkId(): void;
}

/**
 * Testnet Configuration
 */
export class TestnetConfig implements Config {
  networkId = NetworkId.TestNet;
  privateStateStoreName = "0xguard-testnet-state";
  zkConfigPath = BUILD_PATH;

  // Midnight Testnet endpoints
  indexer = "https://indexer.testnet-02.midnight.network/api/v1/graphql";
  indexerWS = "wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws";
  node = "https://rpc.testnet-02.midnight.network";
  proofServer = "http://127.0.0.1:6300";

  setNetworkId(): void {
    setNetworkId(this.networkId);
  }
}

/**
 * Get configuration based on environment
 */
export function getConfig(env?: "testnet"): Config {
  const environment = process.env.MIDNIGHT_ENVIRONMENT || env;

  const config = new TestnetConfig();

  if (process.env.MIDNIGHT_PROOF_SERVER) {
    config.proofServer = process.env.MIDNIGHT_PROOF_SERVER;
  }
  if (process.env.MIDNIGHT_INDEXER) {
    config.indexer = process.env.MIDNIGHT_INDEXER;
  }
  if (process.env.MIDNIGHT_INDEXER_WS) {
    config.indexerWS = process.env.MIDNIGHT_INDEXER_WS;
  }
  if (process.env.MIDNIGHT_NODE) {
    config.node = process.env.MIDNIGHT_NODE;
  }

  return config;
}
