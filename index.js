// index.js
const express = require("express");
const router = express.Router(); // Use router instead of app
const wifi = require("node-wifi");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

wifi.init({
  iface: null, // network interface, choose a random wifi interface if set to null
  debug: true,
});

// Set up views and layouts
router.use(expressLayouts);
router.use(express.static("public"));

// Route for home page
router.get("/", async (req, res) => {
  let error = null;
  try {
    const networks = await wifi.scan();
    const success = req.query?.success ?? false;

    return res.render("wifi", { networks, success });
  } catch (error) {
    return res.render("error", { error: error });
  }
});

// Route for Wi-Fi connection
router.post("/wifi-connect", async (req, res) => {
  try {
    const ssid = req.body.ssid;
    const password = req.body.password;
    const x = await wifi.connect({ password, ssid });

    console.log(ssid, password, );
    return res.redirect("/?success=true");
  } catch (error) {
    return res.render("error", { error: error });
  }
});
router.get('/test-config', function(req, res) {
  res.render('test-config');
});

router.post('/test-config-submit', function(req, res) {
  const { gatewayEUI, bands, forwardingPort, serverPort } = req.body;
  // Handle form submission logic here
  res.redirect('/test-config'); // Or handle it accordingly
});

module.exports = router;
