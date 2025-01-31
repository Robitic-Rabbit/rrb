const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3001;
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const helmet = require('helmet');
const morgan = require('morgan');
const which = require('which');
const { spawn } = require('child_process');
const { REFUSED } = require('dns');
const upload = require('express-fileupload');
const hre = require("hardhat");
const { ethers } = require("hardhat");
const axios = require('axios');

// Set the limit to 50MB for JSON payloads
app.use(bodyParser.json({ limit: '50mb' }));

// Set the limit to 50MB for URL-encoded payloads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Use the JWT key
const pinataSDK = require('@pinata/sdk');
//const { verifyMessage } = require('ethers');
const pinata = new pinataSDK({ pinataJWTKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwOGYyMjVmNi01ZjVmLTQ1MmEtYWIzNS1kNWNhMmE4ZjBhMjUiLCJlbWFpbCI6ImNyb3Nza2l0dGllc25mdHNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjIyYTc5N2RlOGQ0MDc5M2U4ZjNjIiwic2NvcGVkS2V5U2VjcmV0IjoiMDdjNDUwY2IxMTQ4MWRiZjA3YjI4ZTU3NGFlYzZjOTlmYTQwZGIxMzBiZGQxYTczNmUxMGRmYWRiODcyYjQ4OSIsImV4cCI6MTc1MzIwMDU1NX0.VpcgwYgOUj8by3J57ew6GFCf0HXOGSq-31r0JbLqisE' });


// Security best practices
app.use(helmet());
app.use(upload());

// CORS configuration
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

var corsOptions = {
    origin: ['http://localhost:3000', 'https://localhost:3000'],
    optionsSuccessStatus: 200,
};

// Body parsing middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Logging middleware
app.use(morgan('combined'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Specify the path to your contracts directory
const contractsPath = path.resolve(__dirname, './contracts');

// Create an express Router
const router = express.Router();

// Mount the router at a specific path
app.use('/api', router);

//............................................................................//
router.post('/changeSyndicateMetadata_SP', cors(corsOptions), async (req, res) => {

    try {

        const resolvedOrNull = await which('npx', { nothrow: true });
        console.log("resolvedOrNull : " + resolvedOrNull);

        const hardhatresolvedOrNull = await which('hardhat', { nothrow: true });
        console.log("resolvedOrNull : " + hardhatresolvedOrNull);

        const hardhatresolvedOrNull2 = path.resolve(__dirname, './node_modules/.bin/hardhat');

        // const npxPath = 'C:\\Program Files\\nodejs\\npx.cmd';
        const npxPath = resolvedOrNull;
        const hardhatConfigPath = path.resolve(__dirname, './hardhat.config.js');

        //    const isCompiled = fs.existsSync(path.resolve(__dirname, './artifacts'));
        //   if (!isCompiled) {
        //       console.log("Contracts are not compiled. Please compile first.");
        //       return;
        //   } else {
        // res.send('Contracts are compiled');
        const isAvailable = fs.existsSync(path.resolve(__dirname, './scripts/mint.js'));
        console.log("mint.js available - /mint :" + isAvailable);
        const deployScriptPath = path.resolve(__dirname, './scripts/');

        console.log("Request body:", req.body); // Debugging the incoming payload
        let SELECTED_TOKEN_ID = req.body.selectedTokenId_server;
        let MINTING_SPECIAL = req.body.mintingSpecial_server[0];
        console.log("SELECTED_TOKEN_ID:", SELECTED_TOKEN_ID);
        console.log("BURNING_SPECIAL:", MINTING_SPECIAL);

        let chainName;
        let sNetwork = req.body.selectededNetwork;
        console.log("sNetwork : " + sNetwork);

        if (req.body.selectededNetwork == '137') {
            chainName = 'polygonMumbai';
            console.log("SelectedNetwork" + chainName);
        }

        if (req.body.selectededNetwork == '5') {
            chainName = 'goerliTestnet';
            console.log("SelectedNetwork" + chainName);
        }



        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/mint.js',
            '--network',
            chainName
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
                CHAIN_ID: req.body.selectededNetwork,
                USER_ADDRESS: req.body.userAddress,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                _MINTING_SPECIAL: MINTING_SPECIAL
            },
        });


        childProcess.on('close', async (code) => {
            try {

                if (code === 0) {

                    console.log("I'm back to prev code");


                    // Deployment successful

                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const url = `https://robotic-rabbit-metadata-live-replica01.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Special Power'; // The trait type to update or add
                        const value = 'None'; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        jsonData.image = newImageUrl;
                        console.log(`Updated image URL to: ${newImageUrl}`);

                        // Find if the trait already exists in the 'attributes' array
                        const attributeIndex = jsonData.attributes.findIndex(
                            (attr) => attr.trait_type === traitType
                        );

                        if (attributeIndex !== -1) {
                            // If the trait exists, update its value
                            jsonData.attributes[attributeIndex].value = value;
                            console.log(`Updated existing attribute: ${traitType} -> ${value}`);
                        } else {
                            // If the trait does not exist, add a new attribute
                            jsonData.attributes.push({
                                trait_type: traitType,
                                value: value,
                            });
                            console.log(`Added new attribute: ${traitType} -> ${value}`);
                        }
                        const savePath = `./metadata/${SELECTED_TOKEN_ID}.json`; // Path where you want to save the updated file
                        // Create a new file name
                        const dir = path.dirname(savePath);
                        const baseName = path.basename(savePath, '.json');
                        const newFilePath = path.join(dir, `${baseName}_1.json`);

                        // Write updated JSON to a new file
                        fs.writeFileSync(newFilePath, JSON.stringify(jsonData, null, 2));

                        // Delete the original file if it exists locally
                        if (fs.existsSync(savePath)) {
                            fs.unlinkSync(savePath);
                        }

                        // Rename the new file to the original file's name
                        fs.renameSync(newFilePath, savePath);

                        console.log(`File updated and saved as: ${savePath}`);
                    } catch (error) {
                        console.error('Error processing the JSON file:', error.message);
                    }

                    console.log("Deployment successful");
                    res.send(`CS_SPOkay`);
                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    //  res.status(500).send('Error during deployment');
                }
            } catch (err) {
                console.log(err);
            }
        });

        // Capture stdout
        let stdoutData = '';
        childProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log("data :" + data.toString()); // Log the output to the console
        });

        // Log errors
        childProcess.stderr.on('data', (data) => {
            console.error('new stderr-deploy:', data.toString());
        });

        console.log("data" + req.body.totalSupply);

        //  }


    } catch (error) {
        console.error('error:', error);
        res.status(500).send('Error during deployment');
        res.send(`networkError`);
    }

});

router.post('/changeSyndicateMetadata_WG', cors(corsOptions), async (req, res) => {

    try {

        const resolvedOrNull = await which('npx', { nothrow: true });
        console.log("resolvedOrNull : " + resolvedOrNull);

        const hardhatresolvedOrNull = await which('hardhat', { nothrow: true });
        console.log("resolvedOrNull : " + hardhatresolvedOrNull);

        const hardhatresolvedOrNull2 = path.resolve(__dirname, './node_modules/.bin/hardhat');

        // const npxPath = 'C:\\Program Files\\nodejs\\npx.cmd';
        const npxPath = resolvedOrNull;
        const hardhatConfigPath = path.resolve(__dirname, './hardhat.config.js');

        //    const isCompiled = fs.existsSync(path.resolve(__dirname, './artifacts'));
        //   if (!isCompiled) {
        //       console.log("Contracts are not compiled. Please compile first.");
        //       return;
        //   } else {
        // res.send('Contracts are compiled');
        const isAvailable = fs.existsSync(path.resolve(__dirname, './scripts/mint.js'));
        console.log("mint.js available - /mint :" + isAvailable);
        const deployScriptPath = path.resolve(__dirname, './scripts/');

        console.log("Request body:", req.body); // Debugging the incoming payload
        let SELECTED_TOKEN_ID = req.body.selectedTokenId_server;
        let MINTING_WEAPON = req.body.mintingWeapon_server[0];
        console.log("SELECTED_TOKEN_ID:", SELECTED_TOKEN_ID);
        console.log("MINTING_WEAPON:", MINTING_WEAPON);

        let chainName;
        let sNetwork = req.body.selectededNetwork;
        console.log("sNetwork : " + sNetwork);

        if (req.body.selectededNetwork == '137') {
            chainName = 'polygonMumbai';
            console.log("SelectedNetwork" + chainName);
        }

        if (req.body.selectededNetwork == '5') {
            chainName = 'goerliTestnet';
            console.log("SelectedNetwork" + chainName);
        }



        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/mint_WP.js',
            '--network',
            chainName
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
                CHAIN_ID: req.body.selectededNetwork,
                USER_ADDRESS: req.body.userAddress,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                _MINTING_WEAPON: MINTING_WEAPON
            },
        });


        childProcess.on('close', async (code) => {
            try {

                if (code === 0) {

                    console.log("I'm back to prev code");


                    // Deployment successful

                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const url = `https://robotic-rabbit-metadata-live-replica01.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Weapons and Gear'; // The trait type to update or add
                        const value = 'None'; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        jsonData.image = newImageUrl;
                        console.log(`Updated image URL to: ${newImageUrl}`);

                        // Find if the trait already exists in the 'attributes' array
                        const attributeIndex = jsonData.attributes.findIndex(
                            (attr) => attr.trait_type === traitType
                        );

                        if (attributeIndex !== -1) {
                            // If the trait exists, update its value
                            jsonData.attributes[attributeIndex].value = value;
                            console.log(`Updated existing attribute: ${traitType} -> ${value}`);
                        } else {
                            // If the trait does not exist, add a new attribute
                            jsonData.attributes.push({
                                trait_type: traitType,
                                value: value,
                            });
                            console.log(`Added new attribute: ${traitType} -> ${value}`);
                        }
                        const savePath = `./metadata/${SELECTED_TOKEN_ID}.json`; // Path where you want to save the updated file
                        // Create a new file name
                        const dir = path.dirname(savePath);
                        const baseName = path.basename(savePath, '.json');
                        const newFilePath = path.join(dir, `${baseName}_1.json`);

                        // Write updated JSON to a new file
                        fs.writeFileSync(newFilePath, JSON.stringify(jsonData, null, 2));

                        // Delete the original file if it exists locally
                        if (fs.existsSync(savePath)) {
                            fs.unlinkSync(savePath);
                        }

                        // Rename the new file to the original file's name
                        fs.renameSync(newFilePath, savePath);

                        console.log(`File updated and saved as: ${savePath}`);
                    } catch (error) {
                        console.error('Error processing the JSON file:', error.message);
                    }

                    console.log("Deployment successful");
                    res.send(`CS_WGOkay`);
                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    //  res.status(500).send('Error during deployment');
                }
            } catch (err) {
                console.log(err);
            }
        });

        // Capture stdout
        let stdoutData = '';
        childProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log("data :" + data.toString()); // Log the output to the console
        });

        // Log errors
        childProcess.stderr.on('data', (data) => {
            console.error('new stderr-deploy:', data.toString());
        });

        console.log("data" + req.body.totalSupply);

        //  }


    } catch (error) {
        console.error('error:', error);
        res.status(500).send('Error during deployment');
        res.send(`networkError`);
    }

});

router.post('/burn_SP', cors(corsOptions), async (req, res) => {

    try {


        const resolvedOrNull = await which('npx', { nothrow: true });
        console.log("resolvedOrNull : " + resolvedOrNull);

        const hardhatresolvedOrNull = await which('hardhat', { nothrow: true });
        console.log("resolvedOrNull : " + hardhatresolvedOrNull);

        const hardhatresolvedOrNull2 = path.resolve(__dirname, './node_modules/.bin/hardhat');

        // const npxPath = 'C:\\Program Files\\nodejs\\npx.cmd';
        const npxPath = resolvedOrNull;
        const hardhatConfigPath = path.resolve(__dirname, './hardhat.config.js');

        //    const isCompiled = fs.existsSync(path.resolve(__dirname, './artifacts'));
        //   if (!isCompiled) {
        //       console.log("Contracts are not compiled. Please compile first.");
        //       return;
        //   } else {
        // res.send('Contracts are compiled');
        const isAvailable = fs.existsSync(path.resolve(__dirname, './scripts/mint.js'));
        console.log("mint.js available - /mint :" + isAvailable);
        const deployScriptPath = path.resolve(__dirname, './scripts/');

        console.log("Request body:", req.body); // Debugging the incoming payload
        let SELECTED_TOKEN_ID = req.body.selectedTokenId_server;
        let BURNING_SPECIAL_ID = req.body.burningSpecial_server;
        console.log("SELECTED_TOKEN_ID:", SELECTED_TOKEN_ID);
        console.log("BURNING_SPECIAL_ID:", BURNING_SPECIAL_ID);
        let USER_ADDRESS = req.body.selectedTokenId_server;
        console.log("USER_ADDRESS:", USER_ADDRESS);

        let chainName;
        let sNetwork = req.body.selectedNetwork;
        console.log("sNetwork : " + sNetwork);

        if (req.body.selectededNetwork == '137') {
            chainName = 'polygonMumbai';
            console.log("SelectedNetwork" + chainName);
        }

      
        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/burn_sp.js',
            '--network',
            'polygonMumbai'
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
                _CHAIN_ID: req.body.selectedNetwork,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                _BURNING_SPECIAL: BURNING_SPECIAL_ID,
                _USER_ADDRESS: req.body.userAddress_server,
               // _MSG: req.body.message,
                //_SIGNATURE: req.body.signature
                   

            },
        });


        childProcess.on('close', async (code) => {
            try {

                if (code === 0) {

                    console.log("I'm back to prev code");

                    // Deployment successful
                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const weaponList = [
                            "CarroTech",
                            "PiranhaPlant Blaster",
                            "CrimsonCollar Cape",
                            "CrashCable Cluster",
                            "HazeBlaze Hammer",
                            "Poseidon's Poker",
                            "Western Wrangler's Rifle",
                            "TimeTail Thrusters",
                            "CarrotKendo Katana",
                            "ForceHop Pouch",
                            "Golden Guardian Throne",
                            "Tactical Turret",
                            "Mutant Spine Spikes",
                            "GothamGuardian Cape",
                            "HareBot Helper",
                            "Medusa's Pointed Pelerine",
                            "SpiderSlicer Claws",
                            "Stew Zapper Pack",
                            "Golden Pika Tail",
                            "Jason's Terror Tools",
                            "RoboRabbit Cape",
                            "StellarSpike Spine",
                            "BrainBoost Tubing",
                            "SandStorm Sword",
                            "Flaming Phoenix Wings",
                            "BowlCape Drape",
                            "Toxic Inferno Cannons",
                            "WaterWrangler Whirl Power Box",
                            "Luminous Carrot Cascade Power Box",
                            "Lightning Lash Power Box",
                            "BlazeBarrage Power Box",
                            "Terra Ascension Aura Power Box",
                            "Quantum Leap",
                            "Fortune Falls Flurry Power Box",
                            "Diamond EarlyBird Scyche Special Weapon",
                            "MaxMint Mallet Special Weapon",
                            "Golden VIP AK47 Special Weapon",
                            "Minter's Guardian Sword Special Weapon",
                            "Villain FoxFire Blade Special Weapon",
                            "SkyHopper Drone",
                            "SpectraFly Drone",
                            "GoldenGlider Drone"
                        ];
                    
                        const url = `https://robotic-rabbit-metadata-live-replica01.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Special Power'; // The trait type to update or add
                        const value = weaponList[BURNING_SPECIAL_ID]; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        jsonData.image = newImageUrl;
                        console.log(`Updated image URL to: ${newImageUrl}`);

                        // Find if the trait already exists in the 'attributes' array
                        const attributeIndex = jsonData.attributes.findIndex(
                            (attr) => attr.trait_type === traitType
                        );

                        if (attributeIndex !== -1) {
                            // If the trait exists, update its value
                            jsonData.attributes[attributeIndex].value = value;
                            console.log(`Updated existing attribute: ${traitType} -> ${value}`);
                        } else {
                            // If the trait does not exist, add a new attribute
                            jsonData.attributes.push({
                                trait_type: traitType,
                                value: value,
                            });
                            console.log(`Added new attribute: ${traitType} -> ${value}`);
                        }
                        const savePath = `./metadata/${SELECTED_TOKEN_ID}.json`; // Path where you want to save the updated file
                        // Create a new file name
                        const dir = path.dirname(savePath);
                        const baseName = path.basename(savePath, '.json');
                        const newFilePath = path.join(dir, `${baseName}_1.json`);

                        // Write updated JSON to a new file
                        fs.writeFileSync(newFilePath, JSON.stringify(jsonData, null, 2));

                        // Delete the original file if it exists locally
                        if (fs.existsSync(savePath)) {
                            fs.unlinkSync(savePath);
                        }

                        // Rename the new file to the original file's name
                        fs.renameSync(newFilePath, savePath);

                        console.log(`File updated and saved as: ${savePath}`);
                    } catch (error) {
                        console.error('Error processing the JSON file:', error.message);
                    }

                    console.log("Deployment successful");
                    res.send(`SPOkay`);
                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    //  res.status(500).send('Error during deployment');
                }
            } catch (err) {
                console.log(err);
            }
        });

        // Capture stdout
        let stdoutData = '';
        childProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log("data :" + data.toString()); // Log the output to the console
        });

        // Log errors
        childProcess.stderr.on('data', (data) => {
            console.error('new stderr-deploy:', data.toString());
        });

        console.log("data" + req.body.totalSupply);

        //  }


    } catch (error) {
        console.error('error:', error);
        res.status(500).send('Error during deployment');
        res.send(`networkError`);
    }

});


router.post('/burn_WP', cors(corsOptions), async (req, res) => {

    try {


        const resolvedOrNull = await which('npx', { nothrow: true });
        console.log("resolvedOrNull : " + resolvedOrNull);

        const hardhatresolvedOrNull = await which('hardhat', { nothrow: true });
        console.log("resolvedOrNull : " + hardhatresolvedOrNull);

        const hardhatresolvedOrNull2 = path.resolve(__dirname, './node_modules/.bin/hardhat');

        // const npxPath = 'C:\\Program Files\\nodejs\\npx.cmd';
        const npxPath = resolvedOrNull;
        const hardhatConfigPath = path.resolve(__dirname, './hardhat.config.js');

        //    const isCompiled = fs.existsSync(path.resolve(__dirname, './artifacts'));
        //   if (!isCompiled) {
        //       console.log("Contracts are not compiled. Please compile first.");
        //       return;
        //   } else {
        // res.send('Contracts are compiled');
        const isAvailable = fs.existsSync(path.resolve(__dirname, './scripts/mint.js'));
        console.log("mint.js available - /mint :" + isAvailable);
        const deployScriptPath = path.resolve(__dirname, './scripts/');

        console.log("Request body:", req.body); // Debugging the incoming payload
        let SELECTED_TOKEN_ID = req.body.selectedTokenId_server;
        let BURNING_WEAPON_ID = req.body.burningWeapon_server;
        console.log("SELECTED_TOKEN_ID:", SELECTED_TOKEN_ID);
        console.log("BURNING_WEAPON_ID:", BURNING_WEAPON_ID);
        let USER_ADDRESS = req.body.selectedTokenId_server;
        console.log("USER_ADDRESS:", USER_ADDRESS);

        let chainName;
        let sNetwork = req.body.selectedNetwork;
        console.log("sNetwork : " + sNetwork);

        if (req.body.selectededNetwork == '137') {
            chainName = 'polygonMumbai';
            console.log("SelectedNetwork" + chainName);
        }

      
        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/burn_wp.js',
            '--network',
            'polygonMumbai'
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
                _CHAIN_ID: req.body.selectedNetwork,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                _BURNING_SPECIAL: BURNING_WEAPON_ID,
                _USER_ADDRESS: req.body.userAddress_server,
               // _MSG: req.body.message,
                //_SIGNATURE: req.body.signature
                   

            },
        });


        childProcess.on('close', async (code) => {
            try {

                if (code === 0) {

                    console.log("I'm back to prev code");

                    // Deployment successful
                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const weaponList = [
                            "CarroTech",
                            "PiranhaPlant Blaster",
                            "CrimsonCollar Cape",
                            "CrashCable Cluster",
                            "HazeBlaze Hammer",
                            "Poseidon's Poker",
                            "Western Wrangler's Rifle",
                            "TimeTail Thrusters",
                            "CarrotKendo Katana",
                            "ForceHop Pouch",
                            "Golden Guardian Throne",
                            "Tactical Turret",
                            "Mutant Spine Spikes",
                            "GothamGuardian Cape",
                            "HareBot Helper",
                            "Medusa's Pointed Pelerine",
                            "SpiderSlicer Claws",
                            "Stew Zapper Pack",
                            "Golden Pika Tail",
                            "Jason's Terror Tools",
                            "RoboRabbit Cape",
                            "StellarSpike Spine",
                            "BrainBoost Tubing",
                            "SandStorm Sword",
                            "Flaming Phoenix Wings",
                            "BowlCape Drape",
                            "Toxic Inferno Cannons",
                            "WaterWrangler Whirl Power Box",
                            "Luminous Carrot Cascade Power Box",
                            "Lightning Lash Power Box",
                            "BlazeBarrage Power Box",
                            "Terra Ascension Aura Power Box",
                            "Quantum Leap",
                            "Fortune Falls Flurry Power Box",
                            "Diamond EarlyBird Scyche Special Weapon",
                            "MaxMint Mallet Special Weapon",
                            "Golden VIP AK47 Special Weapon",
                            "Minter's Guardian Sword Special Weapon",
                            "Villain FoxFire Blade Special Weapon",
                            "SkyHopper Drone",
                            "SpectraFly Drone",
                            "GoldenGlider Drone"
                        ];
                    
                        const url = `https://robotic-rabbit-metadata-live-replica01.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Weapons and Gear'; // The trait type to update or add
                        const value = weaponList[BURNING_WEAPON_ID]; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        jsonData.image = newImageUrl;
                        console.log(`Updated image URL to: ${newImageUrl}`);

                        // Find if the trait already exists in the 'attributes' array
                        const attributeIndex = jsonData.attributes.findIndex(
                            (attr) => attr.trait_type === traitType
                        );

                        if (attributeIndex !== -1) {
                            // If the trait exists, update its value
                            jsonData.attributes[attributeIndex].value = value;
                            console.log(`Updated existing attribute: ${traitType} -> ${value}`);
                        } else {
                            // If the trait does not exist, add a new attribute
                            jsonData.attributes.push({
                                trait_type: traitType,
                                value: value,
                            });
                            console.log(`Added new attribute: ${traitType} -> ${value}`);
                        }
                        const savePath = `./metadata/${SELECTED_TOKEN_ID}.json`; // Path where you want to save the updated file
                        // Create a new file name
                        const dir = path.dirname(savePath);
                        const baseName = path.basename(savePath, '.json');
                        const newFilePath = path.join(dir, `${baseName}_1.json`);

                        // Write updated JSON to a new file
                        fs.writeFileSync(newFilePath, JSON.stringify(jsonData, null, 2));

                        // Delete the original file if it exists locally
                        if (fs.existsSync(savePath)) {
                            fs.unlinkSync(savePath);
                        }

                        // Rename the new file to the original file's name
                        fs.renameSync(newFilePath, savePath);

                        console.log(`File updated and saved as: ${savePath}`);
                    } catch (error) {
                        console.error('Error processing the JSON file:', error.message);
                    }

                    console.log("Deployment successful");
                    res.send(`WPOkay`);
                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    //  res.status(500).send('Error during deployment');
                }
            } catch (err) {
                console.log(err);
            }
        });

        // Capture stdout
        let stdoutData = '';
        childProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log("data :" + data.toString()); // Log the output to the console
        });

        // Log errors
        childProcess.stderr.on('data', (data) => {
            console.error('new stderr-deploy:', data.toString());
        });

        console.log("data" + req.body.totalSupply);

        //  }


    } catch (error) {
        console.error('error:', error);
        res.status(500).send('Error during deployment');
        res.send(`networkError`);
    }

});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
