# 🌱 B-Carbon

**A decentralized platform for managing, verifying, and trading tokenized carbon credits.**

Live App: [https://decentralized-carbon-credit.vercel.app/](https://decentralized-carbon-credit.vercel.app/)  
GitHub Repo: [github.com/arrnaya/BCarbon-base44](https://github.com/arrnaya/BCarbon-base44)

---

## 🌍 Overview

**B-Carbon** is a blockchain-powered carbon credit registry and marketplace. It allows project developers/issuers to tokenize carbon credits, undergo validation and verification, and sell their carbon offsets on-chain — all while ensuring transparency, immutability, and auditability.

The platform combines smart contracts, decentralized governance, and user-friendly interfaces to build trust and accessibility in voluntary carbon markets.

---

## 🔧 Features

- **Carbon Project Registry:**  
  Register afforestation, reforestation, renewable, or carbon avoidance projects.

- **On-Chain Governance:**  
  Validators (VVBs) validate and verify projects using decentralized governance via smart contracts.

- **Tokenized Carbon Credits (BCO2):**  
  Credits are issued as ERC-1155 tokens with metadata including vintage, permanence, and project details.

- **Marketplace:**  
  Trade carbon credits using RUSD, a mock stablecoin for testnet. Support for listings, sales, and credit retirement.

- **Certificates & Metadata:**  
  Minted and retired credits generate traceable, verifiable certificates.

- **Role Management:**  
  Project developers, VVBs (validators), governance admins all have distinct on-chain roles.

---

## ⚙️ Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| **Frontend**| React, TailwindCSS, shadcn/ui            |
| **Contracts** | Solidity (ERC1155, Governance, Marketplace, Registry) |
| **Backend (Legacy)** | Deno (via base44 platform) |
| **Blockchain** | EVM-compatible network (local/testnet) |
| **Dev Tools** | Foundry, Forge, Hardhat                |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/arrnaya/BCarbon-base44.git
cd BCarbon-base44
```
2. Install Frontend Dependencies
```bash
cd frontend
npm install
npm run dev
```
Visit: http://localhost:3000

3. Run Smart Contract Tests (Foundry)
```bash
forge install
forge test -vv
```
4. Deploy Contracts
Configure .env and RPC settings for your testnet (e.g., BSC Testnet, Polygon Mumbai), then:

```bash
forge script script/Deploy.s.sol --rpc-url <YOUR_RPC_URL> --private-key <YOUR_KEY> --broadcast
```
## 🧱 Smart Contracts
### The smart contracts are split into modular components:

- BCO2.sol – ERC1155 token for carbon credits

- CarbonCreditGovernance.sol – Handles project validation/verification and approvals

- ProjectData.sol – Stores registered project data

- ProjectManager.sol – Interfaces for project owners

- ProjectFactory.sol – Deploys new BCO2 contracts per project

- Marketplace.sol – Allows trading and retirement of credits

All contracts are found in the src/ directory.

## 🧪 Test Coverage
Foundry is used for unit testing all critical contracts. Run:

```bash
forge test -vv
```
## 🧾 Carbon Credit Workflow

1. **Register Project** →
   Issuer submits project details via ProjectManager.

2. **Validation & Verification** →
   VVBs validate/verify project on-chain via governance.

3. **Credit Issuance** →
   Governance contract approves and issues credits to project contract.

4. **Minting** →
   Users can mints carbon credits using RUSD stablecoin.

5. **Retiring** →
   Buyers retire credits to claim a certificate of carbon offset.

6. **Listing & Sale** →
   Credits are listed by users on the marketplace for sale.

## 🧑‍💼 Roles
- Owner / Admin – Manages global governance

- Project Developer/Issuers – Registers and manages carbon projects

- VVB (Validator/Verifier Body) – Validates/Verifies projects

- Buyer – Purchases and retires carbon credits

## 📦 Future Roadmap

🔐 Integrate real-world VVB identity verification

🌐 IPFS or Arweave metadata hosting for certificates

🔁 Cross-chain bridging of credits

💸 DeFi staking and insurance for carbon assets

✅ On-chain certificate registry with QR code validation

## 📜 License

This project is licensed under the MIT License.
