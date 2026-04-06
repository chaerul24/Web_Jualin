// controllers/UserProfileController.js
const con = require('../db/connect');

class UserProfileController {

    async getProfile(req, res) {
        const { id } = req.params;

        try {
            const [rows] = await con.query(
                `SELECT * FROM user_profiles WHERE user_id = ?`,
                [id]
            );

            if (!rows.length) {
                return res.status(404).json({ message: 'Profile tidak ditemukan' });
            }

            res.json(rows[0]);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async saveProfile(req, res) {
        const { user_id, full_name, phone, address, city, province, country } = req.body;

        try {
            await con.query(
                `INSERT INTO user_profiles 
                (user_id, full_name, phone, address, city, province, country)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    full_name = VALUES(full_name),
                    phone = VALUES(phone),
                    address = VALUES(address),
                    city = VALUES(city),
                    province = VALUES(province),
                    country = VALUES(country)
                `,
                [user_id, full_name, phone, address, city, province, country]
            );

            res.json({ message: 'Profile berhasil disimpan' });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async updateProfile(req, res) {
        const { id } = req.params;
        const { full_name, phone, address, city, province, country } = req.body;

        try {
            await con.query(
                `UPDATE user_profiles 
                 SET full_name=?, phone=?, address=?, city=?, province=?, country=?
                 WHERE user_id=?`,
                [full_name, phone, address, city, province, country, id]
            );

            res.json({ message: 'Profile berhasil diupdate' });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }

    async deleteProfile(req, res) {
        const { id } = req.params;

        try {
            await con.query(
                `DELETE FROM user_profiles WHERE user_id = ?`,
                [id]
            );

            res.json({ message: 'Profile berhasil dihapus' });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = UserProfileController;