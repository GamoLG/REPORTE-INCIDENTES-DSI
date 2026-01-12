document.addEventListener('DOMContentLoaded', () => {
    // Forzar API en desarrollo: backend en puerto 5000
    const API_ORIGIN = 'http://localhost:5000';
    const API_URL = `${API_ORIGIN}/api/auth`;
    // Exponer base de la API globalmente para que otras páginas la usen
    window.apiBase = API_ORIGIN;
    window.apiAuthUrl = API_URL;

    // Helper para alternar la visibilidad de la contraseña
    window.togglePasswordVisibility = (id) => {
        const input = document.getElementById(id);
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    };

    // Objeto global para funciones de autenticación
    window.auth = {
                // Logout universal
                logout: () => {
                    try { window.auth.removeAuthToken(); } catch (e) {}
                    try { sessionStorage.clear(); } catch (e) {}
                    window.location.href = 'login.html';
                },
        saveAuthToken: (token) => {
            localStorage.setItem('token', token);
        },
        getAuthToken: () => {
            return localStorage.getItem('token');
        },
        removeAuthToken: () => {
            localStorage.removeItem('token');
        },
        // Función para decodificar rol desde token
        getRoleFromToken: (tokenToDecode) => {
            if (!tokenToDecode) return null;
            try {
                const tokenParts = tokenToDecode.split('.');
                const payload = JSON.parse(atob(tokenParts[1]));
                return payload.user.rol;
            } catch (error) {
                console.error("Error decodificando el token:", error);
                return null;
            }
        },
        // Función para verificar el rol del usuario
        checkUserRole: (allowedRoles) => {
            const token = window.auth.getAuthToken();
            if (!token) {
                window.location.href = 'index.html'; // Redirigir al login si no hay token
                return false;
            }
            const userRole = window.auth.getRoleFromToken(token);
            if (!userRole) {
                alert('Sesión inválida. Inicia sesión nuevamente.');
                window.auth.logout();
                return false;
            }
            if (!allowedRoles.includes(userRole)) {
                // Redirigir al dashboard correcto según el rol, sin alert
                if (userRole === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (userRole === 'autoridad') {
                    window.location.href = 'dashboard-autoridad.html';
                } else {
                    window.location.href = 'citizen-dashboard.html';
                }
                return false;
            }
            return true;
        },
        // Manejar inicio de sesión
        handleLogin: async (correoElectronico, password) => {
            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ correoElectronico, password })
                });

                const data = await response.json();

                if (response.ok) {
                    window.auth.saveAuthToken(data.token);
                    showLoginToast();
                    setTimeout(() => {
                        const userRole = window.auth.getRoleFromToken(window.auth.getAuthToken());
                        if (userRole === 'admin') {
                            window.location.href = 'admin-dashboard.html';
                        } else if (userRole === 'autoridad') {
                            window.location.href = 'dashboard-autoridad.html';
                        } else {
                            window.location.href = 'citizen-dashboard.html';
                        }
                    }, 1200);
                // Toast visual para inicio de sesión exitoso
                function showLoginToast() {
                    // Evitar duplicados
                    if (document.getElementById('loginToast')) return;
                    const toast = document.createElement('div');
                    toast.id = 'loginToast';
                    toast.style.position = 'fixed';
                    toast.style.top = '32px';
                    toast.style.right = '32px';
                    toast.style.zIndex = '9999';
                    toast.style.background = '#222';
                    toast.style.color = '#fff';
                    toast.style.padding = '16px 28px 16px 20px';
                    toast.style.borderRadius = '12px';
                    toast.style.display = 'flex';
                    toast.style.alignItems = 'center';
                    toast.style.boxShadow = '0 2px 16px rgba(0,0,0,0.18)';
                    toast.style.fontSize = '1rem';
                    toast.style.fontWeight = '500';
                    toast.innerHTML = `
                        <span style="display:inline-block;width:14px;height:14px;background:#22c55e;border-radius:50%;margin-right:12px;box-shadow:0 0 6px #22c55e;"></span>
                        <span>Se inició sesión correctamente</span>
                    `;
                    document.body.appendChild(toast);
                    setTimeout(() => {
                        toast.style.opacity = '0';
                        toast.style.transition = 'opacity 0.5s';
                        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 600);
                    }, 1000);
                }
                } else {
                    alert(data.msg || 'Error al iniciar sesión');
                }
            } catch (error) {
                console.error('Error de red o del servidor:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        },

        // Manejar registro de usuario
        handleRegister: async (userData, role) => {
            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ...userData, rol: role })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registro exitoso! Por favor, inicia sesión.');
                    window.location.href = 'index.html'; // Redirigir al login
                } else {
                    alert(data.msg || 'Error en el registro');
                }
            } catch (error) {
                console.error('Error de red o del servidor:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        }
    };

    // Lógica específica para index.html (Formulario de Login)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correoElectronico = document.getElementById('correoElectronico').value;
            const password = document.getElementById('password').value;
            await window.auth.handleLogin(correoElectronico, password);
        });
    }

    // Lógica para página "Olvidé contraseña"
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correoElectronico = document.getElementById('forgotCorreoElectronico').value;
            try {
                const response = await fetch(`${API_URL}/forgot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correoElectronico })
                });
                const data = await response.json();
                alert(data.msg || 'Si existe la cuenta, se enviaron instrucciones al correo.');
                window.location.href = 'index.html';
            } catch (err) {
                console.error('Error enviando solicitud de recuperación:', err);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        });
    }

    // Lógica específica para register.html (Formularios de Registro)
    const registerCitizenForm = document.getElementById('registerCitizenForm');
    const registerAuthorityForm = document.getElementById('registerAuthorityForm');
    const citizenTab = document.getElementById('citizenTab');
    const authorityTab = document.getElementById('authorityTab');

    if (citizenTab && authorityTab) {
        // Función para alternar entre formularios de registro
        const toggleRegisterForms = (isCitizen) => {
            if (isCitizen) {
                citizenTab.classList.remove('bg-gray-200', 'text-gray-700', 'border-gray-300');
                citizenTab.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
                authorityTab.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
                authorityTab.classList.add('bg-gray-200', 'text-gray-700', 'border-gray-300');
                if (registerCitizenForm) registerCitizenForm.style.display = 'block';
                if (registerAuthorityForm) registerAuthorityForm.style.display = 'none';
            } else {
                authorityTab.classList.remove('bg-gray-200', 'text-gray-700', 'border-gray-300');
                authorityTab.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
                citizenTab.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
                citizenTab.classList.add('bg-gray-200', 'text-gray-700', 'border-gray-300');
                if (registerCitizenForm) registerCitizenForm.style.display = 'none';
                if (registerAuthorityForm) registerAuthorityForm.style.display = 'block';
            }
        };

        citizenTab.addEventListener('click', () => toggleRegisterForms(true));
        authorityTab.addEventListener('click', () => toggleRegisterForms(false));

        // Por defecto, mostrar el formulario de ciudadano al cargar
        toggleRegisterForms(true);

        // Handle citizen registration form submission
        if (registerCitizenForm) {
            registerCitizenForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const dni = document.getElementById('citizenDni').value;
                const nombreCompleto = document.getElementById('citizenNombreCompleto').value;
                const correoElectronico = document.getElementById('citizenCorreoElectronico').value;
                const password = document.getElementById('citizenPassword').value;
                const confirmPassword = document.getElementById('citizenConfirmPassword').value;

                if (password !== confirmPassword) {
                    alert('Las contraseñas no coinciden.');
                    return;
                }
                await window.auth.handleRegister({ dni, nombreCompleto, correoElectronico, password }, 'ciudadano');
            });
        }

        // Handle authority registration form submission
        if (registerAuthorityForm) {
            registerAuthorityForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const dni = document.getElementById('authorityDni').value;
                const nombreCompleto = document.getElementById('authorityNombreCompleto').value;
                const correoElectronico = document.getElementById('authorityCorreoElectronico').value;
                const cargo = document.getElementById('authorityCargo').value;
                const password = document.getElementById('authorityPassword').value;
                const confirmPassword = document.getElementById('authorityConfirmPassword').value;

                if (password !== confirmPassword) {
                    alert('Las contraseñas no coinciden.');
                    return;
                }
                await window.auth.handleRegister({ dni, nombreCompleto, correoElectronico, cargo, password }, 'autoridad');
            });
        }
    }
});