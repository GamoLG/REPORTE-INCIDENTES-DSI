document.addEventListener('DOMContentLoaded', () => {
    const doLogout = (e) => {
        if (e) e.preventDefault();
        try { if (window.auth && window.auth.removeAuthToken) window.auth.removeAuthToken(); } catch (err) { console.warn('logout: no auth object', err); }
        // Optionally clear other session storage
        try { sessionStorage.clear(); } catch (e) {}
        window.location.href = 'login.html';
    };

    // Attach to any element with data-logout attribute
    document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', doLogout));
});
