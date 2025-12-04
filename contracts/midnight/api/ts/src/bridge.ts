/**
 * TypeScript Bridge for Python API
 *
 * This script is called by the Python FastAPI to perform contract operations
 * Usage: tsx bridge.ts <operation> <json-data>
 */

import "dotenv/config";
import { pino } from "pino";
import { promises as fs } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { AuditVerifierAPI } from "./api.js";
import { getConfig } from "./config.js";
import type { Ledger } from "../../../build/contract/index.cjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATE_FILE = join(__dirname, "../.contract-state.json");

// Direct logger output to stderr to avoid contaminating JSON stdout
const logger = pino({ level: "info" }, process.stderr);

interface BridgeResponse {
  success: boolean;
  [key: string]: any;
}

interface ContractState {
  contract_address: string;
  environment: string;
}

async function saveContractState(state: ContractState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function loadContractState(): Promise<Partial<ContractState>> {
  try {
    const data = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function serializeLedger(ledger: Ledger): any {
  return JSON.parse(
    JSON.stringify(ledger, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      if (value instanceof Uint8Array) {
        return Array.from(value)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
      if (value instanceof Map) {
        const obj: any = {};
        for (const [k, v] of value.entries()) {
          const keyStr =
            k instanceof Uint8Array
              ? Array.from(k)
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join("")
              : String(k);
          obj[keyStr] = v;
        }
        return obj;
      }
      return value;
    })
  );
}

async function handleInit(data: any): Promise<BridgeResponse> {
  const { mode, contract_address, environment } = data;

  const config = getConfig(environment || "testnet");
  config.setNetworkId();

  if (mode === "deploy") {
    const api = await AuditVerifierAPI.deploy(config, logger);
    const deployedAddress = api.contractAddress;

    // Save contract state for future operations
    await saveContractState({
      contract_address: deployedAddress,
      environment: environment || "testnet",
    });

    return {
      success: true,
      contract_address: deployedAddress,
      message: "Contract deployed successfully",
    };
  } else if (mode === "join" && contract_address) {
    const api = await AuditVerifierAPI.join(config, contract_address, logger, true);

    // Save contract state for future operations
    await saveContractState({
      contract_address: api.contractAddress,
      environment: environment || "testnet",
    });

    return {
      success: true,
      contract_address: api.contractAddress,
      message: "Connected to contract successfully",
    };
  } else {
    return {
      success: false,
      error: "Invalid mode or missing contract_address",
      message: "Failed to initialize contract",
    };
  }
}

async function handleSubmitAudit(data: any): Promise<BridgeResponse> {
  try {
    const { contract_address, environment } = await loadContractState();
    if (!contract_address) {
      return {
        success: false,
        error: "No contract initialized. Call init first.",
        ledgerState: {},
      };
    }

    const config = getConfig("testnet");
    config.setNetworkId();

    const api = await AuditVerifierAPI.join(config, contract_address, logger, true);

    const { audit_id, auditor_addr, threshold, witness } = data;

    // Python API uses snake_case, convert to camelCase for TypeScript
    const result = await api.submitAudit({
      auditId: audit_id,
      auditorAddr: auditor_addr,
      threshold: BigInt(threshold),
      witness: {
        exploitString: witness.exploit_string,  
        riskScore: BigInt(witness.risk_score),  
      },
    });

    return {
      success: result.success,
      transaction_id: result.transactionId,
      block_height: result.blockHeight ? Number(result.blockHeight) : undefined,
      error: result.error,
      ledger_state: serializeLedger(result.ledgerState),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      ledger_state: {},
    };
  }
}

async function handleQueryAudit(data: any): Promise<BridgeResponse> {
  try {
    const { contract_address, environment } = await loadContractState();
    if (!contract_address) {
      return {
        success: false,
        error: "No contract initialized. Call init first.",
      };
    }

    const config = getConfig("testnet");
    config.setNetworkId();

    const api = await AuditVerifierAPI.join(config, contract_address, logger, false);

    const result = await api.queryAudit({ auditId: data.audit_id });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      found: false,
    };
  }
}

async function handleGetLedger(data: any): Promise<BridgeResponse> {
  try {
    const { contract_address, environment } = await loadContractState();
    if (!contract_address) {
      return {
        success: false,
        error: "No contract initialized. Call init first.",
      };
    }

    const config = getConfig("testnet");
    config.setNetworkId();

    const api = await AuditVerifierAPI.join(config, contract_address, logger, false);

    const ledgerState = await api.getLedgerState();

    return {
      success: true,
      ledger_state: serializeLedger(ledgerState),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  try {
    const operation = process.argv[2];
    const dataJson = process.argv[3] || "{}";
    const data = JSON.parse(dataJson);

    let result: BridgeResponse;

    switch (operation) {
      case "init":
        result = await handleInit(data);
        break;
      case "submit_audit":
        result = await handleSubmitAudit(data);
        break;
      case "query_audit":
        result = await handleQueryAudit(data);
        break;
      case "get_ledger":
        result = await handleGetLedger(data);
        break;
      default:
        result = {
          success: false,
          error: `Unknown operation: ${operation}`,
        };
    }

    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    console.error(JSON.stringify(errorResult));
    process.exit(1);
  }
}

main();
