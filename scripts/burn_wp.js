// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

const path = require('path');
const hre = require("hardhat");
const { ethers } = hre;
const { spawn } = require('child_process');
const which = require('which');
//const AWS = require('aws-sdk');
const { ABI, contractAddress } = require('../contractABI');

async function main() {
    try {

        console.log("I'm in burn_wp.js");

        try {

            // const message = process.env._MSG;
            // console.log("message : " + message);

            // const signature = process.env._SIGNATURE;
            // console.log("signature : " + signature);

            // Access environment variables


            const selectedTokenID = process.env._SELECTED_TOKEN_ID;
            console.log("selectedTokenID : " + selectedTokenID);

            const burningSpecialTokenID = process.env._BURNING_SPECIAL;
            console.log("burningSpecialTokenID : " + burningSpecialTokenID);

            const userAddress = process.env._USER_ADDRESS;
            console.log("userAddress : " + userAddress);

            const weaponContract = await ethers.getContractAt(ABI, contractAddress);

            const tx = await weaponContract.burn(userAddress, burningSpecialTokenID, "1") /*{
                //maxFeePerGas: '316000000000',
                //maxPriorityFeePerGas: '25000000000',
                gasLimit: 685000n, // Use BigInt for gasLimit
            });*/

            const receipt = await tx.wait();

            console.log(`Mint successful! Transaction hash: ${receipt}`);
            console.log(`Minted ${burningSpecialTokenID} to ${userAddress}`);


        } catch (error) {
            console.error("Burning error:", error);
            //.status(500).json({ success: false, error: "Internal server error" });
        }


    }
    catch (error) {
        console.error('error:', error);
        process.exitCode = 1;
    }
}

main().then(() => {
  console.log("✅ Script completed successfully.");
  process.exit(5);

}).catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});




