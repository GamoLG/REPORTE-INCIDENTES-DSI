document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = (window.apiBase || '') + '/api';

    // Botón de exportar: muestra modal con opción PDF/Excel (admins y autoridades)
    const exportBtn = document.getElementById('exportReportsBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');

    const openExportModal = () => exportModal && exportModal.classList.remove('hidden');
    const closeExport = () => exportModal && exportModal.classList.add('hidden');

    async function exportReports(format) {
        // Assuming window.auth.checkUserRole and window.auth.getToken are available globally or from auth.js
        if (typeof window.auth.checkUserRole !== 'function' || typeof window.auth.getAuthToken !== 'function') {
            console.error('Auth functions not available.');
            alert('Error de autenticación. Por favor, recarga la página.');
            return;
        }
        if (!window.auth.checkUserRole(['admin', 'autoridad'])) return;
        const url = `${(window.apiBase || '')}/api/reports/export?format=${format}`;
        try {
            const res = await fetch(url, {
                method: 'GET', // Use window.auth.getAuthToken()
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
            if (typeof checkUserRole !== 'function' || !checkUserRole(['admin', 'autoridad'])) return;
            openExportModal();
        });
    }

    if (closeExportModal) closeExportModal.addEventListener('click', closeExport);
    if (exportModal) exportModal.addEventListener('click', (e) => { if (e.target === exportModal) closeExport(); });
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', async () => { await exportReports('pdf'); closeExport(); });
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', async () => { await exportReports('excel'); closeExport(); });

    // Lógica para dashboard-autoridad.html
    if (document.getElementById('authorityDashboard')) {
        // Assuming checkUserRole and getToken are available globally or from auth.js
        if (typeof window.auth.checkUserRole !== 'function' || typeof window.auth.getAuthToken !== 'function') {
            console.error('Auth functions not available.');
            window.location.href = 'index.html'; // Redirect if auth functions are missing
            return;
        }
        if (!window.auth.checkUserRole(['autoridad'])) return; // Ensure only authorities access this dashboard

        const totalReportsElement = document.getElementById('totalReports');
        const pendingReportsElement = document.getElementById('pendingReports');
        const inProcessReportsElement = document.getElementById('inProcessReports');
        const resolvedReportsElement = document.getElementById('resolvedReports');
        const recentReportsTableBody = document.getElementById('recentReportsTableBody');

        const loadDashboardData = async () => {
            try {
                const token = window.auth.getAuthToken();
                // 1. Cargar estadísticas generales
                const response = await fetch(`${API_URL}/dashboard`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (response.ok) {
                    totalReportsElement.textContent = data.totalReports;
                    pendingReportsElement.textContent = (data.reportsByStatus.find(r => r.estado === 'Pendiente') || {count:0}).count;
                    inProcessReportsElement.textContent = (data.reportsByStatus.find(r => r.estado === 'En proceso') || {count:0}).count;
                    resolvedReportsElement.textContent = (data.reportsByStatus.find(r => r.estado === 'Resuelto') || {count:0}).count;

                    // Renderizar gráficos usando los datos agregados
                    if (typeof renderCharts === 'function') {
                        renderCharts(data.reportsByCategory, data.reportsByStatus, data.reportsByDistrict);
                    } else {
                        console.warn('renderCharts function not found. Charts will not be rendered.');
                    }

                    // 2. Cargar solo las tareas asignadas a la autoridad logueada
                    const tareasRes = await fetch(`${API_URL}/dashboard/mis-tareas`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const tareas = await tareasRes.json();
                    recentReportsTableBody.innerHTML = '';
                    (tareas || []).forEach(report => {
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

                } else {
                    alert(data.msg || 'Error al cargar datos del dashboard');
                }
            } catch (error) {
                console.error('Error al cargar datos del dashboard:', error);
                alert('Error de conexión. Inténtalo de nuevo más tarde.');
            }
        };

        loadDashboardData();
    }

    // Functions for chart rendering (copied from admin.js, assuming Chart.js is loaded)
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
});