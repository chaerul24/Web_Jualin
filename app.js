require("dotenv").config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const authMiddleware = require("./middleware/auth");
const productImageRoutes = require('./routes/ProductImageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const con = require('./db/connect');
const rajaongkirRoutes = require("./routes/rajaongkir");

const cookieParser = require("cookie-parser");
// Routes
const userRoutes = require('./routes/User');
const productRoutes = require('./routes/Product');
const addressRoutes = require('./routes/AddressRoutes');
class App {
    constructor() {
        this.app = express();
        this.PORT = process.env.PORT || 6688;
        this.app.use(cookieParser());
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    // ======================
    // MIDDLEWARE
    // ======================
    initializeMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // static views
        this.app.use(express.static(path.join(__dirname, 'views'), {
            index: false
        }));

        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'secret-key',
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: false
            }
        }));
    }

    // ======================
    // ROUTES
    // ======================
    initializeRoutes() {

        // ======================
        // HTML ROUTES
        // ======================
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'index.html'));
        });

        this.app.get('/address', authMiddleware, (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'change_address.html'));
        });

        this.app.get('/address/add', authMiddleware, (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'add_address.html'));
        });

        this.app.use("/api/rajaongkir", rajaongkirRoutes);

        this.app.get('/login', (req, res) => {
            if (req.session.user) {
                return res.redirect('/');
            }
            res.sendFile(path.join(__dirname, 'views', 'login.html'));
        });

        this.app.get('/register', (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'register.html'));
        });

        // ======================
        // 🔒 PROTECT DASHBOARD
        // ======================
        this.app.use('/dashboard', (req, res, next) => {
            if (!req.session.user) {
                return res.redirect('/login');
            }
            next();
        });
        this.app.use('/', addressRoutes);
        // ======================
        // DASHBOARD
        // ======================
        this.app.get('/dashboard', async (req, res) => {
            try {
                const [rows] = await con.query(
                    `SELECT role FROM users WHERE id = ?`,
                    [req.session.user.id]
                );

                if (!rows.length || rows[0].role !== 'toko') {
                    return res.redirect('/login');
                }

                res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));

            } catch (err) {
                console.error(err);
                res.redirect('/login');
            }
        });

        // ======================
        // PRODUCT PAGE
        // ======================
        this.app.get('/product/:slug', (req, res) => {
            res.sendFile(path.join(__dirname, 'views', 'product.html'));
        });

        // ======================
        // PAYMENT ROUTES ✅ (FIX DI SINI)
        // ======================
        this.app.use('/', paymentRoutes);

        // ======================
        // API ROUTES
        // ======================
        this.app.use('/', userRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/products', productRoutes);
        this.app.use('/api/product-images', productImageRoutes);
    }

    // ======================
    // ERROR HANDLER
    // ======================
    initializeErrorHandling() {
        this.app.use('/api', (req, res) => {
            res.status(404).json({
                message: 'API route tidak ditemukan'
            });
        });

        // fallback global
        this.app.use((req, res) => {
            res.status(404).send('Page not found');
        });
    }

    // ======================
    // START SERVER
    // ======================
    start() {
        this.app.listen(this.PORT, () => {
            console.log(`🚀 Server jalan di http://localhost:${this.PORT}`);
        });
    }
}

// ======================
// RUN APP
// ======================
const app = new App();
app.start();