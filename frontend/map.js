document.addEventListener('DOMContentLoaded', async () => {
    // Assuming window.auth.checkUserRole and window.auth.getAuthToken are available globally or from js/shared/auth.js
    if (typeof window.auth.checkUserRole !== 'function' || typeof window.auth.getAuthToken !== 'function') { // Use window.auth.getAuthToken()
        console.error('Auth functions not available.');
        window.location.href = 'index.html'; // Redirect if auth functions are missing
        return;
    }
    if (!window.auth.checkUserRole(['autoridad'])) { // Use window.auth.checkUserRole()
        alert('Acceso no autorizado.');
        window.location.href = 'index.html';
        return;
    }

    const API_URL = (window.apiBase || '') + '/api';
    const token = window.auth.getAuthToken(); // Use window.auth.getAuthToken()

    // Cargar perfil en sidebar
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await response.json();
        if (response.ok) {
            if(document.getElementById('nombreAutoridad'))
                document.getElementById('nombreAutoridad').textContent = user.nombre_completo;
            if(document.getElementById('cargoAutoridad'))
                document.getElementById('cargoAutoridad').textContent = user.cargo || 'Autoridad';
        }
    } catch {}

    function iconByEstado(estado) {
        const icons = {
            'Pendiente': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            'En proceso': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
            'Resuelto': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'
        };
        return L.icon({
            iconUrl: icons[estado] || icons['Pendiente'],
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
    }

    function getFilters() {
        return {
            distrito: document.getElementById('filterDistrict').value,
            categoria: document.getElementById('filterCategory').value
        };
    }

    function applyFilters(data) {
        const f = getFilters();
        return data.filter(r => {
            if (f.distrito && r.distrito !== f.distrito) return false;
            if (f.categoria && r.categoria !== f.categoria) return false;
            return true;
        });
    }

    const mapEl = document.getElementById('mapid');
    if (!mapEl || typeof L === 'undefined') return;

    mapEl.style.minHeight = mapEl.style.minHeight || '420px';
    const cusco = [-13.5167, -71.9781];
    const map = L.map('mapid').setView(cusco, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const markers = (L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup());
    map.addLayer(markers);
    let allReports = [];

    function render(data) {
        markers.clearLayers && markers.clearLayers();
        let bounds = null;
        data.forEach(r => {
            if (!r.latitud || !r.longitud) return;
            const lat = Number(r.latitud), lng = Number(r.longitud);
            if (isNaN(lat) || isNaN(lng)) return;
            const m = L.marker([lat, lng], { icon: iconByEstado(r.estado) })
                .bindPopup(`<b>${r.titulo}</b><br>${r.distrito} - ${r.categoria || ''}<br>Estado: ${r.estado}`);
            markers.addLayer(m);
            if (!bounds) bounds = L.latLngBounds([lat, lng], [lat, lng]);
            else bounds.extend([lat, lng]);
        });
        if (bounds && bounds.isValid && bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        setTimeout(() => { try { map.invalidateSize(); } catch (e) { } }, 200);
    }

    function update() { render(applyFilters(allReports)); }
    document.getElementById('applyFilters').onclick = update;

    fetch(`${API_URL}/reports/public`)
        .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .then(data => { allReports = data; render(allReports); })
        .catch(err => {
            console.warn('Authority map: fallback to mock', err);
            const MOCK = [
                { id: 1, titulo: 'Semáforo dañado', distrito: 'Wanchaq', categoria: 'Semáforos dañados', estado: 'En proceso', latitud: -13.525, longitud: -71.971, imagenes: [] },
                { id: 2, titulo: 'Basura en parque', distrito: 'San Sebastián', categoria: 'Basura acumulada', estado: 'Pendiente', latitud: -13.513, longitud: -71.9785, imagenes: [] }
            ];
            allReports = MOCK;
            render(allReports);
        });
});