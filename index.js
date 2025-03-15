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

const armoryBucket = process.env.ARMORY_BUCKET;
const armoryAssets = process.env.ARMORY_ASSETS;
const syndicateBucket = process.env.SYNDICATE_BUCKET;
const syndicateAssets = process.env.SYNDICATE_ASSETS;

const s3 = new AWS.S3();

const uploadDir = path.join(__dirname, '/uploads/');

// Ensure the uploads folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


const traitIdList = [
    { id: 1, type: 'Weapons and Gear', name: 'CarroTech' },
    { id: 2, type: 'Weapons and Gear', name: 'PiranhaPlant Blaster' },
    { id: 3, type: 'Weapons and Gear', name: 'CrimsonCollar Cape' },
    { id: 4, type: 'Weapons and Gear', name: 'CrashCable Cluster' },
    { id: 5, type: 'Weapons and Gear', name: 'HazeBlaze Hammer' },
    { id: 6, type: 'Weapons and Gear', name: "Poseidon's Poker" },
    { id: 7, type: 'Weapons and Gear', name: "Western Wrangler's Rifle" },
    { id: 8, type: 'Weapons and Gear', name: 'TimeTail Thrusters' },
    { id: 9, type: 'Weapons and Gear', name: 'CarrotKendo Katana' },
    { id: 10, type: 'Weapons and Gear', name: 'ForceHop Pouch' },
    { id: 11, type: 'Weapons and Gear', name: 'Golden Guardian Throne' },
    { id: 12, type: 'Weapons and Gear', name: 'Tactical Turret' },
    { id: 13, type: 'Weapons and Gear', name: 'Mutant Spine Spikes' },
    { id: 14, type: 'Weapons and Gear', name: 'GothamGuardian Cape' },
    { id: 15, type: 'Weapons and Gear', name: 'HareBot Helper' },
    { id: 16, type: 'Weapons and Gear', name: "Medusa's Pointed Pelerine" },
    { id: 17, type: 'Weapons and Gear', name: 'SpiderSlicer Claws' },
    { id: 18, type: 'Weapons and Gear', name: 'Stew Zapper Pack' },
    { id: 19, type: 'Weapons and Gear', name: 'Golden Pika Tail' },
    { id: 20, type: 'Weapons and Gear', name: "Jason's Terror Tools" },
    { id: 21, type: 'Weapons and Gear', name: 'RoboRabbit Cape' },
    { id: 22, type: 'Weapons and Gear', name: 'StellarSpike Spine' },
    { id: 23, type: 'Weapons and Gear', name: 'BrainBoost Tubing' },
    { id: 24, type: 'Weapons and Gear', name: 'SandStorm Sword' },
    { id: 25, type: 'Weapons and Gear', name: 'Flaming Phoenix Wings' },
    { id: 26, type: 'Weapons and Gear', name: 'BowlCape Drape' },
    { id: 27, type: 'Weapons and Gear', name: 'Toxic Inferno Cannons' },
    { id: 28, type: 'Weapons and Gear', name: 'WaterWrangler Whirl Power Box' },
    { id: 29, type: 'Weapons and Gear', name: 'Luminous Carrot Cascade Power Box' },
    { id: 30, type: 'Weapons and Gear', name: 'Lightning Lash Power Box' },
    { id: 31, type: 'Weapons and Gear', name: 'BlazeBarrage Power Box' },
    { id: 32, type: 'Weapons and Gear', name: 'Terra Ascension Aura Power Box' },
    { id: 33, type: 'Weapons and Gear', name: 'Quantum Leap' },
    { id: 34, type: 'Weapons and Gear', name: 'Fortune Falls Flurry Power Box' },
    { id: 35, type: 'Weapons and Gear', name: 'Diamond EarlyBird Scyche Special Weapon' },
    { id: 36, type: 'Weapons and Gear', name: 'MaxMint Mallet Special Weapon' },
    { id: 37, type: 'Weapons and Gear', name: 'Golden VIP AK47 Special Weapon' },
    { id: 38, type: 'Weapons and Gear', name: "Minter's Guardian Sword Special Weapon" },
    { id: 39, type: 'Weapons and Gear', name: 'Villain FoxFire Blade Special Weapon' },
    { id: 40, type: 'Weapons and Gear', name: 'SkyHopper Drone' },
    { id: 41, type: 'Weapons and Gear', name: 'SpectraFly Drone' },
    { id: 42, type: 'Weapons and Gear', name: 'GoldenGlider Drone' },

    { id: 43, type: 'Head', name: 'Alien Ape Controller' },
    { id: 44, type: 'Head', name: 'Alien Slimy Ears' },
    { id: 45, type: 'Head', name: 'BasicBolt BunnyEars' },
    { id: 46, type: 'Head', name: 'BendBunny Brink' },
    { id: 47, type: 'Head', name: 'Boxed Brain' },
    { id: 48, type: 'Head', name: "Brady's Brain Bracer" },
    { id: 49, type: 'Head', name: 'Brilliant Blue GoggleTop' },
    { id: 50, type: 'Head', name: 'Bronze StewBot Ears' },
    { id: 51, type: 'Head', name: 'BronzeBolt Helm' },
    { id: 52, type: 'Head', name: 'CaptainCam Cap' },
    { id: 53, type: 'Head', name: 'CarrotCrest Crown' },
    { id: 54, type: 'Head', name: 'CarrotCrown Cap' },
    { id: 55, type: 'Head', name: 'Carroteers Keffiyeh' },
    { id: 56, type: 'Head', name: 'CellShell Crest' },
    { id: 57, type: 'Head', name: 'CoralKing Crown' },
    { id: 58, type: 'Head', name: 'CyberCottontail Kabuto' },
    { id: 59, type: 'Head', name: 'Dark TronTopper Helmet' },
    { id: 60, type: 'Head', name: 'DroneDoc Dome' },
    { id: 61, type: 'Head', name: 'DuoDisk Dome' },
    { id: 62, type: 'Head', name: 'FireFull Helmet' },
    { id: 63, type: 'Head', name: 'FocusFrame Beanie' },
    { id: 64, type: 'Head', name: 'GeishaGear Helm' },
    { id: 65, type: 'Head', name: 'Golden PikaPeak' },
    { id: 66, type: 'Head', name: 'Golden Test Dummy Receptors' },
    { id: 67, type: 'Head', name: 'GreenGoggle Grizzle' },
    { id: 68, type: 'Head', name: 'Hooper Hears' },
    { id: 69, type: 'Head', name: 'Ice Intellect' },
    { id: 70, type: 'Head', name: "Jason's GreyMatter Glance" },
    { id: 71, type: 'Head', name: 'KingRabbit Crown' },
    { id: 72, type: 'Head', name: "Krusty's Crown" },
    { id: 73, type: 'Head', name: 'Laser Lid' },
    { id: 74, type: 'Head', name: 'LibertyLid Top Hat' },
    { id: 75, type: 'Head', name: 'LicenseLuck Beanie' },
    { id: 76, type: 'Head', name: 'MandoMecha Mantle' },
    { id: 77, type: 'Head', name: "Medusa's Hissing Mantle" },
    { id: 78, type: 'Head', name: 'Mega Helmet' },
    { id: 79, type: 'Head', name: 'Mockingjay Braid' },
    { id: 80, type: 'Head', name: 'Mutant Apex Cranium' },
    { id: 81, type: 'Head', name: 'NightKnight Noggin' },
    { id: 82, type: 'Head', name: "Rabbio's Helmet" },
    { id: 83, type: 'Head', name: 'RaggaeRabbit Cap' },
    { id: 84, type: 'Head', name: 'Rainbow Ice Helm' },
    { id: 85, type: 'Head', name: 'Royal Ronin Kabuto' },
    { id: 86, type: 'Head', name: 'SockHop Lucha Mask' },
    { id: 87, type: 'Head', name: "Sorcerer's Seer Cap" },
    { id: 88, type: 'Head', name: 'Steel Super Scalp' },
    { id: 89, type: 'Head', name: 'TronTopper Helmet' },
    { id: 90, type: 'Head', name: 'TurboTop Helmet' },
    { id: 91, type: 'Head', name: 'Western Felt Hat' },
    { id: 92, type: 'Head', name: 'White StewBot Ears' },
    { id: 93, type: 'Head', name: 'WolfShade Mystic Helm' },

    { id: 94, type: 'Eyes', name: 'Alien Abyss Oculars' },
    { id: 95, type: 'Eyes', name: 'Annoyed Baller' },
    { id: 96, type: 'Eyes', name: 'Armored Blinds' },
    { id: 97, type: 'Eyes', name: 'Awesomo Abyss Stare' },
    { id: 98, type: 'Eyes', name: 'BlazeSpiral Sight' },
    { id: 99, type: 'Eyes', name: 'Blue Side Eye' },
    { id: 100, type: 'Eyes', name: 'BronzeLooker Lenses' },
    { id: 101, type: 'Eyes', name: 'CitrusGlow Gaze' },
    { id: 102, type: 'Eyes', name: 'DummyDot Sight' },
    { id: 103, type: 'Eyes', name: 'eye' },
    { id: 104, type: 'Eyes', name: 'eyes08' },
    { id: 105, type: 'Eyes', name: 'eyes25' },
    { id: 106, type: 'Eyes', name: 'eyes26' },
    { id: 107, type: 'Eyes', name: 'eyes27' },
    { id: 108, type: 'Eyes', name: 'FuturaBend Focus' },
    { id: 109, type: 'Eyes', name: 'GandEyes Gaze' },
    { id: 110, type: 'Eyes', name: 'Geisha Optic Gaze' },
    { id: 111, type: 'Eyes', name: 'Golden Pika Peekers' },
    { id: 112, type: 'Eyes', name: 'Golden Solar Flare Visor' },
    { id: 113, type: 'Eyes', name: 'GothamGlare Gaze' },
    { id: 114, type: 'Eyes', name: 'Green Apathy Gaze' },
    { id: 115, type: 'Eyes', name: 'GreenGlow Glance' },
    { id: 116, type: 'Eyes', name: 'GridGlow Gaze' },
    { id: 117, type: 'Eyes', name: 'Icy Eyes' },
    { id: 118, type: 'Eyes', name: "Jason's MenacingMystery Glare" },
    { id: 119, type: 'Eyes', name: 'Lashed Look' },
    { id: 120, type: 'Eyes', name: 'LuchaLibre Look' },
    { id: 121, type: 'Eyes', name: 'Mean Green' },
    { id: 122, type: 'Eyes', name: 'MonoScope Vision' },
    { id: 123, type: 'Eyes', name: 'Mutant Mire Gaze' },
    { id: 124, type: 'Eyes', name: 'NeonNexus Gaze' },
    { id: 125, type: 'Eyes', name: 'OrangeOS Oculars' },
    { id: 126, type: 'Eyes', name: 'Pink Laser Patch Peeker' },
    { id: 127, type: 'Eyes', name: "Poseidon's Peepers" },
    { id: 128, type: 'Eyes', name: 'PyroPupil Peepers' },
    { id: 129, type: 'Eyes', name: 'Rainbow Ice Readers' },
    { id: 130, type: 'Eyes', name: 'RedRage Gaze' },
    { id: 131, type: 'Eyes', name: 'RoseRefractor Gaze' },
    { id: 132, type: 'Eyes', name: 'Scrutiny Stare' },
    { id: 133, type: 'Eyes', name: 'SeaSight Sensors' },
    { id: 134, type: 'Eyes', name: 'ShockGlare Stare' },
    { id: 135, type: 'Eyes', name: 'Side Eye' },
    { id: 136, type: 'Eyes', name: 'Steel Sights' },
    { id: 137, type: 'Eyes', name: 'StewieBot Stare' },
    { id: 138, type: 'Eyes', name: 'Super Seer' },
    { id: 139, type: 'Eyes', name: 'TiltedToke Twinkle' },
    { id: 140, type: 'Eyes', name: 'T-Scan Lenses' },
    { id: 141, type: 'Eyes', name: 'UnoDangle Damaged Optic' },
    { id: 142, type: 'Eyes', name: 'Zombie Sam Seeing' },

    { id: 143, type: 'Special Power', name: 'BlazeBarrage' },
    { id: 144, type: 'Special Power', name: 'Fortune Falls Flurry' },
    { id: 145, type: 'Special Power', name: 'Lightning Lash' },
    { id: 146, type: 'Special Power', name: 'Luminous Carrot Cascade' },
    { id: 147, type: 'Special Power', name: 'Quantum Leap' },
    { id: 148, type: 'Special Power', name: 'Terra Ascension Aura' },
    { id: 149, type: 'Special Power', name: 'WaterWrangler Whirl' },

    { id: 150, type: 'Background', name: 'Cyber Gray' },
    { id: 151, type: 'Background', name: 'Green' },
    { id: 152, type: 'Background', name: 'Lime Green' },
    { id: 153, type: 'Background', name: 'Mustard' },
    { id: 154, type: 'Background', name: 'Orange' },
    { id: 155, type: 'Background', name: 'Pink' },
    { id: 156, type: 'Background', name: 'Plum Purple' },
    { id: 157, type: 'Background', name: 'Red' },
    { id: 158, type: 'Background', name: 'Sky Blue' },
    { id: 159, type: 'Background', name: 'Tan' },
    { id: 160, type: 'Background', name: 'Teal' },
    { id: 161, type: 'Background', name: 'Violet' },

    { id: 162, type: 'Body', name: 'AirBunny Armor' },
    { id: 163, type: 'Body', name: 'Alien Armor' },
    { id: 164, type: 'Body', name: 'Amazonian Armor' },
    { id: 165, type: 'Body', name: 'Argentinian Armor' },
    { id: 166, type: 'Body', name: 'BareBionic Build' },
    { id: 167, type: 'Body', name: 'BatBunny Body Armor' },
    { id: 168, type: 'Body', name: 'BattlerBunny Bodysuit' },
    { id: 169, type: 'Body', name: 'BayBattler Body' },
    { id: 170, type: 'Body', name: 'Bedouin Bodyplate' },
    { id: 171, type: 'Body', name: 'Bendy Body' },
    { id: 172, type: 'Body', name: 'BeskarBunny Plate' },
    { id: 173, type: 'Body', name: 'BlazeBunny Mech Suit' },
    { id: 174, type: 'Body', name: 'BluTron Barrier' },
    { id: 175, type: 'Body', name: 'Carrotanium Armor' },
    { id: 176, type: 'Body', name: "Cell's Suit" },
    { id: 177, type: 'Body', name: 'CoinQuest Coverall' },
    { id: 178, type: 'Body', name: 'Cpt.Rabbit Artisan Armor' },
    { id: 179, type: 'Body', name: 'Dark Tron' },
    { id: 180, type: 'Body', name: 'FutureFlux Fit' },
    { id: 181, type: 'Body', name: "Geisha's Guarding Gown" },
    { id: 182, type: 'Body', name: 'Golden Dummy' },
    { id: 183, type: 'Body', name: 'Golden PikaGuard' },
    { id: 184, type: 'Body', name: 'GrayForge Armor' },
    { id: 185, type: 'Body', name: 'GreenForge Armor' },
    { id: 186, type: 'Body', name: 'Ice Armor' },
    { id: 187, type: 'Body', name: 'Juggernaut Jason' },
    { id: 188, type: 'Body', name: 'Levitate Lifter' },
    { id: 189, type: 'Body', name: 'LuchaBot' },
    { id: 190, type: 'Body', name: 'MagentaMach Armor' },
    { id: 191, type: 'Body', name: 'MegaRabbit Armor' },
    { id: 192, type: 'Body', name: 'Mutant Mech Mantle' },
    { id: 193, type: 'Body', name: 'PeaceLeaf Protector' },
    { id: 194, type: 'Body', name: 'Pearl StewBot Bod' },
    { id: 195, type: 'Body', name: 'PurpLuxe Plate' },
    { id: 196, type: 'Body', name: 'Rabbit-O Rig' },
    { id: 197, type: 'Body', name: 'Rainbow Ice Rig' },
    { id: 198, type: 'Body', name: 'RebelRed Archer' },
    { id: 199, type: 'Body', name: 'RoboRabbit' },
    { id: 200, type: 'Body', name: 'RoboRacer Rig' },
    { id: 201, type: 'Body', name: 'RoboWizard Robe' },
    { id: 202, type: 'Body', name: 'Royal Rabbit Robe' },
    { id: 203, type: 'Body', name: 'Royal Samurai Armor' },
    { id: 204, type: 'Body', name: 'RoyalSea Armor' },
    { id: 205, type: 'Body', name: 'RubyRonin Samurai Armor' },
    { id: 206, type: 'Body', name: 'SamCircuit Suit' },
    { id: 207, type: 'Body', name: 'Steel CircusSuit' },
    { id: 208, type: 'Body', name: 'SteelSentry Suit' },
    { id: 209, type: 'Body', name: 'StewBot Shell' },
    { id: 210, type: 'Body', name: 'StoneStare Suit' },
    { id: 211, type: 'Body', name: 'Teal TitanPlate' },
    { id: 212, type: 'Body', name: 'ThunderGod Guard' },
    { id: 213, type: 'Body', name: 'VioletVessle Vestiture' },
    { id: 214, type: 'Body', name: 'WoodenSherrif Shell' },

    { id: 215, type: 'Skull', name: 'Blue Gray' },
    { id: 216, type: 'Skull', name: 'Brown' },
    { id: 217, type: 'Skull', name: 'Charcoal Gray' },
    { id: 218, type: 'Skull', name: 'Garnet' },
    { id: 219, type: 'Skull', name: 'Gold' },
    { id: 220, type: 'Skull', name: 'Gray' },
    { id: 221, type: 'Skull', name: 'Green' },
    { id: 222, type: 'Skull', name: 'Purple' },
    { id: 223, type: 'Skull', name: 'Red' },
    { id: 224, type: 'Skull', name: 'Steel' },
    { id: 225, type: 'Skull', name: 'Teal' },

    { id: 226, type: 'Mouth', name: 'Ahhh Orate' },
    { id: 227, type: 'Mouth', name: 'Alien Activated Aperture' },
    { id: 228, type: 'Mouth', name: "Baller's Breath" },
    { id: 229, type: 'Mouth', name: 'Bendy Bite' },
    { id: 230, type: 'Mouth', name: 'Bewildered Buccal' },
    { id: 231, type: 'Mouth', name: 'BlazeBarrier Breather' },
    { id: 232, type: 'Mouth', name: 'BlipBloop Lips' },
    { id: 233, type: 'Mouth', name: 'BluntBunny Bite' },
    { id: 234, type: 'Mouth', name: 'BountyBreath Barrier' },
    { id: 235, type: 'Mouth', name: 'ButtonBros Bite' },
    { id: 236, type: 'Mouth', name: 'Cardboard Cutout Chatter' },
    { id: 237, type: 'Mouth', name: 'Carrot Chomp' },
    { id: 238, type: 'Mouth', name: 'CarrotGrenade Gnaw' },
    { id: 239, type: 'Mouth', name: 'Circus Smirk' },
    { id: 240, type: 'Mouth', name: 'CrimsonCloth Bandanna' },
    { id: 241, type: 'Mouth', name: 'Dark TronTalker' },
    { id: 242, type: 'Mouth', name: 'GadotGoddess Grin' },
    { id: 243, type: 'Mouth', name: "Geisha's Grin" },
    { id: 244, type: 'Mouth', name: 'Golden Grill Grin' },
    { id: 245, type: 'Mouth', name: 'Golden Spark Grin' },
    { id: 246, type: 'Mouth', name: 'Golden Test Dummy Chompers' },
    { id: 247, type: 'Mouth', name: 'Gridiron Guard' },
    { id: 248, type: 'Mouth', name: 'Icy Frostbite' },
    { id: 249, type: 'Mouth', name: "Jason's Jaw" },
    { id: 250, type: 'Mouth', name: 'Jolly Smile' },
    { id: 251, type: 'Mouth', name: 'Lip Nibble' },
    { id: 252, type: 'Mouth', name: 'Mocking Solo Smirk' },
    { id: 253, type: 'Mouth', name: 'Mutant Muncher' },
    { id: 254, type: 'Mouth', name: 'Nuclear Beam Blast' },
    { id: 255, type: 'Mouth', name: 'Nuclear Orange Blast' },
    { id: 256, type: 'Mouth', name: 'Nuclear PinkPulse Blast' },
    { id: 257, type: 'Mouth', name: 'Olympian Orate' },
    { id: 258, type: 'Mouth', name: 'Predator Furry Fangs' },
    { id: 259, type: 'Mouth', name: 'Rainbow Frostbite' },
    { id: 260, type: 'Mouth', name: 'Rainbow Rabbit Grill' },
    { id: 261, type: 'Mouth', name: 'RedRonin Mask' },
    { id: 262, type: 'Mouth', name: 'Royal Samurai Respire' },
    { id: 263, type: 'Mouth', name: 'Seagod Mask' },
    { id: 264, type: 'Mouth', name: 'Serpent Smirk' },
    { id: 265, type: 'Mouth', name: 'SideBite Smirk' },
    { id: 266, type: 'Mouth', name: 'SlyGuy Smirk' },
    { id: 267, type: 'Mouth', name: 'Smirk of Steel' },
    { id: 268, type: 'Mouth', name: 'Steadfast' },
    { id: 269, type: 'Mouth', name: 'Steel Lock Jaw' },
    { id: 270, type: 'Mouth', name: 'StewBot Smirk' },
    { id: 271, type: 'Mouth', name: 'TechCarrot Mask' },
    { id: 272, type: 'Mouth', name: 'TentaTaste Munch' },
    { id: 273, type: 'Mouth', name: 'Terrifying Titanium Teeth' },
    { id: 274, type: 'Mouth', name: 'Tron Teeth' },
    { id: 275, type: 'Mouth', name: 'Tropic Tongue' },
    { id: 276, type: 'Mouth', name: 'VisionVore Lazer' },
    { id: 277, type: 'Mouth', name: 'Wizard Whiskers' },
    { id: 278, type: 'Mouth', name: 'Zombie Sam Snarl' },

    { id: 279, type: 'Mouth', name: 'GoldenGlider' },
    { id: 280, type: 'Mouth', name: 'SkyHopper' },
    { id: 281, type: 'Mouth', name: 'SpectraFly' },
];

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

// CORS configuration
app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

var corsOptions = {
    origin: ['http://44.246.133.131', 'https://localhost:3000'],
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

const clients = []; // Store active connections for SSE

router.get('/events', cors(corsOptions), (req, res) => { // Add CORS middleware
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Ensure headers are sent immediately

    // Send a initial comment to establish the connection
    res.write(': Connected\n\n');

    clients.push(res); // Store the response object

    req.on('close', () => {
        clients.splice(clients.indexOf(res), 1);
    });
});

// Define sendUpdate to format messages properly
function sendUpdate(message) {
    clients.forEach(client => {
        client.write(`data: ${message}\n\n`); // SSE format
    });
}

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
                        const url = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${SELECTED_TOKEN_ID}.json`;

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

/*router.post('/armory-nft-create', cors(), async (req, res) => {
    try {
        const { nftImage, nftName, nftType } = req.body;

        if (!nftImage || !nftName || !nftType) {
            return res.status(400).json({ error: "Missing required NFT details" });
        }

        const metadata = {
            name: nftName,
            image: nftImage,
            type: nftType,
            attributes: []
        };

        const metadataPath = path.join(__dirname, `metadata/${nftName}.json`);

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        const fileContent = fs.readFileSync(metadataPath);
        const params = {
            Bucket: syndicateBucket,
            Key: `${tokenId}.json`,
            Body: fileContent,
            ContentType: 'application/json'
        };

        const data = await s3.upload(params).promise();

        return data.Location;

        res.json({ message: "NFT metadata created successfully", filePath: metadataPath });

    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});*/
/*
router.post('/createUpgradeImg', cors(corsOptions), async (req, res) => {
    try {
        let upgradedTraitDetails = req.body._upgradedTraitDetails;
        let upgradedTraitDetails2 = req.body._upgradedTraitDetails2;

        if (Array.isArray(upgradedTraitDetails)) {
            const types = upgradedTraitDetails.map(item => item.type);
            console.log("Received types:", types);

            // Define a mapping of types to image paths
            const imagePathMapping = {
                "Base": "./upgrades/Base.png",
                "Body": "./upgrades/BodyGreen.png",
                "Skull": "./upgrades/Skull-Green.png",
                "Eyes": "./upgrades/EyesGreen.png",
                "Mouth": "./upgrades/MouthGreen.png",
                "Head": "./upgrades/HeadGreen.png",
            };

            // Ensure 'Base' is the first element
            const baseImage = imagePathMapping["Base"];

            // Filter and sort other types based on imagePathMapping order
            const sortedTypes = Object.keys(imagePathMapping).filter(type => type !== "Base" && types.includes(type));

            // Get image paths in correct order
            const imagePaths = [baseImage, ...sortedTypes.map(type => imagePathMapping[type])];

            console.log("Final Image Paths:", imagePaths);

            // Generate and send the merged image
            const finalImage = await generateImageforFrontend(imagePaths);

            if (!finalImage) {
                return res.status(500).json({ error: "Image generation failed" });
            }

            return res.json({ image: finalImage }); // Send Base64 image to frontend

        } else {
            console.log('Error: _upgradedTraitDetails is not an array');
            //return res.status(400).json({ error: 'Invalid input data' });
        }


        if (Array.isArray(upgradedTraitDetails2)) {
            const types2 = upgradedTraitDetails2.map(item => item.type);
            console.log("Received types2:", types2);

            // Define a mapping of types to image paths
            const imagePathMapping2 = {
                "Base": "./upgrades/Base.png",
                "Body": "./upgrades/BodyBlue.png",
                "Skull": "./upgrades/Skull-Blue.png",
                "Eyes": "./upgrades/EyesBlue.png",
                "Mouth": "./upgrades/MouthBlue.png",
                "Head": "./upgrades/HeadBlue.png",
            };

            // Ensure 'Base' is the first element
            const baseImage2 = imagePathMapping2["Base"];

            // Filter and sort other types based on imagePathMapping order
            const sortedTypes2 = Object.keys(imagePathMapping2).filter(type => type !== "Base" && types2.includes(type));

            // Get image paths in correct order
            const imagePaths2 = [baseImage2, ...sortedTypes2.map(type => imagePathMapping2[type])];

            console.log("Final Image Paths:", imagePaths2);

            // Generate and send the merged image
            const finalImage2 = await generateImageforFrontend(imagePaths2);

            if (!finalImage2) {
                return res.status(500).json({ error: "Image generation failed" });
            }

            return res.json({ image: finalImage2 }); // Send Base64 image to frontend

        } else {
            console.log('Error: _upgradedTraitDetails is not an array');
            return res.status(400).json({ error: 'Invalid input data' });
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message });
    }
});*/


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


/* router.post('/upgradeExistingTrait', cors(corsOptions), async (req, res) => {
   try {
     // Get data from request body
     const selectedUpgradedTrait = req.body._selectedUpgradedTrait;
     const tokenId = req.body._tokenId;
     const traitType = req.body._traitType;
 
     console.log("Received payload:", { selectedUpgradedTrait, tokenId, traitType });
 
     // Build metadata URL and fetch JSON metadata
     const metadataUrl = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${tokenId}.json`;
     console.log("Fetching metadata from:", metadataUrl);
     const metadataResponse = await axios.get(metadataUrl);
     const metadata = metadataResponse.data;
     console.log("Fetched metadata:", metadata);
 
     if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
       console.error("Invalid metadata format");
       return res.status(400).json({ error: "Invalid metadata format" });
     }
 
     // Define base folders
     const traitsFolder = path.join(__dirname, 'traits');           // Base traits folder with subfolders per trait type
     const upgradedTraitsFolder = path.join(__dirname, 'upgradedTraits'); // Folder for upgraded trait images
 
     // Build an ordered list of image paths for merging (layer order: as in the metadata)
     let imagePaths = [];
     console.log("Processing metadata attributes...");
 
     for (const attr of metadata.attributes) {
       console.log("Processing attribute:", attr);
       // If this attribute's trait type is the one being upgraded, use the upgraded image
       if (attr.trait_type === traitType) {
         const upgradedImageFileName = `${selectedUpgradedTrait}_Upgraded.png`;
         const upgradedImagePath = path.join(upgradedTraitsFolder, upgradedImageFileName);
         console.log("Checking for upgraded image:", upgradedImagePath);
         if (fs.existsSync(upgradedImagePath)) {
           imagePaths.push(upgradedImagePath);
           console.log("Upgraded image found and added:", upgradedImagePath);
         } else {
           console.warn("Upgraded image not found for", traitType, upgradedImagePath);
         }
       } else {
         // Otherwise, use the standard trait image
         const traitImagePath = path.join(traitsFolder, attr.trait_type, `${attr.value}.png`);
         console.log("Checking for standard trait image:", traitImagePath);
         if (fs.existsSync(traitImagePath)) {
           imagePaths.push(traitImagePath);
           console.log("Standard trait image found and added:", traitImagePath);
         } else {
           console.warn("Trait image not found:", traitImagePath);
         }
       }
     }
 
     console.log("Final list of image paths:", imagePaths);
 
     // Merge the images using the canvas-based mergeImagesUpgrades function
     console.log("Merging images...");
     const finalImageBuffer = await mergeImagesUpgrades(imagePaths);
     console.log("Images merged successfully.");
 
     // Save final image to a "finalImages" folder
     const finalImagesFolder = path.join(__dirname, 'finalImages');
     if (!fs.existsSync(finalImagesFolder)) {
       fs.mkdirSync(finalImagesFolder, { recursive: true });
       console.log("Created finalImages folder at:", finalImagesFolder);
     }
     const finalImagePath = path.join(finalImagesFolder, `${tokenId}.png`);
     fs.writeFileSync(finalImagePath, finalImageBuffer);
     console.log("Final image created at", finalImagePath);
 
     // Return the final image path in the response
     return res.json({ finalImagePath });
     
   } catch (err) {
     console.error("Error in /upgradeExistingTrait:", err);
     return res.status(500).json({ error: err.message });
   }
 });
 */
/*
router.post('/upgradeExistingTrait', cors(corsOptions), async (req, res) => {
    try {
        // Get data from request body
        const selectedUpgradedTrait = req.body._selectedUpgradedTrait;
        const tokenId = req.body._tokenId;
        const traitType = req.body._traitType;

        console.log("Received payload:", { selectedUpgradedTrait, tokenId, traitType });

        // Build metadata URL and fetch JSON metadata
        const metadataUrl = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${tokenId}.json`;
        console.log("Fetching metadata from:", metadataUrl);
        const metadataResponse = await axios.get(metadataUrl);
        const metadata = metadataResponse.data;
        console.log("Fetched metadata:", metadata);

        if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
            console.error("Invalid metadata format");
            return res.status(400).json({ error: "Invalid metadata format" });
        }

        // Define base folders
        const traitsFolder = path.join(__dirname, 'traits');           // Base traits folder with subfolders per trait type
        const upgradedTraitsFolder = path.join(__dirname, 'upgradedTraits'); // Folder for upgraded trait images

        // Build an ordered list of image paths for merging (layer order: as in the metadata)
        let imagePaths = [];
        console.log("Processing metadata attributes...");

        for (const attr of metadata.attributes) {
            console.log("Processing attribute:", attr);
            // If this attribute's trait type is the one being upgraded, use the upgraded image
            if (attr.trait_type === traitType) {
                const upgradedImageFileName = `${selectedUpgradedTrait}_Upgraded.png`;
                const upgradedImagePath = path.join(upgradedTraitsFolder, upgradedImageFileName);
                console.log("Checking for upgraded image:", upgradedImagePath);
                if (fs.existsSync(upgradedImagePath)) {
                    imagePaths.push(upgradedImagePath);
                    console.log("Upgraded image found and added:", upgradedImagePath);
                } else {
                    console.warn("Upgraded image not found for", traitType, upgradedImagePath);
                }
            } else {
                // Otherwise, use the standard trait image
                const traitImagePath = path.join(traitsFolder, attr.trait_type, `${attr.value}.png`);
                console.log("Checking for standard trait image:", traitImagePath);
                if (fs.existsSync(traitImagePath)) {
                    imagePaths.push(traitImagePath);
                    console.log("Standard trait image found and added:", traitImagePath);
                } else {
                    console.warn("Trait image not found:", traitImagePath);
                }
            }
        }

        console.log("Final list of image paths:", imagePaths);

        // Merge the images using the canvas-based mergeImagesUpgrades function
        console.log("Merging images...");
        const finalImageBuffer = await mergeImagesUpgrades(imagePaths);
        console.log("Images merged successfully.");

        // Save final image to a "finalImages" folder
        const finalImagesFolder = path.join(__dirname, 'finalImages');
        if (!fs.existsSync(finalImagesFolder)) {
            fs.mkdirSync(finalImagesFolder, { recursive: true });
            console.log("Created finalImages folder at:", finalImagesFolder);
        }
        const finalImagePath = path.join(finalImagesFolder, `${tokenId}.png`);
        fs.writeFileSync(finalImagePath, finalImageBuffer);
        console.log("Final image created at", finalImagePath);

        // Update the metadata for the upgraded trait
        console.log("Updating metadata for trait type:", traitType);
        metadata.attributes = metadata.attributes.map(attr => {
            if (attr.trait_type === traitType) {
                // Replace the trait value with the selected upgrade and append " upgraded"
                console.log("Before update:", attr.value);
                attr.value = `${selectedUpgradedTrait} upgraded`;
                console.log("After update:", attr.value);
            }
            return attr;
        });
        console.log("Updated metadata:", metadata);

        // Upload the updated metadata file to AWS S3
        const updatedMetadataJson = JSON.stringify(metadata, null, 2);
        const s3Params = {
            Bucket: syndicateBucket,  // Replace with your actual bucket name if different
            Key: `${tokenId}.json`,
            Body: updatedMetadataJson,
            ContentType: "application/json",
            //ACL: "public-read" // adjust permissions as needed  
        };

        console.log("Uploading updated metadata to AWS S3 with params:", s3Params);
        const data = await s3.upload(s3Params).promise();
        console.log("Updated metadata successfully uploaded to AWS S3");

        // Return the final image path in the response
        return res.json({ finalImagePath });

    } catch (err) {
        console.error("Error in /upgradeExistingTrait:", err);
        return res.status(500).json({ error: err.message });
    }
});
*/
// Merge images using Node Canvas (layering images in order: bottom to top)
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
    const trait = traitIdList.find(trait => trait.name === selectedUpgradedTrait);
    return trait ? trait.id : null; // Return id if found, otherwise null
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
                    const metadataUrl = `https://robotic-rabbit-metadata-live-replica04.s3.us-east-1.amazonaws.com/${tokenId}.json`;
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

                    await uploadToS3Img(finalImagePath, tokenId);

                    metadata.attributes = metadata.attributes.map(attr => {
                        if (attr.trait_type === traitType) {
                            attr.value = `${selectedUpgradedTrait} upgraded`;
                        }
                        return attr;
                    });

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

        const s3Params = {
            Bucket: syndicateBucket,
            Key: `${tokenId}.json`,
            Body: fs.readFileSync(metadataFilePath),
            ContentType: "application/json",
        };

        await s3.upload(s3Params).promise();
        console.log("Updated metadata uploaded to AWS S3");


    } catch (error) {
        console.error("Error saving and uploading metadata:", error);
        throw error;
    }
}

router.post('/armoryCreation', cors(corsOptions), async (req, res) => {
    try {
        if (!req.body || !req.body.file) {
            return res.status(400).json({ error: 'No file received' });
        }
        const { nftName, description, nftId } = req.body;
        console.log("nftName : " + nftName);
        console.log("description : " + description);
        console.log("nftId : " + nftId);

        function generateUniqueFileName(directory, fileName) {
            let ext = path.extname(fileName);
            let baseName = path.basename(fileName, ext);
            let newFileName = fileName;
            let counter = 1;

            while (fs.existsSync(path.join(directory, newFileName))) {
                newFileName = `${baseName}_${counter}${ext}`;
                counter++;
            }
            return newFileName;
        }

        const fileBase64 = req.body.file.replace(/^data:image\/\w+;base64,/, ''); // Remove data URL prefix
        const buffer = Buffer.from(fileBase64, 'base64');

        const originalFileName = /*req.body.fileName || */`image_${nftId}.png`;
        const fileName = generateUniqueFileName(uploadDir, originalFileName);
        const imagePath = path.join(uploadDir, fileName);

        fs.writeFileSync(imagePath, buffer);
        console.log('File saved as:', imagePath);

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        console.log('Image URL:', fileUrl);

        /*  return res.json({
              success: true,
              message: 'File uploaded successfully',
              imageUrl: fileUrl,
          });*/

        //Metadata creation---------------------------------------------------------

        try {

            if (!nftName || !description || !nftId) {
                return res.status(400).json({ error: "Missing required NFT details" });
            }

            const metadata = {
                name: nftName,
                description: description,
                image: imagePath,
                edition: nftId,
                attributes: []
            };

            const metadataPath = path.join(__dirname, `armoryMeatadata/${nftId}.json`);

            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

            const fileContent = fs.readFileSync(metadataPath);
            /* const params = {
                  Bucket: syndicateBucket,
                  Key: `${tokenId}.json`,
                  Body: fileContent,
                  ContentType: 'application/json'
              };*/

            // const data = await s3.upload(params).promise();

            // return data.Location;

            res.json({ message: "NFT metadata created successfully", filePath: metadataPath });


        } catch (error) {
            console.error('Error uploading NFT:', error);
            res.status(500).json({ error: 'Failed to upload NFT. Please try again.' });
        }
    } catch (error) {
        console.error('Error uploading NFT:', error);
        res.status(500).json({ error: 'Failed to upload NFT. Please try again.' });
    }
});

router.get('/check', cors(corsOptions), async (req, res) => {
    res.send(`successful`);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
