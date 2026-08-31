# EVM Smart Contracts: FaceEvidenceRegistry

This folder contains the Solidity smart contract and deployment scripts for deploying the FaceLedger evidence registry on Ethereum, Polygon, or local EVM networks.

## Smart Contract Specification

### `FaceEvidenceRegistry.sol`
- **Solidity Version**: `^0.8.20`
- **Network Compatibility**: Ethereum Sepolia, Polygon Amoy, Arbitrum, Hardhat, Anvil, Ganache
- **Core Functions**:
  - `recordEvidence(...)`: Store record ID, post URL, author, raw image SHA-256 hash, 128-d face embedding digest, and Merkle root on-chain.
  - `verifyEvidence(...)`: Perform cryptographic comparison of candidate hashes against on-chain state.
  - `getEvidence(...)`: Retrieve on-chain metadata for any record ID.

## Deployment with Hardhat / Foundry / Remix

### Option 1: Remix IDE
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Copy and paste `FaceEvidenceRegistry.sol`.
3. Compile with Solidity Compiler `0.8.20`.
4. Deploy using "Injected Provider - MetaMask" to Sepolia or Polygon Amoy.

### Option 2: Hardhat
```bash
npx hardhat run contracts/deploy.py --network sepolia
```
