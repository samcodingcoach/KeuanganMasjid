document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    const addAkunModal = new bootstrap.Modal(document.getElementById('addAkunModal'));
    const addAkunForm = document.getElementById('add-akun-form');

    // Data store
    let allAkunData = [];
    let filteredAkunData = [];

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10; // Default items per page

    // Fungsi untuk mengambil data akun
    function fetchAndDisplayAkun() {
        fetch('/api/akun.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allAkunData = data.data;
                    filteredAkunData = allAkunData;
                    displayData(1); // Display first page
                } else {
                    alert('Gagal memuat data akun: ' + data.message);
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
        const tableBody = document.querySelector('#akun-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel

        // Calculate pagination values
        const totalEntries = filteredAkunData.length;
        const totalPages = Math.ceil(totalEntries / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
        const pageData = filteredAkunData.slice(startIndex, endIndex);

        // Update pagination info
        const paginationInfo = document.querySelector('.card-footer .text-muted');
        if (paginationInfo) {
            paginationInfo.innerHTML = `<small style="font-size: 0.75em;">Menampilkan <strong>${totalEntries > 0 ? startIndex + 1 : 0}-${endIndex}</strong> dari <strong>${totalEntries}</strong> entri</small>`;
        }

        // Update pagination controls
        updatePaginationControls(page, totalPages);

        let counter = startIndex + 1;
        pageData.forEach(akun => {
            const row = document.createElement('tr');
            row.dataset.id = akun.id_akun;
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                <th scope="row" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${counter++}</th>
                <td style="padding: 15px 20px; font-weight: 500; vertical-align: middle; font-size: 0.9em;">${akun.nama_akun}</td>
                <td style="padding: 15px 20px; color: #666; vertical-align: middle; font-size: 0.9em;">${akun.jenis_akun.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;" class="text-end">${parseFloat(akun.saldo_awal).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;" class="text-end">${parseFloat(akun.saldo_akhir).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">
                    <button class="btn btn-sm btn-outline-whatsapp p-1 edit-btn" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Calculate and display totals
        const tableFooter = document.getElementById('akun-table-footer');
        tableFooter.innerHTML = ''; // Clear previous totals

        const totals = allAkunData.reduce((acc, akun) => {
            const jenis = akun.jenis_akun;
            if (!acc[jenis]) {
                acc[jenis] = { saldo_awal: 0, saldo_akhir: 0 };
            }
            acc[jenis].saldo_awal += parseFloat(akun.saldo_awal);
            acc[jenis].saldo_akhir += parseFloat(akun.saldo_akhir);
            return acc;
        }, {});

        for (const jenis in totals) {
            const footerRow = document.createElement('tr');
            footerRow.style = "border-top: 2px solid #dee2e6; background-color: #f8f9fa;";
            footerRow.innerHTML = `
                <th colspan="3" class="text-end" style="padding: 15px 20px; font-weight: bold;">Total ${jenis.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>
                <td class="text-end" style="padding: 15px 20px; font-weight: bold;">${totals[jenis].saldo_awal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td class="text-end" style="padding: 15px 20px; font-weight: bold;">${totals[jenis].saldo_akhir.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td></td>
            `;
            tableFooter.appendChild(footerRow);
        }
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
        const totalPages = Math.ceil(filteredAkunData.length / itemsPerPage);
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
        filteredAkunData = allAkunData.filter(akun => 
            akun.nama_akun.toLowerCase().includes(searchTerm) ||
            akun.jenis_akun.toLowerCase().includes(searchTerm)
        );
        displayData(1); // Display first page of filtered results
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    const editAkunModal = new bootstrap.Modal(document.getElementById('editAkunModal'));
    const editAkunForm = document.getElementById('edit-akun-form');

    // Event listener untuk tombol edit
    document.getElementById('akun-table').addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-btn') || event.target.closest('.edit-btn')) {
            const button = event.target.classList.contains('edit-btn') ? event.target : event.target.closest('.edit-btn');
            const row = button.closest('tr');
            const id = row.dataset.id;
            
            const akun = allAkunData.find(a => a.id_akun == id);
            if (!akun) return;

            document.getElementById('edit_id_akun').value = akun.id_akun;
            document.getElementById('edit_nama_akun').value = akun.nama_akun;
            
            // Set radio button for jenis_akun
            const jenisAkunRadio = document.querySelector(`#editAkunModal input[name="edit_jenis_akun"][value="${akun.jenis_akun}"]`);
            if (jenisAkunRadio) {
                jenisAkunRadio.checked = true;
            }

            document.getElementById('edit_nomor_rekening').value = akun.nomor_rekening || '';
            document.getElementById('edit_nama_bank').value = akun.nama_bank || '';
            document.getElementById('edit_deskripsi').value = akun.deskripsi || '';
            document.getElementById('edit_no_referensi').value = akun.no_referensi || '';
            
            editAkunModal.show();
        }
    });

    const saldoAwalInput = document.getElementById('saldo_awal');
    saldoAwalInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value) {
            value = parseInt(value, 10);
            e.target.value = value.toLocaleString('id-ID');
        } else {
            e.target.value = '0';
        }
    });

    // Event listener untuk form tambah akun
    addAkunForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show spinner and disable button
        const submitBtn = addAkunForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;
        
        // Create spinner overlay inside the modal
        const modalBody = document.querySelector('#addAkunModal .modal-body');
        
        // Disable the form
        const formElements = addAkunForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }
        
        // Show spinner overlay
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'add-akun-spinner-overlay';
        spinnerOverlay.style.position = 'absolute';
        spinnerOverlay.style.top = '0';
        spinnerOverlay.style.left = '0';
        spinnerOverlay.style.width = '100%';
        spinnerOverlay.style.height = '100%';
        spinnerOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        spinnerOverlay.style.display = 'flex';
        spinnerOverlay.style.justifyContent = 'center';
        spinnerOverlay.style.alignItems = 'center';
        spinnerOverlay.style.zIndex = '9999';
        spinnerOverlay.style.borderRadius = '0.5rem';
        
        spinnerOverlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        
        // Position the overlay relative to the modal content
        const modalDialog = document.querySelector('#addAkunModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
        
        // Update button state
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        const saldoAwalValue = document.getElementById('saldo_awal').value.replace(/\./g, '');
        const newAkun = {
            nama_akun: document.getElementById('nama_akun').value,
            jenis_akun: document.querySelector('input[name="jenis_akun"]:checked').value,
            saldo_awal: parseFloat(saldoAwalValue) || 0.00,
            nomor_rekening: document.getElementById('nomor_rekening').value || null,
            nama_bank: document.getElementById('nama_bank').value || null,
            deskripsi: document.getElementById('deskripsi').value || null,
            no_referensi: document.getElementById('no_referensi').value || null,
            saldo_akhir: parseFloat(saldoAwalValue) || 0.00 // Saldo akhir sama dengan saldo awal saat pembuatan
        };
        fetch('/api/akun.create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newAkun),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAkunToast('Akun berhasil ditambahkan!');
                addAkunModal.hide(); // Sembunyikan modal
                addAkunForm.reset(); // Reset form
                fetchAndDisplayAkun(); // Muat ulang data
            } else {
                showAkunToast('Gagal menambahkan akun: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAkunToast('Terjadi kesalahan saat menambahkan akun.', 'error');
        })
        .finally(() => {
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('add-akun-spinner-overlay');
            if (spinnerOverlay) {
                spinnerOverlay.remove();
            }
            
            // Re-enable form elements
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }
            
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
        });
    });

    // Event listener untuk form edit akun
    editAkunForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show spinner and disable button
        const submitBtn = editAkunForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;
        
        // Create spinner overlay inside the modal
        const modalBody = document.querySelector('#editAkunModal .modal-body');
        
        // Disable the form
        const formElements = editAkunForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }
        
        // Show spinner overlay
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'edit-akun-spinner-overlay';
        spinnerOverlay.style.position = 'absolute';
        spinnerOverlay.style.top = '0';
        spinnerOverlay.style.left = '0';
        spinnerOverlay.style.width = '100%';
        spinnerOverlay.style.height = '100%';
        spinnerOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        spinnerOverlay.style.display = 'flex';
        spinnerOverlay.style.justifyContent = 'center';
        spinnerOverlay.style.alignItems = 'center';
        spinnerOverlay.style.zIndex = '9999';
        spinnerOverlay.style.borderRadius = '0.5rem';
        
        spinnerOverlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        
        // Position the overlay relative to the modal content
        const modalDialog = document.querySelector('#editAkunModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
        
        // Update button state
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        const updatedAkun = {
            id_akun: document.getElementById('edit_id_akun').value,
            nama_akun: document.getElementById('edit_nama_akun').value,
            jenis_akun: document.querySelector('input[name="edit_jenis_akun"]:checked').value,
            nomor_rekening: document.getElementById('edit_nomor_rekening').value || null,
            nama_bank: document.getElementById('edit_nama_bank').value || null,
            deskripsi: document.getElementById('edit_deskripsi').value || null,
            no_referensi: document.getElementById('edit_no_referensi').value || null
        };

        fetch('/api/akun.update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedAkun),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAkunToast('Akun berhasil diperbarui!');
                editAkunModal.hide();
                fetchAndDisplayAkun();
            } else {
                showAkunToast('Gagal memperbarui akun: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAkunToast('Terjadi kesalahan saat memperbarui akun.', 'error');
        })
        .finally(() => {
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('edit-akun-spinner-overlay');
            if (spinnerOverlay) {
                spinnerOverlay.remove();
            }
            
            // Re-enable form elements
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }
            
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
        });
    });

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayAkun();
});

// Function to show toast notification for akun
function showAkunToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container-akun');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-akun';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'akun-toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast rounded-3';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    // Determine toast header color based on type
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