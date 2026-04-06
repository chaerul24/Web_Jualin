const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const router = express.Router();
const con = require('../db/connect');
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");
// ======================
// HELPER
// ======================
function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

// ======================
// 🔒 MIDDLEWARE CEK TOKO
// ======================
const checkToko = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const [rows] = await con.query(
            `SELECT role FROM users WHERE id = ?`,
            [req.session.user.id]
        );

        if (!rows.length || rows[0].role !== 'toko') {
            return res.redirect('/login');
        }

        next();
    } catch (err) {
        console.error(err);
        return res.redirect('/login');
    }
};

// ======================
// DASHBOARD (PROTECTED)
// ======================
router.get('/dashboard', checkToko, (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', 'views', 'dashboard.html') // 🔥 bukan public
    );
});

// ======================
// REGISTER
// ======================
router.post('/register', async (req, res) => {
    let { name, email, password, confirm_password, terms } = req.body;

    try {
        name = name?.trim();
        email = email?.trim();

        if (!name || !email || !password) {
            return res.redirect('/register?error=empty');
        }

        if (!isValidEmail(email)) {
            return res.redirect('/register?error=email_format');
        }

        if (password.length < 6) {
            return res.redirect('/register?error=password_length');
        }

        if (password !== confirm_password) {
            return res.redirect('/register?error=password');
        }

        if (!terms) {
            return res.redirect('/register?error=terms');
        }

        const [check] = await con.query(
            `SELECT id FROM users WHERE email = ?`,
            [email]
        );

        if (check.length > 0) {
            return res.redirect('/register?error=email');
        }

        const hash = await bcrypt.hash(password, 10);

        const [result] = await con.query(
            `INSERT INTO users (username, email, password, role) 
             VALUES (?, ?, ?, ?)`,
            [name, email, hash, 'user']
        );

        // auto login
        req.session.user = {
            id: result.insertId,
            username: name,
            role: 'user'
        };

        req.session.save(() => {
            res.redirect('/');
        });

    } catch (err) {
        console.error(err);
        res.redirect('/register?error=server');
    }
});

// LOGIN
router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  try {
    email = email?.trim();

    if (!email || !password) {
      return res.redirect("/login?error=empty");
    }

    const [rows] = await con.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return res.redirect("/login?error=user");
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.redirect("/login?error=password");
    }
    //GENERATE JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    // SIMPAN COOKIE
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    let redirect = req.query.redirect || "/";
    if (!redirect.startsWith("/")) redirect = "/";

    console.log("✅ LOGIN SUCCESS:", user.email);

    res.redirect(redirect);

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.redirect("/login?error=server");
  }
});


// /me (cek login)
router.get('/me', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        res.json({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        });
    } catch (err) {
        return res.status(403).json({
            message: 'Invalid token'
        });
    }
});

// logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
    });

    return res.json({
        message: 'Logout berhasil'
    });
});
module.exports = router;