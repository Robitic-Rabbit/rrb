/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require('dotenv');
dotenv.config();

const signer = process.env.SIGN;
const SCANPOLY = process.env.SCANPOLY;

console.log("read signer : " + signer);


module.exports = {
  solidity: "0.8.19",
  networks: {
    polygonMumbai: {
      url: "https://base-mainnet.infura.io/v3/50597910853247b38793be4ec6b05dc8",
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
