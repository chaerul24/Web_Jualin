$(document).ready(function () {
    let currentUser = null;
    const address_selected = $('#address_selected');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    // 🔹 Load couriers
    function loadCouriers() {
        $.get("/api/rajaongkir/couriers", function (res) {
            if (!res.success) return alert("Gagal load kurir");
            renderCouriers(res.data);
        });
    }

    loadAuthMenu();

    async function loadAuthMenu() {
        try {
            const res = await fetch('/api/users/me', {
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Not logged in');

            const user = await res.json();

            currentUser = user;
            loadCouriers();

        } catch (err) {
            console.log('User belum login');
        }
    }
    // 🔹 Render courier cards
    function renderCouriers(couriers) {
        let html = "";

        couriers.forEach((c, i) => {
            html += `
        <label class="kurir-card relative flex cursor-pointer rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary">

          <input type="radio" name="courier" value="${c.code}" class="sr-only" ${i === 0 ? "checked" : ""} />

          <div class="flex flex-1 items-start gap-4">
            <div class="bg-primary/10 p-3 rounded-2xl">
              <span class="material-symbols-outlined text-primary">local_shipping</span>
            </div>

            <div>
              <p class="font-bold text-gray-800">${c.name}</p>
              <p class="text-sm text-gray-500 mt-1">Klik untuk lihat ongkir</p>
            </div>
          </div>

          <span class="check-icon material-symbols-outlined text-primary hidden">
            check_circle
          </span>
        </label>
      `;
        });

        $("#list_kurir").html(html);

        // trigger default pertama
        $("input[name='courier']:checked").trigger("change");
    }

    // 🔥 Saat pilih kurir
    $(document).on("change", "input[name='courier']", function () {
        $(".kurir-card").removeClass("border-primary ring-2 ring-primary/20");
        $(".check-icon").addClass("hidden");

        const card = $(this).closest(".kurir-card");
        card.addClass("border-primary ring-2 ring-primary/20");
        card.find(".check-icon").removeClass("hidden");

        const courier = $(this).val();

        loadShipping(courier);
    });

    // 🚚 Load ongkir (service)
    function loadShipping(courier) {

        $(".dropdwon_kurir").html(`
      <p class="text-sm text-gray-500">Loading ongkir...</p>
    `);

        $.ajax({
            url: "/api/rajaongkir/price",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                user_id: currentUser.id,   // 🔥 dynamic
                product_id: id,    // 🔥 wajib (sesuai backend terbaru)
                courier: courier
            }),
            success: function (res) {
                console.log('FULL:', res);

                const product = res.data.product;
                const summary = res.data.summary;
                const shipping = res.data.shipping_options;

                // =========================
                // 🛒 PRODUCT
                // =========================
                $('#product_name').text(product.name);

                // Harga awal
                $('#product_price').text(product.price_format);
                $('#product_image').attr('src', product.image);
                if (res.data.summary.shipping_cost === 0) {
                    $('#box_ongkir').addClass('hidden');
                } else {
                    $('#box_ongkir').removeClass('hidden');
                }

                // tetap set text
                $('#tax_price').text(res.data.summary.shipping_cost_format);
                // Tax (PPN + layanan)
                $('#total_tax').text(res.data.summary.total_tax_format);

                // GRAND TOTAL 🔥
                $('#grand_total').text(res.data.summary.grand_total_format);

                // Discount
                if (product.discount_amount > 0) {
                    $('#box_product_discount').removeClass('hidden');
                    $('#product_discount').text('-' + product.discount_amount_format);
                } else {
                    $('#box_product_discount').addClass('hidden');
                }

                // =========================
                // 📦 SHIPPING (contoh ambil pertama)
                // =========================
                if (shipping.length > 0) {
                    const ongkir = shipping[0];

                    $('.total_price').text(ongkir.cost_format);
                }

                // =========================
                // 💰 TOTAL
                // =========================
                $('.total_price').text(summary.total_price_format);

                // =========================
                // ❌ VOUCHER (karena tidak ada di JSON)
                // =========================
                $('#box_voucher_diskon').addClass('hidden');

                // render ongkir
                renderShipping(shipping);
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                $(".dropdwon_kurir").html(`
            <p class="text-red-500">Gagal load ongkir</p>
        `);
            }
        });
    }

    // 🎯 Render ongkir list
    function renderShipping(list) {
        let html = `
      <div class="mt-4 space-y-3">
        <p class="font-bold text-gray-800">Pilih Layanan</p>
    `;

        console.table(list);

        list.forEach((item, i) => {
            html += `
        <label class="ongkir-card flex justify-between items-center border rounded-2xl p-4 cursor-pointer hover:border-primary transition">

          <input type="radio" name="service" class="sr-only"
            value="${item.service}"
            data-cost="${item.cost}"
            ${i === 0 ? "checked" : ""}
          />

          <div>
            <p class="font-bold text-gray-800">${item.service}</p>
            <p class="text-sm text-gray-500">${item.description}</p>
            <p class="text-xs text-gray-400">Estimasi: ${item.etd}</p>
          </div>

          <p class="font-bold text-primary">
            Rp ${item.cost.toLocaleString()}
          </p>

        </label>
      `;
        });

        html += `</div>`;

        $(".dropdwon_kurir").html(html);
    }
    function showAddressSelected(user_id) {
        $.ajax({
            url: '/api/addresses/user/' + user_id,
            method: 'GET',
            success: function (res) {

                const container = $('#address_selected');
                container.empty();

                if (!res.data || res.data.length === 0) {
                    container.html('<p class="text-gray-400">Belum ada alamat</p>');
                    return;
                }

                // 🔥 ambil default
                const selected = res.data.find(e => e.is_default == 1);

                if (!selected) {
                    container.html('<p class="text-gray-400">Belum ada alamat default</p>');
                    return;
                }

                const html = `
            <div class="bg-white p-6 rounded-xl border shadow-sm">

                <div class="flex gap-4">

                    <div class="bg-blue-100 p-3 rounded-xl h-12 w-12 flex items-center justify-center">
                        <span class="material-symbols-outlined text-blue-500">
                            location_on
                        </span>
                    </div>

                    <div class="flex-1">

                        <div class="flex items-center gap-2">
                            <p class="font-bold text-gray-800">
                                ${selected.fullname}
                            </p>

                            <span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                                Address
                            </span>
                        </div>

                        <p class="text-sm text-gray-600 mt-2">
                            ${selected.address}
                        </p>

                        <p class="text-sm text-gray-800 mt-3 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">call</span>
                            ${selected.phone}
                        </p>

                    </div>

                </div>

            </div>
            `;

                container.append(html);
            }
        });
    }
});