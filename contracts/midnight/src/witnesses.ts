import type { Ledger } from "../build/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

/**
 * Private state containing audit data that never goes on-chain
 */
export type AuditPrivateState = {
  readonly exploitString: Uint8Array; // Exploit payload string (up to 64 bytes)
  readonly riskScore: bigint; // Risk score as bigint (Uint<64>)
};

/**
 * Create initial private state for an audit
 */
export const createAuditPrivateState = (
  exploitString: Uint8Array,
  riskScore: bigint
): AuditPrivateState => ({
  exploitString,
  riskScore,
});

/**
 * Witness implementations - these provide private data to the ZK circuits
 * Each function returns: [newPrivateState, returnValue]
 */
export const witnesses = {
  // Provides the exploit string
  exploit_string: ({
    privateState,
  }: WitnessContext<Ledger, AuditPrivateState>): [
    AuditPrivateState,
    Uint8Array
  ] => [privateState, privateState.exploitString],

  // Provides the risk score
  risk_score: ({
    privateState,
  }: WitnessContext<Ledger, AuditPrivateState>): [
    AuditPrivateState,
    bigint
  ] => [privateState, privateState.riskScore],
};
