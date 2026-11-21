const hre = require("hardhat");

async function showResults(voting, label) {
  const count = await voting.getCandidateCount();
  console.log(`\nCandidate results ${label}:`);
  for (let i = 0; i < count; i++) {
    const c = await voting.getCandidate(i);
    console.log(`  [${c.id}] ${c.name}: ${c.voteCount} vote(s)`);
  }
}

async function main() {
  const [deployer, voter2] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  console.log("=".repeat(70));
  console.log("PART 6 — TESTING THE VOTING CONTRACT");
  console.log("Network (in-process Hardhat) — Chain ID:", network.chainId.toString());
  console.log("Account 1 (voter 1):", deployer.address);
  console.log("Account 2 (voter 2):", voter2.address);
  console.log("=".repeat(70));

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  console.log("\nVoting contract deployed at:", await voting.getAddress());
  console.log("Deployment tx hash:", voting.deploymentTransaction().hash);
  await showResults(voting, "(before any votes)");

  // Experiment A: successful voting
  console.log("\n--- Experiment A: Successful voting (Account 1 -> Candidate 1) ---");
  const txA = await voting.connect(deployer).vote(1);
  console.log("Transaction submitted, hash:", txA.hash);
  const receiptA = await txA.wait();
  console.log("Transaction confirmed in block:", receiptA.blockNumber);
  console.log("Status (1 = success):", receiptA.status);
  console.log("Gas used:", receiptA.gasUsed.toString());
  const ev = receiptA.logs
    .map((log) => {
      try {
        return voting.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((p) => p && p.name === "VoteCast");
  if (ev) {
    console.log("Event emitted: VoteCast(voter=%s, candidateId=%s)", ev.args.voter, ev.args.candidateId.toString());
  }
  console.log("hasVoted(Account 1):", await voting.hasVoted(deployer.address));
  await showResults(voting, "(after Experiment A — Candidate 1 increased by 1)");

  //Experiment B: duplicate voting
  console.log("\n--- Experiment B: Duplicate voting (same Account 1 tries again) ---");
  try {
    const txB = await voting.connect(deployer).vote(0);
    await txB.wait();
    console.log("UNEXPECTED: duplicate vote was accepted");
  } catch (err) {
    console.log("Transaction REVERTED as expected.");
    console.log("Revert reason:", err.reason || err.message.split("\n")[0]);
  }
  await showResults(voting, "(after Experiment B — unchanged, no count increased)");

  // Experiment C: voting from another account 
  console.log("\n--- Experiment C: Voting from a second account (Account 2 -> Candidate 1) ---");
  const txC = await voting.connect(voter2).vote(1);
  const receiptC = await txC.wait();
  console.log("Transaction hash:", txC.hash);
  console.log("Confirmed in block:", receiptC.blockNumber, "| Status:", receiptC.status);
  console.log("Gas used:", receiptC.gasUsed.toString());
  console.log("hasVoted(Account 2):", await voting.hasVoted(voter2.address));
  await showResults(voting, "(after Experiment C — Candidate 1 increased by 1 again)");

  //Experiment D: invalid candidate 
  const [, , voter3] = await hre.ethers.getSigners();
  console.log("\n--- Experiment D: Invalid candidate id (fresh Account 3 -> Candidate 99) ---");
  console.log("Account 3:", voter3.address);
  try {
    const txD = await voting.connect(voter3).vote(99);
    await txD.wait();
    console.log("UNEXPECTED: invalid vote was accepted");
  } catch (err) {
    console.log("Transaction REVERTED as expected.");
    console.log("Revert reason:", err.reason || err.message.split("\n")[0]);
  }
  console.log("hasVoted(Account 3):", await voting.hasVoted(voter3.address), "(still false — the failed vote did not count)");
  await showResults(voting, "(FINAL results — unchanged by Experiment D)");

  console.log("\nAll four experiments completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
