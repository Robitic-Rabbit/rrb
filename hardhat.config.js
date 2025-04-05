/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require('dotenv');
dotenv.config();

const signer = process.env.SIGN;
const SCANPOLY = process.env.SCANPOLY;
const SCANPULSE = process.env.SCANPULSE;


module.exports = {
  solidity: "0.8.19",
  networks: {
    polygonMumbai: {
      url: "https://sepolia.infura.io/v3/9aad89c8e515457ab8b7805f5da593ea",
      //url: "https://pulsechain-rpc.publicnode.com",
      accounts: [signer],
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: SCANPOLY,
    }
  },
  sourcify: {
    enabled: true
  }
};
