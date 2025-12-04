# 0xGuard Midnight API

HTTP API for agents to interact with the AuditVerifier Midnight Network contract and generate ZK proofs.


## Architecture Overview

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Agent (Judge)  │  HTTP   │   Python     │  ZK     │  Proof Server   │
│                 │────────>│   FastAPI    │────────>│   (Docker)      │
│  Python/Node    │         │   (Port 8000)│  Proof  │   Port 6300     │
└─────────────────┘         └──────────────┘         └─────────────────┘
                                    │
                                    │ RPC
                                    ▼
                            ┌───────────────┐
                            │   Midnight    │
                            │   Testnet     │
                            └───────────────┘





Here’s an updated version of your README with the **Swagger link** added and a few clarifying details:

```markdown
# 0xGuard Midnight API

HTTP API for agents to interact with the AuditVerifier Midnight Network contract and generate ZK proofs.

## Architecture Overview

```

┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Agent (Judge)  │  HTTP   │   Python     │  ZK     │  Proof Server   │
│                 │────────>│   FastAPI    │────────>│   (Docker)      │
│  Python/Node    │         │   (Port 8000)│  Proof  │   Port 6300     │
└─────────────────┘         └──────────────┘         └─────────────────┘
│
│ RPC
▼
┌───────────────┐
│   Midnight    │
│   Testnet     │
└───────────────┘

````


## Running the API

```bash

# Run container
```bash
docker run -d \
  --name midnight_api \
  -p 8000:8000 \
  -e MIDNIGHT_MNEMONIC="your 24 word mnemonic phrase here" \
  -e MIDNIGHT_ENVIRONMENT="testnet" \
  -e MIDNIGHT_INDEXER="https://indexer.testnet-02.midnight.network/api/v1/graphql" \
  -e MIDNIGHT_INDEXER_WS="wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws" \
  -e MIDNIGHT_NODE="https://rpc.testnet-02.midnight.network" \
  -e PORT="8000" \
  ghcr.io/<your-org>/midnight-api:latest
```

# API will be accessible at http://<IP>:8000
````

## Wallet Utilities

The API provides wallet-related endpoints for interacting with the Midnight .env wallet:

* `/wallet/address` – Get wallet address
* `/wallet/balance` – Get wallet balance
* `/wallet/transactions` – Get transaction history
* `/wallet/transaction/{tx_id}` – Query a specific transaction

## Contract Endpoints

* `/api/init` – Deploy or join a contract
* `/api/submit-audit` – Submit audit proof
* `/api/query-audit` – Query audit status
* `/api/ledger` – Get current ledger state




