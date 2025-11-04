document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    const addPegawaiModal = new bootstrap.Modal(document.getElementById('addPegawaiModal'));
    const addPegawaiForm = document.getElementById('add-pegawai-form');

    // Data store
    let allPegawaiData = [];
    let filteredPegawaiData = [];

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10; // Default items per page

    // Fungsi untuk generate default password YYMMDDHHMM
    function generateDefaultPassword() {
        const d = new Date();
        const year = String(d.getFullYear()).slice(-2);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}`;
    }

    // Set default password when modal is shown
    document.getElementById('addPegawaiModal').addEventListener('show.bs.modal', function () {
        document.getElementById('password').value = generateDefaultPassword();
    });

    // Show/hide password
    const togglePassword = document.querySelector('#togglePassword');
    const password = document.querySelector('#password');
    togglePassword.addEventListener('click', function (e) {
        // toggle the type attribute
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        // toggle the eye / eye slash icon
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

    // Event listener untuk form tambah pegawai
    addPegawaiForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show spinner and disable button
        const submitBtn = addPegawaiForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;
        
        // Create spinner overlay inside the modal
        const modalBody = document.querySelector('#addPegawaiModal .modal-body');
        
        // Disable the form
        const formElements = addPegawaiForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }
        
        // Show spinner overlay
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'add-pegawai-spinner-overlay';
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
        const modalDialog = document.querySelector('#addPegawaiModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
        
        // Update button state
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        const newPegawai = {
            nama_lengkap: document.getElementById('nama_lengkap').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.querySelector('input[name="role"]:checked').value
        };

        fetch('/api/pegawai.create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPegawai),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showPegawaiToast('Pegawai berhasil ditambahkan!');
                addPegawaiModal.hide();
                addPegawaiForm.reset();
                fetchAndDisplayPegawai(); // Refresh data
            } else {
                showPegawaiToast('Gagal menambahkan pegawai: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showPegawaiToast('Terjadi kesalahan saat menambahkan pegawai.', 'error');
        })
        .finally(() => {
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('add-pegawai-spinner-overlay');
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

    // Fungsi untuk mengambil data pegawai
    function fetchAndDisplayPegawai() {
        fetch('/api/pegawai.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allPegawaiData = data.data;
                    filteredPegawaiData = allPegawaiData;
                    displayData(1); // Display first page
                } else {
                    alert('Gagal memuat data pegawai: ' + data.message);
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
        const tableBody = document.querySelector('#pegawai-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel

        // Calculate pagination values
        const totalEntries = filteredPegawaiData.length;
        const totalPages = Math.ceil(totalEntries / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
        const pageData = filteredPegawaiData.slice(startIndex, endIndex);

        // Update pagination info
        const paginationInfo = document.querySelector('.card-footer .text-muted');
        if (paginationInfo) {
            paginationInfo.innerHTML = `<small style="font-size: 0.75em;">Menampilkan <strong>${totalEntries > 0 ? startIndex + 1 : 0}-${endIndex}</strong> dari <strong>${totalEntries}</strong> entri</small>`;
        }

        // Update pagination controls
        updatePaginationControls(page, totalPages);

        let counter = startIndex + 1;
        pageData.forEach(pegawai => {
            const row = document.createElement('tr');
            row.dataset.id = pegawai.id_pegawai;
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                            <th scope="row" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${counter++}</th>
                            <td style="padding: 15px 20px; font-weight: 500; vertical-align: middle; font-size: 0.9em;">${pegawai.nama_lengkap}</td>
                            <td style="padding: 15px 20px; color: #666; vertical-align: middle; font-size: 0.9em;">${pegawai.email}</td>
                            <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;"><span class="badge bg-light text-whatsapp" style="font-size: 0.8em; text-transform: capitalize;">${pegawai.role}</span></td>
                            <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${new Date(pegawai.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
        const totalPages = Math.ceil(filteredPegawaiData.length / itemsPerPage);
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
        filteredPegawaiData = allPegawaiData.filter(pegawai => 
            pegawai.nama_lengkap.toLowerCase().includes(searchTerm)
        );
        displayData(1); // Display first page of filtered results
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    const editPegawaiModal = new bootstrap.Modal(document.getElementById('editPegawaiModal'));
    const editPegawaiForm = document.getElementById('edit-pegawai-form');

    // Event listener untuk tombol edit
    document.getElementById('pegawai-table').addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-btn') || event.target.closest('.edit-btn')) {
            const button = event.target.classList.contains('edit-btn') ? event.target : event.target.closest('.edit-btn');
            const row = button.closest('tr');
            const id = row.dataset.id;
            
            const pegawai = allPegawaiData.find(p => p.id_pegawai == id);
            if (!pegawai) return;

            document.getElementById('edit_pegawai_id').value = pegawai.id_pegawai;
            document.getElementById('edit_nama_lengkap').value = pegawai.nama_lengkap;
            document.getElementById('edit_email').value = pegawai.email;
            document.getElementById('edit_password').value = ''; // Kosongkan password
            
            const roleValue = pegawai.role.toLowerCase().replace(/ /g, '_');
            const radioToCheck = document.querySelector(`#editPegawaiModal input[name="edit_role"][value="${roleValue}"]`);
            if (radioToCheck) {
                radioToCheck.checked = true;
            }

            editPegawaiModal.show();
        }
    });

    // Event listener untuk form edit pegawai
    editPegawaiForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show spinner and disable button
        const submitBtn = editPegawaiForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;
        
        const modalBody = document.querySelector('#editPegawaiModal .modal-body');
        const formElements = editPegawaiForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }
        
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'edit-pegawai-spinner-overlay';
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
        spinnerOverlay.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;
        
        const modalDialog = document.querySelector('#editPegawaiModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
        
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        const id = document.getElementById('edit_pegawai_id').value;
        const updatedData = {
            id_pegawai: id,
            nama_lengkap: document.getElementById('edit_nama_lengkap').value,
            email: document.getElementById('edit_email').value,
            role: document.querySelector('input[name="edit_role"]:checked').value
        };

        const password = document.getElementById('edit_password').value;
        if (password) {
            updatedData.password = password;
        }

        fetch('/api/pegawai.update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showPegawaiToast('Data pegawai berhasil diperbarui!');
                editPegawaiModal.hide();
                fetchAndDisplayPegawai(); // Refresh data
            } else {
                showPegawaiToast('Gagal memperbarui data: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showPegawaiToast('Terjadi kesalahan saat memperbarui data.', 'error');
        })
        .finally(() => {
            const spinnerOverlay = document.getElementById('edit-pegawai-spinner-overlay');
            if (spinnerOverlay) spinnerOverlay.remove();
            
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
        });
    });

    // Show/hide password di modal edit
    const toggleEditPassword = document.querySelector('#toggleEditPassword');
    const editPassword = document.querySelector('#edit_password');
    toggleEditPassword.addEventListener('click', function () {
        const type = editPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        editPassword.setAttribute('type', type);
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayPegawai();
});

// Function to show toast notification for pegawai
function showPegawaiToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container-pegawai');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-pegawai';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'pegawai-toast-' + Date.now();
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