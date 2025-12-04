/**
 * 0xGuard API - Main Contract Interaction Layer
 */

import { Contract, ledger, type Ledger, type Witnesses } from "../../../build/contract/index.cjs";
import { witnesses, type AuditPrivateState } from "../../../src/witnesses.js";
import { deployContract, findDeployedContract, type ContractProviders } from "@midnight-ntwrk/midnight-js-contracts";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { getLedgerNetworkId, getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { createBalancedTx } from "@midnight-ntwrk/midnight-js-types";
import { Transaction } from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import type { Logger } from "pino";
import type { Config } from "./config.js";
import { createWalletProviders, getWalletCredentials } from "./wallet-provider.js";
import * as Rx from "rxjs";
import type {
  SubmitAuditRequest,
  SubmitAuditResponse,
  QueryAuditRequest,
  QueryAuditResponse,
} from "./types.js";


export class AuditVerifierAPI {
  private contract: Contract<AuditPrivateState>;
  private deployedContract: any;
  private providers: any;
  private logger: Logger;
  private _contractAddress: string = "";

  private constructor(providers: any, logger: Logger) {
    this.contract = new Contract<AuditPrivateState>(witnesses);
    this.providers = providers;
    this.logger = logger;
  }

  static async deploy(config: Config, logger: Logger): Promise<AuditVerifierAPI> {
    logger.info("Setting up wallet and providers...");

    const credentials = getWalletCredentials();
    const result = await createWalletProviders(
      {
        indexer: config.indexer,
        indexerWS: config.indexerWS,
        node: config.node,
        proofServer: config.proofServer,
        networkId: config.networkId,
      },
      credentials
    );
    const wallet = result.wallet;

    logger.info(`✅ Wallet initialized - Address: ${result.address}`);

    logger.info("Waiting for wallet to sync...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create proper wallet provider with transaction serialization (per Midnight docs)
    const walletState = await Rx.firstValueFrom(wallet.state());
    const zswapNetworkId = getZswapNetworkId(); // Uses globally set network ID
    const walletProvider = {
      coinPublicKey: walletState.coinPublicKey,
      encryptionPublicKey: walletState.encryptionPublicKey,
      balanceTx(tx: any, newCoins: any) {
        return wallet
          .balanceTransaction(
            ZswapTransaction.deserialize(
              tx.serialize(getLedgerNetworkId()),
              zswapNetworkId
            ),
            newCoins
          )
          .then((tx: any) => wallet.proveTransaction(tx))
          .then((zswapTx: any) =>
            Transaction.deserialize(
              zswapTx.serialize(zswapNetworkId),
              getLedgerNetworkId()
            )
          )
          .then(createBalancedTx);
      },
      submitTx(tx: any) {
        return wallet.submitTransaction(tx);
      }
    };

    const providers: ContractProviders<Contract<AuditPrivateState, Witnesses<AuditPrivateState>>> = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: config.privateStateStoreName,
      }),
      publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
      zkConfigProvider: new NodeZkConfigProvider(config.zkConfigPath) as any,
      proofProvider: httpClientProofProvider(config.proofServer),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };

    const api = new AuditVerifierAPI(providers, logger);

    // Create initial private state (empty/default values for deployment)
    const initialPrivateState: AuditPrivateState = {
      exploitString: new Uint8Array(64), // Padded to 64 bytes
      riskScore: 0n,
    };

    logger.info("Deploying contract...");
    api.deployedContract = await deployContract(providers, {
      contract: api.contract,
      privateStateId: config.privateStateStoreName,
      initialPrivateState,
    });

    const address = api.deployedContract.deployTxData?.public.contractAddress;
    api._contractAddress = address;
    logger.info({ address }, "Contract deployed");

    return api;
  }

  static async join(
    config: Config,
    contractAddress: string,
    logger: Logger,
    useWallet: boolean = false
  ): Promise<AuditVerifierAPI> {
    logger.info({ contractAddress }, "Setting up providers...");

    let walletProvider: any;

    if (useWallet) {
      const credentials = getWalletCredentials();
      const result = await createWalletProviders(
        {
          indexer: config.indexer,
          indexerWS: config.indexerWS,
          node: config.node,
          proofServer: config.proofServer,
          networkId: config.networkId,
        },
        credentials
      );
      const wallet = result.wallet;

      // Create proper wallet provider with transaction serialization
      const walletState = await Rx.firstValueFrom(wallet.state());
      const zswapNetworkId = getZswapNetworkId(); // Uses globally set network ID
      walletProvider = {
        coinPublicKey: walletState.coinPublicKey,
        encryptionPublicKey: walletState.encryptionPublicKey,
        balanceTx(tx: any, newCoins: any) {
          return wallet
            .balanceTransaction(
              ZswapTransaction.deserialize(
                tx.serialize(getLedgerNetworkId()),
                zswapNetworkId
              ),
              newCoins
            )
            .then((tx: any) => wallet.proveTransaction(tx))
            .then((zswapTx: any) =>
              Transaction.deserialize(
                zswapTx.serialize(zswapNetworkId),
                getLedgerNetworkId()
              )
            )
            .then(createBalancedTx);
        },
        submitTx(tx: any) {
          return wallet.submitTransaction(tx);
        }
      };
    }

    const providers: ContractProviders<Contract<AuditPrivateState, Witnesses<AuditPrivateState>>> = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: config.privateStateStoreName,
      }),
      publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
      zkConfigProvider: new NodeZkConfigProvider(config.zkConfigPath) as any,
      proofProvider: httpClientProofProvider(config.proofServer),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };

    const api = new AuditVerifierAPI(providers, logger);

    logger.info("Finding contract...");

    // Get or create initial private state (per Midnight SDK pattern)
    const existingPrivateState = await providers.privateStateProvider.get(config.privateStateStoreName);
    const initialPrivateState: AuditPrivateState = existingPrivateState ?? {
      exploitString: new Uint8Array(64),
      riskScore: 0n,
    };

    api.deployedContract = await findDeployedContract(providers, {
      contract: api.contract,
      contractAddress: contractAddress,
      privateStateId: config.privateStateStoreName,
      initialPrivateState  // Must pass to findDeployedContract, not set separately!
    });
    api._contractAddress = contractAddress;

    logger.info("Connected to contract");
    return api;
  }

  async submitAudit(request: SubmitAuditRequest): Promise<SubmitAuditResponse> {
    try {
      this.logger.info({ auditId: request.auditId }, "Submitting audit with ZK proof...");

      const auditId = this.hexToBytes(request.auditId);
      const auditorAddr = this.hexToBytes(request.auditorAddr);

      // Pad exploit string to 64 bytes
      const exploitBytes = this.hexToBytes(request.witness.exploitString);
      const exploitString = new Uint8Array(64);
      exploitString.set(exploitBytes.slice(0, 64));

      // Debug logging
      this.logger.info({
        auditIdLength: auditId.length,
        auditorAddrLength: auditorAddr.length,
        exploitStringLength: exploitString.length,
        threshold: request.threshold,
        riskScore: request.witness.riskScore.toString()
      }, "Prepared parameters for submitAudit");

      // TEST: Try calling without manually setting private state
      // Maybe witness functions auto-read from provider during transaction?
      this.logger.info("Calling callTx.submitAudit WITHOUT setting private state first...");

      const txData = await this.deployedContract.callTx.submitAudit(
        auditId,
        auditorAddr,
        BigInt(request.threshold)  // Convert to bigint for Uint<64>
      );

      this.logger.info({ txHash: txData.public.txHash }, "Transaction submitted successfully");

      this.logger.info(
        {
          transactionId: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
        "Audit submitted with ZK proof"
      );

      const state = await this.providers.publicDataProvider.queryContractState(this._contractAddress);
      const ledgerState = ledger(state.data);

      return {
        success: true,
        transactionId: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
        ledgerState,
      };
    } catch (error) {
      this.logger.error({
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name
      }, "Failed to submit audit");

      const state = await this.providers.publicDataProvider.queryContractState(this._contractAddress);
      const ledgerState = ledger(state.data);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        ledgerState,
      };
    }
  }

  async queryAudit(request: QueryAuditRequest): Promise<QueryAuditResponse> {
    try {
      const auditId = this.hexToBytes(request.auditId);
      const state = await this.providers.publicDataProvider.queryContractState(this._contractAddress);
      const ledgerState = ledger(state.data);

      // Check if audit exists in is_verified map
      const found = ledgerState.is_verified.member(auditId);

      if (!found) {
        return { found: false };
      }

      const proofHash = ledgerState.proofs.lookup(auditId);
      const isVerified = ledgerState.is_verified.lookup(auditId);

      return {
        found: true,
        auditId: request.auditId,
        proofHash: proofHash ? this.bytesToHex(proofHash) : undefined,
        isVerified,
      };
    } catch (error) {
      this.logger.error({ error }, "Failed to query audit");
      return { found: false };
    }
  }

  async getLedgerState(): Promise<Ledger> {
    const state = await this.providers.publicDataProvider.queryContractState(this._contractAddress);
    return ledger(state.data);
  }

  get contractAddress(): string {
    return this._contractAddress || this.deployedContract.deployTxData?.public.contractAddress || "";
  }

  private hexToBytes(hex: string): Uint8Array {
    const cleaned = hex.replace(/^0x/, "");
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

