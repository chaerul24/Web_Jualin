const express = require('express');
const router = express.Router();
const path = require('path');
const snap = require('../config/midtrans');
const con = require('../db/connect');
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
router.get('/payment', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/payment.html'));
});

// ======================
// GET list payment methods (GROUPING)
// ======================
router.get('/api/payment-methods', authMiddleware, async (req, res) => {
    try {
        const [rows] = await con.query(`
            SELECT * FROM payment_methods 
            WHERE is_active = 1 
            ORDER BY category, name
        `);

        const grouped = {};

        rows.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });

        res.json(grouped);

    } catch (err) {
        console.error('GET payment-methods error:', err);
        res.status(500).json({ message: 'Database error' });
    }
});


// ======================
// POST payment (Midtrans)
// ======================
router.post('/payment', authMiddleware, async (req, res) => {
    const { id, payment_method } = req.body;

    const allowedMethods = [
        "gopay","qris","bca_va","bni_va","bri_va",
        "permata_va","echannel","indomaret","alfamart","credit_card"
    ];

    // validasi payment method
    if (!allowedMethods.includes(payment_method)) {
        return res.status(400).json({ message: 'Metode tidak valid' });
    }

    try {
        // 🔥 ambil produk dari DB
        const [results] = await con.query(
            `SELECT * FROM products WHERE id = ?`,
            [id]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        const product = results[0];

        // hitung harga
        const price = parseFloat(product.price);
        const discount = product.discount || 0;
        const total = price - (price * discount / 100);

        // parameter midtrans
        const parameter = {
            transaction_details: {
                order_id: 'ORDER-' + Date.now(),
                gross_amount: Math.round(total)
            },
            item_details: [{
                id: product.id,
                price: Math.round(total),
                quantity: 1,
                name: product.name
            }],
            enabled_payments: [payment_method]
        };

        // 🔥 create transaction
        const transaction = await snap.createTransaction(parameter);

        res.json({
            token: transaction.token
        });

    } catch (err) {
        console.error('POST payment error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;