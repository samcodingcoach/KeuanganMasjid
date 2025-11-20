document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('You must be logged in to access this page.');
        window.location.href = '/login';
        return;
    }

    // Data store
    let allBayarFitrahData = [];
    let filteredBayarFitrahData = [];

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10; // Default items per page

    // Function to fetch and display bayar fitrah data
    function fetchAndDisplayBayarFitrah() {
        fetch('/api/bayarfitrah.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allBayarFitrahData = data.data;
                    filteredBayarFitrahData = allBayarFitrahData;
                    displayData(1); // Display first page
                } else {
                    alert('Failed to load bayar fitrah data: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('An error occurred while retrieving data.');
            });
    }

    // Function to display data, pagination, and event listeners
    function displayData(page) {
        currentPage = page;
        const tableBody = document.querySelector('#bayar-fitrah-table tbody');
        tableBody.innerHTML = ''; // Clear table body

        // Calculate pagination values
        const totalEntries = filteredBayarFitrahData.length;
        const totalPages = Math.ceil(totalEntries / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
        const pageData = filteredBayarFitrahData.slice(startIndex, endIndex);

        // Update pagination info
        const paginationInfo = document.querySelector('.card-footer .text-muted');
        if (paginationInfo) {
            paginationInfo.innerHTML = `<small style="font-size: 0.75em;">Menampilkan <strong>${totalEntries > 0 ? startIndex + 1 : 0}-${endIndex}</strong> dari <strong>${totalEntries}</strong> entri</small>`;
        }

        // Update pagination controls
        updatePaginationControls(page, totalPages);

        let counter = startIndex + 1;
        pageData.forEach(bayarFitrah => {
            const row = document.createElement('tr');
            row.dataset.id = bayarFitrah.id_pembayaranfitrah;
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                <td scope="row" style="padding: 15px 25px; vertical-align: middle; font-size: 0.9em; width: 60px;">${counter++}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${bayarFitrah.kode_pembayaran || '-'}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${bayarFitrah.created_at || '-'}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${bayarFitrah.keterangan_hargafitrah || '-'}</td>
                <td class="text-end" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">Rp ${bayarFitrah.total_uang?.toLocaleString('id-ID') || '0'}</td>
                <td class="text-end" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${bayarFitrah.total_berat || '0'} kg</td>
                <td class="text-center" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">
                    <button class="btn btn-sm btn-outline-info p-1 detail-btn" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Function to update pagination controls
    function updatePaginationControls(currentPage, totalPages) {
        const paginationContainer = document.querySelector('.card-footer .pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = ''; // Clear existing pagination

        // Previous button
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" ${currentPage === 1 ? 'tabindex="-1"' : ''}><i class="bi bi-chevron-left"></i></a>`;
        paginationContainer.appendChild(prevItem);

        // Page numbers
        const pagesToShow = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
        } else {
            pagesToShow.push(1);
            if (currentPage > 3) pagesToShow.push('...');
            if (currentPage > 2) pagesToShow.push(currentPage - 1);
            if (currentPage > 1 && currentPage < totalPages) pagesToShow.push(currentPage);
            if (currentPage < totalPages - 1) pagesToShow.push(currentPage + 1);
            if (currentPage < totalPages - 2) pagesToShow.push('...');
            pagesToShow.push(totalPages);
        }

        // Remove duplicate '...'
        let uniquePages = [...new Set(pagesToShow)];

        uniquePages.forEach(page => {
            if (page === '...') {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                ellipsisItem.innerHTML = '<span class="page-link">...</span>';
                paginationContainer.appendChild(ellipsisItem);
            } else {
                const pageItem = document.createElement('li');
                pageItem.className = `page-item ${page === currentPage ? 'active' : ''}`;
                pageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${page}); return false;">${page}</a>`;
                paginationContainer.appendChild(pageItem);
            }
        });

        // Next button
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
        nextItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;"><i class="bi bi-chevron-right"></i></a>`;
        paginationContainer.appendChild(nextItem);
    }

    // Function to change page
    function changePage(page) {
        const totalPages = Math.ceil(filteredBayarFitrahData.length / itemsPerPage);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        displayData(page);
    }

    // Make changePage function available globally
    window.changePage = changePage;

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        filteredBayarFitrahData = allBayarFitrahData.filter(bayarFitrah =>
            (bayarFitrah.kode_pembayaran && bayarFitrah.kode_pembayaran.toLowerCase().includes(searchTerm)) ||
            (bayarFitrah.created_at && bayarFitrah.created_at.toLowerCase().includes(searchTerm)) ||
            (bayarFitrah.keterangan_hargafitrah && bayarFitrah.keterangan_hargafitrah.toLowerCase().includes(searchTerm)) ||
            (bayarFitrah.total_uang && String(bayarFitrah.total_uang).toLowerCase().includes(searchTerm))
        );
        displayData(1); // Display first page of filtered results
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Event listener for detail button
    document.getElementById('bayar-fitrah-table').addEventListener('click', function(event) {
        if (event.target.classList.contains('detail-btn') || event.target.closest('.detail-btn')) {
            const button = event.target.classList.contains('detail-btn') ? event.target : event.target.closest('.detail-btn');
            const row = button.closest('tr');
            const id = row.dataset.id;

            const bayarFitrah = allBayarFitrahData.find(h => h.id_pembayaranfitrah == id);
            if (!bayarFitrah) return;

            // Populate detail modal with data
            document.querySelector('#detail-utama-pane #detail_kode_pembayaran').textContent = bayarFitrah.kode_pembayaran || '-';
            document.querySelector('#detail-utama-pane #detail_nama_muzakki').textContent = bayarFitrah.nama_muzakki || '-';
            document.querySelector('#detail-utama-pane #detail_nama_pegawai').textContent = bayarFitrah.nama_pegawai || '-';
            document.querySelector('#detail-utama-pane #detail_keterangan_hargafitrah').textContent = bayarFitrah.keterangan_hargafitrah || '-';

            document.querySelector('#detail-detail-pane #detail_total_uang').textContent = 'Rp ' + (bayarFitrah.total_uang?.toLocaleString('id-ID') || '0');
            document.querySelector('#detail-detail-pane #detail_total_berat').textContent = (bayarFitrah.total_berat || 0) + ' kg';
            document.querySelector('#detail-detail-pane #detail_created_at').textContent = bayarFitrah.created_at || '-';
            document.querySelector('#detail-detail-pane #detail_nama_akun').textContent = bayarFitrah.nama_akun || '-';
            document.querySelector('#detail-detail-pane #detail_jumlah').textContent = bayarFitrah.jumlah || 0;

            // Format status as badge
            const status = bayarFitrah.lunas ? 'Lunas' : 'Belum Lunas';
            const statusClass = bayarFitrah.lunas ? 'bg-success' : 'bg-warning';
            const statusHTML = `<span class="badge ${statusClass}">${status}</span>`;
            document.querySelector('#detail-detail-pane #detail_lunas').innerHTML = statusHTML;

            const detailModal = new bootstrap.Modal(document.getElementById('detailBayarFitrahModal'));
            detailModal.show();
        }
    });

    // Call function to load data for the first time
    fetchAndDisplayBayarFitrah();

    // Initially enable the search button
    const searchBtn = document.querySelector('#search-button');
    if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.classList.remove('disabled');
    }
});

// Function to show toast notification for bayar fitrah
function showBayarFitrahToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container-bayar-fitrah');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-bayar-fitrah';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'bayar-fitrah-toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast rounded-3';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    let headerBg = type === 'error' ? 'linear-gradient(180deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(180deg, #075E54 0%, #128C7E 100%)';

    toastEl.innerHTML = `
        <div class="toast-header d-flex align-items-center" style="background: ${headerBg}; border-radius: 10px 10px 0 0 !important;">
            <i class="bi ${type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2 text-white"></i>
            <strong class="me-auto text-white">${type === 'error' ? 'Error' : 'Sukses'}</strong>
            <small class="text-white">Sekarang</small>
            <button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });
}