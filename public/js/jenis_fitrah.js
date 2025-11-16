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
        dropdownParent: $('#addFitrahModal') // Ensure dropdown appears correctly within the modal
    });

    const addFitrahModal = new bootstrap.Modal(document.getElementById('addFitrahModal'));
    const addFitrahForm = document.getElementById('add-fitrah-form');
    const editFitrahModal = new bootstrap.Modal(document.getElementById('editFitrahModal'));
    const editFitrahForm = document.getElementById('edit-fitrah-form');

    // Pagination and search variables
    let allFitrahData = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredFitrahData = [];

    // Fungsi untuk mengambil data jenis fitrah
    function fetchFitrahData() {
        fetch('/api/jenisfitrah.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allFitrahData = data.data;
                    filteredFitrahData = [...allFitrahData]; // Initialize filtered data
                    currentPage = 1; // Reset to first page
                    renderTable(); // Display the first page

                } else {
                    alert('Gagal memuat data jenis fitrah: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Terjadi kesalahan saat mengambil data.');
            });
    }

    // Fungsi untuk merender tabel dengan data pagination
    function renderTable() {
        const tableBody = document.querySelector('#fitrah-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel sebelum mengisi

        // Calculate start and end index for current page
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredFitrahData.length);
        const currentData = filteredFitrahData.slice(startIndex, endIndex);

        // Add rows for current page
        currentData.forEach((fitrah, index) => {
            const rowIndex = startIndex + index; // Absolute index in the filtered data
            const row = document.createElement('tr');
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
                <td scope="row" class="text-center align-middle py-2">${rowIndex + 1}</td>
                <td class="align-middle py-2">${fitrah.nama_jenis}</td>
                <td class="align-middle py-2">${fitrah.aktif ? 'Aktif' : 'Tidak Aktif'}</td>
                <td class="text-center align-middle py-2" style="width: 10%;">
                    <button class="btn btn-sm btn-outline-whatsapp p-1 edit-btn" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;

            const editButton = row.querySelector('.edit-btn');
            editButton.addEventListener('click', () => {
                document.getElementById('edit_id_jenis_fitrah').value = fitrah.id_jenis_fitrah;
                document.getElementById('edit_nama_jenis').value = fitrah.nama_jenis;

                // Set the select value and trigger change to update Select2 display
                const editSelect = document.getElementById('edit_aktif');
                editSelect.value = fitrah.aktif.toString();

                // If Select2 is initialized, update both select values
                if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
                    $('#edit_nama_jenis').val(fitrah.nama_jenis).trigger('change');
                    $(editSelect).val(fitrah.aktif.toString()).trigger('change');
                }

                editFitrahModal.show();
            });

            tableBody.appendChild(row);
        });

        // Update pagination controls
        updatePaginationControls();
    }

    // Fungsi untuk memperbarui kontrol pagination
    function updatePaginationControls() {
        const totalPages = Math.ceil(filteredFitrahData.length / rowsPerPage);
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
            countDisplay.innerHTML = `Menampilkan <strong>${Math.min(rowsPerPage, filteredFitrahData.length - (currentPage - 1) * rowsPerPage)}</strong> dari <strong>${filteredFitrahData.length}</strong> entri`;
        }
    }

    // Fungsi untuk mengganti halaman
    function changePage(page) {
        if (page < 1 || page > Math.ceil(filteredFitrahData.length / rowsPerPage)) {
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
            filteredFitrahData = [...allFitrahData];
        } else {
            // Filter data based on search term
            filteredFitrahData = allFitrahData.filter(fitrah =>
                fitrah.nama_jenis.toLowerCase().includes(searchTerm) ||
                (fitrah.aktif ? 'aktif' : 'tidak aktif').toLowerCase().includes(searchTerm)
            );
        }

        currentPage = 1; // Reset to first page when searching
        renderTable(); // Re-render the table with filtered data
    }

    // Event listener untuk form tambah jenis fitrah
    if (addFitrahForm) {
        addFitrahForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Show spinner and disable button - get the submit button from the modal footer
            const submitBtn = document.querySelector('#addFitrahModal button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const originalDisabled = submitBtn.disabled;

            // Create spinner overlay inside the modal
            const modalBody = document.querySelector('#addFitrahModal .modal-body');

            // Disable the form
            const formElements = addFitrahForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }

            // Show spinner overlay
            const spinnerOverlay = document.createElement('div');
            spinnerOverlay.id = 'add-fitrah-spinner-overlay';
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
            const modalDialog = document.querySelector('#addFitrahModal .modal-dialog');
            modalDialog.style.position = 'relative';
            modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

            // Update button state
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
            submitBtn.disabled = true;

            // Get the select values properly for Select2
            const aktif_element = document.getElementById('aktif');
            const aktif_value = $('#aktif').val() || aktif_element.value;
            const nama_jenis_value = $('#nama_jenis').val() || document.getElementById('nama_jenis').value;

            const newFitrah = {
                nama_jenis: nama_jenis_value,
                aktif: aktif_value === 'true' // Convert string to boolean
            };

            fetch('/api/jenisfitrah.new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newFitrah),
            })
            .then(response => {
                console.log('Response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data); // Debug log
                if (data.success) {
                    showFitrahToast('Jenis fitrah berhasil ditambahkan!');
                    addFitrahModal.hide(); // Sembunyikan modal
                    addFitrahForm.reset(); // Reset form

                    // Reset the Select2 elements after form reset
                    setTimeout(() => {
                        if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
                            $('#aktif').val('').trigger('change');
                            $('#nama_jenis').val('').trigger('change');
                        }
                    }, 100);

                    fetchFitrahData(); // Muat ulang data
                } else {
                    showFitrahToast('Gagal menambahkan jenis fitrah: ' + (data.message || data.error || data.error), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showFitrahToast('Terjadi kesalahan saat menambahkan jenis fitrah.', 'error');
            })
            .finally(() => {
                // Remove spinner overlay
                const spinnerOverlay = document.getElementById('add-fitrah-spinner-overlay');
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

    // Event listener untuk form edit jenis fitrah
    if (editFitrahForm) {
        editFitrahForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Show spinner and disable button - get the submit button from the modal footer
            const submitBtn = document.querySelector('#editFitrahModal button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const originalDisabled = submitBtn.disabled;

            // Create spinner overlay inside the modal
            const modalBody = document.querySelector('#editFitrahModal .modal-body');

            // Disable the form
            const formElements = editFitrahForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }

            // Show spinner overlay
            const spinnerOverlay = document.createElement('div');
            spinnerOverlay.id = 'edit-fitrah-spinner-overlay';
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
            const modalDialog = document.querySelector('#editFitrahModal .modal-dialog');
            modalDialog.style.position = 'relative';
            modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

            // Update button state
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
            submitBtn.disabled = true;

            // Get the select values properly for Select2
            const edit_aktif_element = document.getElementById('edit_aktif');
            const edit_aktif_value = $('#edit_aktif').val() || edit_aktif_element.value;
            const edit_nama_jenis_value = $('#edit_nama_jenis').val() || document.getElementById('edit_nama_jenis').value;

            const updatedFitrah = {
                id_jenis_fitrah: document.getElementById('edit_id_jenis_fitrah').value,
                nama_jenis: edit_nama_jenis_value,
                aktif: edit_aktif_value === 'true' // Convert string to boolean
            };

            fetch('/api/jenisfitrah.update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedFitrah),
            })
            .then(response => {
                console.log('Edit response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('Edit server response:', data); // Debug log
                if (data.success) {
                    showFitrahToast('Jenis fitrah berhasil diperbarui!');
                    editFitrahModal.hide();
                    fetchFitrahData();
                } else {
                    showFitrahToast('Gagal memperbarui jenis fitrah: ' + (data.message || data.error || data.error), 'error');
                }
            })
            .catch(error => {
                console.error('Edit Error:', error);
                showFitrahToast('Terjadi kesalahan saat memperbarui jenis fitrah.', 'error');
            })
            .finally(() => {
                // Remove spinner overlay
                const spinnerOverlay = document.getElementById('edit-fitrah-spinner-overlay');
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

    // Function to show toast notification for jenis fitrah
    function showFitrahToast(message, type = 'success') {
        let toastContainer = document.getElementById('toast-container-fitrah');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container-fitrah';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1100';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'fitrah-toast-' + Date.now();
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
    fetchFitrahData();

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