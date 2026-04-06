const express = require('express');
const router = express.Router();
const con = require('../db/connect');

// ======================
// HELPER SLUG
// ======================
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');
}

// ======================
// GET ALL PRODUCTS + CATEGORY
// ======================
router.get('/', async (req, res) => {
    try {
        const [rows] = await con.query(`
            SELECT 
                p.*,
                c.name AS category_name,
                GROUP_CONCAT(DISTINCT pi.image) AS images,

                -- ambil 1 diskon saja
                MAX(d.id) AS discount_id,
                MAX(d.name) AS discount_name,
                MAX(d.value) AS discount_value

            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON pi.product_id = p.id
            LEFT JOIN product_discounts pd ON pd.product_id = p.id
            LEFT JOIN discounts d ON d.id = pd.discount_id

            WHERE p.is_active = TRUE
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);

        const products = rows.map(p => ({
            ...p,
            images: p.images ? p.images.split(',') : [],

            // 🔥 handle diskon
            discount: p.discount_id
                ? {
                    id: p.discount_id,
                    name: p.discount_name,
                    value: p.discount_value
                }
                : null
        }));

        res.json(products);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ======================
// GET PRODUCT BY ID
// ======================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return res.status(400).json({ message: 'ID tidak valid' });
    }

    try {
        // 🔹 1. Ambil product + category + image + discount + store
        const [rows] = await con.query(`
            SELECT 
                p.*,
                c.name AS category_name,
                pi.image,
                d.id AS discount_id,
                d.name AS discount_name,
                d.value AS discount_value,
                d.description AS discount_description,

                s.id AS store_id,
                s.name AS store_name,
                s.logo AS store_logo,
                s.rating AS store_rating,
                s.province_id  AS province_id,
                s.city_id AS city_id,
                s.address AS address,
                s.postal_code AS postal_code

            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON pi.product_id = p.id
            LEFT JOIN product_discounts pd ON pd.product_id = p.id
            LEFT JOIN discounts d ON d.id = pd.discount_id
            LEFT JOIN stores s ON p.store_id = s.id

            WHERE p.id = ?
        `, [id]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        // 🔹 2. Format product
        const product = {
            ...rows[0],
            images: [],
            discount: null,
            reviews: [],
            store: null
        };

        rows.forEach(r => {
            // images
            if (r.image && !product.images.includes(r.image)) {
                product.images.push(r.image);
            }

            // discount
            if (!product.discount && r.discount_id !== null) {
                product.discount = {
                    id: r.discount_id,
                    name: r.discount_name,
                    discount_description: r.discount_description,
                    value: r.discount_value
                };
            }

            // store (cukup ambil sekali)
            if (!product.store && r.store_id !== null) {
                product.store = {
                    id: r.store_id,
                    name: r.store_name,
                    logo: r.store_logo,
                    rating: r.store_rating
                };
            }
        });

        // 🔹 3. Ambil reviews
        const [reviews] = await con.query(`
            SELECT user_id, rating, comment, created_at
            FROM reviews
            WHERE product_id = ?
            ORDER BY created_at DESC
        `, [id]);

        product.reviews = reviews;

        // 🔹 4. Hitung rating
        if (reviews.length > 0) {
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            product.rating_avg = (total / reviews.length).toFixed(1);
            product.review_count = reviews.length;
        } else {
            product.rating_avg = 0;
            product.review_count = 0;
        }

        // 🔹 5. Cleanup field mentah
        delete product.image;
        delete product.discount_id;
        delete product.discount_name;
        delete product.discount_value;
        delete product.discount_description;
        delete product.store_id;
        delete product.store_name;
        delete product.store_logo;
        delete product.store_rating;

        res.json(product);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});
// ======================
// CREATE PRODUCT
// ======================
router.post('/', async (req, res) => {
    const {
        name,
        description,
        price,
        stock = 0,
        category_id,

        // 🔥 kolom baru
        brand,
        weight = 0,
        sold = 0,
        share = 0,
        cart = 0,
        width = 0,
        height = 0

    } = req.body;

    try {
        if (!name || !price) {
            return res.status(400).json({ message: 'Nama & harga wajib diisi' });
        }

        // cek category (FK)
        if (category_id) {
            const [cat] = await con.query(
                `SELECT id FROM categories WHERE id = ?`,
                [category_id]
            );

            if (!cat.length) {
                return res.status(400).json({ message: 'Kategori tidak valid' });
            }
        }

        let slug = generateSlug(name);

        // 🔥 pastikan slug unik
        const [existing] = await con.query(
            `SELECT id FROM products WHERE slug = ?`,
            [slug]
        );

        if (existing.length) {
            slug = `${slug}-${Date.now()}`;
        }

        // 🔥 INSERT FINAL
        const [result] = await con.query(
            `INSERT INTO products 
            (
                name, slug, description, price, stock, category_id,
                brand, weight, sold, share, cart, width, height
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                slug,
                description,
                price,
                stock,
                category_id || null,
                brand || null,
                weight,
                sold,
                share,
                cart,
                width,
                height
            ]
        );

        res.json({
            message: 'Produk berhasil ditambahkan',
            id: result.insertId,
            slug
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// ======================
// UPDATE PRODUCT
// ======================
router.put('/product/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, category_id, is_active } = req.body;

    try {
        let slug = generateSlug(name);

        // cek slug unik (kecuali dirinya sendiri)
        const [existing] = await con.query(
            `SELECT id FROM products WHERE slug = ? AND id != ?`,
            [slug, id]
        );

        if (existing.length) {
            slug = `${slug}-${Date.now()}`;
        }

        await con.query(`
            UPDATE products SET 
                name = ?, 
                slug = ?, 
                description = ?, 
                price = ?, 
                stock = ?, 
                category_id = ?, 
                is_active = ?
            WHERE id = ?
        `, [
            name,
            slug,
            description,
            price,
            stock,
            category_id || null,
            is_active ?? true,
            id
        ]);

        res.json({ message: 'Produk berhasil diupdate' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ======================
// DELETE PRODUCT (SOFT DELETE)
// ======================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await con.query(
            `UPDATE products SET is_active = FALSE WHERE id = ?`,
            [id]
        );

        res.json({ message: 'Produk berhasil dinonaktifkan' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;