require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    somnia: {
      url: process.env.SOMNIA_RPC_URL || "https://rpc.ankr.com/somnia_testnet/3c762a03e25b498bc79b874a461257b419f03ca1d479b5ef998e3d87cada0964",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 50312
    }
  }
}; 