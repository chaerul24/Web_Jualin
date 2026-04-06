function goToVoucher() {
    // dummy pilih voucher
    applyVoucher({
        name: "Diskon 10%",
        desc: "Maks. 20rb"
    });
}

function applyVoucher(voucher) {
    const box = document.getElementById('selected-voucher');

    document.getElementById('voucher-name').innerText = voucher.name;
    document.getElementById('voucher-desc').innerText = voucher.desc;

    box.classList.remove('hidden');
}

function removeVoucher() {
    document.getElementById('selected-voucher').classList.add('hidden');
}