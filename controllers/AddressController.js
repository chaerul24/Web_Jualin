const con = require('../db/connect');

const jwt = require("jsonwebtoken");
class AddressController {

    // ======================
    // CREATE / UPDATE
    // ======================

    async store(req, res) {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized (belum login)'
            });
        }

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(403).json({
                message: 'Invalid token'
            });
        }

        const user_id = decoded.id;

        const {
            street_name,
            provinsi,
            kabupaten_kota,
            kecamatan,
            kelurahan,
            kode_pos,
            address_label,
            fullname,
            phone,
            is_default
        } = req.body;

        try {
            const fullAddress = `${street_name}, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kabupaten_kota}, ${provinsi}, ${kode_pos}`.trim();

            await con.query(
                `INSERT INTO addresses 
            (user_id, address, city, postal_code, label, fullname, phone, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user_id,
                    fullAddress,
                    kabupaten_kota,
                    kode_pos,
                    address_label,
                    fullname,
                    phone,
                    is_default
                ]
            );

            res.json({
                message: 'Alamat berhasil disimpan',
                address: fullAddress
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Gagal menyimpan alamat' });
        }
    }
    // ======================
    // GET BY USER ID
    // ======================
    async getAddressById(req, res) {
        const { user_id } = req.params;

        try {
            const [rows] = await con.query(
                `SELECT * FROM addresses WHERE user_id = ?`,
                [user_id]
            );

            if (!rows || rows.length === 0) {
                return res.status(404).json({
                    message: 'Data alamat tidak ditemukan',
                    data: []
                });
            }

            res.json({
                message: 'Berhasil ambil data alamat',
                data: rows
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Gagal ambil data' });
        }
    }

    async selected(req, res) {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(403).json({ message: 'Invalid token' });
        }

        const user_id = decoded.id;
        const { id } = req.params;

        try {
            await con.query(
                `UPDATE addresses SET is_default = 0 WHERE user_id = ?`,
                [user_id]
            );

            await con.query(
                `UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?`,
                [id, user_id]
            );

            res.json({ message: 'Default address updated' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to update default address' });
        }
    }

    // ======================
    // DELETE ADDRESS
    // ======================
    async delete(req, res) {
        const { id } = req.params;

        try {
            await con.query(
                `DELETE FROM addresses WHERE id = ?`,
                [id]
            );

            res.json({ message: 'Alamat berhasil dihapus' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Gagal hapus alamat' });
        }
    }

    // ======================
    // GET ALL ADDRESS
    // ======================
    async getAllAddress(req, res) {
        try {
            const [rows] = await con.query(
                `SELECT * FROM addresses ORDER BY id DESC`
            );

            // 🔥 validasi kosong
            if (!rows || rows.length === 0) {
                return res.status(404).json({
                    message: 'Data alamat tidak ditemukan',
                    data: []
                });
            }

            res.json({
                message: 'Berhasil ambil data alamat',
                data: rows
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Gagal ambil semua alamat' });
        }
    }
}

module.exports = new AddressController();