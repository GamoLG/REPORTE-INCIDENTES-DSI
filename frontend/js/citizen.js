document.addEventListener('DOMContentLoaded', () => {
        // Previsualización de imágenes seleccionadas en el formulario de nuevo reporte
        const fotoInput = document.getElementById('fotoIncidente');
        if (fotoInput) {
            // Crear contenedor para previsualización si no existe
            let previewContainer = document.getElementById('previewFotos');
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.id = 'previewFotos';
                previewContainer.className = 'flex flex-wrap gap-2 mt-2';
                fotoInput.parentElement.parentElement.appendChild(previewContainer);
            }
            fotoInput.addEventListener('change', function() {
                previewContainer.innerHTML = '';
                const files = Array.from(fotoInput.files);
                if (files.length > 5) {
                    alert('Solo puedes subir hasta 5 fotografías.');
                    fotoInput.value = '';
                    return;
                }
                files.forEach(file => {
                    if (!file.type.startsWith('image/')) return;
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.className = 'w-20 h-20 object-cover rounded border';
                        previewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
            });
        }
    const useMyLocationBtn = document.getElementById('useMyLocation');
    const distritoSelect = document.getElementById('distrito'); // Cambiado a select
    const direccionInput = document.getElementById('direccion');

    let currentLat = null;
    let currentLng = null;

    // Simulación de API de geocodificación inversa
    async function reverseGeocode(lat, lng) {
        // En un entorno real, aquí harías una llamada a una API de geocodificación inversa
        // Por ejemplo, con OpenStreetMap Nominatim:
        // const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        // const data = await response.json();
        // if (data.address) {
        //     return {
        //         distrito: data.address.city_district || data.address.suburb || data.address.town || 'Desconocido',
        //         direccion: data.display_name || 'Dirección desconocida'
        //     };
        // }
        // Por ahora, valores de ejemplo
        return {
            distrito: 'Wanchaq', // Ejemplo
            direccion: 'Av. El Sol 123' // Ejemplo
        };
    }

    if (useMyLocationBtn) {
        useMyLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        currentLat = lat;
                        currentLng = lng;

                        alert(`Ubicación obtenida: Latitud ${lat}, Longitud ${lng}.`);

                        try {
                            const locationInfo = await reverseGeocode(lat, lng);
                            distritoSelect.value = locationInfo.distrito;
                            direccionInput.value = locationInfo.direccion;
                        } catch (error) {
                            console.error('Error al obtener la dirección del distrito:', error);
                            alert('No se pudo obtener la dirección del distrito. Por favor, ingresa la dirección manualmente.');
                        }
                    },
                    (error) => {
                        console.error('Error al obtener la ubicación:', error);
                        alert('No se pudo obtener tu ubicación. Por favor, ingresa la dirección manualmente.');
                    }
                );
            } else {
                alert('Tu navegador no soporta geolocalización. Por favor, ingresa la dirección manualmente.');
            }
        });
    }

    const newReportForm = document.getElementById('newReportForm');
    if (newReportForm) {
        newReportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const titulo = document.getElementById('tituloReporte').value;
            const descripcion = document.getElementById('descripcionDetallada').value;
            const categoria = document.getElementById('categoria').value;
            const distrito = distritoSelect.value;
            const direccion = direccionInput.value;
            const fotos = document.getElementById('fotoIncidente').files;

            // Permitir ingresar lat/lng manualmente si no se usó geolocalización
            let lat = currentLat, lng = currentLng;
            if (!lat || !lng) {
                // Buscar inputs manuales
                const latInput = document.getElementById('latitudManual');
                const lngInput = document.getElementById('longitudManual');
                if (latInput && lngInput && latInput.value && lngInput.value) {
                    lat = parseFloat(latInput.value);
                    lng = parseFloat(lngInput.value);
                }
            }
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                alert('Por favor, obtén tu ubicación o ingresa latitud y longitud manualmente.');
                return;
            }

            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            formData.append('categoria', categoria);
            formData.append('latitud', lat);
            formData.append('longitud', lng);
            formData.append('direccion', direccion);
            formData.append('distrito', distrito);
            
            for (let i = 0; i < fotos.length; i++) {
                formData.append('fotografias', fotos[i]);
            }

            try {
                const token = window.auth.getAuthToken();
                const response = await fetch((window.apiBase || '') + '/api/reports', {
                    method: 'POST',
                    headers: {
                        'x-auth-token': token
                    },
                    body: formData // FormData se envía directamente, sin 'Content-Type'
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Reporte enviado con éxito!');
                    window.location.href = 'citizen-my-reports.html'; // Redirigir a mis reportes
                } else {
                    alert(data.msg || 'Error al enviar el reporte');
                }

            } catch (error) {
                console.error('Error de red o del servidor:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        });
    }
});