const path = require('path');
const hre = require("hardhat");
const { ethers } = hre;
const { spawn } = require('child_process');
const which = require('which');
const contractABI = require('../json/contractAbi.json');

async function main() {
  try {

	const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

    const fileUrlMetadata = process.env.METADATA_URL;
    console.log("fileUrlMetadata : " + fileUrlMetadata);

    const fileUrl = process.env.IMG_URL;
    console.log("fileUrl : " + fileUrl);

    const radio = process.env.RADIO;
    console.log("radio : " + radio);

    const notes = process.env.NOTES;
    console.log("notes : " + notes);

    const illustrator = process.env.ILLUSTRATOR;
    console.log("illustrator : " + illustrator);

    const poet = process.env.POET;
    console.log("poet : " + poet);

    const donation = process.env.DONATION;
    console.log("donation : " + donation);

    const nonprofit = process.env.NONPROFIT;
    console.log("nonprofit : " + nonprofit);

    let wallet = process.env.WALLET;
    console.log("wallet : " + wallet);

    let collection = process.env.COLLECTION;
    console.log("collection : " + collection);

    let bonus = process.env.BONUS;
    console.log("bonus : " + bonus);


    if (wallet == null) {
      wallet = '0x0000000000000000000000000000000000000000';
    }

    if (collection == null) {
      collection = '';
    }


    const contractNFT = await ethers.getContractAt(contractABI.abi, contractAddress);
    const totalSupplynft = await contractNFT.totalSupply();
    console.log('totalSupply : ' + totalSupplynft.toString());

    const DONATION = await contractNFT.getDonationAmount(0);
    console.log('getDonationAmount data: ', DONATION);


    // Calculate gasLimit dynamically
    /*const gasEstimate = await contractNFT.estimateGas.mint(
      Number(totalSupplynft.toString()) + 1,
      fileUrlMetadata
    );*/
    //const gasLimit = Math.round(gasEstimate * 1.2); // Increase by 20% as buffer

    // Call mint with calculated gasLimit
    const txResponse = await contractNFT.addEntry(
      nonprofit, donation, poet, illustrator, notes, radio, fileUrlMetadata, fileUrl, wallet, bonus
      //{ value: "685000" }
    );

    // Wait for transaction receipt
    const txReceipt = await txResponse.wait();
    console.log(`Transaction confirmed with hash ${txReceipt.transactionHash}`);
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



