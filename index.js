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
const AWS = require('aws-sdk');
const { createCanvas, loadImage } = require('canvas');


// Set the limit to 50MB for JSON payloads
app.use(bodyParser.json({ limit: '50mb' }));

// Set the limit to 50MB for URL-encoded payloads
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
});

const s3 = new AWS.S3();

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

const imageMappings = {

    //Background
    "Background": {
        "Cyber Gray": "./traits/Background/Cyber Gray.png",
        "Green": "./traits/Background/Green.png",
        "Lime Green": "./traits/Background/Lime Green.png",
        "Mustard": "./traits/Background/Mustard.png",
        "Orange": "./traits/Background/Orange.png",
        "Pink": "./traits/Background/Pink.png",
        "Plum Purple": "./traits/Background/Plum Purple.png",
        "Red": "./traits/Background/Red.png",
        "Sky Blue": "./traits/Background/Sky Blue.png",
        "Tan": "./traits/Background/Tan.png",
        "Teal": "./traits/Background/Teal.png",
        "Violet": "./traits/Background/Violet.png",
    },

    //Body    
    "Body": {
        "AirBunny Armor": "./traits/Body/AirBunny Armor.png",
        "Alien Armor": "./traits/Body/Alien Armor.png",
        "Amazonian Armor": "./traits/Body/Amazonian Armor.png",
        "Argentinian Armor": "./traits/Body/Argentinian Armor.png",
        "BareBionic Build": "./traits/Body/BareBionic Build.png",
        "BatBunny Body Armor": "./traits/Body/BatBunny Body Armor.png",
        "BattlerBunny Bodysuit": "./traits/Body/BattlerBunny Bodysuit.png",
        "BayBattler Body": "./traits/Body/BayBattler Body.png",
        "Bedouin Bodyplate": "./traits/Body/Bedouin Bodyplate.png",
        "Bendy Body": "./traits/Body/Bendy Body.png",
        "BeskarBunny Plate": "./traits/Body/BeskarBunny Plate.png",
        "BlazeBunny Mech Suit": "./traits/Body/BlazeBunny Mech Suit.png",
        "BluTron Barrier": "./traits/Body/BluTron Barrier.png",
        "Carrotanium Armor": "./traits/Body/Carrotanium Armor.png",
        "Cell_s Suit": "./traits/Body/Cell_s Suit.png",
        "CoinQuest Coverall": "./traits/Body/CoinQuest Coverall.png",
        "Cpt.Rabbit Artisan Armor": "./traits/Body/Cpt.Rabbit Artisan Armor.png",
        "Dark Tron": "./traits/Body/Dark Tron.png",
        "FutureFlux Fit": "./traits/Body/FutureFlux Fit.png",
        "Geisha_s Guarding Gown": "./traits/Body/Geisha_s Guarding Gown.png",
        "Golden Dummy": "./traits/Body/Golden Dummy.png",
        "Golden PikaGuard": "./traits/Body/Golden PikaGuard.png",
        "GrayForge Armor": "./traits/Body/GrayForge Armor.png",
        "GreenForge Armor": "./traits/Body/GreenForge Armor.png",
        "Ice Armor": "./traits/Body/Ice Armor.png",
        "Juggernaut Jason": "./traits/Body/Juggernaut Jason.png",
        "Levitate Lifter": "./traits/Body/Levitate Lifter.png",
        "LuchaBot": "./traits/Body/LuchaBot.png",
        "MagentaMach Armor": "./traits/Body/MagentaMach Armor.png",
        "MegaRabbit Armor": "./traits/Body/MegaRabbit Armor.png",
        "Mutant Mech Mantle": "./traits/Body/Mutant Mech Mantle.png",
        "PeaceLeaf Protector": "./traits/Body/PeaceLeaf Protector.png",
        "Pearl StewBot Bod": "./traits/Body/Pearl StewBot Bod.png",
        "PurpLuxe Plate": "./traits/Body/PurpLuxe Plate.png",
        "Rabbit-O Rig": "./traits/Body/Rabbit-O Rig.png",
        "Rainbow Ice Rig": "./traits/Body/Rainbow Ice Rig.png",
        "RebelRed Archer": "./traits/Body/RebelRed Archer.png",
        "RoboRabbit": "./traits/Body/RoboRabbit.png",
        "RoboRacer Rig": "./traits/Body/RoboRacer Rig.png",
        "RoboWizard Robe": "./traits/Body/RoboWizard Robe.png",
        "Royal Rabbit Robe": "./traits/Body/Royal Rabbit Robe.png",
        "Royal Samurai Armor": "./traits/Body/Royal Samurai Armor.png",
        "RoyalSea Armor": "./traits/Body/.png",
        "RubyRonin Samurai Armor": "./traits/Body/RoyalSea Armor.png",
        "SamCircuit Suit": "./traits/Body/SamCircuit Suit.png",
        "Steel CircusSuit": "./traits/Body/Steel CircusSuit.png",
        "SteelSentry Suit": "./traits/Body/SteelSentry Suit.png",
        "StewBot Shell": "./traits/Body/StewBot Shell.png",
        "StoneStare Suit": "./traits/Body/StoneStare Suit.png",
        "Teal TitanPlate": "./traits/Body/Teal TitanPlate.png",
        "ThunderGod Guard": "./traits/Body/ThunderGod Guard.png",
        "VioletVessle Vestiture": "./traits/Body/VioletVessle Vestiture.png",
        "WoodenSherrif Shell": "./traits/Body/WoodenSherrif Shell.png",
    },

    //Drone
    "Drone": {
        "GoldenGlider": "./traits/Drone/GoldenGlider.png",
        "SkyHopper": "./traits/Drone/SkyHopper.png",
        "SpectraFly": "./traits/Drone/SpectraFly.png",
    },


    //Eyes
    "Eyes": {
        "Alien Abyss Oculars": "./traits/Eyes/Alien Abyss Oculars.png",
        "Annoyed Baller": "./traits/Eyes/Annoyed Baller.png",
        "Armored Blinds": "./traits/Eyes/Armored Blinds.png",
        "Awesomo Abyss Stare": "./traits/Eyes/Awesomo Abyss Stare.png",
        "BlazeSpiral Sight": "./traits/Eyes/BlazeSpiral Sight.png",
        "Blue Side Eye": "./traits/Eyes/Blue Side Eye.png",
        "BronzeLooker Lenses": "./traits/Eyes/BronzeLooker Lenses.png",
        "CitrusGlow Gaze": "./traits/Eyes/CitrusGlow Gaze.png",
        "DummyDot Sight": "./traits/Eyes/DummyDot Sight.png",
        "eye": "./traits/Eyes/eye.png",
        "eyes08": "./traits/Eyes/eyes08.png",
        "eyes25": "./traits/Eyes/eyes25.png",
        "eyes26": "./traits/Eyes/eyes26.png",
        "eyes27": "./traits/Eyes/eyes27.png",
        "FuturaBend Focus": "./traits/Eyes/FuturaBend Focus.png",
        "GandEyes Gaze": "./traits/Eyes/GandEyes Gaze.png",
        "Geisha Optic Gaze": "./traits/Eyes/Geisha Optic Gaze.png",
        "Golden Pika Peekers": "./traits/Eyes/Golden Pika Peekers.png",
        "Golden Solar Flare Visor": "./traits/Eyes/Golden Solar Flare Visor.png",
        "GothamGlare Gaze": "./traits/Eyes/GothamGlare Gaze.png",
        "Green Apathy Gaze": "./traits/Eyes/Green Apathy Gaze.png",
        "GreenGlow Glance": "./traits/Eyes/GreenGlow Glance.png",
        "GridGlow Gaze": "./traits/Eyes/GridGlow Gaze.png",
        "Icy Eyes": "./traits/Eyes/Icy Eyes.png",
        "Jason_s MenacingMystery Glare": "./traits/Eyes/Jason_s MenacingMystery Glare.png",
        "Lashed Look": "./traits/Eyes/Lashed Look.png",
        "LuchaLibre Look": "./traits/Eyes/LuchaLibre Look.png",
        "Mean Green": "./traits/Eyes/Mean Green.png",
        "MonoScope Vision": "./traits/Eyes/MonoScope Vision.png",
        "Mutant Mire Gaze": "./traits/Eyes/Mutant Mire Gaze.png",
        "NeonNexus Gaze": "./traits/Eyes/NeonNexus Gaze.png",
        "OrangeOS Oculars": "./traits/Eyes/OrangeOS Oculars.png",
        "Pink Laser Patch Peeker": "./traits/Eyes/Pink Laser Patch Peeker.png",
        "Poseidon_s Peepers": "./traits/Eyes/Poseidon_s Peepers.png",
        "PyroPupil Peepers": "./traits/Eyes/PyroPupil Peepers.png",
        "Rainbow Ice Readers": "./traits/Eyes/Rainbow Ice Readers.png",
        "RedRage Gaze": "./traits/Eyes/RedRage Gaze.png",
        "RoseRefractor Gaze": "./traits/Eyes/RoseRefractor Gaze.png",
        "Scrutiny Stare": "./traits/Eyes/Scrutiny Stare.png",
        "SeaSight Sensors": "./traits/Eyes/SeaSight Sensors.png",
        "ShockGlare Stare": "./traits/Eyes/ShockGlare Stare.png",
        "Side Eye": "./traits/Eyes/Side Eye.png",
        "Steel Sights": "./traits/Eyes/Steel Sights.png",
        "StewieBot Stare": "./traits/Eyes/StewieBot Stare.png",
        "Super Seer": "./traits/Eyes/Super Seer.png",
        "TiltedToke Twinkle": "./traits/Eyes/TiltedToke Twinkle.png",
        "T-Scan Lenses": "./traits/Eyes/T-Scan Lenses.png",
        "UnoDangle Damaged Optic": "./traits/Eyes/UnoDangle Damaged Optic.png",
        "Zombie Sam Seeing": "./traits/Eyes/Zombie Sam Seeing.png",
    },

    //Weapons and Gear
    "Weapons and Gear": {
        "BowlCape Drape": "./traits/Gear/BowlCape Drape.png",
        "BrainBoost Tubing": "./traits/Gear/BrainBoost Tubing.png",
        "CarrotKendo Katana": "./traits/Gear/CarrotKendo Katana.png",
        "CrashCable Cluster": "./traits/Gear/CrashCable Cluster.png",
        "CrimsonCollar Cape": "./traits/Gear/CrimsonCollar Cape.png",
        "Diamond EarlyBird Scythe": "./traits/Gear/Diamond EarlyBird Scythe.png",
        "Flaming Phoenix Wings": "./traits/Gear/Flaming Phoenix Wings.png",
        "ForceHop Pouch": "./traits/Gear/ForceHop Pouch.png",
        "Golden Guardian Throne": "./traits/Gear/Golden Guardian Throne.png",
        "Golden Pika Tail": "./traits/Gear/Golden Pika Tail.png",
        "Golden VIP AK47": "./traits/Gear/Golden VIP AK47.png",
        "GothamGuardian Cape": "./traits/Gear/GothamGuardian Cape.png",
        "HareBot Helper": "./traits/Gear/HareBot Helper.png",
        "HazeBlaze Hammer": "./traits/Gear/HazeBlaze Hammer.png",
        "Jason_s Terror Tools": "./traits/Gear/Jason_s Terror Tools.png",
        "MaxMint Mallet": "./traits/Gear/MaxMint Mallet.png",
        "Medusa_s Pointed Pelerine": "./traits/Gear/Medusa_s Pointed Pelerine.png",
        "Minter’s Guardian Sword": "./traits/Gear/Minter’s Guardian Sword.PNG",
        "Mutant Spine Spikes": "./traits/Gear/Mutant Spine Spikes.png",
        "PiranhaPlant Blaster": "./traits/Gear/PiranhaPlant Blaster.png",
        "Poseidon_s Poker": "./traits/Gear/Poseidon_s Poker.png",
        "RoboRabbit Cape": "./traits/Gear/RoboRabbit Cape.png",
        "SandStorm Sword": "./traits/Gear/SandStorm Sword.png",
        "SpiderSlicer Claws": "./traits/Gear/SpiderSlicer Claws.png",
        "StellarSpike Spine": "./traits/Gear/StellarSpike Spine.png",
        "Stew Zapper Pack": "./traits/Gear/Stew Zapper Pack.png",
        "Tactical Turret": "./traits/Gear/Tactical Turret.png",
        "TimeTail Thrusters": "./traits/Gear/TimeTail Thrusters.png",
        "Toxic Inferno Cannons": "./traits/Gear/Toxic Inferno Cannons.png",
        "Villain FireFox Blade": "./traits/Gear/Villain FireFox Blade.png",
        "Western Wrangler_s Rifle": "./traits/Gear/Western Wrangler_s Rifle.png",
    },

    //Head
    "Head": {
        "Alien Ape Controller": "./traits/Head/Alien Ape Controller.png",
        "Alien Slimy Ears": "./traits/Head/Alien Slimy Ears.png",
        "BasicBolt BunnyEars": "./traits/Head/BasicBolt BunnyEars.png",
        "BendBunny Brink": "./traits/Head/BendBunny Brink.png",
        "Boxed Brain": "./traits/Head/Boxed Brain.png",
        "Brady_s Brain Bracer": "./traits/Head/Brady_s Brain Bracer.png",
        "Brilliant Blue GoggleTop": "./traits/Head/Brilliant Blue GoggleTop.png",
        "Bronze StewBot Ears": "./traits/Head/Bronze StewBot Ears.png",
        "BronzeBolt Helm": "./traits/Head/BronzeBolt Helm.png",
        "CaptainCam Cap": "./traits/Head/CaptainCam Cap.png",
        "CarrotCrest Crown": "./traits/Head/CarrotCrest Crown.png",
        "CarrotCrown Cap": "./traits/Head/CarrotCrown Cap.png",
        "Carroteers Keffiyeh": "./traits/Head/Carroteers Keffiyeh.png",
        "CellShell Crest": "./traits/Head/CellShell Crest.png",
        "CoralKing Crown": "./traits/Head/CoralKing Crown.png",
        "CyberCottontail Kabuto": "./traits/Head/CyberCottontail Kabuto.png",
        "Dark TronTopper Helmet": "./traits/Head/Dark TronTopper Helmet.png",
        "DroneDoc Dome": "./traits/Head/DroneDoc Dome.png",
        "DuoDisk Dome": "./traits/Head/DuoDisk Dome.png",
        "FireFull Helmet": "./traits/Head/FireFull Helmet.png",
        "FocusFrame Beanie": "./traits/Head/FocusFrame Beanie.png",
        "GeishaGear Helm": "./traits/Head/GeishaGear Helm.png",
        "Golden PikaPeak": "./traits/Head/Golden PikaPeak.png",
        "Golden Test Dummy Receptors": "./traits/Head/Golden Test Dummy Receptors.png",
        "GreenGoggle Grizzle": "./traits/Head/GreenGoggle Grizzle.png",
        "Hooper Hears": "./traits/Head/Hooper Hears.png",
        "Ice Intellect": "./traits/Head/Ice Intellect.png",
        "Jason_s GreyMatter Glance": "./traits/Head/Jason_s GreyMatter Glance.png",
        "KingRabbit Crown": "./traits/Head/KingRabbit Crown.png",
        "Krusty_s Crown": "./traits/Head/Krusty_s Crown.png",
        "Laser Lid": "./traits/Head/Laser Lid.png",
        "LibertyLid Top Hat": "./traits/Head/LibertyLid Top Hat.png",
        "LicenseLuck Beanie": "./traits/Head/LicenseLuck Beanie.png",
        "MandoMecha Mantle": "./traits/Head/MandoMecha Mantle.png",
        "Medusa_s Hissing Mantle": "./traits/Head/Medusa_s Hissing Mantle.png",
        "Mega Helmet": "./traits/Head/Mega Helmet.png",
        "Mockingjay Braid": "./traits/Head/Mockingjay Braid.png",
        "Mutant Apex Cranium": "./traits/Head/Mutant Apex Cranium.png",
        "NightKnight Noggin": "./traits/Head/NightKnight Noggin.png",
        "Rabbio_s Helmet": "./traits/Head/Rabbio_s Helmet.png",
        "RaggaeRabbit Cap": "./traits/Head/RaggaeRabbit Cap.png",
        "Rainbow Ice Helm": "./traits/Head/Rainbow Ice Helm.png",
        "Royal Ronin Kabuto": "./traits/Head/Royal Ronin Kabuto.png",
        "SockHop Lucha Mask": "./traits/Head/SockHop Lucha Mask.png",
        "Sorcerer_s Seer Cap": "./traits/Head/Sorcerer_s Seer Cap.png",
        "Steel Super Scalp": "./traits/Head/Steel Super Scalp.png",
        "TronTopper Helmet": "./traits/Head/TronTopper Helmet.png",
        "TurboTop Helmet": "./traits/Head/TurboTop Helmet.png",
        "Western Felt Hat": "./traits/Head/Western Felt Hat.png",
        "White StewBot Ears": "./traits/Head/White StewBot Ears.png",
        "WolfShade Mystic Helm": "./traits/Head/WolfShade Mystic Helm.png",
    },

    //Mouth
    "Mouth": {
        "Ahhh Orate": "./traits/Mouth/Ahhh Orate.png",
        "Alien Activated Aperture": "./traits/Mouth/Alien Activated Aperture.png",
        "Baller_s Breath": "./traits/Mouth/Baller_s Breath.png",
        "Bendy Bite": "./traits/Mouth/Bendy Bite.png",
        "Bewildered Buccal": "./traits/Mouth/Bewildered Buccal.png",
        "BlazeBarrier Breather": "./traits/Mouth/BlazeBarrier Breather.png",
        "BlipBloop Lips": "./traits/Mouth/BlipBloop Lips.png",
        "BluntBunny Bite": "./traits/Mouth/BluntBunny Bite.png",
        "BountyBreath Barrier": "./traits/Mouth/BountyBreath Barrier.png",
        "ButtonBros Bite": "./traits/Mouth/ButtonBros Bite.png",
        "Cardboard Cutout Chatter": "./traits/Mouth/Cardboard Cutout Chatter.png",
        "Carrot Chomp": "./traits/Mouth/Carrot Chomp.png",
        "CarrotGrenade Gnaw": "./traits/Mouth/CarrotGrenade Gnaw.png",
        "Circus Smirk": "./traits/Mouth/Circus Smirk.png",
        "CrimsonCloth Bandanna": "./traits/Mouth/CrimsonCloth Bandanna.png",
        "Dark TronTalker": "./traits/Mouth/Dark TronTalker.png",
        "GadotGoddess Grin": "./traits/Mouth/GadotGoddess Grin.png",
        "Geisha_s Grin": "./traits/Mouth/Geisha_s Grin.png",
        "Golden Grill Grin": "./traits/Mouth/Golden Grill Grin.png",
        "Golden Spark Grin": "./traits/Mouth/Golden Spark Grin.png",
        "Golden Test Dummy Chompers": "./traits/Mouth/Golden Test Dummy Chompers.png",
        "Gridiron Guard": "./traits/Mouth/Gridiron Guard.png",
        "Icy Frostbite": "./traits/Mouth/Icy Frostbite.png",
        "Jason_s Jaw": "./traits/Mouth/Jason_s Jaw.png",
        "Jolly Smile": "./traits/Mouth/Jolly Smile.png",
        "Lip Nibble": "./traits/Mouth/Lip Nibble.png",
        "Mocking Solo Smirk": "./traits/Mouth/Mocking Solo Smirk.png",
        "Mutant Muncher": "./traits/Mouth/Mutant Muncher.png",
        "Nuclear Beam Blast": "./traits/Mouth/Nuclear Beam Blast.png",
        "Nuclear Orange Blast": "./traits/Mouth/Nuclear Orange Blast.png",
        "Nuclear PinkPulse Blast": "./traits/Mouth/Nuclear PinkPulse Blast.png",
        "Olympian Orate": "./traits/Mouth/Olympian Orate.png",
        "Predator Furry Fangs": "./traits/Mouth/Predator Furry Fangs.png",
        "Rainbow Frostbite": "./traits/Mouth/Rainbow Frostbite.png",
        "Rainbow Rabbit Grill": "./traits/Mouth/Rainbow Rabbit Grill.png",
        "RedRonin Mask": "./traits/Mouth/RedRonin Mask.png",
        "Royal Samurai Respire": "./traits/Mouth/Royal Samurai Respire.png",
        "Seagod Mask": "./traits/Mouth/Seagod Mask.png",
        "Serpent Smirk": "./traits/Mouth/Serpent Smirk.png",
        "SideBite Smirk": "./traits/Mouth/SideBite Smirk.png",
        "SlyGuy Smirk": "./traits/Mouth/SlyGuy Smirk.png",
        "Smirk of Steel": "./traits/Mouth/Smirk of Steel.png",
        "Steadfast": "./traits/Mouth/Steadfast.png",
        "Steel Lock Jaw": "./traits/Mouth/Steel Lock Jaw.png",
        "StewBot Smirk": "./traits/Mouth/StewBot Smirk.png",
        "TechCarrot Mask": "./traits/Mouth/TechCarrot Mask.png",
        "TentaTaste Munch": "./traits/Mouth/TentaTaste Munch.png",
        "Terrifying Titanium Teeth": "./traits/Mouth/Terrifying Titanium Teeth.png",
        "Tron Teeth": "./traits/Mouth/Tron Teeth.png",
        "Tropic Tongue": "./traits/Mouth/Tropic Tongue.png",
        "VisionVore Lazer": "./traits/Mouth/VisionVore Lazer.png",
        "Wizard Whiskers": "./traits/Mouth/Wizard Whiskers.png",
        "Zombie Sam Snarl": "./traits/Mouth/Zombie Sam Snarl.png",
    },

    //Special Power
    "Special Power": {
        "BlazeBarrage": "./traits/Power/BlazeBarrage.png",
        "Fortune Falls Flurry": "./traits/Power/Fortune Falls Flurry.png",
        "Lightning Lash": "./traits/Power/Lightning Lash.png",
        "Luminous Carrot Cascade": "./traits/Power/Luminous Carrot Cascade.png",
        "Quantum Leap": "./traits/Power/Quantum Leap.png",
        "Terra Ascension Aura": "./traits/Power/Terra Ascension Aura.png",
        "WaterWrangler Whirl": "./traits/Power/WaterWrangler Whirl.png",
    },

    //Skull
    "Skull": {
        "Blue Gray": "./traits/Skull/Blue Gray.png",
        "Brown": "./traits/Skull/Brown.png",
        "Charcoal Gray": "./traits/Skull/Charcoal Gray.png",
        "Garnet": "./traits/Skull/Garnet.png",
        "Gold": "./traits/Skull/Gold.png",
        "Gray": "./traits/Skull/Gray.png",
        "Green": "./traits/Skull/Green.png",
        "Purple": "./traits/Skull/Purple.png",
        "Red": "./traits/Skull/Red.png",
        "Steel": "./traits/Skull/Steel.png",
        "Teal": "./traits/Skull/Teal.png",
    }
};

// Function to upload file to S3
async function uploadToS3(filePath, tokenId) {
    try {
        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: 'robotic-rabbit-metadata-live-replica04',
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

async function uploadToS3Img(filePath, tokenId) {
    try {
        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: 'robotic-rabbit-metadata-live-replica04',
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


// Load metadata and generate image
async function generateImageFromMetadata(savePath, SELECTED_TOKEN_ID) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(savePath, 'utf8'));

        // Extract images based on trait_type and value
        const imageUrls = jsonData.attributes
            .map(({ trait_type, value }) => {
                return imageMappings[trait_type]?.[value]; // Safely access mapping
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
        response.image = `https://robotic-rabbit-metadata-live-replica04.s3.amazonaws.com/${SELECTED_TOKEN_ID}.png`;
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
        console.log(`Final json created: https://robotic-rabbit-metadata-live-replica04.s3.amazonaws.com/${SELECTED_TOKEN_ID}.json`);


        //https://robotic-rabbit-collection.s3.amazonaws.com/8.png

    } catch (error) {
        console.error("Error processing metadata:", error);
    }
}

// Merge images function
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

//............................................................................//

router.post('/addDrone', cors(corsOptions), async (req, res) => {

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
                CHAIN_ID: req.body.selectedNetwork,
                USER_ADDRESS: req.body.userAddress_server,
                _SELECTED_TOKEN_ID: SELECTED_TOKEN_ID,
                __RECEIVED_DRONE_VALUE: _RECEIVED_DRONE_VALUE
            },
        });

        childProcess.on('close', async (code) => {
            try {
                if (code === 0) {
                    console.log("I'm back to prev code");
            
                    try {
                        const url = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; 
           
                        const droneTraitType = 'Drone'; // New attribute
                        let droneValue;

                        if(_RECEIVED_DRONE_VALUE == 39){
                            droneValue = 'SkyHopper';                            
                        }else if(_RECEIVED_DRONE_VALUE == 40){
                            droneValue = 'SpectraFly';
                        }else if(_RECEIVED_DRONE_VALUE == 41){
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
                        console.error('Error processing the JSON file:', error.message);
                    }
            
                    console.log("Deployment successful");
                    res.send(`CS_SPOkay`);
                } else {
                    console.log("Error during deployment");
                    res.status(500).send('Error during deployment');
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
                CHAIN_ID: req.body.selectededNetwork,
                USER_ADDRESS: req.body.userAddress,
                _SELECTED_TOKEN_ID:  req.body.selectedTokenId_server,
                __RECEIVED_DRONE_VALUE: _RECEIVED_DRONE_VALUE
            },
        });


        childProcess.on('close', async (code) => {
            try {
                if (code === 0) {
                    console.log("I'm back to prev code");
            
                    try {
                        const url = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; 
           
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
                        console.error('Error processing the JSON file:', error.message);
                    }
            
                    console.log("Deployment successful");
                    res.send(`CS_SPOkay`);
                } else {
                    console.log("Error during deployment");
                    res.status(500).send('Error during deployment');
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
            './scripts/mint_SP.js',
            '--network',
            'polygonMumbai'
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

                        const url = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

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
                        console.error('Error processing the JSON file:', error.message);
                    }

                    console.log("Deployment successful");
                    res.send(`CS_SPOkay`);
                } else {
                    // Deployment failed
                    console.log("Error during deployment");
                    res.status(500).send('Error during deployment');
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
            'polygonMumbai'
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

                        const url = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

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

                        const url = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

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

                        const url = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`; // Replace with the URL of your JSON file

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

router.get('/check', cors(corsOptions), async (req, res) => {
    res.send(`successful`);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
