(function(){
    const getToken = () => {
        try { if (window.auth && typeof window.auth.getAuthToken === 'function') return window.auth.getAuthToken(); } catch(e){}
        return localStorage.getItem('token'); // Fallback in case window.auth is not fully loaded
    };

    async function loadProfile(){
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch((window.apiBase || '') + '/api/users/profile', { headers: { 'x-auth-token': token, 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return;
            const user = await res.json();

            // Sidebar: nombre y cargo/rol
            const nameEl = document.querySelector('aside .font-semibold');
            const roleEl = document.querySelector('aside .text-blue-200');
            if (nameEl && user.nombre_completo) nameEl.textContent = user.nombre_completo;
            if (roleEl) roleEl.textContent = user.cargo || user.rol || roleEl.textContent;

            // DNI en sidebar
            const dniEl = document.querySelector('aside .text-sm.text-blue-200');
            if (dniEl && user.dni) {
                // Algunos templates usan 'DNI: 1234' como texto
                dniEl.textContent = 'DNI: ' + user.dni;
            }

            // Avatar / foto de perfil: buscar elementos con clase `user-avatar` o data-profile="avatar"
            const avatarEls = Array.from(document.querySelectorAll('img.user-avatar, [data-profile="avatar"]'));
            if (avatarEls.length > 0) {
                const foto = user.foto_perfil_url || user.foto || user.avatar || null;
                avatarEls.forEach(containerEl => { // Iterate over all elements that could be an avatar
                    const imgEl = containerEl.tagName === 'IMG' ? containerEl : containerEl.querySelector('img');
                    if (imgEl) {
                        if (foto) { el.src = foto; el.alt = user.nombre_completo || 'Usuario'; }
                        else {
                            // si no hay foto, reemplazar por un placeholder o ocultar
                            imgEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nombre_completo || 'User') + '&background=random';
                            imgEl.alt = 'Avatar';
                        }
                    } else {
                        // elemento no-img: intentar inyectar una imagen dentro
                        const img = document.createElement('img'); // Create an image element if the container is not an img
                        img.className = 'user-avatar';
                        img.style.width = '80px'; img.style.height = '80px'; img.style.borderRadius = '9999px'; img.style.objectFit = 'cover';
                        img.src = user.foto_perfil_url || 'https://via.placeholder.com/80?text=User';
                        el.innerHTML = ''; el.appendChild(img);
                    }
                });
            }

            // Elementos con data-profile attributes
            document.querySelectorAll('[data-profile="nombre"]').forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = user.nombre_completo || '';
                else el.textContent = user.nombre_completo || '';
            });
            document.querySelectorAll('[data-profile="dni"]').forEach(el => {
                if (el.tagName === 'INPUT') el.value = user.dni || '';
                else el.textContent = user.dni || '';
            });
            document.querySelectorAll('[data-profile="email"]').forEach(el => {
                if (el.tagName === 'INPUT') el.value = user.correo_electronico || '';
                else el.textContent = user.correo_electronico || '';
            });
            document.querySelectorAll('[data-profile="cargo"]').forEach(el => {
                if (el.tagName === 'INPUT') el.value = user.cargo || '';
                else el.textContent = user.cargo || '';
            });

            // También rellenar campos por id si existen (compatibilidad con citizen-profile.html)
            try {
                const nombreInput = document.getElementById('nombreCompleto');
                const dniInput = document.getElementById('dni');
                const correoInput = document.getElementById('correoElectronico');
                const welcomeSpan = document.getElementById('welcomeSpan');
                const cargoInput = document.getElementById('cargo'); // For admin/authority profile
                // const profileAvatar = document.getElementById('profileAvatar'); // This ID is not consistently used

                if (nombreInput) nombreInput.value = user.nombre_completo || '';
                if (dniInput) dniInput.value = user.dni || '';
                if (correoInput) correoInput.value = user.correo_electronico || '';
                if (cargoInput) cargoInput.value = user.cargo || '';
                if (welcomeSpan) welcomeSpan.textContent = `Bienvenido, ${user.nombre_completo || 'Ciudadano'}!`;
                // if (profileAvatar && user.foto_perfil_url) profileAvatar.src = user.foto_perfil_url; // Handled by data-profile="avatar"
            } catch (e) { /* ignore */ }

            // Reemplazar encabezados o textos de bienvenida por el nombre real del usuario
            const newName = user.nombre_completo || 'Ciudadano';

            // h1s que contienen 'BIENVENIDO' (mayúsculas) o 'Bienvenido' (normal)
            Array.from(document.getElementsByTagName('h1')).forEach(h => {
                if (/BIENVENIDO|Bienvenido/i.test(h.textContent)) {
                    // Construir texto con la misma palabra 'BIENVENIDO' en mayúsculas si aparecía así
                    const isAllCaps = /\bBIENVENIDO\b/.test(h.textContent);
                    const welcomeWord = isAllCaps ? '¡BIENVENIDO' : 'Bienvenido';
                    h.textContent = isAllCaps ? `${welcomeWord}, ${newName}!` : `${welcomeWord}, ${newName}!`;
                }
            });

            // Otros elementos comunes (span#welcomeSpan, .welcome, [data-welcome])
            const welcomeSelectors = ['#welcomeSpan', '.welcome', '[data-welcome]'];
            welcomeSelectors.forEach(sel => {
                Array.from(document.querySelectorAll(sel)).forEach(el => {
                    if (/bienvenid/i.test(el.textContent)) {
                        // Mantener capitalización inicial
                        const cap = /^[A-ZÁÉÍÓÚÑ]/.test(el.textContent.trim()) ? 'Bienvenido' : 'bienvenido';
                        el.textContent = `${cap}, ${newName}!`;
                    }
                });
            });

        } catch (err) {
            console.warn('profile.js: no se pudo cargar perfil', err);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadProfile); else loadProfile();
})();
