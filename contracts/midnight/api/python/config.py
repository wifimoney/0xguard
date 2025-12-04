"""
Configuration for 0xGuard Midnight API
"""
import os
from typing import Literal
from dotenv import load_dotenv

load_dotenv()

NetworkType = Literal["testnet", "mainnet"]


class Config:
    """Configuration for Midnight Network"""

    def __init__(self, network: NetworkType = "testnet"):
        self.network = network
        self.mnemonic = os.getenv("MIDNIGHT_MNEMONIC")

        if not self.mnemonic:
            raise ValueError("MIDNIGHT_MNEMONIC not found in environment variables")

        # Network endpoints
        if network == "testnet":
            self.indexer = "https://indexer.testnet-02.midnight.network/api/v1/graphql"
            self.indexer_ws = "wss://indexer.testnet-02.midnight.network/api/v1/graphql"
            self.node = "https://rpc.testnet-02.midnight.network"
            self.proof_server = os.getenv("MIDNIGHT_PROOF_SERVER", "http://127.0.0.1:6300")
            self.network_id = "testnet-02"
        else:
            raise NotImplementedError("Mainnet configuration not yet implemented")

    def to_dict(self):
        """Convert config to dictionary"""
        return {
            "network": self.network,
            "indexer": self.indexer,
            "indexer_ws": self.indexer_ws,
            "node": self.node,
            "proof_server": self.proof_server,
            "network_id": self.network_id,
        }


def get_config(network: NetworkType = "testnet") -> Config:
    """Get configuration for specified network"""
    return Config(network)
