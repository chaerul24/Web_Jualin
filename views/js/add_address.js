let currentUser = null;

// ======================
// 🔥 CEK LOGIN
// ======================
async function checkAuth() {
    try {
        const res = await fetch('/api/users/me', {
            credentials: 'include'
        });

        if (!res.ok) return;

        const user = await res.json();
        currentUser = user;

        // document.getElementById('authMenu').innerHTML = `
        //     <span class="font-semibold text-white">Hi, ${user.username}</span>
        //     <button id="logoutBtn" class="font-semibold hover:text-red-400">Logout</button>
        // `;

        // document.getElementById('logoutBtn').addEventListener('click', async () => {
        //     await fetch('/api/users/logout', {
        //         method: 'POST',
        //         credentials: 'include'
        //     });
        //     window.location.reload();
        // });

    } catch (err) {
        console.error(err);
    }
}

// ======================
// 🔥 LOADING BUTTON
// ======================
function setLoading(isLoading) {
    const btn = $('#btn_save_address');

    if (isLoading) {
        btn.prop('disabled', true).addClass('opacity-70');

        $('#btn_icon').addClass('hidden');
        $('#btn_text').text('Menyimpan...');
        $('#btn_spinner').removeClass('hidden');
    } else {
        btn.prop('disabled', false).removeClass('opacity-70');

        $('#btn_icon').removeClass('hidden');
        $('#btn_text').text('Simpan Alamat');
        $('#btn_spinner').addClass('hidden');
    }
}
$(document).ready(function () {

    const notyf = new Notyf({
        duration: 3000,
        position: { x: 'right', y: 'top' }
    });

    checkAuth();

    const rules = {
        fullname: "Nama wajib diisi",
        phone: "Nomor telepon wajib diisi",
        street_name: "Alamat wajib diisi",
        provinsi: "Provinsi wajib diisi",
        kabupaten_kota: "Kota wajib diisi",
        kecamatan: "Kecamatan wajib diisi",
        kelurahan: "Kelurahan wajib diisi",
        kode_pos: "Kode pos wajib diisi",
        address_label: "Pilih label alamat"
    };

    function validateField(name) {

        if (name === 'address_label') {
            const checked = $('input[name="address_label"]:checked').val();

            $('#label_error').remove();

            if (!checked) {
                $('.mt-10').append(`<div id="label_error" class="error-text">Pilih label alamat</div>`);
                return false;
            }

            if (checked === 'custom') {
                const custom = $('#custom_label').val().trim();

                $('#custom_label').removeClass('input-error');
                $('#custom_label').next('.error-text').remove();

                if (!custom) {
                    $('#custom_label').addClass('input-error');
                    $('#custom_label').after(`<div class="error-text">Isi label custom</div>`);
                    return false;
                }
            }

            return true;
        }

        const field = $(`[name="${name}"]`);
        const value = field.val()?.trim();

        field.removeClass('input-error');
        field.next('.error-text').remove();

        if (!value) {
            field.addClass('input-error');
            field.after(`<div class="error-text">${rules[name]}</div>`);
            return false;
        }

        if (name === 'phone') {
            if (!/^(\+62|08)[0-9]{8,13}$/.test(value)) {
                field.addClass('input-error');
                field.after(`<div class="error-text">Format nomor tidak valid</div>`);
                return false;
            }
        }

        if (name === 'kode_pos') {
            if (!/^[0-9]{5}$/.test(value)) {
                field.addClass('input-error');
                field.after(`<div class="error-text">Kode pos harus 5 digit</div>`);
                return false;
            }
        }

        return true;
    }

    $('input, textarea, select').on('keyup change', function () {
        const name = $(this).attr('name');
        if (name) validateField(name);
    });

    function validateForm() {
        let valid = true;

        Object.keys(rules).forEach(name => {
            if (!validateField(name)) {
                valid = false;
            }
        });

        return valid;
    }

    $('input[name="address_label"]').on('change', function () {
        const val = $(this).val();

        if (val === 'custom') {
            $('#custom_label').removeClass('hidden').focus();
        } else {
            $('#custom_label').addClass('hidden').val('');
        }

        validateField('address_label');
    });

    $('#btn_save_address').on('click', function () {
        $('#add_address').trigger('submit');
    });

    $('#add_address').on('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) {
            notyf.error('Mohon lengkapi semua data');
            return;
        }

        if (!currentUser) {
            notyf.error('Silakan login terlebih dahulu');
            return;
        }

        let formData = {};

        $('#add_address').find('input, textarea, select').each(function () {
            const name = $(this).attr('name');
            if (name) {
                formData[name] = $(this).val();
            }
        });

        let label = $('input[name="address_label"]:checked').val();

        if (label === 'custom') {
            label = $('#custom_label').val();
        }

        formData.address_label = label;
        formData.user_id = currentUser.id;
        formData.is_default = formData.is_default || 0;

        setLoading(true);

        $.ajax({
            url: '/api/addresses',
            method: 'POST',
            data: formData,

            success: function (res) {
                notyf.success('Alamat berhasil disimpan');

                $('#add_address')[0].reset();
                $('#custom_label').addClass('hidden');
            },

            error: function (err) {
                let message = err.responseJSON?.message || 'Terjadi kesalahan';
                notyf.error(message);
            },

            complete: function () {
                setLoading(false);
            }
        });

    });

});