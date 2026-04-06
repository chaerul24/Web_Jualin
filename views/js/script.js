let currentUser = null;

// ======================
// 🔥 BACK BUTTON
// ======================
const btnBack = document.getElementById('page_back');

if (btnBack) {
    btnBack.addEventListener('click', () => {
        window.history.back();
    });
}

