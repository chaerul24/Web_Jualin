const axios = require("axios");
const con = require("../db/connect");

const API_KEY = process.env.KOMERCE_API_KEY;
const BASE_URL = "https://rajaongkir.komerce.id/api/v1";
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};
class RajaOngkirController {
  /**
   * 🌍 GET PROVINCES
   */
  static async getProvinces(req, res) {
    try {
      const response = await axios.get(`${BASE_URL}/destination/province`, {
        headers: { key: API_KEY },
      });

      return res.json({
        success: true,
        data: response.data.data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil provinsi",
        error: error.response?.data || error.message,
      });
    }
  }

  /**
   * 🏙️ GET CITIES BY PROVINCE
   */
  static async getCities(req, res) {
    try {
      const { province_id } = req.params;

      const response = await axios.get(
        `${BASE_URL}/destination/city/${province_id}`,
        {
          headers: { key: API_KEY },
        }
      );

      return res.json({
        success: true,
        data: response.data.data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil kota",
        error: error.response?.data || error.message,
      });
    }
  }

  /**
   * 🚚 HITUNG ONGKIR (MANUAL)
   */
  static async getCost(req, res) {
    try {
      const { origin, destination, weight, courier } = req.body;

      if (!origin || !destination || !weight || !courier) {
        return res.status(400).json({
          success: false,
          message: "origin, destination, weight, courier wajib diisi",
        });
      }

      const response = await axios.post(
        `${BASE_URL}/calculate/domestic-cost`,
        new URLSearchParams({
          origin,
          destination,
          weight,
          courier,
        }),
        {
          headers: {
            key: API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const results = response.data.data.map((item) => ({
        courier: item.code,
        courier_name: item.name,
        service: item.service,
        description: item.description,
        cost: item.cost,
        etd: item.etd,
      }));

      return res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Gagal menghitung ongkir",
        error: error.response?.data || error.message,
      });
    }
  }

  /**
   * 💰 HITUNG TOTAL + ONGKIR (CART BASED)
   */
  static async price(req, res) {
    try {
      const { product_id, user_id, courier = "jne", qty = 1 } = req.body;

      if (!user_id || !product_id) {
        return res.status(400).json({
          success: false,
          message: "product_id dan user_id wajib diisi",
        });
      }

      // =========================
      // 🛒 PRODUCT
      // =========================
      const [rows] = await con.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.weight,
        p.store_id,
        pi.image,
        s.city_id AS origin,
        a.city_id AS destination,
        d.type AS discount_type,
        d.value AS discount_value
      FROM products p
      JOIN stores s ON p.store_id = s.id
      JOIN addresses a ON a.user_id = ? AND a.is_default = 1
      LEFT JOIN product_images pi 
        ON pi.product_id = p.id AND pi.set_default = 1
      LEFT JOIN product_discounts pd 
        ON pd.product_id = p.id
        AND pd.is_active = 1
        AND (pd.start_date IS NULL OR pd.start_date <= NOW())
        AND (pd.end_date IS NULL OR pd.end_date >= NOW())
      LEFT JOIN discounts d 
        ON d.id = pd.discount_id
        AND d.is_active = 1
      WHERE p.id = ?
      LIMIT 1
    `, [user_id, product_id]);

      if (!rows.length) {
        return res.status(400).json({
          success: false,
          message: "Produk tidak ditemukan",
        });
      }

      const item = rows[0];

      // =========================
      // 💸 DISCOUNT
      // =========================
      let price = item.price;
      let discount_amount = 0;

      if (item.discount_type && item.discount_value) {
        if (item.discount_type === "percent") {
          discount_amount = (price * item.discount_value) / 100;
        } else {
          discount_amount = item.discount_value;
        }
      }

      discount_amount = Math.min(discount_amount, price);
      const final_price = Math.max(0, price - discount_amount);

      // =========================
      // 📦 TOTAL PRODUCT
      // =========================
      const total_price = final_price * qty;
      const total_weight = item.weight * qty;

      // =========================
      // 🚚 ONGKIR (SAFE MODE)
      // =========================
      let shipping = [];
      let shipping_cost = 0;
      let shipping_error = null;

      try {
        if (item.origin && item.destination && total_weight > 0) {

          const origin = parseInt(item.origin);
          const destination = parseInt(item.destination);
          const weight = parseInt(total_weight);

          console.log("ONGKIR PARAMS:", {
            origin,
            destination,
            weight,
            courier
          });

          const response = await axios.post(
            `${BASE_URL}/calculate/domestic-cost`,
            new URLSearchParams({
              origin,
              destination,
              weight,
              courier,
            }),
            {
              headers: {
                key: API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          shipping = response.data.data.map(i => ({
            courier: i.code,
            service: i.service,
            cost: i.cost,
            etd: i.etd,
          }));

          shipping_cost = shipping.length ? shipping[0].cost : 0;

        } else {
          shipping_error = "Data ongkir belum lengkap";
        }

      } catch (err) {
        console.error("ONGKIR ERROR:", err.response?.data || err.message);
        shipping_error = "Gagal mengambil ongkir";
      }

      // =========================
      // 🧾 TAX
      // =========================
      const [taxRows] = await con.query(`
      SELECT name, type, value, applies_to
      FROM taxes
      WHERE is_active = 1
    `);

      let taxes = [];
      let total_tax = 0;

      for (let tax of taxRows) {
        let taxAmount = 0;
        let baseAmount = 0;

        if (tax.applies_to === "product") {
          baseAmount = total_price;
        } else if (tax.applies_to === "shipping") {
          baseAmount = shipping_cost;
        } else {
          baseAmount = total_price + shipping_cost;
        }

        if (tax.type === "percent") {
          let percent = parseFloat(tax.value);

          if (percent > 100) {
            percent = percent / 100;
          }

          taxAmount = baseAmount * (percent / 100);
        } else {
          taxAmount = parseFloat(tax.value);
        }

        taxAmount = Math.round(taxAmount);
        total_tax += taxAmount;

        taxes.push({
          name: tax.name,
          type: tax.type,
          value: tax.value,
          applies_to: tax.applies_to,
          amount: taxAmount,
          amount_format: formatRupiah(taxAmount),
        });
      }

      // =========================
      // 💰 GRAND TOTAL
      // =========================
      const grand_total = total_price + total_tax + shipping_cost;

      // =========================
      // 🚀 RESPONSE
      // =========================
      return res.json({
        success: true,
        data: {
          product: {
            id: item.id,
            name: item.name,
            image: item.image || null,

            price,
            final_price,
            discount_amount,

            price_format: formatRupiah(price),
            final_price_format: formatRupiah(final_price),
            discount_amount_format: formatRupiah(discount_amount),

            discount_type: item.discount_type || null,
            qty
          },

          summary: {
            total_price,
            total_tax,
            shipping_cost,
            grand_total,

            total_price_format: formatRupiah(total_price),
            total_tax_format: formatRupiah(total_tax),
            shipping_cost_format: formatRupiah(shipping_cost),
            grand_total_format: formatRupiah(grand_total)
          },

          shipping: {
            cost: shipping_cost,
            cost_format: formatRupiah(shipping_cost),
            available: shipping.length > 0,
            error: shipping_error
          },

          taxes,

          shipping_options: shipping.map(s => ({
            ...s,
            cost_format: formatRupiah(s.cost)
          })),
        },
      });

    } catch (error) {
      console.error("PRICE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan server",
        error: error.response?.data || error.message,
      });
    }
  }
  static async getCouriers(req, res) {
    try {
      const [rows] = await con.query(`
      SELECT 
        id,
        code,
        name
      FROM couriers
      WHERE is_active = 1
      ORDER BY name ASC
    `);

      return res.json({
        success: true,
        message: "Berhasil mengambil data kurir",
        data: rows,
      });

    } catch (error) {
      console.error("Error getCouriers:", error);

      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data kurir",
        error: error.message,
      });
    }
  }
  /**
   * 📦 GET CART
   */
  static async getCart(user_id) {
    const [rows] = await con.query(
      `
      SELECT c.qty, p.price, p.weight
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `,
      [user_id]
    );

    return rows;
  }

  /**
   * 🧮 CALCULATE CART
   */
  static calculateCart(cart) {
    let total_price = 0;
    let total_weight = 0;
    let total_items = 0;

    cart.forEach((item) => {
      total_price += item.price * item.qty;
      total_weight += item.weight * item.qty;
      total_items += item.qty;
    });

    return { total_price, total_weight, total_items };
  }

  /**
   * 📍 GET USER ADDRESS
   */
  static async getUserAddress(user_id) {
    const [rows] = await con.query(
      `
      SELECT * FROM addresses
      WHERE user_id = ? AND is_default = 1
      LIMIT 1
    `,
      [user_id]
    );

    if (!rows.length) {
      throw new Error("Alamat user tidak ditemukan");
    }

    const address = rows[0];

    if (!address.city_id) {
      throw new Error("Alamat user belum lengkap (city_id kosong)");
    }

    return address;
  }

  /**
   * 🏪 GET STORE
   */
  static async getStore(store_id) {
    const [rows] = await con.promise().query(
      `
      SELECT * FROM stores WHERE id = ?
    `,
      [store_id]
    );

    if (!rows.length) {
      throw new Error("Store tidak ditemukan");
    }

    const store = rows[0];

    if (!store.city_id) {
      throw new Error("Alamat store belum lengkap");
    }

    return store;
  }

  /**
   * 🚚 GET SHIPPING COST (KOMERCE API)
   */
  static async getShippingCost({ origin, destination, weight, courier }) {
    const response = await axios.post(
      `${BASE_URL}/calculate/domestic-cost`,
      new URLSearchParams({
        origin,
        destination,
        weight,
        courier,
      }),
      {
        headers: {
          key: API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.data.map((item) => ({
      courier: item.code,
      courier_name: item.name,
      service: item.service,
      description: item.description,
      cost: item.cost,
      etd: item.etd,
    }));
  }
}

module.exports = RajaOngkirController;