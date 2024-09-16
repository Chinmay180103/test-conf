const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const indexRoutes = require('./index'); // Import the routes from index.js

const app = express();
const port = 3000;

var test_var=0;
// Middleware to parse URL-encoded data from forms and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the view engine and layout system
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/layout");

app.use(expressLayouts);
app.use(express.static("public"));

// Function to create an empty test_conf.json file if it does not exist
async function createEmptyConfigFile() {
    const filePath = path.join(__dirname, 'test_conf.json');
    
    try {
        await fs.access(filePath, fs.constants.F_OK);
        console.log('test_conf.json already exists.');
    } catch {
        console.log('Creating empty test_conf.json...');
        await fs.writeFile(filePath, '{}', 'utf8');
    }
}

// Create the empty config file when the application starts
createEmptyConfigFile().catch(err => {
    console.error("Error creating the configuration file:", err);
});

// Route to render the test-config.ejs page

// Route for band selection and file copy
app.post('/band-sel', async (req, res) => {
    const selectedBand = req.body.bands;
    console.log("Selected band: ", selectedBand);

    // Define file paths for each band
    const sourcein = path.join(__dirname, 'band-freq/global_conf.json.sx1250.IN865');
    const sourceeu = path.join(__dirname, 'band-freq/global_conf.json.sx1250.EU868');
    const destination = path.join(__dirname, 'test_conf.json');

    console.log("Source IN865 path: ", sourcein);
    console.log("Source EU868 path: ", sourceeu);
    console.log("Destination path: ", destination);
    
    try {
        // Determine source path based on the selected band
        const sourcePath = selectedBand === 'IN865' ? sourcein : selectedBand === 'EU868' ? sourceeu : null;
        
        if (!sourcePath) {
            console.error("Invalid band selection.");
            return res.status(400).send('Invalid band selected.');
        }

        // Check if the source file exists
        await fs.access(sourcePath, fs.constants.F_OK);
        console.log(`Source file exists at: ${sourcePath}`);

        // Copy the file based on the selected band
        console.log(`Starting copy from ${sourcePath} to ${destination}...`);
        await fs.copyFile(sourcePath, destination);

        // Verify that the copy operation was successful
        await fs.access(destination, fs.constants.F_OK);
        console.log('File copied successfully!');
        test_var=1;

        // Debugging: Log the state of the file after copy
        const updatedData = await fs.readFile(destination, 'utf8');
        console.log('Updated file content:', updatedData);

        // Send success response
        res.sendStatus(200);
    } catch (err) {
        // Send detailed error information to the client
        console.error("Error during file operations:", err);
        res.status(500).send(`Error during file copy: ${err.message}`);
    }
});

app.get('/test-config', async (req, res) => {
    const filePath = path.join(__dirname, 'test_conf.json'); // Path to your test_conf.json file

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const config = JSON.parse(data); // Parse the JSON file

        // Log file read operation
        // console.log('Rendering /test-config with data:', config);

        // Render the EJS view and pass the config object
        
            res.render('test-config', { config });
    } catch (err) {
        console.error("Error reading or parsing the configuration file:", err);
        res.status(500).send("Error reading or parsing the configuration file.");
    }
});
// Route to handle form submission
app.post('/test-config-submit', async (req, res) => {
    const filePath = path.join(__dirname, 'test_conf.json');
    
    let existingData = {};

    // Read the existing JSON file before updating
    try {
        const data = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(data);
    } catch (err) {
        console.error("Error reading the configuration file:", err);
        return res.status(500).send("Error reading the configuration file.");
    }

    // Update existing data with form values
    if (req.body.gatewayEUI) {
        existingData.gateway_conf = existingData.gateway_conf || {};
        existingData.gateway_conf.gateway_ID = req.body.gatewayEUI;
    }
    if (req.body.forwardingPort) {
        existingData.gateway_conf = existingData.gateway_conf || {};
        existingData.gateway_conf.serv_port_up = parseInt(req.body.forwardingPort, 10);
    }
    if (req.body.serverPort) {
        existingData.gateway_conf = existingData.gateway_conf || {};
        existingData.gateway_conf.serv_port_down = parseInt(req.body.serverPort, 10);
    }
    if (req.body.bands) {
        existingData.SX130x_conf = existingData.SX130x_conf || {};
        existingData.SX130x_conf.radio_0 = existingData.SX130x_conf.radio_0 || {};
        existingData.SX130x_conf.radio_0.freq = req.body.bands === 'IN865' ? 867500000 : 868500000;
    }
    if (req.body.antennagain) {
        existingData.SX130x_conf = existingData.SX130x_conf || {};
        existingData.SX130x_conf.antenna_gain = parseFloat(req.body.antennagain);
    }
    if (req.body.cableloss) {
        existingData.SX130x_conf = existingData.SX130x_conf || {};
        existingData.SX130x_conf.cable_loss = parseFloat(req.body.cableloss);
    }

    // Write updated data back to the JSON file
    try {
        await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8');
        res.send('Configuration updated successfully!');
    } catch (err) {
        console.error("Error writing to the configuration file:", err);
        res.status(500).send("Error writing to the configuration file.");
    }
});

app.use('/', indexRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
