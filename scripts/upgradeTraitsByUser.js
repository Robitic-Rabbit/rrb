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
const { ABISyndicate, contractAddressSyndicate } = require('../contractABISyndicate');

async function main() {
    try {

        console.log("I'm in mint_wp.js");

        let checker1 = 0;
        let checker2 = 0;
        let checker3 = 0;


        const nftId = process.env.nftId;
        console.log("nftId : " + nftId);

        const traitId = process.env.traitId;
        console.log("traitId : " + traitId);

        const userAddress = process.env.USER_ADDRESS;
        console.log("userAddress : " + userAddress);

        console.log("Loading contract...");
        const weaponContract = await ethers.getContractAt(ABI, contractAddress);
        //const syndicateContract = await ethers.getContractAt(ABISyndicate, contractAddressSyndicate);

        console.log("weaponContract loaded successfully.");

        console.log("Attempting to mint...");

        //const ownerOf = await syndicateContract.ownerOf(nftId);

        /*if (ownerOf == userAddress) {
        } else {
            return;
        }*/
        // Submit mint transaction
        const tx = await weaponContract.upgradeTraitsByUser(nftId, traitId);/*, {
            //maxFeePerGas: '516000000000',
            //maxPriorityFeePerGas: '45000000000',
            gasLimit: 785000n, // Use BigInt for gasLimit
        });*/

        console.log(`Transaction submitted. TX Hash: ${tx.hash}`);

        // 🛑 Ensure execution stops until transaction is confirmed
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait(); // 🚨 This must block execution until transaction completes

        console.log("receipt : " + receipt);
        if (receipt && receipt.status === 1) {
            console.log(`✅ Mint successful! Transaction hash: ${tx.hash}`);
          //  console.log(`Minted ${mintingWeaponNumber} to ${userAddress}`);
            checker1 = 1;

        } else {
            console.error("❌ Mint failed: Transaction was reverted.");
            checker2 = 1;
            process.exit(1); // 🚨 Exit the script with an error code

        }

    } catch (error) {
        console.error("❌ Error:", error);
        checker3 = 1;
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