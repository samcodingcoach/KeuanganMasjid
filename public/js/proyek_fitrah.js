document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    // Initialize Select2 for the aktif dropdown
    $('#aktif').select2({
        theme: 'bootstrap-5',
        placeholder: 'Pilih Status',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#addProyekModal') // Ensure dropdown appears correctly within the modal
    });

    const addProyekModal = new bootstrap.Modal(document.getElementById('addProyekModal'));
    const addProyekForm = document.getElementById('add-proyek-form');
    const editProyekModal = new bootstrap.Modal(document.getElementById('editProyekModal'));
    const editProyekForm = document.getElementById('edit-proyek-form');

    // Pagination and search variables
    let allProyekData = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredProyekData = [];

    // Fungsi untuk mengambil data proyek fitrah
    function fetchProyekData() {
        fetch('/api/fitrah.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allProyekData = data.data;
                    filteredProyekData = [...allProyekData]; // Initialize filtered data
                    currentPage = 1; // Reset to first page
                    renderTable(); // Display the first page
                } else {
                    alert('Gagal memuat data proyek fitrah: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Terjadi kesalahan saat mengambil data.');
            });
    }

    // Fungsi untuk merender tabel dengan data pagination
    function renderTable() {
        const tableBody = document.querySelector('#proyek-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel sebelum mengisi

        // Calculate start and end index for current page
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredProyekData.length);
        const currentData = filteredProyekData.slice(startIndex, endIndex);

        // Add rows for current page
        currentData.forEach((proyek, index) => {
            const rowIndex = startIndex + index; // Absolute index in the filtered data
            const row = document.createElement('tr');
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                <td scope="row" class="text-center align-middle py-2 small">${rowIndex + 1}</td>
                <td class="align-middle py-2 small">${proyek.tahun_hijriah}</td>
                <td class="align-middle py-2 small">${proyek.penanggung_jawab || '-'}</td>
                <td class="align-middle py-2 small">${proyek.aktif ? 'Aktif' : 'Tidak Aktif'}</td>
                <td class="text-center align-middle py-2 small">
                    <button class="btn btn-sm btn-outline-whatsapp p-1 edit-btn" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;

            const editButton = row.querySelector('.edit-btn');
            editButton.addEventListener('click', () => {
                document.getElementById('edit_id_fitrah').value = proyek.id_fitrah;
                document.getElementById('edit_tahun_hijriah').value = proyek.tahun_hijriah;
                document.getElementById('edit_penanggung_jawab').value = proyek.penanggung_jawab || '';

                // Set the select value and trigger change to update Select2 display
                const editSelect = document.getElementById('edit_aktif');
                editSelect.value = proyek.aktif.toString();

                // If Select2 is initialized, update its value
                if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
                    $(editSelect).val(proyek.aktif.toString()).trigger('change');
                    $('#edit_aktif').val(proyek.aktif.toString()).trigger('change');
                }

                editProyekModal.show();
            });

            tableBody.appendChild(row);
        });

        // Update pagination controls
        updatePaginationControls();
    }

    // Fungsi untuk memperbarui kontrol pagination
    function updatePaginationControls() {
        const totalPages = Math.ceil(filteredProyekData.length / rowsPerPage);
        const paginationContainer = document.querySelector('.pagination');

        if (!paginationContainer) return; // If pagination container doesn't exist

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

        // Update count display
        const countDisplay = document.querySelector('.card-footer .text-muted small');
        if (countDisplay) {
            countDisplay.innerHTML = `Menampilkan <strong>${Math.min(rowsPerPage, filteredProyekData.length - (currentPage - 1) * rowsPerPage)}</strong> dari <strong>${filteredProyekData.length}</strong> entri`;
        }
    }

    // Fungsi untuk mengganti halaman
    function changePage(page) {
        if (page < 1 || page > Math.ceil(filteredProyekData.length / rowsPerPage)) {
            return; // Invalid page number
        }
        currentPage = page;
        renderTable();
    }

    // Expose changePage function globally for HTML onclick attributes
    window.changePage = changePage;

    // Fungsi untuk pencarian
    function setupSearchFunctionality() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');

        if (!searchInput || !searchButton) return;

        // Search on button click
        searchButton.addEventListener('click', performSearch);

        // Search on Enter key
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Fungsi utama pencarian
    function performSearch() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();

        if (searchTerm === '') {
            // If search is empty, show all data
            filteredProyekData = [...allProyekData];
        } else {
            // Filter data based on search term
            filteredProyekData = allProyekData.filter(proyek =>
                proyek.tahun_hijriah.toString().includes(searchTerm) ||
                (proyek.penanggung_jawab || '').toLowerCase().includes(searchTerm) ||
                (proyek.aktif ? 'aktif' : 'tidak aktif').toLowerCase().includes(searchTerm)
            );
        }

        currentPage = 1; // Reset to first page when searching
        renderTable(); // Re-render the table with filtered data
    }

    // Event listener untuk form tambah proyek fitrah
    if (addProyekForm) {
        addProyekForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Show spinner and disable button - get the submit button from the modal footer
            const submitBtn = document.querySelector('#addProyekModal button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const originalDisabled = submitBtn.disabled;

            // Create spinner overlay inside the modal
            const modalBody = document.querySelector('#addProyekModal .modal-body');

            // Disable the form
            const formElements = addProyekForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }

            // Show spinner overlay
            const spinnerOverlay = document.createElement('div');
            spinnerOverlay.id = 'add-proyek-spinner-overlay';
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
            const modalDialog = document.querySelector('#addProyekModal .modal-dialog');
            modalDialog.style.position = 'relative';
            modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

            // Update button state
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
            submitBtn.disabled = true;

            // Get the select value properly for Select2
            const aktif_element = document.getElementById('aktif');
            const aktif_value = $('#aktif').val() || aktif_element.value;

            const newProyek = {
                tahun_hijriah: document.getElementById('tahun_hijriah').value,
                penanggung_jawab: document.getElementById('penanggung_jawab').value,
                aktif: aktif_value === 'true' // Convert string to boolean
            };

            fetch('/api/fitrah.new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProyek),
            })
            .then(response => {
                console.log('Response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data); // Debug log
                if (data.success) {
                    showProyekToast('Proyek fitrah berhasil ditambahkan!');
                    addProyekModal.hide(); // Sembunyikan modal
                    addProyekForm.reset(); // Reset form

                    // Reset the Select2 element after form reset
                    setTimeout(() => {
                        if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
                            $('#aktif').val('').trigger('change');
                        }
                    }, 100);

                    fetchProyekData(); // Muat ulang data
                } else {
                    showProyekToast('Gagal menambahkan proyek fitrah: ' + (data.message || data.error || data.error), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showProyekToast('Terjadi kesalahan saat menambahkan proyek fitrah.', 'error');
            })
            .finally(() => {
                // Remove spinner overlay
                const spinnerOverlay = document.getElementById('add-proyek-spinner-overlay');
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
    } else {
        console.error('Add form not found, cannot attach submit event listener');
    }

    // Event listener untuk form edit proyek fitrah
    if (editProyekForm) {
        editProyekForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Show spinner and disable button - get the submit button from the modal footer
            const submitBtn = document.querySelector('#editProyekModal button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const originalDisabled = submitBtn.disabled;

            // Create spinner overlay inside the modal
            const modalBody = document.querySelector('#editProyekModal .modal-body');

            // Disable the form
            const formElements = editProyekForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }

            // Show spinner overlay
            const spinnerOverlay = document.createElement('div');
            spinnerOverlay.id = 'edit-proyek-spinner-overlay';
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
            const modalDialog = document.querySelector('#editProyekModal .modal-dialog');
            modalDialog.style.position = 'relative';
            modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

            // Update button state
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
            submitBtn.disabled = true;

            // Get the select value properly for Select2
            const edit_aktif_element = document.getElementById('edit_aktif');
            const edit_aktif_value = $('#edit_aktif').val() || edit_aktif_element.value;

            const updatedProyek = {
                id_fitrah: document.getElementById('edit_id_fitrah').value,
                tahun_hijriah: document.getElementById('edit_tahun_hijriah').value,
                penanggung_jawab: document.getElementById('edit_penanggung_jawab').value,
                aktif: edit_aktif_value === 'true' // Convert string to boolean
            };

            fetch('/api/fitrah.update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedProyek),
            })
            .then(response => {
                console.log('Edit response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('Edit server response:', data); // Debug log
                if (data.success) {
                    showProyekToast('Proyek fitrah berhasil diperbarui!');
                    editProyekModal.hide();
                    fetchProyekData();
                } else {
                    showProyekToast('Gagal memperbarui proyek fitrah: ' + (data.message || data.error || data.error), 'error');
                }
            })
            .catch(error => {
                console.error('Edit Error:', error);
                showProyekToast('Terjadi kesalahan saat memperbarui proyek fitrah.', 'error');
            })
            .finally(() => {
                // Remove spinner overlay
                const spinnerOverlay = document.getElementById('edit-proyek-spinner-overlay');
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
    } else {
        console.error('Edit form not found, cannot attach submit event listener');
    }

    // Function to show toast notification for proyek fitrah
    function showProyekToast(message, type = 'success') {
        let toastContainer = document.getElementById('toast-container-proyek');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container-proyek';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1100';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'proyek-toast-' + Date.now();
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

    // Panggil fungsi untuk pertama kali memuat data
    fetchProyekData();

    // Setup search functionality after DOM is fully loaded
    setupSearchFunctionality();

    // Initialize Select2 for searchable selects (from admin.html)
    if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
        function initializeSelect2() {
            $('.searchable-select').select2({
                theme: 'bootstrap-5',
                placeholder: 'Pilih opsi...',
                allowClear: true,
                width: '100%'
            });
        }

        // Initialize on page load
        initializeSelect2();

        // Also initialize when modals are shown to ensure proper initialization of modal content
        $('.modal').on('shown.bs.modal', function() {
            // Destroy any existing Select2 instance to prevent conflicts
            $(this).find('.searchable-select').each(function() {
                if ($(this).data('select2')) {
                    $(this).select2('destroy');
                }
            });

            // Re-initialize Select2 for modal content with dropdownParent as the modal itself
            $(this).find('.searchable-select').select2({
                theme: 'bootstrap-5',
                placeholder: 'Pilih opsi...',
                allowClear: true,
                width: '100%',
                dropdownParent: $(this) // Use the modal as the dropdown parent to avoid z-index issues
            });
        });

        // Destroy Select2 instances when modals are hidden to prevent conflicts
        $('.modal').on('hidden.bs.modal', function() {
            $(this).find('.searchable-select').each(function() {
                if ($(this).data('select2')) {
                    $(this).select2('destroy');
                }
            });
        });
    }
});