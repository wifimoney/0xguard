/**
 * Wallet Provider Configuration for 0xGuard
 * Creates wallet from mnemonic phrase or hex seed
 */

import { WalletBuilder } from "@midnight-ntwrk/wallet";
import type { Wallet, WalletState } from "@midnight-ntwrk/wallet-api";
import { getZswapNetworkId, type NetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import * as Rx from "rxjs";
import { mnemonicToSeedSync } from "bip39";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import type {
  BalancedTransaction,
  UnbalancedTransaction,
} from "@midnight-ntwrk/midnight-js-types";
import type { CoinInfo } from "@midnight-ntwrk/ledger";


const bip32 = BIP32Factory(ecc);

/**
 * Create wallet and providers from mnemonic or seed
 *
 * @param config - Network configuration
 * @param mnemonicOrSeed - 24-word mnemonic phrase or 64-char hex seed
 */
export async function createWalletProviders(
  config: {
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
    networkId: NetworkId; 
  },
  mnemonicOrSeed?: string
): Promise<{
  wallet: Wallet;
  provider: any;
  address: string;
}> {

  const isMnemonic = mnemonicOrSeed && mnemonicOrSeed.includes(" ");

  let walletSeed: string;

  if (isMnemonic) {
    console.error("Deriving Midnight wallet seed from mnemonic...");

    const seed = mnemonicToSeedSync(mnemonicOrSeed!);
    const root = bip32.fromSeed(seed);

    const path = "m/44'/2400'/0'/0/0";
    const child = root.derivePath(path);

    if (!child.privateKey) {
      throw new Error("Failed to derive private key from mnemonic");
    }
    walletSeed = Buffer.from(child.privateKey).toString("hex");
    console.error(`Derived using path: ${path}`);
  } else {
    walletSeed = mnemonicOrSeed || generateRandomSeed();
    if (!mnemonicOrSeed) {
      console.error("Generated new random seed (save this for reuse!):");
      console.error(`   ${walletSeed}`);
    }
  }

  console.error("Initializing wallet...");

  // Note: setNetworkId must be called before this function
  const wallet = await WalletBuilder.build(
    config.indexer,
    config.indexerWS,
    config.proofServer,
    config.node,
    walletSeed,
    getZswapNetworkId(), 
    "warn"
  );

  wallet.start();
  const state: WalletState = await Rx.firstValueFrom(wallet.state());
  const address = state.address;

  console.error("✅ Wallet initialized and syncing...");
  console.error(`📬 Midnight Address: ${address}`);
  const provider = await createProvider(wallet);

  return { wallet, provider, address };
}

/**
 * Create wallet/midnight provider from initialized wallet
 */
async function createProvider(wallet: Wallet): Promise<any> {
  const state: WalletState = await Rx.firstValueFrom(wallet.state());

  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,

    balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]) {
      return wallet.balanceTransaction(tx, newCoins) as any;
    },

    submitTx(tx: BalancedTransaction) {
      return wallet.submitTransaction(tx) as any;
    },
  };
}

/**
 * Generate a random 32-byte seed
 */
function generateRandomSeed(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get wallet mnemonic or seed from environment
 * Priority: MNEMONIC > SEED > throw error
 */
export function getWalletCredentials(): string {

  if (process.env.MIDNIGHT_MNEMONIC) {
    console.error("Using mnemonic from MIDNIGHT_MNEMONIC env var");
    return process.env.MIDNIGHT_MNEMONIC;
  }

  if (process.env.MIDNIGHT_WALLET_SEED) {
    console.error("Using hex seed from MIDNIGHT_WALLET_SEED env var");
    return process.env.MIDNIGHT_WALLET_SEED;
  }
  
  throw new Error(
    "No wallet credentials found. Set MIDNIGHT_MNEMONIC or MIDNIGHT_WALLET_SEED in .env file"
  );
}
