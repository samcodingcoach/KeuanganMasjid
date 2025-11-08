document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    const detailMasjidModal = new bootstrap.Modal(document.getElementById('detailMasjidModal'));
    const editMasjidModal = new bootstrap.Modal(document.getElementById('editMasjidModal'));
    const editMasjidForm = document.getElementById('edit-masjid-form');

    // Data store
    let allMasjidData = [];
    let filteredMasjidData = [];

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10; // Default items per page

    // Fungsi untuk mengambil data masjid
    function fetchAndDisplayMasjid() {
        fetch('/api/masjid.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allMasjidData = data.data;
                    filteredMasjidData = allMasjidData;
                    displayData(1); // Display first page
                } else {
                    alert('Gagal memuat data masjid: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Terjadi kesalahan saat mengambil data.');
            });
    }

    // Fungsi untuk menampilkan data, paginasi, dan event listener
    function displayData(page) {
        currentPage = page;
        const tableBody = document.querySelector('#masjid-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel

        // Calculate pagination values
        const totalEntries = filteredMasjidData.length;
        const totalPages = Math.ceil(totalEntries / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
        const pageData = filteredMasjidData.slice(startIndex, endIndex);

        // Update pagination info
        const paginationInfo = document.querySelector('.card-footer .text-muted');
        if (paginationInfo) {
            paginationInfo.innerHTML = `<small style="font-size: 0.75em;">Menampilkan <strong>${totalEntries > 0 ? startIndex + 1 : 0}-${endIndex}</strong> dari <strong>${totalEntries}</strong> entri</small>`;
        }

        // Update pagination controls
        updatePaginationControls(page, totalPages);

        let counter = startIndex + 1;
        pageData.forEach(masjid => {
            const row = document.createElement('tr');
            row.dataset.id = masjid.id_masjid;
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                <td scope="row" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${counter++}</td>
                <td style="padding: 15px 20px;  vertical-align: middle; font-size: 0.9em;">${masjid.nama_mesjid}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${masjid.alamat}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${masjid.kota}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">
                    <button class="btn btn-sm btn-outline-info p-1 detail-btn" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-whatsapp p-1 edit-btn" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-pencil"></i>
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
        const totalPages = Math.ceil(filteredMasjidData.length / itemsPerPage);
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
        filteredMasjidData = allMasjidData.filter(masjid => 
            masjid.nama_mesjid.toLowerCase().includes(searchTerm)
        );
        displayData(1); // Display first page of filtered results
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Event listener untuk tombol detail dan edit
    document.getElementById('masjid-table').addEventListener('click', function(event) {
        const target = event.target;
        const detailButton = target.closest('.detail-btn');
        const editButton = target.closest('.edit-btn');

        if (detailButton) {
            const row = detailButton.closest('tr');
            const id = row.dataset.id;
            const masjid = allMasjidData.find(m => m.id_masjid == id);
            if (!masjid) return;

            document.getElementById('detail_nama_mesjid').textContent = masjid.nama_mesjid;
            document.getElementById('detail_alamat').textContent = masjid.alamat;
            document.getElementById('detail_kota').textContent = masjid.kota;
            document.getElementById('detail_provinsi').textContent = masjid.provinsi;
            document.getElementById('detail_email').textContent = masjid.email;
            document.getElementById('detail_gps').textContent = masjid.gps;
            document.getElementById('detail_mushola').textContent = masjid.mushola ? 'Ya' : 'Tidak';

            detailMasjidModal.show();
        }

        if (editButton) {
            const row = editButton.closest('tr');
            const id = row.dataset.id;
            const masjid = allMasjidData.find(m => m.id_masjid == id);
            if (!masjid) return;

            document.getElementById('edit_id_masjid').value = masjid.id_masjid;
            document.getElementById('edit_nama_mesjid').value = masjid.nama_mesjid;
            document.getElementById('edit_alamat').value = masjid.alamat;
            document.getElementById('edit_kota').value = masjid.kota;
            document.getElementById('edit_provinsi').value = masjid.provinsi;
            document.getElementById('edit_email').value = masjid.email;
            document.getElementById('edit_gps').value = masjid.gps;
            document.getElementById('edit_mushola').checked = masjid.mushola;

            editMasjidModal.show();
        }
    });

    // Event listener untuk form edit masjid
    editMasjidForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const submitBtn = editMasjidForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        const id = document.getElementById('edit_id_masjid').value;
        const updatedData = {
            id_masjid: id,
            nama_mesjid: document.getElementById('edit_nama_mesjid').value,
            alamat: document.getElementById('edit_alamat').value,
            kota: document.getElementById('edit_kota').value,
            provinsi: document.getElementById('edit_provinsi').value,
            email: document.getElementById('edit_email').value,
            gps: document.getElementById('edit_gps').value,
            mushola: document.getElementById('edit_mushola').checked
        };

        fetch('/api/masjid.update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMasjidToast('Data masjid berhasil diperbarui!');
                editMasjidModal.hide();
                fetchAndDisplayMasjid(); // Refresh data
            } else {
                showMasjidToast('Gagal memperbarui data: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMasjidToast('Terjadi kesalahan saat memperbarui data.', 'error');
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayMasjid();
});

// Function to show toast notification for masjid
function showMasjidToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container-masjid');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-masjid';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'masjid-toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast rounded-3';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    let headerBg = type === 'error' ? 'linear-gradient(180deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(180deg, #075E54 0%, #128C7E 100%)';
    
    toastEl.innerHTML = `
        <div class="toast-header" style="background: ${headerBg}; border-radius: 10px 10px 0 0 !important;">
            <div class="d-flex align-items-center">
                <i class="bi ${type === 'error' ? 'bi-x-circle' : 'bi-check-circle'} me-2 text-white"></i>
                <strong class="me-auto text-white">${type === 'error' ? 'Error' : 'Sukses'}</strong>
            </div>
            <small class="text-white">Sekarang</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
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