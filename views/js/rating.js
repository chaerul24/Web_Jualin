function renderStars(rating, elementId = 'rating_stars') {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = '';

    rating = parseFloat(rating) || 0;

    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;

    let hasHalf = decimal >= 0.25 && decimal < 0.75;

    // kalau >= 0.75 dibulatkan ke full
    const totalFull = decimal >= 0.75 ? fullStars + 1 : fullStars;

    for (let i = 1; i <= 5; i++) {
        let star = document.createElement('span');
        star.classList.add('material-symbols-outlined', 'text-base');

        if (i <= totalFull) {
            // ⭐ full
            star.style.fontVariationSettings = "'FILL' 1";
            star.textContent = 'star';

        } else if (i === totalFull + 1 && hasHalf) {
            // ⭐½ half
            star.textContent = 'star_half';

        } else {
            // ☆ kosong
            star.textContent = 'star';
        }

        container.appendChild(star);
    }
}