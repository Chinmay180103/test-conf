const express = require('express');
const fs = require('fs');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const indexRoutes = require('./index'); // Import the routes from index.js

const app = express();
const port = 3000;

// Middleware to parse URL-encoded data from forms and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the view engine and layout system
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/layout");

app.use(expressLayouts);
app.use(express.static("public"));

// Route to render the test-config.ejs page
app.get('/test-config', (req, res) => {
    const filePath = path.join(__dirname, 'global_conf.json'); // Path to your global_conf.json file

    // Read the JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading the configuration file:", err);
            return res.status(500).send("Error reading the configuration file.");
        }

        try {
            const config = JSON.parse(data); // Parse the JSON file

            // Render the EJS view and pass the config object
            res.render('test-config', { config });
        } catch (parseError) {
            console.error("Error parsing the configuration file:", parseError);
            res.status(500).send("Error parsing the configuration file.");
        }
    });
});

// Route to handle form submission
app.post('/test-config-submit', (req, res) => {
    const filePath = path.join(__dirname, 'global_conf.json');
    
    // Read the existing JSON file
    let existingData = {};
    try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        if (err.code !== 'ENOENT') throw err; // If error is not file not found
    }

    // Update existing data with form values
    if (req.body.gatewayEUI) {
        existingData.gateway_conf.gateway_ID = req.body.gatewayEUI;
    }
    if (req.body.forwardingPort) {
        existingData.gateway_conf.serv_port_up = parseInt(req.body.forwardingPort, 10);
    }
    if (req.body.serverPort) {
        existingData.gateway_conf.serv_port_down = parseInt(req.body.serverPort, 10);
    }
    if (req.body.bands) {
        existingData.SX130x_conf.radio_0.freq = req.body.bands === 'IN865' ? 867500000 : 868500000;
    }
    if (req.body.antennagain) {
        existingData.SX130x_conf.antenna_gain = parseFloat(req.body.antennagain);
    }
    if (req.body.cableloss) {
        existingData.SX130x_conf.cable_loss = parseFloat(req.body.cableloss);
    }

    // Write updated data back to the JSON file
    try {
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
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
 