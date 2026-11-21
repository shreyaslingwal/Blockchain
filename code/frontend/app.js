// Decentralized Voting DApp — frontend logic (ethers.js v6)
//
// SETUP (see README.md):
// 1. Start the local node:        npx hardhat node
// 2. Deploy the contract:         npx hardhat run scripts/deploy.js --network localhost
// 3. Paste the deployed Voting contract address below.
// 4. In MetaMask, add the Hardhat network (RPC http://127.0.0.1:8545,
//    Chain ID 31337) and import one of the node's pre-funded test accounts.
//    For Sepolia instead: deploy with --network sepolia, set
//    EXPECTED_CHAIN_ID to 11155111n and paste the Sepolia address.

// ↓↓↓ REPLACE with the Voting address printed by the deploy script ↓↓↓
const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Voting address from the verified local-node deployment (see test-results/deployment-localhost-log.txt) — re-check after every fresh deploy
const EXPECTED_CHAIN_ID = 31337n; // Hardhat local node. Sepolia = 11155111n
const EXPECTED_NETWORK_NAME = "Hardhat Local (Chain ID 31337)";

// ABI of Voting.sol — copied from the compiled artifact
// (artifacts/contracts/Voting.sol/Voting.json -> "abi") after `npx hardhat compile`.
const CONTRACT_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: true, internalType: "uint256", name: "candidateId", type: "uint256" },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "candidates",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "voteCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllCandidates",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "uint256", name: "voteCount", type: "uint256" },
        ],
        internalType: "struct Voting.Candidate[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_candidateId", type: "uint256" }],
    name: "getCandidate",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "voteCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "getCandidateCount", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ internalType: "address", name: "_voter", type: "address" }],
    name: "hasVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_candidateId", type: "uint256" }],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// ---------------------------------------------------------------------------

let provider;
let signer;
let contract;
let userAddress;

const connectBtn = document.getElementById("connectBtn");
const accountInfo = document.getElementById("accountInfo");
const networkInfo = document.getElementById("networkInfo");
const candidateList = document.getElementById("candidateList");
const voterStatus = document.getElementById("voterStatus");
const statusMessage = document.getElementById("statusMessage");
const txInfo = document.getElementById("txInfo");
const refreshBtn = document.getElementById("refreshBtn");
const switchBtn = document.getElementById("switchBtn");

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status" + (type ? " " + type : "");
}

function friendlyError(err) {
  if (!err) return "Unknown error.";
  // User rejected the request in MetaMask
  if (err.code === 4001 || err.code === "ACTION_REJECTED") {
    return "You rejected the transaction in MetaMask. No vote was recorded.";
  }
  // Contract require() revert — surface the contract's own reason string
  if (err.reason) return "Transaction failed: " + err.reason;
  if (err.shortMessage) return "Transaction failed: " + err.shortMessage;
  return "Transaction failed: " + (err.message || err);
}

async function checkNetwork() {
  const network = await provider.getNetwork();
  networkInfo.textContent = `Network: Chain ID ${network.chainId}` + (network.chainId === EXPECTED_CHAIN_ID ? ` — ${EXPECTED_NETWORK_NAME} ✓` : " — WRONG NETWORK ✗");
  if (network.chainId !== EXPECTED_CHAIN_ID) {
    setStatus(`Wrong network. Please switch MetaMask to ${EXPECTED_NETWORK_NAME} — or use the switch button above.`, "error");
    switchBtn.style.display = "inline-block";
    return false;
  }
  switchBtn.style.display = "none";
  return true;
}

// Asks MetaMask to switch this site's connection to the expected network.
// If the network is not saved in MetaMask yet (error 4902), it offers to
// add it first, with the correct RPC URL and Chain ID.
async function switchToExpectedNetwork() {
  const chainIdHex = "0x" + EXPECTED_CHAIN_ID.toString(16); // 31337 -> 0x7a69
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    // The chainChanged listener reloads the page after a successful switch.
  } catch (err) {
    if (err && err.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: "Hardhat Local",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } catch (addErr) {
        setStatus(friendlyError(addErr), "error");
      }
    } else {
      setStatus(friendlyError(err), "error");
    }
  }
}

async function connectWallet() {
  // Error handling: MetaMask not installed
  if (typeof window.ethereum === "undefined") {
    setStatus("MetaMask is not installed. Please install the MetaMask browser extension and reload this page.", "error");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    accountInfo.textContent = "Connected account: " + userAddress;
    connectBtn.textContent = "Wallet Connected";
    refreshBtn.disabled = false;

    if (!(await checkNetwork())) return;

    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    setStatus("Wallet connected. Loading candidates from the contract…", "success");
    await loadCandidates();
  } catch (err) {
    setStatus(friendlyError(err), "error");
  }
}

async function loadCandidates() {
  try {
    // All vote counts come from the blockchain — nothing is hardcoded.
    const candidates = await contract.getAllCandidates();
    const alreadyVoted = await contract.hasVoted(userAddress);
    voterStatus.textContent = alreadyVoted
      ? "This address has already voted. Voting is disabled (one vote per address)."
      : "This address has not voted yet.";

    candidateList.innerHTML = "";
    candidates.forEach((c) => {
      const row = document.createElement("div");
      row.className = "candidate";
      row.innerHTML = `
        <div>
          <div class="name">${c.id}. ${c.name}</div>
          <div class="votes">${c.voteCount} vote(s)</div>
        </div>`;
      const btn = document.createElement("button");
      btn.textContent = "Vote";
      btn.disabled = alreadyVoted;
      btn.addEventListener("click", () => castVote(c.id));
      row.appendChild(btn);
      candidateList.appendChild(row);
    });
  } catch (err) {
    setStatus("Could not load candidates. Is the contract deployed at the address in app.js, and is the local node running? " + friendlyError(err), "error");
  }
}

async function castVote(candidateId) {
  try {
    setStatus("Waiting for you to confirm the transaction in MetaMask…", "pending");
    txInfo.textContent = "";
    const tx = await contract.vote(candidateId);
    setStatus("Transaction submitted. Waiting for confirmation…", "pending");
    txInfo.textContent = "Transaction hash: " + tx.hash;
    const receipt = await tx.wait();
    setStatus(`Vote confirmed in block ${receipt.blockNumber}. Gas used: ${receipt.gasUsed}. Results updated below.`, "success");
    await loadCandidates(); // refresh results from the contract
  } catch (err) {
    // Covers: user rejection, duplicate vote ("You have already voted"),
    // invalid candidate and any other revert.
    setStatus(friendlyError(err), "error");
    await loadCandidates();
  }
}

connectBtn.addEventListener("click", connectWallet);
refreshBtn.addEventListener("click", loadCandidates);
switchBtn.addEventListener("click", switchToExpectedNetwork);

// React to account / network changes in MetaMask
if (typeof window.ethereum !== "undefined") {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
