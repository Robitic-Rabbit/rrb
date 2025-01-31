const path = require('path');
const hre = require("hardhat");
const { ethers } = hre;
const { spawn } = require('child_process');
const which = require('which');
import contractABI from '../json/contractAbi.json';

async function main() {
  try {

    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

    const ID = process.env.ID;
    console.log("ID : " + ID);

    const fileUrlMetadata = process.env.METADATA_URL;
    console.log("fileUrlMetadata : " + fileUrlMetadata);

    const contractNFT = await ethers.getContractAt(contractABI.abi, contractAddress);

    // set metadata Link
    const update_metadataURL = await contractNFT.update_metadataURL(ID, fileUrlMetadata);
    console.log('update_metadataURL: ', update_metadataURL);


  }
  
  catch (error) {
    console.error('error:', error);
    process.exitCode = 1;
  }
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



