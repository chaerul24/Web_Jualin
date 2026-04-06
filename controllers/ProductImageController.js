// controllers/ProductImageController.js
const con = require('../db/connect');

class ProductImageController {

    async getByProduct(req, res) {
        const { id } = req.params;

        try {
            const [images] = await con.query(
                `SELECT image FROM product_images WHERE product_id = ?`,
                [id]
            );

            if (!images.length) {
                return res.status(404).json({
                    message: 'Gambar tidak ditemukan'
                });
            }

            res.json({
                product_id: id,
                images: images.map(i => i.image)
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
}

module.exports = ProductImageController;