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

    console.log("I'm in mint_wp.js");

        let checker1 = 0;
        let checker2 = 0;
        let checker3 = 0;

       
        const chainID = process.env.CHAIN_ID;
        console.log("chainID : " + chainID);
    
        const userAddress = process.env.USER_ADDRESS;
        console.log("userAddress : " + userAddress);
    
        const mintingWeaponNumber = process.env._MINTING_WEAPON;
        console.log("mintingWeaponNumber : " + mintingWeaponNumber);
    
        console.log("Loading contract...");
        const weaponContract = await ethers.getContractAt(ABI, contractAddress);
    
        console.log("weaponContract loaded successfully.");
    
        console.log("Attempting to mint...");
        
        // Submit mint transaction
        const tx = await weaponContract.mint(userAddress, mintingWeaponNumber);/* {
         // maxFeePerGas: '316000000000',
          //maxPriorityFeePerGas: '25000000000',
          gasLimit: 685000n, // Use BigInt for gasLimit
        });*/
    
        console.log(`Transaction submitted. TX Hash: ${tx.hash}`);
    
        // 🛑 Ensure execution stops until transaction is confirmed
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait(); // 🚨 This must block execution until transaction completes
    
        if (receipt && receipt.status === 1) {
          checker1 = 1;

          console.log(`✅ Mint successful! Transaction hash: ${tx.hash}`);
          console.log(`Minted ${mintingWeaponNumber} to ${userAddress}`);

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