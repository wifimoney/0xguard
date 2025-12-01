
import {
    type CircuitContext,
    sampleContractAddress,
    constructorContext,
  } from "@midnight-ntwrk/compact-runtime";
  import {
    QueryContext,
  } from "@midnight-ntwrk/onchain-runtime";
  import {
    Contract,
    type Ledger,
    ledger,
  } from "../../build/contract/index.cjs";
  import { type AuditPrivateState, witnesses } from "../witnesses.js";
  
  /**
   * Serves as a testbed to exercise the AuditVerifier contract in tests
   */
  export class AuditVerifierSimulator {
    readonly contract: Contract<AuditPrivateState>;
    circuitContext: CircuitContext<AuditPrivateState>;
  
    constructor(exploitString: Uint8Array, riskScore: bigint) {
      this.contract = new Contract<AuditPrivateState>(witnesses);
      
      const privateState: AuditPrivateState = {
        exploitString,
        riskScore,
      };

      const {
        currentPrivateState,
        currentContractState,
        currentZswapLocalState,
      } = this.contract.initialState(
        constructorContext(privateState, "0".repeat(64))
      );

      this.circuitContext = {
        currentPrivateState,
        currentZswapLocalState,
        originalState: currentContractState,
        transactionContext: new QueryContext(
          currentContractState.data,
          sampleContractAddress()
        ),
      };
    }
  
    /**
     * Switch to a different private state (e.g., different exploit)
     */
    public switchPrivateState(
      exploitString: Uint8Array,
      riskScore: bigint
    ) {
      this.circuitContext.currentPrivateState = {
        exploitString,
        riskScore,
      };
    }
  
    /**
     * Get current public ledger state
     */
    public getLedger(): Ledger {
      return ledger(this.circuitContext.transactionContext.state);
    }
  
    /**
     * Get current private state
     */
    public getPrivateState(): AuditPrivateState {
      return this.circuitContext.currentPrivateState;
    }
  
    /**
     * Submit an audit with ZK proof
     */
    public submitAudit(
      auditId: Uint8Array,
      auditorId: Uint8Array,
      threshold: bigint
    ): Ledger {
      // Execute the submitAudit circuit
      this.circuitContext = this.contract.impureCircuits.submitAudit(
        this.circuitContext,
        auditId,
        auditorId,
        threshold
      ).context;
  
      return ledger(this.circuitContext.transactionContext.state);
    }
  }