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

// Security best practices
app.use(helmet());

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Specify the path to your contracts directory
const contractsPath = path.resolve(__dirname, './contracts');

//............................................................................//

app.post('/_mintnft', cors(corsOptions), async (req, res) => {
    console.log("SERVER");
});

//............................................................................//

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
