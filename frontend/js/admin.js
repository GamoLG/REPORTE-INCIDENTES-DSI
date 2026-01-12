document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = (window.apiBase || '') + '/api'; // URL base de la API (usa window.apiBase si está expuesto)

    // Botón de exportar: muestra modal con opción PDF/Excel (admins y autoridades)
    const exportBtn = document.getElementById('exportReportsBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    const openExportModal = () => exportModal && exportModal.classList.remove('hidden');
    const closeExport = () => exportModal && exportModal.classList.add('hidden');

    async function exportReports(format) { // This function is also in dashboard-autoridad.js, should be consolidated or removed from admin.js
        if (!window.auth.checkUserRole(['admin', 'autoridad'])) return;
        const url = `${(window.apiBase || '')}/api/reports/export?format=${format}`;
        try {
            const res = await fetch(url, {
                method: 'GET', // Use window.auth.getToken()
                headers: { 'Authorization': `Bearer ${window.auth.getAuthToken()}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.msg || 'Error al exportar.');
                return;
            }

            const blob = await res.blob();
            const filename = format === 'pdf' ? 'reportes.pdf' : 'reportes.xlsx';
            const a = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error('Error exportando reportes:', error);
            alert('Error de conexión al exportar. Inténtalo de nuevo más tarde.');
        }
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!window.auth.checkUserRole(['admin', 'autoridad'])) return;
            openExportModal();
        });
    }

    if (closeExportModal) closeExportModal.addEventListener('click', closeExport);
    // Cerrar modal al hacer click fuera del diálogo
    if (exportModal) exportModal.addEventListener('click', (e) => { if (e.target === exportModal) closeExport(); });
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', async () => { await exportReports('pdf'); closeExport(); });
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', async () => { await exportReports('excel'); closeExport(); });

    // Normaliza campos que pueden venir como JSON strings desde MySQL
    const normalizeReport = (r) => {
        try {
            if (r.fotografias && typeof r.fotografias === 'string') r.fotografias = JSON.parse(r.fotografias);
        } catch (e) { r.fotografias = r.fotografias || []; }
        return r;
    };

    // Lógica para admin-dashboard.html
    if (document.getElementById('adminDashboard') && window.auth.checkUserRole(['admin'])) { // Only for admin dashboard

        const totalReportsElement = document.getElementById('totalReports');
        const pendingReportsElement = document.getElementById('pendingReports');
        const inProcessReportsElement = document.getElementById('inProcessReports');
        const resolvedReportsElement = document.getElementById('resolvedReports');
        const recentReportsTableBody = document.getElementById('recentReportsTableBody');

        const loadDashboardData = async () => {
            try {
                const response = await fetch(`${API_URL}/dashboard`, {
                    headers: {
                        'Authorization': `Bearer ${window.auth.getAuthToken()}`
                    }
                });
                const data = await response.json();

                let recentReports = data.recentReports.map(normalizeReport); // Admin dashboard shows all recent reports

                if (response.ok) {
                    totalReportsElement.textContent = data.totalReports;
                    const pending = data.reportsByStatus.find(r => r.estado === 'Pendiente');
                    pendingReportsElement.textContent = pending ? pending.count : 0;
                    const inProcess = data.reportsByStatus.find(r => r.estado === 'En proceso');
                    inProcessReportsElement.textContent = inProcess ? inProcess.count : 0;
                    const resolved = data.reportsByStatus.find(r => r.estado === 'Resuelto');
                    resolvedReportsElement.textContent = resolved ? resolved.count : 0;

                    // Limpiar tabla de reportes recientes
                    recentReportsTableBody.innerHTML = '';
                    recentReports.forEach(report => {
                        const row = `
                            <tr class="hover:bg-gray-50">
                                <td class="py-3 px-6 text-left whitespace-nowrap">${report.id}</td>
                                <td class="py-3 px-6 text-left">${report.titulo}</td>
                                <td class="py-3 px-6 text-left">${report.categoria}</td>
                                <td class="py-3 px-6 text-left">${report.distrito}</td>
                                <td class="py-3 px-6 text-left">
                                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                                        report.estado === 'Pendiente' ? 'bg-yellow-200 text-yellow-800' :
                                        report.estado === 'En proceso' ? 'bg-blue-200 text-blue-800' :
                                        report.estado === 'Resuelto' ? 'bg-green-200 text-green-800' :
                                        'bg-gray-200 text-gray-800'
                                    }">${report.estado}</span>
                                </td>
                                <td class="py-3 px-6 text-left">${new Date(report.created_at).toLocaleDateString()}</td>
                                <td class="py-3 px-6 text-center">
                                    <a href="admin-report-detail.html?id=${report.id}" class="text-blue-600 hover:text-blue-900">Ver Detalle</a>
                                </td>
                            </tr>
                        `;
                        recentReportsTableBody.innerHTML += row;
                    });

                    // Renderizar gráficos (simulación con datos reales)
                    renderCharts(data.reportsByCategory, data.reportsByStatus, data.reportsByDistrict);

                } else {
                    alert(data.msg || 'Error al cargar datos del dashboard');
                }
            } catch (error) {
                console.error('Error al cargar datos del dashboard:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        };

        loadDashboardData(); // Load data only for admin dashboard
    }

    

    // Funciones de renderizado de gráficos (simuladas con Canvas)
    const renderCharts = (reportsByCategory, reportsByStatus, reportsByDistrict) => {
        // Gráfico de Reportes por Categoría (Barra)
        const categoryCtx = document.getElementById('reportsByCategoryChart');
        if (categoryCtx) {
            new Chart(categoryCtx, {
                type: 'bar',
                data: {
                    labels: reportsByCategory.map(r => r.categoria),
                    datasets: [{
                        label: 'Número de Reportes',
                        data: reportsByCategory.map(r => r.count),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Gráfico de Distribución de Estados (Pie)
        const statusCtx = document.getElementById('reportsByStatusChart');
        if (statusCtx) {
            new Chart(statusCtx, {
                type: 'pie',
                data: {
                    labels: reportsByStatus.map(r => r.estado),
                    datasets: [{
                        data: reportsByStatus.map(r => r.count),
                        backgroundColor: [
                            'rgba(255, 206, 86, 0.6)', // Pendiente (amarillo)
                            'rgba(54, 162, 235, 0.6)', // En proceso (azul)
                            'rgba(75, 192, 192, 0.6)', // Resuelto (verde)
                            'rgba(153, 102, 255, 0.6)',// En espera (morado)
                            'rgba(201, 203, 207, 0.6)' // Cerrado (gris)
                        ],
                        borderColor: [
                            'rgba(255, 206, 86, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(201, 203, 207, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                }
            });
        }

        // Gráfico de Reportes por Distrito (Línea)
        const districtCtx = document.getElementById('reportsByDistrictChart');
        if (districtCtx) {
            new Chart(districtCtx, {
                type: 'line',
                data: {
                    labels: reportsByDistrict.map(r => r.distrito),
                    datasets: [{
                        label: 'Número de Reportes',
                        data: reportsByDistrict.map(r => r.count),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    };

    // Lógica para admin-report-management.html
    if (document.getElementById('reportManagementTable')) {
        if (!window.auth.checkUserRole(['admin', 'autoridad'])) return;

        const searchInput = document.getElementById('searchReport');
        const statusFilter = document.getElementById('filterStatus');
        const categoryFilter = document.getElementById('filterCategory');
        const districtFilter = document.getElementById('filterDistrict');
        const reportTableBody = document.getElementById('reportTableBody');
        
        let authorities = []; // Para almacenar la lista de autoridades

        // Función para obtener las clases de estilo de Tailwind CSS según el estado del reporte
        function getReportStatusClass(status) {
            switch (status) {
                case 'Pendiente':
                    return 'bg-yellow-100 text-yellow-800';
                case 'En proceso':
                    return 'bg-blue-100 text-blue-800';
                case 'En espera':
                    return 'bg-orange-100 text-orange-800';
                case 'Resuelto':
                    return 'bg-green-100 text-green-800';
                case 'Cerrado':
                    return 'bg-gray-200 text-gray-800';
                default:
                    return 'bg-gray-100 text-gray-700';
            }
        }

        // Función para obtener la lista de autoridades
        async function fetchAuthorities() {
            try {
                const response = await fetch(`${API_URL}/users/authorities`, {
                    headers: { 'Authorization': `Bearer ${window.auth.getAuthToken()}` }
                });
                const data = await response.json();
                if (response.ok) {
                    authorities = data;
                } else {
                    console.error('Error al obtener autoridades:', data.msg);
                }
            } catch (error) {
                console.error('Error de red al obtener autoridades:', error);
            }
        }

        async function fetchAndRenderReports() {
            const searchTerm = searchInput.value;
            const selectedStatus = statusFilter.value === '' ? '' : statusFilter.value;
            const selectedCategory = categoryFilter.value === '' ? '' : categoryFilter.value;
            const selectedDistrict = districtFilter.value === '' ? '' : districtFilter.value;

            let url = `${API_URL}/reports?`;
            if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`; // Use normalizeReport here
            if (selectedStatus) url += `estado=${encodeURIComponent(selectedStatus)}&`;
            if (selectedCategory) url += `categoria=${encodeURIComponent(selectedCategory)}&`;
            if (selectedDistrict) url += `distrito=${encodeURIComponent(selectedDistrict)}&`;

            url = url.slice(0, -1); // Eliminar el último '&' o '?'

            try {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${window.auth.getAuthToken()}` }
                });
                let reports = (await response.json()).map(normalizeReport);

                // Filtrar por asignado_id si el usuario es autoridad
                const token = window.auth.getAuthToken();
                const userRole = window.auth.getRoleFromToken(token);
                let userId = null;
                if (userRole === 'autoridad') {
                    // Obtener el id del usuario desde el token
                    try {
                        const parts = token.split('.');
                        if (parts.length === 3) { // JWTs have 3 parts
                            const payload = JSON.parse(atob(parts[1]));
                            userId = payload.user && payload.user.id ? payload.user.id : null;
                        }
                    } catch (e) { userId = null; }
                    if (userId) {
                        reports = reports.filter(r => r.asignado_id === userId);
                    }
                }

                if (response.ok) {
                    renderReportTable(reports);
                } else {
                    alert(reports.msg || 'Error al obtener los reportes.');
                    console.error('Error al obtener reportes:', reports);
                }
            } catch (error) {
                console.error('Error de red o del servidor:', error);
                alert('Error de conexión al obtener los reportes. Inténtalo de nuevo más tarde.');
            }
        }

        function renderReportTable(reports) {
            reportTableBody.innerHTML = '';
            if (reports.length === 0) {
                reportTableBody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No hay reportes que coincidan con los filtros.</td></tr>';
                return;
            }

            reports.forEach(report => {
                const statusClass = getReportStatusClass(report.estado);
                const reportDate = new Date(report.created_at).toLocaleDateString('es-ES');
                // Mostrar siempre el nombre real del ciudadano
                const ciudadanoNombre = report.ciudadano_nombre && report.ciudadano_nombre.trim() !== '' ? report.ciudadano_nombre : '';

                let assignSelectOptions = '<option value="">Sin asignar</option>';
                authorities.forEach(authority => {
                    const selected = (report.asignado_id === authority.id || report.asignado_a_nombre === authority.nombre_completo) ? 'selected' : '';
                    assignSelectOptions += `<option value="${authority.id}" ${selected}>${authority.nombre_completo} (${authority.cargo || 'Autoridad'})</option>`;
                });

                const reportElement = `
                    <tr data-report-id="${report.id}">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <img class="h-10 w-10 rounded-full" src="${report.fotografias && report.fotografias.length > 0 && report.fotografias[0].url !== null ? report.fotografias[0].url : 'https://via.placeholder.com/40'}" alt="">
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${report.titulo}</div>
                                    <div class="text-sm text-gray-500">${report.direccion}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.categoria}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.distrito}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${report.estado}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ciudadanoNombre}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${reportDate}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <select class="assign-authority-select p-2 border border-gray-300 rounded-md" data-report-id="${report.id}">
                                ${assignSelectOptions}
                            </select>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href="admin-report-detail.html?id=${report.id}" class="text-indigo-600 hover:text-indigo-900 mr-2">Ver</a>
                        </td>
                    </tr>
                `;
                reportTableBody.innerHTML += reportElement;
            });

            // Añadir event listeners a los selectores de asignación
            document.querySelectorAll('.assign-authority-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const reportId = e.target.dataset.reportId;
                    const assignedToId = e.target.value || null;
                    try {
                        const response = await fetch(`${API_URL}/reports/${reportId}/assign`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${window.auth.getAuthToken()}`
                            },
                            body: JSON.stringify({ asignado_id: assignedToId })
                        });
                        const data = await response.json();
                        if (response.ok) {
                            alert('Reporte asignado/desasignado con éxito!');
                            fetchAndRenderReports();
                        } else {
                            alert(data.msg || 'Error al asignar reporte.');
                            console.error('Error al asignar reporte:', data);
                        }
                    } catch (error) {
                        console.error('Error de red o del servidor al asignar reporte:', error);
                        alert('Error de conexión al asignar reporte. Inténtalo de nuevo más tarde.');
                    }
                });
            });
        }

        // Event Listeners para filtros
        searchInput.addEventListener('input', fetchAndRenderReports);
        statusFilter.addEventListener('change', fetchAndRenderReports);
        categoryFilter.addEventListener('change', fetchAndRenderReports);
        districtFilter.addEventListener('change', fetchAndRenderReports);

        // Cargar autoridades y luego los reportes al inicio
        await fetchAuthorities();
        fetchAndRenderReports();
    }

    // Lógica para admin-report-detail.html
    if (document.getElementById('reportDetail')) {
        if (!window.auth.checkUserRole(['admin', 'autoridad'])) return;

        const urlParams = new URLSearchParams(window.location.search);
        const reportId = urlParams.get('id');
        if (!reportId) {
            alert('ID de reporte no especificado.');
            window.location.href = 'admin-report-management.html';
            return;
        }

        // Elementos del DOM
        const reportIdSpan = document.getElementById('reportId');
        const reportTitle = document.getElementById('reportTitle');
        const reportCategory = document.getElementById('reportCategory');
        const reportStatus = document.getElementById('reportStatus');
        const reportCitizen = document.getElementById('reportCitizen');
        const reportDateTime = document.getElementById('reportDateTime');
        const reportLocation = document.getElementById('reportLocation');
        const reportDescription = document.getElementById('reportDescription');
        const reportImages = document.getElementById('reportImages');
        const assignTo = document.getElementById('assignTo');
        const assignBtn = document.getElementById('assignBtn');
        const changeStatus = document.getElementById('changeStatus');
        const updateStatusBtn = document.getElementById('updateStatusBtn');
        const statusComment = document.getElementById('statusComment');

        const resolutionDescriptionEl = document.getElementById('resolutionDescription');
        const resolutionPhotosInput = document.getElementById('resolutionPhotos');
        const resolutionImagesPreview = document.getElementById('resolutionImagesPreview');
        const uploadEvidenceBtn = document.getElementById('uploadEvidenceBtn');
        let currentReport = null;
        let authorities = [];

        async function fetchAuthorities() {
            try {
                const response = await fetch(`${API_URL}/users/authorities`, {
                    headers: { 'Authorization': `Bearer ${window.auth.getAuthToken()}` }
                });
                const data = await response.json();
                if (response.ok) {
                    authorities = data;
                } else {
                    authorities = [];
                }
            } catch (e) {
                authorities = [];
            }
        }

        async function fetchReportDetail() {
            try {
                const response = await fetch(`${API_URL}/reports/${reportId}`, {
                    headers: { 'Authorization': `Bearer ${window.auth.getAuthToken()}` }
                });
                const data = await response.json();
                if (response.ok) {
                    currentReport = data;
                    renderReportDetail();
                } else {
                    alert(data.msg || 'No se pudo cargar el reporte.');
                    window.location.href = 'admin-report-management.html';
                }
            } catch (e) {
                alert('Error de red al cargar el reporte.');
                window.location.href = 'admin-report-management.html';
            }
        }

        function renderReportDetail() {
            if (!currentReport) return;
            reportIdSpan.textContent = currentReport.id;
            reportTitle.textContent = currentReport.titulo;
            reportCategory.textContent = currentReport.categoria;
            reportStatus.textContent = currentReport.estado;
            reportStatus.className = 'px-2 py-1 rounded-full text-xs font-semibold ' +
                (currentReport.estado === 'Pendiente' ? 'bg-yellow-200 text-yellow-800' :
                currentReport.estado === 'En proceso' ? 'bg-blue-200 text-blue-800' :
                currentReport.estado === 'En espera' ? 'bg-orange-200 text-orange-800' :
                currentReport.estado === 'Resuelto' ? 'bg-green-200 text-green-800' :
                'bg-gray-200 text-gray-800');
            reportCitizen.textContent = currentReport.ciudadano ? `${currentReport.ciudadano.nombre_completo} (${currentReport.ciudadano.correo_electronico || ''})` : 'Desconocido';
            reportDateTime.textContent = new Date(currentReport.created_at).toLocaleString('es-PE');
            reportLocation.textContent = `${currentReport.direccion}, ${currentReport.distrito}`;
            reportDescription.textContent = currentReport.descripcion;
            // Imágenes
            reportImages.innerHTML = '';
            if (currentReport.imagenes && currentReport.imagenes.length > 0) {
                currentReport.imagenes.forEach(img => {
                    const el = document.createElement('img');
                    el.src = img.url;
                    el.alt = 'Incidencia';
                    el.className = 'w-full h-32 object-cover rounded-md shadow-sm';
                    reportImages.appendChild(el);
                });
            } else {
                reportImages.innerHTML = '<span class="text-gray-400">Sin imágenes</span>';
            }
            
            // Select de autoridades
            assignTo.innerHTML = '<option value="">-- Seleccionar Autoridad --</option>';
            authorities.forEach(a => {
                const selected = currentReport.asignado_id === a.id ? 'selected' : '';
                assignTo.innerHTML += `<option value="${a.id}" ${selected}>${a.nombre_completo} (${a.cargo || 'Autoridad'})</option>`;
            });
            
            // Estado actual en select
            if (changeStatus) changeStatus.value = currentReport.estado;

            // Resolution Evidence
            if (resolutionDescriptionEl) {
                if (currentReport.evidencia_resolucion_descripcion) {
                    resolutionDescriptionEl.value = currentReport.evidencia_resolucion_descripcion;
                    resolutionDescriptionEl.readOnly = true;
                } else {
                    resolutionDescriptionEl.value = '';
                    resolutionDescriptionEl.readOnly = false;
                }
            }

            if (resolutionImagesPreview) {
                resolutionImagesPreview.innerHTML = '';
                const resolutionImages = currentReport.imagenes ? currentReport.imagenes.filter(img => img.tipo === 'resolucion') : [];
                if (resolutionImages.length > 0) {
                    resolutionImages.forEach(img => {
                        const el = document.createElement('img');
                        el.src = img.url;
                        el.alt = 'Evidencia de Resolución';
                        el.className = 'w-full h-32 object-cover rounded-md shadow-sm';
                        resolutionImagesPreview.appendChild(el);
                    });
                    if (resolutionPhotosInput) resolutionPhotosInput.style.display = 'none'; // Hide input if evidence already exists
                    if (uploadEvidenceBtn) uploadEvidenceBtn.style.display = 'none';
                } else {
                    if (resolutionPhotosInput) resolutionPhotosInput.style.display = 'block';
                    if (uploadEvidenceBtn) uploadEvidenceBtn.style.display = 'block';
                }
            }
        }
        
        if (assignBtn) {
            assignBtn.addEventListener('click', async () => {
                const asignado_id = assignTo.value;
                if (!asignado_id) {
                    alert('Selecciona una autoridad para asignar.');
                    return;
                }
                try {
                    const response = await fetch(`${API_URL}/reports/${reportId}/assign`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.auth.getAuthToken()}`
                        },
                        body: JSON.stringify({ asignado_id })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Reporte asignado correctamente.');
                        currentReport = data;
                        renderReportDetail();
                    } else {
                        alert(data.msg || 'No se pudo asignar.');
                    }
                } catch (e) {
                    alert('Error de red al asignar.');
                }
            });
        }

        if (updateStatusBtn) {
            updateStatusBtn.addEventListener('click', async () => {
                const estado = changeStatus.value;
                const evidencia_resolucion_descripcion = statusComment.value;
                try {
                    const response = await fetch(`${API_URL}/reports/${reportId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.auth.getAuthToken()}`
                        },
                        body: JSON.stringify({ estado, evidencia_resolucion_descripcion })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Estado actualizado correctamente.');
                        fetchReportDetail();
                    } else {
                        alert(data.msg || 'No se pudo actualizar el estado.');
                    }
                } catch (e) {
                    alert('Error de red al actualizar estado.');
                }
            });
        }
        
        if (uploadEvidenceBtn) {
            uploadEvidenceBtn.addEventListener('click', async () => {
                const resolutionDescription = resolutionDescriptionEl.value;
                const resolutionPhotos = resolutionPhotosInput.files;
        
                if (resolutionPhotos.length === 0 && !resolutionDescription.trim()) {
                    alert('Por favor, añade una descripción o al menos una fotografía como evidencia.');
                    return;
                }
        
                const formData = new FormData();
                formData.append('estado', currentReport.estado); // Keep current status or allow changing it here too
                formData.append('evidencia_resolucion_descripcion', resolutionDescription);
                for (let i = 0; i < resolutionPhotos.length; i++) {
                    formData.append('evidencia_resolucion_fotografias', resolutionPhotos[i]);
                }
        
                try {
                    const response = await fetch(`${API_URL}/reports/${reportId}/status`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${window.auth.getAuthToken()}` },
                        body: formData
                    });
                    const data = await response.json();
                    if (response.ok) {
                        alert('Evidencia de resolución subida correctamente.');
                        fetchReportDetail(); // Refresh details
                    } else { alert(data.msg || 'Error al subir evidencia de resolución.'); }
                } catch (e) { console.error('Error de red al subir evidencia:', e); alert('Error de conexión al subir evidencia. Inténtalo de nuevo más tarde.'); }
            });
        }
        

        // Inicialización
        await fetchAuthorities();
        await fetchReportDetail();
    }

    // Lógica para admin-profile.html (se implementará en una tarea posterior)
    if (document.getElementById('profileForm') && window.location.pathname.includes('admin-profile.html')) { // This check is redundant with profile.js
        if (!window.auth.checkUserRole(['admin', 'autoridad'])) return;
        // Aquí irá la lógica para gestionar el perfil del admin/autoridad
    }

    // Lógica para admin-map.html: mostrar todas las incidencias en el mapa para el admin
    if (document.getElementById('mapid') && window.location.pathname.includes('admin-map.html')) {
        if (!window.auth.checkUserRole(['admin'])) return;
        const API_URL = (window.apiBase || '') + '/api';
        const token = window.auth.getAuthToken();
        const mapEl = document.getElementById('mapid');
        if (!mapEl || typeof L === 'undefined') return;
        mapEl.style.minHeight = mapEl.style.minHeight || '500px';
        const cusco = [-13.5167, -71.9781];
        const map = L.map('mapid').setView(cusco, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
        const markers = (L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup());
        map.addLayer(markers);
        let allReports = [];

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

        // Obtener todos los reportes para el admin
        fetch(`${API_URL}/reports`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
            .then(data => {
                allReports = Array.isArray(data) ? data : [];
                render(allReports);
            })
            .catch(err => {
                console.warn('Admin map: fallback to mock', err);
                const MOCK = [
                    { id: 1, titulo: 'Semáforo dañado', distrito: 'Wanchaq', categoria: 'Semáforos dañados', estado: 'En proceso', latitud: -13.525, longitud: -71.971, imagenes: [] },
                    { id: 2, titulo: 'Basura en parque', distrito: 'San Sebastián', categoria: 'Basura acumulada', estado: 'Pendiente', latitud: -13.513, longitud: -71.9785, imagenes: [] }
                ];
                allReports = MOCK;
                render(allReports);
            });
    }
});