require('dotenv').config();
const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: "SB-Mid-server-5mI96VJ6IL0RGPC-apOJAbi9",
    clientKey: "SB-Mid-client-gWVN2ydG4l95VJ_e"
});

module.exports = snap;