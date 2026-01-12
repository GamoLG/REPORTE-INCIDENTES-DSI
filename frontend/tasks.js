// authority/tasks.js
// Lógica para authority/tasks.html (gestión de tareas de la autoridad)
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.auth === 'undefined' || typeof window.auth.getAuthToken !== 'function') {
        console.error('Auth functions not available.');
        window.location.href = 'index.html';
        return;
    }
    const token = window.auth.getAuthToken();
    if (!token) { // Check token again after ensuring window.auth is available
        window.location.href = 'index.html';
        return;
    }

    let userId = null;
    let userRole = null;
    try {
        const parts = token.split('.');
        if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1]));
            userRole = window.auth.getRoleFromToken(token);
            userId = payload.user && payload.user.id ? payload.user.id : null; // userId is not exposed in window.auth, so keep this
        }
    } catch (e) {}

    if (!window.auth.checkUserRole(['autoridad'])) return; // Use window.auth.checkUserRole

    // Tareas asignadas
    const searchInput = document.getElementById('searchReport');
    const statusFilter = document.getElementById('filterStatus');
    const categoryFilter = document.getElementById('filterCategory');
    const districtFilter = document.getElementById('filterDistrict');
    const reportTableBody = document.getElementById('reportTableBody');
    function getReportStatusClass(status) {
        switch (status) {
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'En proceso': return 'bg-blue-100 text-blue-800';
            case 'En espera': return 'bg-orange-100 text-orange-800';
            case 'Resuelto': return 'bg-green-100 text-green-800';
            case 'Cerrado': return 'bg-gray-200 text-gray-800';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
    async function fetchAndRenderReports() {
        let url = (window.apiBase || '') + '/api/reports?';
        if (searchInput && searchInput.value) url += `search=${encodeURIComponent(searchInput.value)}&`;
        if (statusFilter && statusFilter.value) url += `estado=${encodeURIComponent(statusFilter.value)}&`;
        if (categoryFilter && categoryFilter.value) url += `categoria=${encodeURIComponent(categoryFilter.value)}&`;
        if (districtFilter && districtFilter.value) url += `distrito=${encodeURIComponent(districtFilter.value)}&`;
        url = url.slice(0, -1);
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            let reports = await response.json();
            // Filtrar solo las asignadas a la autoridad
            reports = reports.filter(r => r.asignado_id == userId);
            if (response.ok) {
                const normalized = reports.map(r => {
                    try {
                        if (r.fotografias && typeof r.fotografias === 'string') r.fotografias = JSON.parse(r.fotografias);
                    } catch (e) { r.fotografias = r.fotografias || []; }
                    return r;
                });
                renderReportTable(normalized);
            } else {
                alert(reports.msg || 'Error al obtener los reportes.');
            }
        } catch (error) {
            alert('Error de conexión al obtener los reportes.');
        }
    }
    function renderReportTable(reports) {
        if (!reportTableBody) return;
        reportTableBody.innerHTML = '';
        if (reports.length === 0) {
            reportTableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No tienes tareas asignadas o no hay reportes que coincidan con los filtros.</td></tr>';
            return;
        }
        reports.forEach(report => {
            const statusClass = getReportStatusClass(report.estado);
            const reportDate = new Date(report.created_at).toLocaleDateString('es-ES');
            const reportElement = `
                <tr data-report-id="${report.id}"> <td class="px-6 py-4 whitespace-nowrap"> <div class="flex items-center"> <img class="h-10 w-10 rounded-full" src="${report.fotografias && report.fotografias.length > 0 && report.fotografias[0].url !== null ? report.fotografias[0].url : 'https://via.placeholder.com/40'}" alt="">
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.ciudadano_nombre}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${reportDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.asignado_a_nombre || 'Sin asignar'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> <a href="../admin/report-detail.html?id=${report.id}" class="text-indigo-600 hover:text-indigo-900 mr-2 view-report-btn" data-report-id="${report.id}">Ver</a>
                        <a href="#" class="text-green-600 hover:text-green-900 update-status-btn" data-report-id="${report.id}" data-current-status="${report.estado}">Actualizar Estado</a>
                    </td>
                </tr>
            `;
            reportTableBody.innerHTML += reportElement;
        });
    }
    if (searchInput) searchInput.addEventListener('input', fetchAndRenderReports);
    if (statusFilter) statusFilter.addEventListener('change', fetchAndRenderReports);
    if (categoryFilter) categoryFilter.addEventListener('change', fetchAndRenderReports);
    if (districtFilter) districtFilter.addEventListener('change', fetchAndRenderReports);
    fetchAndRenderReports();
});
