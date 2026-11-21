require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // Local development blockchain started with: npx hardhat node
    // Chain ID 31337. This is the network selected for this submission.
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Optional testnet deployment (same procedure, see README):
    // sepolia: {
    //   url: "https://ethereum-sepolia-rpc.publicnode.com",
    //   chainId: 11155111,
    //   accounts: ["<YOUR TESTNET ACCOUNT PRIVATE KEY - NEVER COMMIT A REAL ONE>"],
    // },
  },
};
