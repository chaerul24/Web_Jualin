function slugify(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')      // spasi → -
        .replace(/\//g, '-')       // / → -
        .replace(/[^\w\-]+/g, '')  // hapus karakter aneh
        .replace(/\-\-+/g, '-')    // double - jadi satu
        .replace(/^-+|-+$/g, '');  // hapus - di awal/akhir
}
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        const container = document.getElementById('productList');
        container.innerHTML = '';

        products.forEach(p => {
            const image = p.images && p.images.length > 0
                ? p.images[0]
                : 'https://via.placeholder.com/300x300?text=No+Image';
            container.innerHTML += `
<a class="group bg-white rounded-sm border border-black/5 shadow-sm hover:border-primary/50 transition-all overflow-hidden flex flex-col product-card-hover"
    href="/product/${slugify(p.slug)}?id=${p.id}">
    
    <div class="aspect-square relative overflow-hidden">
        <img class="w-full h-full object-cover lg:group-hover:scale-105 transition-transform duration-500"
            src="${image}" />

        <div class="absolute top-0 left-0 bg-primary text-white text-[9px] lg:text-[10px] font-bold px-1.5 lg:py-0.5 rounded-br-[2px]">
            ${p.category_name || 'Product'}
        </div>

        <div class="absolute bottom-0 right-0 bg-yellow-400/95 text-primary text-[9px] lg:text-[10px] font-black px-1.5 py-0.5">
            Stock: ${p.stock}
        </div>
    </div>

    <div class="p-2 lg:p-2.5 flex flex-col flex-1">
        <h3 class="text-[11px] lg:text-[12px] line-clamp-2 text-gray-800 mb-2 leading-[1.3] lg:leading-[1.4] font-medium lg:group-hover:text-primary transition-colors">
            ${p.name}
        </h3>

        <div class="mt-auto">
            <div class="flex items-center gap-1.5 mb-1.5 lg:mb-2">

    ${p.discount
                    ? `
        <span class="text-primary font-semibold text-xs sm:text-sm md:text-sm lg:text-base">
            Rp ${(Number(p.price) - (Number(p.price) * Number(p.discount.value) / 100)).toLocaleString('id-ID')}
        </span>

        <span class="text-gray-400 line-through text-[10px] sm:text-xs md:text-xs">
            Rp ${Number(p.price).toLocaleString('id-ID')}
        </span>
        `
                    : `
        <span class="text-primary font-semibold text-xs sm:text-sm md:text-sm lg:text-base">
            Rp ${Number(p.price).toLocaleString('id-ID')}
        </span>
        `
                }

</div>

            <div class="flex items-center justify-between text-[10px] lg:text-[11px] text-gray-400">
                <div class="flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-[10px] lg:text-[12px] text-yellow-400 fill-1">star</span>
                    <span class="text-gray-500">4.9 | 1.2k Sold</span>
                </div>
                <span class="hidden lg:inline">Indonesia</span>
            </div>
        </div>
    </div>
</a>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

loadProducts();