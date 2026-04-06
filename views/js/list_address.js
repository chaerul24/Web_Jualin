$(document).ready(function () {
    let currentUser = null;

    loadAuthMenu();

    // =========================
    // 🔐 AUTH USER
    // =========================
    async function loadAuthMenu() {
        try {
            const res = await fetch('/api/users/me', {
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Not logged in');

            const user = await res.json();

            currentUser = user;
            loadAddress();

        } catch (err) {
            console.error(err);
            console.log('User belum login');
        }
    }

    // =========================
    // 📍 LOAD ADDRESS (DEFAULT ONLY)
    // =========================
    function loadAddress(){
        $.ajax({
            url:'/api/addresses/user/'+currentUser.id,
            method:'GET',
            success:function(res){

                const addresses = res.data;

                // ambil hanya default
                const addr = addresses.find(a => a.is_default == 1);

                // ❗ kalau tidak ada alamat default
                if (!addr) {
                    $('#address_box').html(`
                        <div class="text-red-500 text-sm">
                            Alamat utama belum tersedia
                        </div>
                    `);

                    $('#box_ongkir').addClass('hidden');
                    $('#tax_price').text('Alamat belum tersedia');

                    return;
                }

                // =========================
                // 🎨 UI CARD (TAILWIND)
                // =========================
                const html = `
                    <div class="flex gap-3 p-4 rounded-xl border border-blue-500 bg-blue-50 shadow-sm">
                        
                        <!-- ICON -->
                        <span class="material-symbols-outlined">location_on</span>

                        <!-- CONTENT -->
                        <div class="flex-1 text-sm">

                            <div class="font-semibold text-gray-800 flex items-center gap-2">
                                ${addr.label} (${addr.fullname})

                                <span class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                    Utama
                                </span>
                            </div>

                            <div class="text-gray-600 mt-1">
                                ${addr.address}
                            </div>

                            <div class="text-gray-500 text-xs mt-1">
                                ${addr.phone}
                            </div>

                            ${
                                !addr.city_id 
                                ? `<div class="text-red-500 text-xs mt-2">
                                    ⚠️ Kota belum di set
                                   </div>` 
                                : ''
                            }

                        </div>
                    </div>
                `;

                $('#address_box').html(html);

                // =========================
                // 🚚 VALIDASI ONGKIR
                // =========================
                if (!addr.city_id) {

                    console.warn("Alamat default belum punya city_id");

                    $('#box_ongkir').addClass('hidden');
                    $('#tax_price').text('Alamat belum lengkap');

                    return;
                }

                // =========================
                // ✅ AMAN → LANJUT ONGKIR
                // =========================
                console.log("Alamat OK:", addr.city_id);

                // contoh trigger (optional)
                // loadOngkir(addr.city_id);

            },
            error:function(err){
                console.error("Gagal ambil alamat", err);

                $('#address_box').html(`
                    <div class="text-red-500 text-sm">
                        Gagal memuat alamat
                    </div>
                `);
            }
        })
    }

});