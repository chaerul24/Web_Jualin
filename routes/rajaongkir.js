const express = require("express");
const router = express.Router();
const RajaOngkirController = require("../controllers/RajaOngkir");

/**
 * 📦 RajaOngkir Routes
 * Prefix: /api/shipping
 */

// 🌍 Get all provinces
router.get("/provinces", RajaOngkirController.getProvinces);

// 🏙️ Get cities by province
router.get("/provinces/:province_id/cities", RajaOngkirController.getCities);

// 🚚 Get shipping cost (manual input)
router.post("/cost", RajaOngkirController.getCost);

// 💰 Get price + ongkir (cart based)
router.post("/price", RajaOngkirController.price);
router.get("/couriers", RajaOngkirController.getCouriers);
module.exports = router;