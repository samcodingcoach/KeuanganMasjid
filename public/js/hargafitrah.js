document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    const addHargaFitrahModal = new bootstrap.Modal(document.getElementById('addHargaFitrahModal'));
    const addHargaFitrahForm = document.getElementById('add-harga-fitrah-form');

    // Data store
    let allHargaFitrahData = [];
    let filteredHargaFitrahData = [];

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10; // Default items per page

    // Load data for dropdowns when page loads
    function loadDropdownData() {
        // Load jenis fitrah data
        fetch('/api/jenisfitrah.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const selectElement = document.getElementById('id_jenis_fitrah');
                    selectElement.innerHTML = '<option value="">Pilih Jenis Fitrah</option>';

                    // Filter only active jenis fitrah
                    const activeJenisFitrah = data.data.filter(item => item.aktif === true);

                    activeJenisFitrah.forEach(jenis => {
                        const option = document.createElement('option');
                        option.value = jenis.id_jenis_fitrah;
                        option.textContent = jenis.nama_jenis;
                        selectElement.appendChild(option);
                    });
                } else {
                    console.error('Gagal memuat data jenis fitrah:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching jenis fitrah:', error);
            });

        // Load proyek fitrah data (tahun hijriah)
        fetch('/api/fitrah.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const selectElement = document.getElementById('id_fitrah');
                    selectElement.innerHTML = '<option value="">Pilih Tahun Fitrah</option>';

                    // Filter only active proyek fitrah
                    const activeProyekFitrah = data.data.filter(item => item.aktif === true);

                    activeProyekFitrah.forEach(proyek => {
                        const option = document.createElement('option');
                        option.value = proyek.id_fitrah;
                        option.textContent = proyek.tahun_hijriah;
                        selectElement.appendChild(option);
                    });
                } else {
                    console.error('Gagal memuat data proyek fitrah:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching proyek fitrah:', error);
            });
    }

    // Event listener untuk form tambah harga fitrah
    addHargaFitrahForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Validate confirmation checkbox first
        const konfirmasi = document.getElementById('konfirmasi');
        if (!konfirmasi.checked) {
            showHargaFitrahToast('Harap centang konfirmasi bahwa data sudah benar.', 'error');
            return; // Stop form submission
        }

        // Show spinner and disable button
        const submitBtn = addHargaFitrahForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;

        // Create spinner overlay inside the modal
        const modalBody = document.querySelector('#addHargaFitrahModal .modal-body');

        // Disable the form
        const formElements = addHargaFitrahForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }

        // Show spinner overlay
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'add-harga-fitrah-spinner-overlay';
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
        const modalDialog = document.querySelector('#addHargaFitrahModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

        // Update button state
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        const newHargaFitrah = {
            keterangan: document.getElementById('keterangan').value,
            id_jenis_fitrah: parseInt(document.getElementById('id_jenis_fitrah').value),
            id_fitrah: parseInt(document.getElementById('id_fitrah').value),
            nominal: parseFloat(document.getElementById('nominal').value.replace(/\./g, '')), // Remove thousands separators
            berat: parseFloat(document.getElementById('berat').value)
        };

        fetch('/api/hargafitrah.new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newHargaFitrah),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showHargaFitrahToast('Harga fitrah berhasil ditambahkan!');
                addHargaFitrahModal.hide();
                addHargaFitrahForm.reset();
                // Reset the confirmation checkbox
                document.getElementById('konfirmasi').checked = false;
                fetchAndDisplayHargaFitrah(); // Refresh data
            } else {
                showHargaFitrahToast('Gagal menambahkan harga fitrah: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showHargaFitrahToast('Terjadi kesalahan saat menambahkan harga fitrah.', 'error');
        })
        .finally(() => {
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('add-harga-fitrah-spinner-overlay');
            if (spinnerOverlay) {
                spinnerOverlay.remove();
            }

            // Re-enable form elements
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }

            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('disabled');
        });
    });

    // Fungsi untuk mengambil data harga fitrah
    function fetchAndDisplayHargaFitrah() {
        fetch('/api/hargafitrah.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allHargaFitrahData = data.data;
                    filteredHargaFitrahData = allHargaFitrahData;
                    displayData(1); // Display first page
                } else {
                    alert('Gagal memuat data harga fitrah: ' + data.message);
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
        const tableBody = document.querySelector('#harga-fitrah-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel

        // Calculate pagination values
        const totalEntries = filteredHargaFitrahData.length;
        const totalPages = Math.ceil(totalEntries / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
        const pageData = filteredHargaFitrahData.slice(startIndex, endIndex);

        // Update pagination info
        const paginationInfo = document.querySelector('.card-footer .text-muted');
        if (paginationInfo) {
            paginationInfo.innerHTML = `<small style="font-size: 0.75em;">Menampilkan <strong>${totalEntries > 0 ? startIndex + 1 : 0}-${endIndex}</strong> dari <strong>${totalEntries}</strong> entri</small>`;
        }

        // Update pagination controls
        updatePaginationControls(page, totalPages);

        let counter = startIndex + 1;
        pageData.forEach(hargaFitrah => {
            const row = document.createElement('tr');
            row.dataset.id = hargaFitrah.id_hargafitrah;
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                <td scope="row" style="padding: 15px 25px; vertical-align: middle; font-size: 0.9em; width: 60px;">${counter++}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${hargaFitrah.tahun_hijriah || '-'}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${hargaFitrah.nama_jenis || '-'}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${hargaFitrah.keterangan || '-'}</td>
                <td class="text-end" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">Rp ${hargaFitrah.nominal?.toLocaleString('id-ID') || '0'}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;">${hargaFitrah.berat || '0'} kg</td>
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
        const totalPages = Math.ceil(filteredHargaFitrahData.length / itemsPerPage);
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
        filteredHargaFitrahData = allHargaFitrahData.filter(hargaFitrah =>
            (hargaFitrah.keterangan && hargaFitrah.keterangan.toLowerCase().includes(searchTerm)) ||
            (hargaFitrah.tahun_hijriah && String(hargaFitrah.tahun_hijriah).toLowerCase().includes(searchTerm)) ||
            (hargaFitrah.nama_jenis && hargaFitrah.nama_jenis.toLowerCase().includes(searchTerm))
        );
        displayData(1); // Display first page of filtered results
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    const editHargaFitrahModal = new bootstrap.Modal(document.getElementById('editHargaFitrahModal'));
    const editHargaFitrahForm = document.getElementById('edit-harga-fitrah-form');

    // Event listener untuk tombol edit
    document.getElementById('harga-fitrah-table').addEventListener('click', function(event) {
        if (event.target.classList.contains('edit-btn') || event.target.closest('.edit-btn')) {
            const button = event.target.classList.contains('edit-btn') ? event.target : event.target.closest('.edit-btn');
            const row = button.closest('tr');
            const id = row.dataset.id;

            const hargaFitrah = allHargaFitrahData.find(h => h.id_hargafitrah == id);
            if (!hargaFitrah) return;

            document.getElementById('edit_id_hargafitrah').value = hargaFitrah.id_hargafitrah;
            document.getElementById('edit_keterangan').value = hargaFitrah.keterangan;
            document.getElementById('edit_nominal').value = hargaFitrah.nominal;
            document.getElementById('edit_berat').value = hargaFitrah.berat;

            editHargaFitrahModal.show();
        }
    });

    // Event listener untuk form edit harga fitrah
    editHargaFitrahForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Show spinner and disable button
        const submitBtn = editHargaFitrahForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;

        const modalBody = document.querySelector('#editHargaFitrahModal .modal-body');
        const formElements = editHargaFitrahForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }

        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'edit-harga-fitrah-spinner-overlay';
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

        const modalDialog = document.querySelector('#editHargaFitrahModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        const id = document.getElementById('edit_id_hargafitrah').value;
        const updatedData = {
            id_hargafitrah: id,
            keterangan: document.getElementById('edit_keterangan').value,
            nominal: parseFloat(document.getElementById('edit_nominal').value),
            berat: parseFloat(document.getElementById('edit_berat').value)
        };

        fetch('/api/hargafitrah.update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showHargaFitrahToast('Data harga fitrah berhasil diperbarui!');
                editHargaFitrahModal.hide();
                fetchAndDisplayHargaFitrah(); // Refresh data
            } else {
                showHargaFitrahToast('Gagal memperbarui data: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showHargaFitrahToast('Terjadi kesalahan saat memperbarui data.', 'error');
        })
        .finally(() => {
            const spinnerOverlay = document.getElementById('edit-harga-fitrah-spinner-overlay');
            if (spinnerOverlay) spinnerOverlay.remove();

            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
        });
    });

    // Reload dropdown data when modal is shown to ensure fresh data
    document.getElementById('addHargaFitrahModal').addEventListener('shown.bs.modal', function () {
        // Reload the data to ensure it's fresh
        loadDropdownData();

        // Reinitialize both Select2 dropdowns with proper dropdownParent for modal context
        setTimeout(function() {
            // Destroy existing instances first
            if ($('#id_jenis_fitrah').hasClass('select2-hidden-accessible')) {
                $('#id_jenis_fitrah').select2('destroy');
            }
            if ($('#id_fitrah').hasClass('select2-hidden-accessible')) {
                $('#id_fitrah').select2('destroy');
            }

            // Initialize both dropdowns
            $('#id_jenis_fitrah').select2({
                theme: 'bootstrap-5',
                placeholder: 'Pilih Jenis Fitrah',
                allowClear: true,
                width: '100%',
                dropdownParent: $('#addHargaFitrahModal') // Ensure dropdown appears above modal
            });

            $('#id_fitrah').select2({
                theme: 'bootstrap-5',
                placeholder: 'Pilih Tahun Fitrah',
                allowClear: true,
                width: '100%',
                dropdownParent: $('#addHargaFitrahModal') // Ensure dropdown appears above modal
            });
        }, 100);
    });

    // Destroy Select2 when modal is hidden to prevent issues on next open
    document.getElementById('addHargaFitrahModal').addEventListener('hidden.bs.modal', function () {
        if ($('#id_jenis_fitrah').hasClass('select2-hidden-accessible')) {
            $('#id_jenis_fitrah').select2('destroy');
        }
        if ($('#id_fitrah').hasClass('select2-hidden-accessible')) {
            $('#id_fitrah').select2('destroy');
        }
    });

    // Function to format currency with thousands separators
    function formatCurrency(value) {
        // Remove any existing formatting
        const numValue = parseFloat(value.replace(/[^\d]/g, ''));
        if (isNaN(numValue)) return '';

        // Format with thousands separators
        return numValue.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    }

    // Event listener for nominal input to format thousands
    document.getElementById('nominal').addEventListener('input', function(e) {
        let value = e.target.value;
        // Remove any existing formatting
        value = value.replace(/[^\d]/g, '');
        // Format with thousands separator
        if (value) {
            e.target.value = formatCurrency(value);
        }
    });

    // Event listener for berat input to validate decimal format
    document.getElementById('berat').addEventListener('input', function(e) {
        let value = e.target.value;
        // Allow only numbers and decimal point, maximum one decimal point
        value = value.replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        e.target.value = value;
    });

    // Reset form state when modal is hidden
    document.getElementById('addHargaFitrahModal').addEventListener('hidden.bs.modal', function () {
        // Uncheck the confirmation checkbox
        document.getElementById('konfirmasi').checked = false;
        // Clear form fields
        document.getElementById('keterangan').value = '';
        document.getElementById('nominal').value = '';
        document.getElementById('berat').value = '';
        // Reset dropdowns to default
        $('#id_jenis_fitrah').val('').trigger('change');
        $('#id_fitrah').val('').trigger('change');
    });

    // Panggil fungsi untuk pertama kali memuat data
    loadDropdownData(); // Load dropdown data first
    fetchAndDisplayHargaFitrah();

    // Initially disable the submit button until confirmation is checked
    const submitBtn = document.querySelector('#add-harga-fitrah-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled');
    }
});

// Function to show toast notification for harga fitrah
function showHargaFitrahToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container-harga-fitrah');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-harga-fitrah';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'harga-fitrah-toast-' + Date.now();
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