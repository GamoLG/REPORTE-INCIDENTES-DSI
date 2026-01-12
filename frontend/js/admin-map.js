// Este archivo contiene toda la lógica del mapa y los filtros para admin-map.html
(function() {
	document.addEventListener('DOMContentLoaded', function() {
		// --- Lógica del mapa y filtros ---
		let map, markers, allReports = [];
		const districtFilter = document.getElementById('filterDistrict');
		const categoryFilter = document.getElementById('filterCategory');
		const applyFiltersBtn = document.getElementById('applyFilters');
		const mapEl = document.getElementById('mapid');

		// Inicializar mapa
		function initMap() {
			if (typeof L === 'undefined') {
				alert('Leaflet no está disponible.');
				return;
			}
			const cuscoCoords = [-13.5167, -71.9781];
			map = L.map('mapid').setView(cuscoCoords, 13);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors'
			}).addTo(map);
			markers = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();
			map.addLayer(markers);
		}

		// Renderizar marcadores
		function renderMarkers(reports) {
			if (!markers) return;
			if (markers.clearLayers) markers.clearLayers();
			const iconByEstado = {
				'Pendiente': L.icon({
					iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
					shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
					iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
				}),
				'En proceso': L.icon({
					iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
					shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
					iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
				}),
				'Resuelto': L.icon({
					iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
					shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
					iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
				})
			};
			let bounds = null;
			reports.forEach(r => {
				if (!r.latitud || !r.longitud) return;
				const lat = Number(r.latitud);
				const lng = Number(r.longitud);
				if (isNaN(lat) || isNaN(lng)) return;
				const popupContent = `
					<strong>${r.titulo || 'Incidencia'}</strong><br>
					<span><b>Descripción:</b> ${r.descripcion || ''}</span><br>
					<span><b>Distrito:</b> ${r.distrito || ''}</span><br>
					<span><b>Categoría:</b> ${r.categoria || ''}</span><br>
					<span><b>Estado:</b> <span style="color:${r.estado==='Pendiente'?'#e53e3e':r.estado==='En proceso'?'#ed8936':r.estado==='Resuelto'?'#38a169':'#4a5568'};font-weight:bold">${r.estado || ''}</span></span>
				`;
				let icon = iconByEstado[r.estado] || iconByEstado['Pendiente'];
				const marker = L.marker([lat, lng], { icon });
				marker.bindPopup(popupContent);
				markers.addLayer(marker);
				if (!bounds) bounds = L.latLngBounds([lat, lng], [lat, lng]);
				else bounds.extend([lat, lng]);
			});
			if (bounds && bounds.isValid && bounds.isValid()) {
				map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
			}
		}

		// Filtros
		function populateFilters(reports) {
			const districts = new Set();
			const categories = new Set();
			reports.forEach(r => {
				if (r.distrito) districts.add(r.distrito);
				if (r.categoria) categories.add(r.categoria);
			});
			districtFilter.innerHTML = '<option value="">Todos los distritos</option>';
			categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
			Array.from(districts).sort().forEach(d => {
				const opt = document.createElement('option'); opt.value = d; opt.textContent = d; districtFilter.appendChild(opt);
			});
			Array.from(categories).sort().forEach(c => {
				const opt = document.createElement('option'); opt.value = c; opt.textContent = c; categoryFilter.appendChild(opt);
			});
		}
		function applyFilters() {
			const district = districtFilter.value;
			const category = categoryFilter.value;
			const filtered = allReports.filter(r => {
				if (district && r.distrito !== district) return false;
				if (category && r.categoria !== category) return false;
				return true;
			});
			renderMarkers(filtered);
		}
		if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
		if (districtFilter) districtFilter.addEventListener('change', applyFilters);
		if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);

		// Cargar incidencias (todas) para el admin
		function loadReports() {
			fetch((window.apiBase || '') + '/api/reports/public')
				.then(r => r.json())
				.then(data => {
					let reports = [];
					if (Array.isArray(data)) {
						reports = data;
					} else if (data && Array.isArray(data.reports)) {
						reports = data.reports;
					} else {
						alert('La respuesta de la API no contiene incidencias.');
						return;
					}
					allReports = reports;
					populateFilters(allReports);
					renderMarkers(allReports);
				})
				.catch(err => {
					alert('Error al cargar incidencias públicas: ' + err);
				});
		}

		// Inicializar todo
		initMap();
		loadReports();
	});
})();
