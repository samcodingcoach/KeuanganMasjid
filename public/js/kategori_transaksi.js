document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    // Initialize Select2 for the jenis_kategori dropdown
    $('#jenis_kategori').select2({
        theme: 'bootstrap-5',
        placeholder: 'Pilih Jenis Kategori',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#addKategoriModal') // Ensure dropdown appears correctly within the modal
    });

    const addKategoriModal = new bootstrap.Modal(document.getElementById('addKategoriModal'));
    const addKategoriForm = document.getElementById('add-kategori-form');
    const editKategoriModal = new bootstrap.Modal(document.getElementById('editKategoriModal'));
    const editKategoriForm = document.getElementById('edit-kategori-form');

    // Data store
    let allKategoriData = [];
    let filteredKategoriData = [];

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10; // Default items per page

    // Fungsi untuk mengambil dan menampilkan data kategori
    function fetchAndDisplayKategori() {
        fetch('/api/kategori.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allKategoriData = data.data;
                    filteredKategoriData = allKategoriData;
                    displayData(1); // Display first page
                } else {
                    alert('Gagal memuat data kategori: ' + data.message);
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
        const tableBody = document.querySelector('#kategori-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel

        // Calculate pagination values
        const totalEntries = filteredKategoriData.length;
        const totalPages = Math.ceil(totalEntries / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
        const pageData = filteredKategoriData.slice(startIndex, endIndex);

        // Update pagination info
        const paginationInfo = document.querySelector('.card-footer .text-muted');
        if (paginationInfo) {
            paginationInfo.innerHTML = `<small style="font-size: 0.75em;">Menampilkan <strong>${totalEntries > 0 ? startIndex + 1 : 0}-${endIndex}</strong> dari <strong>${totalEntries}</strong> entri</small>`;
        }

        // Update pagination controls
        updatePaginationControls(page, totalPages);

        let counter = startIndex + 1;
        pageData.forEach(kategori => {
            const row = document.createElement('tr');
            row.dataset.id = kategori.id_kategori;
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                <th scope="row" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${counter++}</th>
                <td style="padding: 15px 20px; font-weight: 500; vertical-align: middle; font-size: 0.9em;">${kategori.nama_kategori}</td>
                <td style="padding: 15px 20px; color: #666; vertical-align: middle; font-size: 0.9em;">${kategori.jenis_kategori}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">
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
        const totalPages = Math.ceil(filteredKategoriData.length / itemsPerPage);
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
        filteredKategoriData = allKategoriData.filter(kategori => 
            kategori.nama_kategori.toLowerCase().includes(searchTerm) ||
            kategori.jenis_kategori.toLowerCase().includes(searchTerm)
        );
        displayData(1); // Display first page of filtered results
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Event listener untuk tombol edit
    document.getElementById('kategori-table').addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-btn') || event.target.closest('.edit-btn')) {
            const button = event.target.classList.contains('edit-btn') ? event.target : event.target.closest('.edit-.btn');
            const row = button.closest('tr');
            const id = row.dataset.id;
            
            const kategori = allKategoriData.find(k => k.id_kategori == id);
            if (!kategori) return;

            document.getElementById('edit_id_kategori').value = kategori.id_kategori;
            document.getElementById('edit_nama_kategori').value = kategori.nama_kategori;
            document.getElementById('edit_jenis_kategori').value = kategori.jenis_kategori;
            
            editKategoriModal.show();
        }
    });

    // Event listener untuk form tambah kategori
    addKategoriForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const submitBtn = addKategoriForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';

        const newKategori = {
            nama_kategori: document.getElementById('nama_kategori').value,
            jenis_kategori: document.getElementById('jenis_kategori').value
        };

        fetch('/api/kategori.create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newKategori),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showKategoriToast('Kategori berhasil ditambahkan!');
                addKategoriModal.hide();
                addKategoriForm.reset();
                fetchAndDisplayKategori();
            } else {
                showKategoriToast('Gagal menambahkan kategori: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showKategoriToast('Terjadi kesalahan saat menambahkan kategori.', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Simpan';
        });
    });

    // Event listener untuk form edit kategori
    editKategoriForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const submitBtn = editKategoriForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';

        const updatedKategori = {
            id_kategori: document.getElementById('edit_id_kategori').value,
            nama_kategori: document.getElementById('edit_nama_kategori').value,
            jenis_kategori: document.getElementById('edit_jenis_kategori').value
        };

        fetch('/api/kategori.update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedKategori),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showKategoriToast('Kategori berhasil diperbarui!');
                editKategoriModal.hide();
                fetchAndDisplayKategori();
            } else {
                showKategoriToast('Gagal memperbarui kategori: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showKategoriToast('Terjadi kesalahan saat memperbarui kategori.', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Simpan Perubahan';
        });
    });

    // Function to show toast notification for kategori
    function showKategoriToast(message, type = 'success') {
        let toastContainer = document.getElementById('toast-container-kategori');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container-kategori';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1100';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'kategori-toast-' + Date.now();
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

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayKategori();
});