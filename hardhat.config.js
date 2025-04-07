/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
//const dotenv = require('dotenv');
//dotenv.config();

const signer = process.env.SIGN;
const SCANPOLY = process.env.SCANPOLY;
const SCANPULSE = process.env.SCANPULSE;
console.log("read signer : " + signer);


module.exports = {
  solidity: "0.8.19",
  networks: {
    polygonMumbai: {
      url: "https://holy-burned-sheet.optimism.quiknode.pro/f7e9efbb6f5a0385ae4c3a55b94bb67eca5e31bc/",
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
