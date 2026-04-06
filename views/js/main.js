document.getElementById('profileBtn').addEventListener('click', async () => {
    try {
        const res = await fetch('/api/users/me');
        
        if (!res.ok) {
            // belum login → ke login
            window.location.href = '/login';
            return;
        }

        const user = await res.json();

        // sudah login → ke halaman profile / dashboard
        window.location.href = '/profile.html';

    } catch (err) {
        console.error(err);
        window.location.href = '/login';
    }
});