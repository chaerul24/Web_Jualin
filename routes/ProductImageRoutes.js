// routes/ProductImageRoutes.js
const express = require('express');
const ProductImageController = require('../controllers/ProductImageController');

class ProductImageRoutes {
    constructor() {
        this.router = express.Router();
        this.controller = new ProductImageController();

        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get('/:id', (req, res) =>
            this.controller.getByProduct(req, res)
        );
    }
}

module.exports = new ProductImageRoutes().router;