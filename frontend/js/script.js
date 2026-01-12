document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerCitizenForm = document.getElementById('registerCitizenForm');
    const registerAuthorityForm = document.getElementById('registerAuthorityForm');
    const citizenTab = document.getElementById('citizenTab');
    const authorityTab = document.getElementById('authorityTab');

    const API_URL = (window.apiBase || '') + '/api/auth'; // URL de la API de autenticación

    // Función para manejar el inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correoElectronico = document.getElementById('correoElectronico').value;
            const password = document.getElementById('password').value;

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
                    localStorage.setItem('token', data.token);
                    alert('Inicio de sesión exitoso!');
                    // Redirigir según el rol del usuario (se obtendrá del token JWT en un escenario real)
                    // Por ahora, redirigimos manualmente basado en una simulación o si tienes un mecanismo para extraer el rol del token.
                    
                    // Simulación de redirección basada en el rol (requiere decodificar el JWT o que el backend lo envíe)
                    const tokenParts = data.token.split('.');
                    const payload = JSON.parse(atob(tokenParts[1]));
                    const userRole = payload.user.rol;

                    if (userRole === 'admin' || userRole === 'autoridad') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'citizen-dashboard.html';
                    }
                } else {
                    alert(data.msg || 'Error al iniciar sesión');
                }

            } catch (error) {
                console.error('Error de red o del servidor:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        });
    }

    // Función para manejar el registro de ciudadano
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

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ dni, nombreCompleto, correoElectronico, password, rol: 'ciudadano' })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registro de ciudadano exitoso! Ahora puedes iniciar sesión.');
                    window.location.href = 'index.html'; // Redirigir al login
                } else {
                    alert(data.msg || 'Error al registrar ciudadano');
                }

            } catch (error) {
                console.error('Error de red o del servidor:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        });
    }

    // Función para manejar el registro de autoridad
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

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ dni, nombreCompleto, correoElectronico, password, rol: 'autoridad', cargo })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registro de autoridad exitoso! Ahora puedes iniciar sesión.');
                    window.location.href = 'index.html'; // Redirigir al login
                } else {
                    alert(data.msg || 'Error al registrar autoridad');
                }

            } catch (error) {
                console.error('Error de red o del servidor:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        });
    }

    // Lógica para alternar entre formularios de registro
    if (citizenTab && authorityTab) {
        citizenTab.addEventListener('click', () => {
            citizenTab.classList.remove('bg-gray-200', 'text-gray-700', 'border-gray-300');
            citizenTab.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
            authorityTab.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
            authorityTab.classList.add('bg-gray-200', 'text-gray-700', 'border-gray-300');
            if (registerCitizenForm) registerCitizenForm.style.display = 'block';
            if (registerAuthorityForm) registerAuthorityForm.style.display = 'none';
        });

        authorityTab.addEventListener('click', () => {
            authorityTab.classList.remove('bg-gray-200', 'text-gray-700', 'border-gray-300');
            authorityTab.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
            citizenTab.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
            citizenTab.classList.add('bg-gray-200', 'text-gray-700', 'border-gray-300');
            if (registerCitizenForm) registerCitizenForm.style.display = 'none';
            if (registerAuthorityForm) registerAuthorityForm.style.display = 'block';
        });
    }

});

function togglePasswordVisibility(id) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}