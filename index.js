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
// const hre = require("hardhat");
// const { ethers } = require("hardhat");
const axios = require('axios');
const AWS = require('aws-sdk');
const { getSecrets } = require('./vault-config');
const { createCanvas, loadImage } = require('canvas');
//const { imageMappingsFile } = require('./imageMappings.json');
const imageMappings = require('./imageMappings.json');


// Set the limit to 50MB for JSON payloads
app.use(bodyParser.json({ limit: '50mb' }));

// Set the limit to 50MB for URL-encoded payloads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use("/upgradedTraits", express.static(path.join(__dirname, "upgradedTraits")));

app.use(express.json()); // ✅ Ensures JSON body parsing
app.use(express.urlencoded({ extended: true })); // ✅ Optional for form data

getSecrets()
  .then(() => {

    console.log("env...............................................", process.env.AWS_ACCESS_KEY_ID)

    const hre = require("hardhat");
    const { ethers } = require("hardhat");

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
});


// Sanitize function to replace special characters
//const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9-_\.]/g, "_");

// Ensure image filename is safe
//const sanitizedImageName = sanitizeFilename(updatedNft.image);
//updatedNft.image = `your_image_path/${sanitizedImageName}`;

const armoryBucket = process.env.ARMORY_BUCKET;
const armoryAssets = process.env.ARMORY_ASSETS;
const syndicateBucket = process.env.SYNDICATE_BUCKET;
const syndicateAssets = process.env.SYNDICATE_ASSETS;

const s3 = new AWS.S3();

const uploadDir = path.join(__dirname, '/uploads/');
const uploadDir2 = path.join(__dirname, '/weaponNftImage/');

// Ensure the uploads folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

//const traitIdList = traitsFile;

const weaponListPath = path.join(__dirname, 'weaponList.json');
const armorysFilePath = path.join(__dirname, 'armoryIds.json');

let weaponList = [];

try {
    const rawData = fs.readFileSync(weaponListPath);
    weaponList = JSON.parse(rawData);
    console.log("weaponList [] : " + weaponList);
    console.log("Weapon ID List Loaded Successfully");
} catch (err) {
    console.error("Error loading weaponList.json:", err);
}

const traitIdListPath = path.join(__dirname, 'traitIdList.json');
let traitIdList = [];

try {
    const rawData = fs.readFileSync(traitIdListPath);
    traitIdList = JSON.parse(rawData);
    console.log("Trait ID List Loaded Successfully");
} catch (err) {
    console.error("Error loading traitIdList.json:", err);
}

//const imageMappings = imageMappingsFile;

// Function to upload file to S3
async function uploadToS3(filePath, tokenId) {
    try {
        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: syndicateBucket,
            Key: `${tokenId}.json`,
            Body: fileContent,
            ContentType: 'application/json'
        };

        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully. ${data.Location}`);
        return data.Location;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
}

// Function to upload file to S3
async function uploadToS3ImgArmories(filePath, tokenId) {
    try {
        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: armoryBucket,
            Key: `${tokenId}.png`,
            Body: fileContent,
            ContentType: 'image/png'
        };

        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully. ${data.Location}`);
        return data.Location;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
}

async function uploadToS3Img(filePath, tokenId) {
    try {
        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: syndicateBucket,
            Key: `${tokenId}.png`,
            Body: fileContent,
            ContentType: 'image/png'
        };

        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully. ${data.Location}`);
        return data.Location;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
}

// Use the JWT key
const pinataSDK = require('@pinata/sdk');
//const { verifyMessage } = require('ethers');
const pinata = new pinataSDK({ pinataJWTKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwOGYyMjVmNi01ZjVmLTQ1MmEtYWIzNS1kNWNhMmE4ZjBhMjUiLCJlbWFpbCI6ImNyb3Nza2l0dGllc25mdHNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjIyYTc5N2RlOGQ0MDc5M2U4ZjNjIiwic2NvcGVkS2V5U2VjcmV0IjoiMDdjNDUwY2IxMTQ4MWRiZjA3YjI4ZTU3NGFlYzZjOTlmYTQwZGIxMzBiZGQxYTczNmUxMGRmYWRiODcyYjQ4OSIsImV4cCI6MTc1MzIwMDU1NX0.VpcgwYgOUj8by3J57ew6GFCf0HXOGSq-31r0JbLqisE' });


// Security best practices
app.use(helmet());
app.use(upload());

app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

var corsOptions = {
    origin: ['https://d2mlmfod4h1sc4.cloudfront.net/', 'https://adminrabbit.vercel.app/', 'https://frontend-check-ten.vercel.app/', 'https://roboticrabbitsyndicate.io/'],
    optionsSuccessStatus: 200,
    methods: "GET,POST",
    allowedHeaders: ["Content-Type"],
    exposedHeaders: ["Content-Type"],
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

const clients = []; // Store active connections for SSE

// Server-Sent Events endpoint
router.get('/events', cors(corsOptions), async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Ensure headers are sent immediately

    // Send an initial comment to establish the connection
    res.write(': Connected\n\n');

    clients.push(res); // Store the response object

    req.on('close', () => {
        clients.splice(clients.indexOf(res), 1);
    });
});

// Send updates to all connected SSE clients
function sendUpdate(message) {
    clients.forEach(client => {
        client.write(`data: ${message}\n\n`); // Correct SSE format
    });
}

// Mount the router at a specific path
app.use('/api', router);


//.................START INVENTORY.................

async function generateImageFromMetadata(savePath, SELECTED_TOKEN_ID) {
    try {
        console.log("imageMappings : " + imageMappings);
        const jsonData = JSON.parse(fs.readFileSync(savePath, 'utf8'));

        // Extract images based on trait_type and value
        const imageUrls = jsonData.attributes
            .map(({ trait_type, value }) => {
                console.log("img urls ---------------------------------------- ");
                const cleanedValue = value.trim(); // Trim spaces

                console.log("jsonData value: " + trait_type);
                console.log("jsonData value: " + value);
                console.log("...............#.........#........... ");
                console.log("trait_type.value : " + imageMappings[trait_type]?.[cleanedValue]);

                return imageMappings[trait_type]?.[cleanedValue]; // Safely access mapping

            })
            .filter(url => url); // Remove undefined values

        if (imageUrls.length === 0) {
            console.log("No valid images found for the given metadata.");
            return;
        }

        console.log("Image URLs to be layered (bottom to top):", imageUrls);

        // Merge images
        const finalImage = await mergeImages(imageUrls);
        // const outputFilePath = `./outputImgs/${SELECTED_TOKEN_ID}.png`;
        const outputFilePath = `./outputImgs/${SELECTED_TOKEN_ID}.png`;

        // Save final image
        fs.writeFileSync(outputFilePath, finalImage);
        console.log(`Final image created: ${outputFilePath}`);

        //Transfer to S3 bucket
        await uploadToS3Img(outputFilePath, SELECTED_TOKEN_ID);

        const url = `./metadata/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

        const response = JSON.parse(fs.readFileSync(url, 'utf8'));

        console.log("response.image : " + response.image);
        response.image = `${syndicateAssets}${SELECTED_TOKEN_ID}.png`;
        console.log(`Updated image URL to: ${response.image}`);

        savePath = `./metadata/${SELECTED_TOKEN_ID}.json`; // Path where you want to save the updated file
        // Create a new file name
        const dir = path.dirname(savePath);
        const baseName = path.basename(savePath, '.json');
        const newFilePath = path.join(dir, `${baseName}_1.json`);

        // Write updated JSON to a new file
        fs.writeFileSync(newFilePath, JSON.stringify(response, null, 2));

        // Delete the original file if it exists locally
        if (fs.existsSync(savePath)) {
            fs.unlinkSync(savePath);
        }

        // Rename the new file to the original file's name
        fs.renameSync(newFilePath, savePath);


        await uploadToS3(savePath, SELECTED_TOKEN_ID);
        console.log(`Final json created: ${syndicateAssets}${SELECTED_TOKEN_ID}.json`);


        //https://robotic-rabbit-collection.s3.amazonaws.com/8.png

    } catch (error) {
        console.error("Error processing metadata:", error);
        return;
    }
}

async function generateImageFromMetadataForAdminPanel(savePath, SELECTED_TOKEN_ID) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(savePath, 'utf8'));
        console.log("I'm inside img generator ---------------------------------");
        console.log("jsonData : " + jsonData);

        // Extract images based on trait_type and value
        const imageUrls = jsonData.attributes
            .map(({ trait_type, value }) => {
                console.log("img urls ---------------------------------------- ");
                const cleanedValue = value.trim(); // Trim spaces

                console.log("jsonData value: " + trait_type);
                console.log("jsonData value: " + value);
                console.log("...............#.........#........... ");
                console.log("trait_type.value : " + imageMappings[trait_type]?.[cleanedValue]);

                return imageMappings[trait_type]?.[cleanedValue]; // Safely access mapping
            })
            .filter(url => url); // Remove undefined values

        if (imageUrls.length === 0) {
            console.log("No valid images found for the given metadata.");
            return;
        }

        console.log("Image URLs to be layered (bottom to top):", imageUrls);

        // Merge images
        const finalImage = await mergeImages(imageUrls);
        // const outputFilePath = `./outputImgs/${SELECTED_TOKEN_ID}.png`;
        const outputFilePath = `./outputImgs/${SELECTED_TOKEN_ID}.png`;

        // Save final image
        fs.writeFileSync(outputFilePath, finalImage);
        console.log(`Final image created: ${outputFilePath}`);

        //Transfer to S3 bucket
        const imgUploadAdminPanel = await uploadToS3Img(outputFilePath, SELECTED_TOKEN_ID);
        console.log("imgUploadAdminPanel : " + imgUploadAdminPanel);
        return imgUploadAdminPanel;

    } catch (error) {
        console.error("Error processing metadata:", error);
    }
}

async function generateImageforFrontend(imageUrls) {
    try {
        const finalImageBuffer = await mergeImages(imageUrls);

        // Convert buffer to Base64
        const finalImageBase64 = `data:image/png;base64,${finalImageBuffer.toString("base64")}`;

        console.log("Final image generated successfully.");

        return finalImageBase64; // Return Base64 string

    } catch (error) {
        console.error("Error processing metadata:", error);
        return null;
    }
}

async function mergeImages(imageUrls) {
    const images = await Promise.all(imageUrls.map(url => loadImage(url)));

    // Assume all images have the same width & height
    const width = images[0].width;
    const height = images[0].height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw images in order (bottom to top)
    images.forEach(image => {
        ctx.drawImage(image, 0, 0, width, height);
    });

    return canvas.toBuffer("image/png");
}

router.post('/addDrone', cors(corsOptions), async (req, res) => {

    try {
        sendUpdate("Sending Data..."); // Inform frontend

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
        const isAvailable = fs.existsSync(path.resolve(__dirname, './scripts/mint_drn.js'));
        console.log("mint.js available - /mint :" + isAvailable);
        const deployScriptPath = path.resolve(__dirname, './scripts/');

        console.log("Request body:", req.body); // Debugging the incoming payload
        let SELECTED_TOKEN_ID = req.body.selectedTokenId_server;
        let MINTING_SPECIAL = req.body.mintingSpecial_server;
        console.log("SELECTED_TOKEN_ID:", SELECTED_TOKEN_ID);
        console.log("BURNING_SPECIAL:", MINTING_SPECIAL);

        let chainName;
        //  let sNetwork = req.body.selectededNetwork;
        // console.log("sNetwork : " + sNetwork);

        if (req.body.selectededNetwork == '137') {
            chainName = 'polygonMumbai';
            console.log("SelectedNetwork" + chainName);
        }

        if (req.body.selectededNetwork == '5') {
            chainName = 'goerliTestnet';
            console.log("SelectedNetwork" + chainName);
        }


        const _RECEIVED_DRONE_VALUE = req.body.RECEIVED_DRONE_VALUE
        console.log("_RECEIVED_DRONE_VALUE" + _RECEIVED_DRONE_VALUE);

        sendUpdate("Executing Blockchain Functions...");

        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/burn_drn.js',
            '--network',
            'polygonMumbai'
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
                ...process.env,
                CHAIN_ID: req.body.selectedNetwork,
                USER_ADDRESS: req.body.userAddress_server,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                __RECEIVED_DRONE_VALUE: _RECEIVED_DRONE_VALUE
            },
        });

        childProcess.on('close', async (code) => {
            try {
                if (code === 5) {
                    console.log("I'm back to prev code");

                    sendUpdate("Adjusting Metadata...");

                    try {
                        const url = `https://robotic-rabbit-metadata-live-replica05.s3.us-east-2.amazonaws.com/${SELECTED_TOKEN_ID}.json`;

                        const droneTraitType = 'Drone'; // New attribute
                        let droneValue;

                        if (_RECEIVED_DRONE_VALUE == 39) {
                            droneValue = 'SkyHopper';
                        } else if (_RECEIVED_DRONE_VALUE == 40) {
                            droneValue = 'SpectraFly';
                        } else if (_RECEIVED_DRONE_VALUE == 41) {
                            droneValue = 'GoldenGlider';
                        }


                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        // Remove "Drone" attribute if it exists
                        jsonData.attributes = jsonData.attributes.filter(attr => attr.trait_type !== droneTraitType);

                        // Re-add "Drone" at the end
                        jsonData.attributes.push({ trait_type: droneTraitType, value: droneValue });
                        console.log(`Ensured "Drone" is the last attribute: ${droneValue}`);

                        // Save updated metadata
                        const savePath = `./metadata/${SELECTED_TOKEN_ID}.json`;
                        const dir = path.dirname(savePath);
                        const baseName = path.basename(savePath, '.json');
                        const newFilePath = path.join(dir, `${baseName}_1.json`);

                        fs.writeFileSync(newFilePath, JSON.stringify(jsonData, null, 2));

                        if (fs.existsSync(savePath)) {
                            fs.unlinkSync(savePath);
                        }
                        fs.renameSync(newFilePath, savePath);

                        console.log(`File updated and saved as: ${savePath}`);

                        // Generate image based on metadata
                        await generateImageFromMetadata(savePath, SELECTED_TOKEN_ID);

                    } catch (error) {
                        sendUpdate("Metadata Adjustment Failed.");
                        console.error('Error processing the JSON file:', error.message);
                    }

                    sendUpdate("Process Completed!");
                    console.log("Deployment successful");
                    sendUpdate("Blockchain Execution Failed.");
                    res.send(`CS_SPOkay`);
                } else {
                    console.log("Error during deployment");
                    sendUpdate("Blockchain Execution Failed.");
                    res.status(500).send('Error during deployment');
                }
            } catch (err) {
                sendUpdate("Error Occurred.");
                console.log(err);
            }

        });

        // Capture stdout
        let stdoutData = '';
        childProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log("data :" + data.toString()); // Log the output to the console
        });

        // Log errors"
        childProcess.stderr.on('data', (data) => {
            console.error('new stderr-deploy:', data.toString());
        });

        // console.log("data" + req.body.totalSupply);

        //  }


    } catch (error) {
        console.error('error:', error);
        res.status(500).send('Error during deployment');
        res.send(`networkError`);
    }

});

router.post('/removeDrone', cors(corsOptions), async (req, res) => {

    try {

        sendUpdate("Sending Data..."); // Inform frontend

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


        const _RECEIVED_DRONE_VALUE = req.body.RECEIVED_DRONE_VALUE
        console.log("_RECEIVED_DRONE_VALUE" + _RECEIVED_DRONE_VALUE);

        sendUpdate("Executing Blockchain Functions...");

        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/mint_drn.js',
            '--network',
            'polygonMumbai'
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
              ...process.env,
                CHAIN_ID: req.body.selectededNetwork,
                USER_ADDRESS: req.body.userAddress,
                _SELECTED_TOKEN_ID: req.body.selectedTokenId_server,
                __RECEIVED_DRONE_VALUE: _RECEIVED_DRONE_VALUE
            },
        });


        childProcess.on('close', async (code) => {
            try {
                if (code === 5) {
                    console.log("I'm back to prev code");
                    sendUpdate("Adjusting Metadata...");

                    try {
                        const url = `https://robotic-rabbit-metadata-live-replica05.s3.us-east-2.amazonaws.com/${SELECTED_TOKEN_ID}.json`;

                        const droneTraitType = 'Drone'; // New attribute
                        const droneValue = 'None'; // Value from frontend        


                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        // Remove "Drone" attribute if it exists
                        jsonData.attributes = jsonData.attributes.filter(attr => attr.trait_type !== droneTraitType);

                        // Re-add "Drone" at the end
                        jsonData.attributes.push({ trait_type: droneTraitType, value: droneValue });
                        console.log(`Ensured "Drone" is the last attribute: ${droneValue}`);

                        // Save updated metadata
                        const savePath = `./metadata/${SELECTED_TOKEN_ID}.json`;
                        const dir = path.dirname(savePath);
                        const baseName = path.basename(savePath, '.json');
                        const newFilePath = path.join(dir, `${baseName}_1.json`);

                        fs.writeFileSync(newFilePath, JSON.stringify(jsonData, null, 2));

                        if (fs.existsSync(savePath)) {
                            fs.unlinkSync(savePath);
                        }
                        fs.renameSync(newFilePath, savePath);

                        console.log(`File updated and saved as: ${savePath}`);

                        // Generate image based on metadata
                        await generateImageFromMetadata(savePath, SELECTED_TOKEN_ID);

                    } catch (error) {
                        sendUpdate("Metadata Adjustment Failed.");
                        console.error('Error processing the JSON file:', error.message);
                    }

                    sendUpdate("Process Completed!");
                    console.log("Deployment successful");
                    res.send(`CS_SPOkay`);
                } else {
                    console.log("Error during deployment");
                    sendUpdate("Blockchain Execution Failed.");
                    res.status(500).send('Error during deployment');
                }
            } catch (err) {
                sendUpdate("Error Occurred.");
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

router.post('/changeSyndicateMetadata_SP', cors(corsOptions), async (req, res) => {

    try {
        sendUpdate("Sending Data..."); // Inform frontend

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

        sendUpdate("Executing Blockchain Functions...");

        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/mint_SP.js',
            '--network',
            'polygonMumbai'
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
              ...process.env,
                CHAIN_ID: req.body.selectededNetwork,
                USER_ADDRESS: req.body.userAddress,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                _MINTING_SPECIAL: MINTING_SPECIAL
            },
        });


        childProcess.on('close', async (code) => {
            try {

                if (code === 5) {
                    sendUpdate("Adjusting Metadata...");

                    console.log("I'm back to prev code");


                    // Deployment successful

                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const url = `https://robotic-rabbit-metadata-live-replica05.s3.us-east-2.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Special Power'; // The trait type to update or add
                        const value = 'None'; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        //  const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        //  jsonData.image = newImageUrl;
                        //  console.log(`Updated image URL to: ${newImageUrl}`);

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

                        // Upload the updated file to S3
                        // await uploadToS3(savePath, SELECTED_TOKEN_ID);

                        console.log(`File updated and uploaded to S3: ${savePath}`);

                        console.log(`File updated and saved as: ${savePath}`);

                        // <Section> // - Reading Metadata
                        // Run the function
                        await generateImageFromMetadata(savePath, SELECTED_TOKEN_ID);
                        //   </Section> // - Reading Metadata

                    } catch (error) {
                        sendUpdate("Metadata Adjustment Failed.");
                        console.error('Error processing the JSON file:', error.message);
                    }

                    sendUpdate("Process Completed!");
                    console.log("Deployment successful");
                    res.send(`CS_SPOkay`);
                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    sendUpdate("Blockchain Execution Failed.");
                    res.status(500).send('Error during deployment');
                }
            } catch (err) {
                sendUpdate("Error Occurred.");
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
        sendUpdate("Sending Data..."); // Inform frontend

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

        sendUpdate("Executing Blockchain Functions...");

        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/mint_WP.js',
            '--network',
            'polygonMumbai'
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
              ...process.env,
                CHAIN_ID: req.body.selectededNetwork,
                USER_ADDRESS: req.body.userAddress,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                _MINTING_WEAPON: MINTING_WEAPON
            },
        });


        childProcess.on('close', async (code) => {
            try {

                if (code === 5) {
                    sendUpdate("Adjusting Metadata...");

                    console.log("I'm back to prev code");

                    // Deployment successful

                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const url = `https://robotic-rabbit-metadata-live-replica05.s3.us-east-2.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Weapons and Gear'; // The trait type to update or add
                        const value = 'None'; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        //const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        //jsonData.image = newImageUrl;
                        //console.log(`Updated image URL to: ${newImageUrl}`);

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

                        // Upload the updated file to S3
                        await uploadToS3(savePath, SELECTED_TOKEN_ID);

                        console.log(`File updated and uploaded to S3: ${savePath}`);

                        console.log(`File updated and saved as: ${savePath}`);

                        // <Section> // - Reading Metadata
                        // Run the function
                        await generateImageFromMetadata(savePath, SELECTED_TOKEN_ID);
                        //   </Section> // - Reading Metadata

                    } catch (error) {
                        sendUpdate("Metadata Adjustment Failed.");
                        console.error('Error processing the JSON file:', error.message);
                    }

                    sendUpdate("Process Completed!");
                    console.log("Deployment successful");
                    res.send(`CS_WGOkay`);
                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    sendUpdate("Blockchain Execution Failed.");
                    //  res.status(500).send('Error during deployment');
                }
            } catch (err) {
                sendUpdate("Error Occurred.");
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

        sendUpdate("Sending Data..."); // Inform frontend

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
        const isAvailable = fs.existsSync(path.resolve(__dirname, './scripts/burn_sp.js'));
        console.log("burn_sp.js available - /burn_sp :" + isAvailable);
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

        sendUpdate("Executing Blockchain Functions...");

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
              ...process.env,
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

                if (code === 5) {
                    sendUpdate("Adjusting Metadata...");

                    console.log("I'm back to prev code");

                    // Deployment successful
                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const url = `https://robotic-rabbit-metadata-live-replica05.s3.us-east-2.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Special Power'; // The trait type to update or add
                        const value = weaponList[BURNING_SPECIAL_ID]; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        //const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        //  jsonData.image = newImageUrl;
                        // console.log(`Updated image URL to: ${newImageUrl}`);

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

                        // Upload the updated file to S3
                        await uploadToS3(savePath, SELECTED_TOKEN_ID);

                        console.log(`File updated and uploaded to S3: ${savePath}`);

                        console.log(`File updated and saved as: ${savePath}`);

                        // <Section> // - Reading Metadata

                        // Run the function
                        await generateImageFromMetadata(savePath, SELECTED_TOKEN_ID);

                        //   </Section> // - Reading Metadata


                    } catch (error) {
                        sendUpdate("Metadata Adjustment Failed.");
                        console.error('Error processing the JSON file:', error.message);
                    }

                    sendUpdate("Process Completed!");
                    console.log("Deployment successful");
                    res.send(`SPOkay`);
                } else {
                    // Deployment failed
                    sendUpdate("Blockchain Execution Failed.");
                    console.log("Error during deployment");
                    //  res.status(500).send('Error during deployment');
                }
            } catch (err) {
                sendUpdate("Error Occurred.");
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

        sendUpdate("Adjusting Metadata...");

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
        const isAvailable = fs.existsSync(path.resolve(__dirname, './scripts/burn_wp.js'));
        console.log("burn_wp.js available - /burn_wp :" + isAvailable);
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

        sendUpdate("Executing Blockchain Functions...");

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
              ...process.env,
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

                if (code === 5) {
                    sendUpdate("Adjusting Metadata...");

                    console.log("I'm back to prev code");

                    // Deployment successful
                    // Metadata change after theWeapon got minted successfuly

                    try {

                        const url = `https://robotic-rabbit-metadata-live-replica05.s3.us-east-2.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

                        const traitType = 'Weapons and Gear'; // The trait type to update or add
                        const value = weaponList[BURNING_WEAPON_ID]; // The value provided by the user (can be changed to AK47, AK48, etc.)
                        //const newImageUrl = `https://robotic-rabbit-collection.s3.amazonaws.com/noWeaponRabbit/${SELECTED_TOKEN_ID}.png`; // New image URL
                        //const newImageUrl = `https://bafybeiamdsnltto6afcwcag433i2abmsp7azgxo62utxx7yninsc3jm6cy.ipfs.w3s.link/pending.png`; // New image URL

                        // Fetch the JSON file from the URL
                        const response = await axios.get(url);
                        const jsonData = response.data;

                        //jsonData.image = newImageUrl;
                        //console.log(`Updated image URL to: ${newImageUrl}`);

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

                        // Upload the updated file to S3
                        await uploadToS3(savePath, SELECTED_TOKEN_ID);

                        console.log(`File updated and uploaded to S3: ${savePath}`);

                        console.log(`File updated and saved as: ${savePath}`);


                        // <Section> // - Reading Metadata


                        // Run the function
                        await generateImageFromMetadata(savePath, SELECTED_TOKEN_ID);
                        //   </Section> // - Reading Metadata

                    } catch (error) {
                        sendUpdate("Metadata Adjustment Failed.");
                        console.error('Error processing the JSON file:', error.message);
                    }

                    sendUpdate("Process Completed!");
                    console.log("Deployment successful");
                    res.send(`WPOkay`);


                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    //  res.status(500).send('Error during deployment');
                    sendUpdate("Blockchain Execution Failed.");

                }
            } catch (err) {
                console.log(err);
                sendUpdate("Error Occurred.");
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

router.post('/createUpgradeImg_copy', cors(corsOptions), async (req, res) => {
    try {
        let upgradedTraitDetails = req.body._upgradedTraitDetails;
        let upgradedTraitDetails2 = req.body._upgradedTraitDetails2;

        console.log("In createUpgradeImg");
        console.log("upgradedTraitDetails : " + JSON.stringify(upgradedTraitDetails));
        console.log("upgradedTraitDetails2 : " + JSON.stringify(upgradedTraitDetails2));

        if (!Array.isArray(upgradedTraitDetails) || !Array.isArray(upgradedTraitDetails2)) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        const types1 = upgradedTraitDetails.map(item => item.type);
        const types2 = upgradedTraitDetails2.map(item => item.type);

        console.log("Received types1:", types1);
        console.log("Received types2:", types2);

        const imagePathMapping1 = {
            "Base": "./upgrades/Base.png",
            "Body": "./upgrades/BodyGreen.png",
            "Skull": "./upgrades/Skull-Green.png",
            "Eyes": "./upgrades/EyesGreen.png",
            "Mouth": "./upgrades/MouthGreen.png",
            "Head": "./upgrades/HeadGreen.png",
        };

        const imagePathMapping2 = {
            "Base": "./upgrades/Base.png",  // Keep Base consistent
            "Body": "./upgrades/BodyBlue.png",
            "Skull": "./upgrades/Skull-Blue.png",
            "Eyes": "./upgrades/EyesBlue.png",
            "Mouth": "./upgrades/MouthBlue.png",
            "Head": "./upgrades/HeadBlue.png",
        };

        // Ensure 'Base' is the first element
        const baseImage = imagePathMapping1["Base"];

        // Combine unique types from both arrays
        const allTypes = [...new Set([...types1, ...types2])];

        // Determine the final image paths, prioritizing imagePathMapping2
        const imagePaths = [
            baseImage,  // Always include Base first
            ...allTypes.filter(type => type !== "Base").map(type => imagePathMapping2[type] || imagePathMapping1[type])
        ];

        console.log("Final Image Paths:", imagePaths);

        // Generate and send the merged image
        const finalImage = await generateImageforFrontend(imagePaths);

        if (!finalImage) {
            return res.status(500).json({ error: "Image generation failed" });
        }

        return res.json({ image: finalImage }); // Send Base64 image to frontend

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message });
    }
});

router.post('/createUpgradeImg', cors(corsOptions), async (req, res) => {
    try {
        let upgradedTraitDetails = req.body._upgradedTraitDetails;
        let upgradedTraitDetails2 = req.body._upgradedTraitDetails2;

        console.log("In createUpgradeImg");
        console.log("upgradedTraitDetails : " + JSON.stringify(upgradedTraitDetails));
        console.log("upgradedTraitDetails2 : " + JSON.stringify(upgradedTraitDetails2));

        if (!Array.isArray(upgradedTraitDetails) || !Array.isArray(upgradedTraitDetails2)) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        const types1 = upgradedTraitDetails.map(item => item.type);
        const types2 = upgradedTraitDetails2.map(item => item.type);

        console.log("Received types1:", types1);
        console.log("Received types2:", types2);

        const imagePathMapping1 = {
            "Base": "./upgrades/Base.png",
            "Body": "./upgrades/BodyGreen.png",
            "Skull": "./upgrades/Skull-Green.png",
            "Eyes": "./upgrades/EyesGreen.png",
            "Mouth": "./upgrades/MouthGreen.png",
            "Head": "./upgrades/HeadGreen.png",
        };

        const imagePathMapping2 = {
            "Base": "./upgrades/Base.png",  // Keep Base consistent
            "Body": "./upgrades/BodyBlue.png",
            "Skull": "./upgrades/Skull-Blue.png",
            "Eyes": "./upgrades/EyesBlue.png",
            "Mouth": "./upgrades/MouthBlue.png",
            "Head": "./upgrades/HeadBlue.png",
        };

        // Ensure 'Base' is the first element
        const baseImage = imagePathMapping1["Base"];

        // Combine unique types from both arrays
        const allTypes = [...new Set([...types1, ...types2])];

        // Determine the final image paths, prioritizing imagePathMapping2 only if type exists in types2
        const imagePaths = [
            baseImage,  // Always include Base first
            ...allTypes
                .filter(type => type !== "Base")
                .map(type => types2.includes(type) ? imagePathMapping2[type] : imagePathMapping1[type])
        ];

        console.log("Final Image Paths:", imagePaths);

        // Generate and send the merged image
        const finalImage = await generateImageforFrontend(imagePaths);

        if (!finalImage) {
            return res.status(500).json({ error: "Image generation failed" });
        }

        return res.json({ image: finalImage }); // Send Base64 image to frontend

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message });
    }
});

async function mergeImagesUpgrades(imagePaths) {
    try {
        // Load all images from the provided file paths
        const images = await Promise.all(imagePaths.map(p => loadImage(p)));

        // Assume that all images share the same dimensions (use the first image's dimensions)
        const width = images[0].width;
        const height = images[0].height;

        // Create a canvas and draw each image in order
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        images.forEach(image => {
            ctx.drawImage(image, 0, 0, width, height);
        });

        // Return the final merged image as a PNG buffer
        return canvas.toBuffer("image/png");
    } catch (error) {
        console.error("Error merging images:", error);
        throw error;
    }
}


function getTraitId(selectedUpgradedTrait) {
    if (!traitIdList || !Array.isArray(traitIdList)) {
        console.error("Error: traitIdList is not loaded or not an array.");
        return null;
    }

    const trait = traitIdList.find(trait => trait.name === selectedUpgradedTrait);

    if (!trait) {
        console.warn(`Trait '${selectedUpgradedTrait}' not found.`);
        return null;
    }

    return trait.id;
}


router.post('/upgradeExistingTrait', cors(corsOptions), async (req, res) => {

    try {
        sendUpdate("Sending Data..."); // Inform frontend

        const resolvedOrNull = await which('npx', { nothrow: true });
        console.log("resolvedOrNull : " + resolvedOrNull);

        const hardhatresolvedOrNull = await which('hardhat', { nothrow: true });
        console.log("resolvedOrNull : " + hardhatresolvedOrNull);
        const hardhatresolvedOrNull2 = path.resolve(__dirname, './node_modules/.bin/hardhat');

        const npxPath = resolvedOrNull;
        const hardhatConfigPath = path.resolve(__dirname, './hardhat.config.js');

        //.......................................................................................
        const selectedUpgradedTrait = req.body._selectedUpgradedTrait;
        const tokenId = req.body._tokenId;
        const traitType = req.body._traitType;
        const userAddress = req.body._userAddress;
        const traitId = getTraitId(selectedUpgradedTrait);

        console.log("Resolved Trait ID:", traitId);

        if (traitId === null) {
            return res.status(400).json({ error: `Trait ID not found for ${selectedUpgradedTrait}` });
        }

        console.log("Received payload:", { selectedUpgradedTrait, tokenId, traitType, traitId });

        sendUpdate("Executing Blockchain Functions...");

        const childProcess = spawn(npxPath, [
            hardhatresolvedOrNull2,
            'run',
            './scripts/upgradeTraitsByUser.js',
            '--network',
            'polygonMumbai'
        ], {
            cwd: /*deployScriptPath8*/__dirname,
            env: {
                // Pass variables as environment variables
              ...process.env,
                traitId: traitId,
                nftId: tokenId,
                USER_ADDRESS: userAddress,
                // _MSG: req.body.message,
                //_SIGNATURE: req.body.signature


            },
        });
        //.......................................................................................


        childProcess.on('close', async (code) => {
            if (code === 5) {
                try {
                    const metadataUrl = `https://robotic-rabbit-metadata-live-replica05.s3.us-east-2.amazonaws.com/${tokenId}.json`;
                    console.log("Fetching metadata from:", metadataUrl);
                    const metadataResponse = await axios.get(metadataUrl);
                    const metadata = metadataResponse.data;

                    if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
                        console.error("Invalid metadata format");
                        return res.status(400).json({ error: "Invalid metadata format" });
                    }

                    const traitsFolder = path.join(__dirname, 'traits');
                    const upgradedTraitsFolder = path.join(__dirname, 'upgradedTraits');

                    let imagePaths = [];
                    for (const attr of metadata.attributes) {
                        if (attr.trait_type === traitType) {
                            const upgradedImageFileName = `${selectedUpgradedTrait}_Upgraded.png`;
                            const upgradedImagePath = path.join(upgradedTraitsFolder, upgradedImageFileName);
                            if (fs.existsSync(upgradedImagePath)) {
                                imagePaths.push(upgradedImagePath);
                            } else {
                                console.warn("Upgraded image not found for", traitType, upgradedImagePath);
                            }
                        } else {
                            const traitImagePath = path.join(traitsFolder, attr.trait_type, `${attr.value}.png`);
                            if (fs.existsSync(traitImagePath)) {
                                imagePaths.push(traitImagePath);
                            } else {
                                console.warn("Trait image not found:", traitImagePath);
                            }
                        }
                    }

                    console.log("Merging images...");
                    const finalImageBuffer = await mergeImagesUpgrades(imagePaths);
                    console.log("Images merged successfully.");

                    const finalImagesFolder = path.join(__dirname, 'finalImages');
                    if (!fs.existsSync(finalImagesFolder)) {
                        fs.mkdirSync(finalImagesFolder, { recursive: true });
                    }
                    const finalImagePath = path.join(finalImagesFolder, `${tokenId}.png`);
                    fs.writeFileSync(finalImagePath, finalImageBuffer);
                    console.log("Final image saved at", finalImagePath);

                    const imgLocation = await uploadToS3Img(finalImagePath, tokenId);
                    console.log("imgLocation : " + imgLocation);
                    console.log("running after uploading img to the bucket")
                    metadata.attributes = metadata.attributes.map(attr => {
                        if (attr.trait_type === traitType) {
                            attr.value = `${selectedUpgradedTrait} upgraded`;
                        }
                        return attr;
                    });

                    metadata.image = imgLocation;

                    await saveAndUploadMetadata(tokenId, metadata);

                    sendUpdate("Process Completed!");

                    return res.json({ finalImagePath });


                } catch (err) {
                    console.log(err);
                    sendUpdate("Error Occurred.");
                }
            } else {
                // Deployment failed
                console.log("Error during deployment");
                //  res.status(500).send('Error during deployment');
                sendUpdate("Blockchain Execution Failed.");

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


    } catch (err) {
        sendUpdate("Error Occurred.");

        console.error("Error in /upgradeExistingTrait:", err);
        return res.status(500).json({ error: err.message });
    }
});

async function saveAndUploadMetadata(tokenId, metadata) {
    try {
        const metadataFolder = path.join(__dirname, 'metadata');
        if (!fs.existsSync(metadataFolder)) {
            fs.mkdirSync(metadataFolder, { recursive: true });
        }

        const metadataFilePath = path.join(metadataFolder, `${tokenId}.json`);
        fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
        console.log("Metadata saved locally at", metadataFilePath);

        // Read metadata file correctly
        const fileContent = fs.readFileSync(metadataFilePath, 'utf8');
        const metadataBuffer = Buffer.from(fileContent); // Convert to Buffer


        const s3Params = {
            Bucket: syndicateBucket,
            Key: `${tokenId}.json`,
            Body: metadataBuffer,
            ContentType: "application/json",
        };

        const data = await s3.upload(s3Params).promise();
        console.log(`Metadata uploaded successfully at ${data.Location}`);
        return data.Location;


    } catch (error) {
        console.error("Error saving and uploading metadata:", error);
        throw error;
    }
}

//.................END IINVENTORY.................


//.................START ADMIN PANEL.................

router.post('/armoryCreation', cors(corsOptions), async (req, res) => {
    try {
        if (!req.body || !req.body.file) {
            return res.status(400).json({ error: 'No file received' });
        }

        const { nftName, description, nftType, nftId } = req.body;
        console.log("nftName:", nftName);
        console.log("description:", description);
        console.log("nftId:", nftId);
        console.log("nftType:", nftType);

        // Decode and save the image
        const fileBase64 = req.body.file.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(fileBase64, 'base64');
        const imagePath = path.join(uploadDir, `${nftId}.png`);

        fs.writeFileSync(imagePath, imageBuffer);
        console.log('File saved as:', imagePath);

        // Upload image to S3
        const imgPathS3 = await uploadToS3ImgArmories(imagePath, nftId);
        console.log("Image uploaded to S3");


        try {
            // Read the existing weapon list
            let weaponListData = fs.readFileSync(weaponListPath, 'utf-8');
            let weaponList = JSON.parse(weaponListData);

            let traitIdListData = fs.readFileSync(traitIdListPath, 'utf-8');
            let traitIdList = JSON.parse(traitIdListData);


            /*   // Check if the name already exists in the trait list
               const nameExists = traitIdList.some(item => item.name === nftName);
               if (nameExists) {
                   console.log(`${nftName} already exists in traitIdList.json`);
                   // Don't return here, just note the error
                   return res.status(400).json({ error: 'Name already exists in trait list' });
               }
   */


            // Check if nftId exists in weaponList
            if (weaponList[nftId - 1] && weaponList[nftId - 1].length > 0) {
                // Replace existing value
                console.log(`Replacing ${weaponList[nftId - 1]} with ${nftName}`);
                weaponList[nftId - 1] = nftName;

                // Determine the correct type for the trait
                let traitType = nftType;
                if (nftType === "Special Gear" || nftType === "Special Weapon") {
                    traitType = "Weapons and Gear";
                }


                const newTrait = {
                    id: traitIdList.length > 0 ? Math.max(...traitIdList.map(item => item.id)) : 1,
                    type: traitType,
                    name: nftName,
                    upgradeAvailable: false
                };
                // Add the new trait to the list
                delete traitIdList[Number(traitIdList.length) - 1];
                traitIdList[Number(traitIdList.length) - 1] = newTrait;



            } else {
                // Append if nftId is not found or is empty
                if (!weaponList.includes(nftName)) {
                    weaponList[nftId - 1] = nftName;

                    // Determine the correct type for the trait
                    let traitType = nftType;
                    if (nftType === "Special Gear" || nftType === "Special Weapon") {
                        traitType = "Weapons and Gear";
                    }


                    // Create new trait entry only if name doesn't exist
                    const newTrait = {
                        id: traitIdList.length > 0 ? Math.max(...traitIdList.map(item => item.id)) + 1 : 1,
                        type: traitType,
                        name: nftName,
                        upgradeAvailable: false
                    };

                    // Add the new trait to the list
                    traitIdList.push(newTrait);

                    console.log(`Successfully added ${nftName} to weaponList.json`);
                    console.log(`Successfully added ${nftName} to traitIdList.json`);

                } else {
                    console.log(`${nftName} already exists in weaponList.json`);
                    return res.status(400).json({ error: 'Name already exists' });
                }
            }

            // Write the updated list back to the file
            fs.writeFileSync(weaponListPath, JSON.stringify(weaponList, null, 2), 'utf-8');

            // Write the updated list back to the file
            fs.writeFileSync(traitIdListPath, JSON.stringify(traitIdList, null, 2), 'utf-8');


        } catch (err) {
            console.error("Error updating weaponList.json:", err);
        }


        // Create and save metadata
        const metadata = {
            name: nftName,
            description: description,
            image: imgPathS3,
            edition: nftId,
            attributes: [
                {
                    "trait_type": `Type`,
                    "value": `${nftType}`
                }
            ]
        };

        const metadataPath = path.join(uploadDir, `${nftId}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log("Metadata file saved:", metadataPath);

        // Read metadata file correctly
        const fileContent = fs.readFileSync(metadataPath, 'utf8');
        const metadataBuffer = Buffer.from(fileContent); // Convert to Buffer

        const params = {
            Bucket: armoryBucket,
            Key: `${nftId}.json`,
            Body: metadataBuffer,
            ContentType: 'application/json'
        };

        await uploadToS3ArmoriesJson(params);
        console.log("Metadata uploaded to S3");

        //................ARMORY DATA.......................

        // Read existing data
        let jsonData;
        try {
            const rawData = fs.readFileSync(armorysFilePath, 'utf-8');
            jsonData = JSON.parse(rawData);
            console.log("rawData : " + rawData);
        } catch (err) {
            return res.status(500).json({ error: 'Error reading file' });
        }

        // Check if the nftId exists in any category and remove it
        Object.keys(jsonData).forEach((category) => {
            const index = jsonData[category].indexOf(nftId);
            if (index !== -1) {
                // Remove the nftId from the existing category
                jsonData[category].splice(index, 1);
                console.log(`Removed nftId ${nftId} from category ${category}`);
            }
        });

        // Ensure the weaponType exists in the JSON file
        let __nftType = nftType;
        // Determine the correct type for the trait
        if (nftType === "Special Gear" || nftType === "Special Weapon") {
            __nftType = "Weapon and Gear";
            console.log("traitType 1 : " + nftType);

        }

        if (jsonData[__nftType]) {

            // Append the new ID to the requested type
            jsonData[__nftType].push(nftId);
        }





        // Write updated data back to file
        try {
            fs.writeFileSync(armorysFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        } catch (err) {
            return res.status(500).json({ error: 'Error writing file' });
        }

        console.log("ID added successfully under the requested type");

        res.json({
            message: "NFT metadata created and uploaded successfully",
            filePath: metadataPath,
            updatedData: jsonData
        });

    } catch (error) {
        console.error('Error processing NFT:', error);
        res.status(500).json({ error: 'Failed to process NFT. Please try again.' });
    }
});

router.post('/armoryCreation2', cors(corsOptions), async (req, res) => {
    try {
        if (!req.body || !req.body.file) {
            return res.status(400).json({ error: 'No file received' });
        }

        const { slectedId } = req.body;
        console.log("nftId:", slectedId);

        // Decode and save the image
        const fileBase64 = req.body.file.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(fileBase64, 'base64');
        const imagePath = path.join(uploadDir2, `${slectedId}.png`);

        fs.writeFileSync(imagePath, imageBuffer);
        console.log('File saved as:', imagePath);

        // Upload image to S3
        const imgPathS3 = await uploadToS3ImgArmories(imagePath, slectedId);
        console.log("Image uploaded to S3");

        res.json({
            message: "NFT metadata created and uploaded successfully",
        });


    } catch (error) {
        console.error('Error processing NFT:', error);
        res.status(500).json({ error: 'Failed to process NFT. Please try again.' });
    }
});

async function uploadToS3ArmoriesJson(params) {
    try {
        const data = await s3.upload(params).promise();
        console.log(`File uploaded successfully at ${data.Location}`);
        return data.Location;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
}

const imageMappingsFilePath = path.join(__dirname, "imageMappings.json");

async function updateImageMappings(traitType, upgradedTraitName, filename) {
    // Read the existing imageMappings.json file
    fs.readFile(imageMappingsFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading imageMappings file:", err);
            return;
        }

        let imageMappings = {};

        // Parse JSON if file is not empty
        if (data.trim()) {
            try {
                // imageMappings = JSON.parse(data);
                imageMappings = JSON.parse(fs.readFileSync(imageMappingsFilePath, 'utf8'));

            } catch (parseError) {
                console.error("Error parsing imageMappings JSON:", parseError);
                return;
            }
        }

        // Ensure the traitType exists in the JSON structure
        if (!imageMappings[traitType]) {
            imageMappings[traitType] = {};
        }

        // Append the new upgraded trait **without overwriting existing ones**
        imageMappings[traitType][upgradedTraitName] = `./upgradedTraits/${filename}`;

        // Write the updated JSON back to the file
        fs.writeFile(imageMappingsFilePath, JSON.stringify(imageMappings, null, 2), "utf8", (err) => {
            if (err) {
                console.error("Error updating imageMappings file:", err);
                return;
            }
            console.log(`Trait "${upgradedTraitName}" added successfully under "${traitType}" in imageMappings.json`);
        });
    });
}


router.post("/uploadUpgradedImages", cors(corsOptions), async (req, res) => {
    // Ensure the upgradedTraits folder exists
    const uploadDir = path.join(__dirname, "upgradedTraits");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Extract base64 image & trait name
    const { base64Image, traitName, traitId, traitType } = req.body;

    console.log("base64Image:", base64Image ? "[Received]" : "undefined");
    console.log("traitName:", traitName);

    //console.log("base64Image : " + base64Image);

    if (!base64Image || !traitName) {
        return res.status(400).json({ error: "Missing base64 image or trait name" });
    }

    // Extract file extension from base64 data
    const match = base64Image.match(/^data:image\/(\w+);base64,/);
    if (!match) {
        return res.status(400).json({ error: "Invalid base64 image format" });
    }
    const extension = match[1]; // Extract file extension (png, jpg, etc.)

    // Construct filename and path
    //  const filename = `${traitName.replace(/\s+/g, "_")}_Upgraded.${extension}`;
    const filename = `${traitName}_Upgraded.png`;
    const filePath = path.join(uploadDir, filename);
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, ""); // Remove base64 prefix

    // Save the file
    fs.writeFile(filePath, base64Data, "base64", (err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to save file" });
        }
        //upgradeTraitsByAdmin(traitId, traitName, traitType, res);

        // Upgrade trait and update imageMappings
        const upgradedTraitName = `${traitName} upgraded`;
        upgradeTraitsByAdmin(traitId, traitName, traitType, res);
        updateImageMappings(traitType, upgradedTraitName, filename);
    });
});

router.post("/update-nft", cors(corsOptions), async (req, res) => {
    try {

        const updatedNft = req.body; // Get the NFT data from the request body
        console.log("Received updated NFT data:", JSON.stringify(updatedNft, null, 2));

        // Ensure the folder exists
        const folderPath = path.join(__dirname, "adminEditedMetadata");
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Generate a unique filename using the NFT name or timestamp
        const fileName = `${updatedNft.edition}.json`;
        const filePath = path.join(folderPath, fileName);
        fs.writeFileSync(filePath, JSON.stringify(updatedNft, null, 2), "utf8");

        // Save the JSON file

        const imgUploadedLocation = await generateImageFromMetadataForAdminPanel(filePath, updatedNft.edition);
        updatedNft.image = imgUploadedLocation;
        console.log("updatedNft.image : " + updatedNft.image);
        console.log("imgUploadedLocation : " + imgUploadedLocation);
        console.log("updatedNft : " + JSON.stringify(updatedNft));

        fs.writeFileSync(filePath, JSON.stringify(updatedNft, null, 2), "utf8");

        const metadataSavedPath = await saveAndUploadMetadata(updatedNft.edition, updatedNft);
        console.log("metadataSavedPath :" + metadataSavedPath);
        return res.status(200).json({ message: "NFT metadata updated and saved successfully", success: true, filePath });

    } catch (error) {
        console.error("Error updating NFT metadata:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

router.post("/upload-nft-image", cors(corsOptions), async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ message: "No image file uploaded", success: false });
        }

        if (!req.body.metadata) {
            return res.status(400).json({ message: "No metadata provided", success: false });
        }

        const updatedNft = JSON.parse(req.body.metadata); // Parse the metadata string
        console.log("updatedNft :" + JSON.stringify(updatedNft));

        // Ensure the folder exists
        const folderPath = path.join(__dirname, "adminEditedImages");
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        console.log("updatedNft.edition : " + updatedNft.edition);

        const fileName = `${updatedNft.edition}.json`;
        const filePath = path.join(folderPath, fileName);

        const imageFile = req.files.image;
        const imageName = `${updatedNft.edition}.png`;
        const imagePath = path.join(folderPath, imageName);

        // Save the image
        await imageFile.mv(imagePath);

        // Upload image to S3
        const imgUploadAdminPanel = await uploadToS3Img(imagePath, updatedNft.edition);
        console.log("imgUploadAdminPanel : " + imgUploadAdminPanel);

        // Update the NFT with new image URL
        updatedNft.image = imgUploadAdminPanel;

        // Save updated metadata
        fs.writeFileSync(filePath, JSON.stringify(updatedNft, null, 2), "utf8");

        // Upload metadata to S3
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const metadataBuffer = Buffer.from(fileContent);

        const s3Params = {
            Bucket: syndicateBucket,
            Key: `${updatedNft.edition}.json`,
            Body: metadataBuffer,
            ContentType: "application/json",
        };

        await s3.upload(s3Params).promise();

        // Return the updated NFT data including the new image URL
        res.json({
            message: "NFT image updated successfully",
            success: true,
            nft: updatedNft,  // Send back the full updated NFT
            imageUrl: imgUploadAdminPanel  // Also send just the image URL
        });

    } catch (error) {
        console.error("Error updating NFT image:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
            error: error.message
        });
    }
});
//.................END ADMIN PANEL.................

router.get('/check', cors(corsOptions), async (req, res) => {

    //console.log("imageMappings:", JSON.stringify(imageMappings)); 
    console.log("imageMappings:", JSON.stringify(imageMappings, null, 2));

    res.send(`successful`);
});

//-------//-------//

const traitIDList_filePath = path.join(__dirname, 'traitIdList.json');

// Set a secret API key (store this in an `.env` file)
const API_KEY = process.env.API_KEY || 'mysecretkey';

// Middleware to check API key
const authenticate = (req, res, next) => {
    const userApiKey = req.headers['x-api-key'];
    if (userApiKey !== API_KEY) {
        return res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// API route to fetch traits (open to everyone)
router.get('/traits', cors(corsOptions), async (req, res) => {
    fs.readFile(traitIDList_filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read traits file' });
        }
        res.json(JSON.parse(data));
    });
});

// API route to fetch traits (open to everyone)
router.get('/weapons', cors(corsOptions), async (req, res) => {
    fs.readFile(weaponListPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read weapons file' });
        }
        res.json(JSON.parse(data));
    });
});

// API route to fetch traits (open to everyone)
router.get('/armories', cors(corsOptions), async (req, res) => {
    fs.readFile(armorysFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read weapons file' });
        }
        res.json(JSON.parse(data));
    });
});

async function upgradeTraitsByAdmin(traitId, traitName, traitType, res) {
    fs.readFile(traitIDList_filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ error: 'Failed to read file' });
        }

        let traits = [];

        // Ensure we have valid JSON before parsing
        if (data.trim()) {
            try {
                traits = JSON.parse(data);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                return res.status(500).json({ error: 'Invalid JSON format in file' });
            }
        }

        console.log("Existing traits JSON array:", traits);

        let upgradedTraitName = `${traitName} upgraded`
        // Create a new trait object correctly

        // Find the highest existing traitId
        const lastTraitId = traits.length > 0 ? Math.max(...traits.map(trait => trait.id)) : 0;
        const newTraitId = lastTraitId + 1; // Increment the ID

        const newTrait = {
            id: Number(`${newTraitId}`), // Keeping the modified traitId if required
            type: traitType,
            name: upgradedTraitName,
            upgradeAvailable: false
        };

        // Append new trait to the existing array
        traits.push(newTrait);

        // Write back the updated array to the file
        fs.writeFile(traitIDList_filePath, JSON.stringify(traits, null, 2), 'utf8', (err) => {
            if (err) {
                console.error("Error saving trait:", err);
                return res.status(500).json({ error: 'Failed to save trait' });
            }

            return res.status(201).json({ message: 'Trait added successfully', trait: newTrait });
        });
    });
}

//-------//-------//

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

  })
.catch(err => {
    console.error("Failed to load secrets:", err);
    process.exit(1);
  });

