# Blockchain Technology — Practical Lab Submission

**Course:** Blockchain Technology — Practical Lab, Department of Computer Science, School of Technology, Doon University
**Student:** Shreyas Lingwal
**Assignment:** Introduction to Ethereum, Smart Contracts and DApp Development

## Selected network

| Item | Value |
| --- | --- |
| Network | Hardhat local development network (no real cryptocurrency) |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Voting contract address (verified local deployment) | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| SimpleStorage contract address (verified local deployment) | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Solidity version | 0.8.20 |
| Frontend library | ethers.js v6 (CDN) |

## Project layout

```
contracts/SimpleStorage.sol   Part 2/3 storage contract
contracts/Voting.sol          Part 4 voting contract
frontend/index.html           DApp page
frontend/style.css            DApp styling
frontend/app.js               Wallet connection, voting, error handling (ethers.js)
scripts/deploy.js             Deploys both contracts and prints addresses/tx hashes/gas
scripts/run-experiments.js    Part 6 experiments A–D with full logs
test-results/                 Compilation, deployment and experiment logs (evidence)
screenshots/                  Screenshots of compilation, deployment, voting experiments and the DApp interface (embedded in the report)
hardhat.config.js             Network configuration (localhost Chain ID 31337, Sepolia stub)
Lab_Report.docx               Full written report: answers, observations, transaction details
```

## Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension (for the DApp demo)
- No real ETH is needed or used anywhere in this project.

## Step 1 — Install and compile

```bash
npm install
npx hardhat compile
```

Expected output: `Compiled 2 Solidity files successfully (evm target: paris).`

## Step 2 — Start the local blockchain (terminal 1)

```bash
npx hardhat node
```

This starts a local Ethereum-compatible chain (Chain ID 31337) with 20
pre-funded test accounts of 10,000 test ETH each. Leave it running.

## Step 3 — Deploy the contracts (terminal 2)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The script deploys SimpleStorage with initial value 42, calls
`setNumber(100)`, then deploys Voting with three candidates
(Alice Sharma, Rohan Verma, Priya Nair). It prints both contract addresses,
deployment transaction hashes and gas used. Full output of a verified run is
in `test-results/deployment-localhost-log.txt`.

## Step 4 — Run the Part 6 experiments (optional, terminal 2)

```bash
npx hardhat run scripts/run-experiments.js
```

Runs Experiment A (successful vote), B (duplicate vote — reverts with
"You have already voted"), C (vote from a second account — accepted) and
D (invalid candidate id 99 — reverts with "Invalid candidate ID"), printing
transaction hashes, gas used, events and vote counts after each step.
Verified output: `test-results/experiments-log.txt`.

## Step 5 — Run the DApp

1. Add the local network to MetaMask: **Settings → Networks → Add network** —
   Network name `Hardhat Local`, RPC URL `http://127.0.0.1:8545`,
   Chain ID `31337`, Currency symbol `ETH`.
2. Import a test account: copy a private key printed by `npx hardhat node`
   in terminal 1 and use **MetaMask → Import account**. 
3. Serve the frontend:

   ```bash
   cd frontend
   python3 -m http.server 8000
   ```

4. Open `http://localhost:8000` in the browser with MetaMask.
5. Click **Connect MetaMask Wallet** — the account address and network are
   displayed, candidates and vote counts are loaded from the contract.
6. Click **Vote** next to a candidate and confirm in MetaMask. The status
   area shows the transaction hash, confirmation block and gas used, and the
   results refresh from the contract. Trying to vote again shows
   "You have already voted" and the button stays disabled for that address.
   Switch to a second imported test account in MetaMask to vote again.

## Alternative: deploy with Remix IDE instead of Hardhat

1. Open https://remix.ethereum.org, create `SimpleStorage.sol` and
   `Voting.sol` with the source in `contracts/`.
2. In **Solidity Compiler**, select 0.8.20 and compile both files.
3. In **Deploy & Run Transactions**, choose environment **Injected Provider –
   MetaMask** (with MetaMask on the Hardhat Local network above) or
   **Remix VM** for a quick in-browser test.
4. Deploy SimpleStorage with initial value `42`; deploy Voting (no arguments).
5. Copy the deployed Voting address into `frontend/app.js`.

