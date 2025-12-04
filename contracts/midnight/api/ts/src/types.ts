/**
 * Type definitions for 0xGuard API
 */

import type { Contract, Ledger } from "../../../build/contract/index.cjs";
import type { AuditPrivateState } from "../../../src/witnesses.js";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import type { FoundContract } from "@midnight-ntwrk/midnight-js-contracts";


export type AuditVerifierContract = Contract<AuditPrivateState>;


export type AuditVerifierCircuitKeys = Exclude<
  keyof AuditVerifierContract["impureCircuits"],
  symbol
>;


export const auditPrivateStateKey = "auditPrivateState" as const;
export type PrivateStateId = typeof auditPrivateStateKey;


export type PrivateStates = {
  [auditPrivateStateKey]: AuditPrivateState;
};


export type AuditVerifierProviders = MidnightProviders<
  AuditVerifierCircuitKeys,
  PrivateStateId,
  PrivateStates
>;


export type DeployedAuditVerifierContract = FoundContract<AuditVerifierContract>;


export interface SubmitAuditRequest {
  auditId: string;           // 32-byte hex string
  auditorAddr: string;       // 32-byte hex string (Judge agent address)
  threshold: bigint;         // Minimum risk score required
  witness: {
    exploitString: string;   // Hex string (will be padded to 64 bytes)
    riskScore: bigint;       // Risk score value
  };
}


export interface SubmitAuditResponse {
  success: boolean;
  transactionId?: string;
  blockHeight?: bigint;
  error?: string;
  ledgerState: Ledger;
}

export interface QueryAuditRequest {
  auditId: string;
}


export interface QueryAuditResponse {
  found: boolean;
  auditId?: string;
  proofHash?: string;
  isVerified?: boolean;
}
