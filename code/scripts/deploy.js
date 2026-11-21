// Deployment script — works on the in-process Hardhat network, on a local
// node (`npx hardhat node`, --network localhost) and on Sepolia
// (--network sepolia) with no changes.
//
// Usage:
//   npx hardhat run scripts/deploy.js                    (in-process test network)
//   npx hardhat run scripts/deploy.js --network localhost (local node, Chain ID 31337)
//   npx hardhat run scripts/deploy.js --network sepolia   (testnet)
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("=".repeat(70));
  console.log("DEPLOYMENT");
  console.log("=".repeat(70));
  console.log("Network name      :", hre.network.name);
  console.log("Chain ID          :", network.chainId.toString());
  console.log("Deployer address  :", deployer.address);
  console.log(
    "Deployer balance  :",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // ---- SimpleStorage, deployed with initial value 42 ----
  const SimpleStorage = await hre.ethers.getContractFactory("SimpleStorage");
  const storage = await SimpleStorage.deploy(42);
  await storage.waitForDeployment();
  const storageDeployTx = storage.deploymentTransaction();
  const storageReceipt = await storageDeployTx.wait();
  console.log("\n--- SimpleStorage ---");
  console.log("Contract address  :", await storage.getAddress());
  console.log("Deployment tx hash:", storageDeployTx.hash);
  console.log("Gas used          :", storageReceipt.gasUsed.toString());
  console.log("Initial getNumber():", (await storage.getNumber()).toString());

  const setTx = await storage.setNumber(100);
  const setReceipt = await setTx.wait();
  console.log("setNumber(100) tx :", setTx.hash);
  console.log("Gas used          :", setReceipt.gasUsed.toString());
  console.log("Updated getNumber():", (await storage.getNumber()).toString());

  // ---- Voting ----
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  const votingDeployTx = voting.deploymentTransaction();
  const votingReceipt = await votingDeployTx.wait();
  console.log("\n--- Voting ---");
  console.log("Contract address  :", await voting.getAddress());
  console.log("Deployment tx hash:", votingDeployTx.hash);
  console.log("Gas used          :", votingReceipt.gasUsed.toString());
  console.log("Candidate count   :", (await voting.getCandidateCount()).toString());
  const count = await voting.getCandidateCount();
  for (let i = 0; i < count; i++) {
    const c = await voting.getCandidate(i);
    console.log(`  Candidate ${c.id}: ${c.name} — ${c.voteCount} vote(s)`);
  }
  console.log("\nCopy the Voting contract address above into frontend/app.js");
  console.log("(CONTRACT_ADDRESS) and into the lab report.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
