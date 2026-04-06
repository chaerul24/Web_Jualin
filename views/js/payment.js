const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let selectedPayment = null;

const categoryTitle = {
    "e-wallet": "E-Wallet",
    "bank": "Bank Transfer",
    "retail": "Retail",
    "card": "Kartu"
};

fetch('/api/payment-methods')
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('payment-container');

        Object.keys(data).forEach(category => {

            const wrapper = document.createElement('div');
            wrapper.className = 'space-y-2';

            // HEADER
            const header = document.createElement('div');
            header.className = `
                flex items-center justify-between cursor-pointer 
                p-4 rounded-2xl bg-white border border-gray-200 shadow-sm
            `;
            header.innerHTML = `
                <span class="font-bold">${categoryTitle[category]}</span>
                <span class="arrow">▼</span>
            `;

            // CONTENT
            const content = document.createElement('div');
            content.className = 'hidden grid grid-cols-1 gap-3 mt-2';

            data[category].forEach(method => {

                const div = document.createElement('div');

                // DEFAULT
                div.className = `
                    payment-item flex cursor-pointer rounded-2xl 
                    bg-white border border-gray-200 
                    p-4 justify-between items-center transition-all
                `;

                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <img src="${method.icon}" class="w-8 h-8"/>
                        <span>${method.name}</span>
                    </div>

                    <!-- CHECK ICON -->
                    <div class="check hidden w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                        ✓
                    </div>
                `;

                div.onclick = () => {
                    selectedPayment = method.code;

                    // reset semua
                    document.querySelectorAll('.payment-item').forEach(el => {
                        el.className = `
                            payment-item flex cursor-pointer rounded-2xl 
                            bg-white border border-gray-200 
                            p-4 justify-between items-center
                        `;
                        el.querySelector('.check').classList.add('hidden');
                    });

                    // SELECTED
                    div.className = `
                        payment-item flex cursor-pointer rounded-2xl 
                        bg-white border-2 border-primary 
                        p-4 justify-between items-center 
                        shadow-md ring-2 ring-primary/10
                    `;

                    div.querySelector('.check').classList.remove('hidden');
                };

                content.appendChild(div);
            });

            // TOGGLE DROPDOWN
            header.onclick = () => {
                content.classList.toggle('hidden');

                const arrow = header.querySelector('.arrow');
                arrow.innerText = content.classList.contains('hidden') ? '▼' : '▲';
            };

            wrapper.appendChild(header);
            wrapper.appendChild(content);
            container.appendChild(wrapper);
        });
    });


// tombol bayar
document.getElementById('pay_now').onclick = function () {
    if (!selectedPayment) {
        alert('Pilih metode pembayaran dulu');
        return;
    }

    fetch('/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: productId,
            payment_method: selectedPayment
        })
    })
    .then(res => res.json())
    .then(res => {
        snap.pay(res.token);
    });
};