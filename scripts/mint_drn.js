// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

const path = require('path');
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { spawn } = require('child_process');
const which = require('which');
//const AWS = require('aws-sdk');
const { ABI, contractAddress } = require('../contractABI');

async function main() {
  try {
    const chainID = process.env.CHAIN_ID;
    console.log("chainID : " + chainID);

    const userAddress = process.env.USER_ADDRESS;
    console.log("userAddress : " + userAddress);

    const selectedTokenID = process.env._SELECTED_TOKEN_ID;
    console.log("selectedTokenID : " + selectedTokenID);

    const receivedDroneValue = process.env.__RECEIVED_DRONE_VALUE;
    console.log("receivedDroneValue : " + receivedDroneValue);

    const provider = ethers.provider;
    const feeData = await provider.getFeeData(); // Get gas fee data

    const weaponContract = await ethers.getContractAt(ABI, contractAddress);
    console.log("weaponContract : " + JSON.stringify(weaponContract));

    const tx = await weaponContract.mint(userAddress, receivedDroneValue) /*{
      //maxFeePerGas: '316000000000',
     // maxPriorityFeePerGas: '25000000000',
      gasLimit: 685000n, // Use BigInt for gasLimit
    });*/

    console.log(`Transaction submitted. TX Hash: ${tx.hash}`);

    // 🛑 Ensure execution stops until transaction is confirmed
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait(); // 🚨 This must block execution until transaction completes

    if (receipt && receipt.status === 1) {
      console.log(`✅ Mint successful! Transaction hash: ${tx.hash}`);
     // console.log(`Minted ${mintingSpecialNumber} to ${userAddress}`);
    } else {
      console.error("❌ Mint failed: Transaction was reverted.");
      process.exit(1); // 🚨 Exit the script with an error code
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1); // 🚨 Force exit with failure

  }
}

main().then(() => {
  console.log("✅ Script completed successfully.");
  process.exit(5);

}).catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});


