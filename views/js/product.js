// ========================
// UTIL
// ========================
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    return num;
}
// ========================
// MAIN FUNCTION
// ========================
async function loadProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) return;

    try {
        const res = await fetch(`/api/products/${id}`);
        const product = await res.json();

        renderProduct(product);
        renderGallery(product.images);
        renderRating(product);

    } catch (err) {
        console.error('Error load product:', err);
    }
}

// ========================
// RENDER PRODUCT INFO
// ========================
function renderProduct(product) {
    const el = id => document.getElementById(id);

    if (el('product_name')) el('product_name').textContent = product.name;
    if (el('toko_name')) el('toko_name').textContent = product.store?.name;
    if (el('toko_profile')) el('toko_profile').src = product.store?.logo;
    const desc = document.getElementById('description_product');
    const btn = document.getElementById('read_detail');

    // isi deskripsi
    if (desc) {
        desc.textContent = product.description || '-';
    }

    if (btn && desc) {
        let expanded = false;

        btn.addEventListener('click', () => {
            expanded = !expanded;

            if (expanded) {
                desc.classList.remove('clamp-3');

                btn.innerHTML = `
                Hide Details 
                <span class="material-symbols-outlined">expand_less</span>
            `;

                desc.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } else {
                desc.classList.add('clamp-3');

                btn.innerHTML = `
                Read Detailed Specifications 
                <span class="material-symbols-outlined">expand_more</span>
            `;
            }
        });
    }
    if (desc && btn) {
        setTimeout(() => {
            if (desc.scrollHeight <= desc.clientHeight) {
                btn.style.display = 'none';
            }
        }, 0);
    }
    if (el('brand_name')) el('brand_name').textContent = product.brand || 'Tidak ada';
    if (el('weight')) el('weight').textContent = product.weight || '0g';
    if (el('stock')) el('stock').textContent = product.stock || '0';
    document.querySelectorAll('.btn-payment').forEach(btn => {
        btn.onclick = function () {
            window.location.href = `/payment?id=${product.id}`;
        };
    });

    // sold
    if (el('span_sold')) {
        el('span_sold').textContent = formatNumber(product.sold) + ' Sold';
    }

    // harga
    const price = parseFloat(product.price);
    const priceReal = el('price_real');
    const priceDiscount = el('price_discount');
    const discountPercent = el('discount_percen');
    const product_review = document.getElementById('product_review');
    if (product_review) {
        const count = product.review_count || 0;
        product_review.textContent = count + ' Reviews';
    }
    if (product.discount) {
        const discountValue = parseFloat(product.discount.value);
        const finalPrice = price - (price * discountValue / 100);

        if (priceReal) {
            priceReal.textContent = `Rp ${finalPrice.toLocaleString('id-ID')}`;
            priceReal.classList.remove('line-through', 'text-gray-400');
        }

        if (priceDiscount) {
            priceDiscount.textContent = `Rp ${price.toLocaleString('id-ID')}`;
            priceDiscount.classList.add('line-through', 'text-gray-400');
        }

        if (discountPercent) {
            discountPercent.textContent = `-${discountValue}%`;
            discountPercent.classList.add('text-red-500', 'font-bold');
        }

    } else {
        if (priceReal) {
            priceReal.textContent = `Rp ${price.toLocaleString('id-ID')}`;
            priceReal.classList.remove('line-through', 'text-gray-400');
        }

        if (priceDiscount) {
            priceDiscount.textContent = '';
            priceDiscount.classList.remove('line-through');
        }

        if (discountPercent) discountPercent.textContent = '';
    }
}

// ========================
// RENDER RATING
// ========================
function renderRating(product) {
    const rating = parseFloat(product.rating_avg) || 0;
    const storeRating = parseFloat(product.store?.rating) || 0;

    const ratingEl = document.getElementById('rating_count');
    const ratingProduct1 = document.getElementById('rating_product_1');


    if (ratingEl) {
        ratingEl.textContent = rating > 0
            ? `${rating.toFixed(1)} (${product.review_count || 0})`
            : '0.0';
    }

    // if (ratingTokoEl) {
    //     ratingTokoEl.textContent = storeRating > 0
    //         ? storeRating.toFixed(1)
    //         : '0.0';
    // }

    if (ratingProduct1) {
        ratingProduct1.textContent = rating > 0
            ? rating.toFixed(1)
            : '0.0';
    }


    renderStars(rating, 'rating_stars');

    renderStars(rating, 'store_stars');
}
// ========================
// RENDER GALLERY
// ========================
function renderGallery(images = []) {
    const gallery = document.getElementById('productGallery');
    const thumbnails = document.getElementById('thumbnailGallery');
    const dots = document.getElementById('dots');

    if (!gallery || !thumbnails || !dots) return;

    gallery.innerHTML = '';
    thumbnails.innerHTML = '';
    dots.innerHTML = '';

    if (!images.length) {
        images = ['https://via.placeholder.com/300x300?text=No+Image'];
    }

    images.forEach((img, index) => {

        // 👉 SLIDE (FULL TANPA "PADDING LOOK")
        const slide = document.createElement('div');
        slide.className = `slide flex-none w-full h-full snap-center overflow-hidden
            ${index === 0 ? 'border-2 border-primary' : ''}`;
        slide.dataset.index = index;

        slide.innerHTML = `
            <img class="w-full h-full object-cover cursor-pointer" src="${img}" />
        `;

        gallery.appendChild(slide);

        // 👉 THUMB (VERTICAL)
        const thumb = document.createElement('div');
        thumb.className = `thumb w-20 h-20 rounded-lg border overflow-hidden cursor-pointer
            ${index === 0 ? 'border-primary' : 'border-gray-200'}`;
        thumb.dataset.index = index;

        thumb.innerHTML = `
            <img class="w-full h-full object-cover" src="${img}" />
        `;

        thumbnails.appendChild(thumb);

        // 👉 DOT
        const dot = document.createElement('div');
        dot.className = `dot w-2 h-2 rounded-full 
            ${index === 0 ? 'bg-primary' : 'bg-gray-300'}`;

        dots.appendChild(dot);
    });

    setupGallery();
}

function syncActive(index) {
    const thumbs = document.querySelectorAll('.thumb');
    const dots = document.querySelectorAll('.dot');
    const slides = document.querySelectorAll('.slide');

    thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === index);
        t.classList.toggle('border-primary', i === index);
        t.classList.toggle('border-gray-200', i !== index);
    });

    dots.forEach((d, i) => {
        d.classList.toggle('bg-primary', i === index);
        d.classList.toggle('bg-gray-300', i !== index);
    });

    slides.forEach((s, i) => {
        s.classList.toggle('ring-2', i === index);
        s.classList.toggle('ring-primary', i === index);
        s.classList.toggle('ring-0', i !== index);
    });
}

// ========================
// GALLERY INTERACTION
// ========================
function setupGallery() {
    const gallery = document.getElementById('productGallery');
    const thumbs = document.querySelectorAll('.thumb');
    const dots = document.querySelectorAll('.dot');
    const slides = document.querySelectorAll('.slide');

    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = thumb.dataset.index;

            gallery.scrollTo({
                left: gallery.clientWidth * index,
                behavior: 'smooth'
            });
        });
    });

    gallery.addEventListener('scroll', () => {
        const index = Math.round(gallery.scrollLeft / gallery.clientWidth);

        thumbs.forEach((t, i) => {
            t.classList.toggle('border-primary', i === index);
            t.classList.toggle('border-gray-200', i !== index);
        });

        dots.forEach((d, i) => {
            d.classList.toggle('bg-primary', i === index);
            d.classList.toggle('bg-gray-300', i !== index);
        });

        slides.forEach((s, i) => {
            s.classList.toggle('ring-2', i === index);
            s.classList.toggle('ring-primary', i === index);
            s.classList.toggle('ring-0', i !== index);
        });
    });
}

// ========================
// INIT
// ========================
loadProductDetail();