const express = require('express');
const router = express.Router();
const path = require('path');

const addressController = require('../controllers/AddressController');


// ======================
// PAGE (HTML)
// ======================
router.get('/address', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/address.html'));
});


router.get('/address', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/address.html'));
});

// API
router.post('/api/addresses', addressController.store);
router.get('/api/addresses', addressController.getAllAddress);
router.get('/api/addresses/user/:user_id', addressController.getAddressById);
router.delete('/api/addresses/:id', addressController.delete);

// 🔥 SET DEFAULT (lebih proper)
router.patch('/api/addresses/:id/default', addressController.selected);


module.exports = router;