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
<<<<<<< HEAD
    const editKategoriForm = document.getElementById('edit-kategori-form');

    // Data store
    let allKategoriData = [];
    let filteredKategoriData = [];

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 10; // Default items per page
=======
    
    // Debug: Check if form elements exist
    if (!addKategoriForm) {
        console.error('Form element #add-kategori-form not found!');
    }
    if (!editKategoriForm) {
        console.error('Form element #edit-kategori-form not found!');
    }
    
    // Pagination and search variables
    let allKategoriData = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let filteredKategoriData = [];
>>>>>>> ce23015 (fix 90% kategori)

    // Fungsi untuk mengambil data kategori
    function fetchKategoriData() {
        fetch('/api/kategori.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    allKategoriData = data.data;
<<<<<<< HEAD
                    filteredKategoriData = allKategoriData;
                    displayData(1); // Display first page
=======
                    filteredKategoriData = [...allKategoriData]; // Initialize filtered data
                    currentPage = 1; // Reset to first page
                    renderTable(); // Display the first page
>>>>>>> ce23015 (fix 90% kategori)
                } else {
                    alert('Gagal memuat data kategori: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Terjadi kesalahan saat mengambil data.');
            });
    }

<<<<<<< HEAD
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
=======
    // Fungsi untuk merender tabel dengan data pagination
    function renderTable() {
        const tableBody = document.querySelector('#kategori-table tbody');
        tableBody.innerHTML = ''; // Kosongkan body tabel sebelum mengisi

        // Calculate start and end index for current page
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredKategoriData.length);
        const currentData = filteredKategoriData.slice(startIndex, endIndex);

        // Add rows for current page
        currentData.forEach((kategori, index) => {
            const rowIndex = startIndex + index; // Absolute index in the filtered data
            const row = document.createElement('tr');
            row.style = "border-top: 1px solid #eee;";
            row.innerHTML = `
<<<<<<< HEAD
                <th scope="row" style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;" class="text-center">${rowIndex + 1}</th>
                <td style="padding: 15px 20px; font-weight: 500; vertical-align: middle; font-size: 0.9em;">${kategori.nama_kategori}</td>
                <td style="padding: 15px 20px; color: #666; vertical-align: middle; font-size: 0.9em;">${kategori.jenis_kategori}</td>
                <td style="padding: 15px 20px; vertical-align: middle; font-size: 0.9em;" class="text-center">
>>>>>>> ce23015 (fix 90% kategori)
=======
                <th scope="row" style="padding: 10px 15px; vertical-align: middle; font-size: 0.9em;" class="text-center">${rowIndex + 1}</th>
                <td style="padding: 10px 15px; font-weight: 500; vertical-align: middle; font-size: 0.9em;">${kategori.nama_kategori}</td>
                <td style="padding: 10px 15px; color: #666; vertical-align: middle; font-size: 0.9em;">${kategori.jenis_kategori}</td>
                <td style="padding: 10px 15px; vertical-align: middle; font-size: 0.9em;" class="text-center">
>>>>>>> 2bacae5 (Fix)
                    <button class="btn btn-sm btn-outline-whatsapp p-1 edit-btn" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;
<<<<<<< HEAD
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
=======

            const editButton = row.querySelector('.edit-btn');
            editButton.addEventListener('click', () => {
                document.getElementById('edit_id_kategori').value = kategori.id_kategori;
                document.getElementById('edit_nama_kategori').value = kategori.nama_kategori;
                
                // Set the select value and trigger change to update Select2 display
                const editSelect = document.getElementById('edit_jenis_kategori');
                editSelect.value = kategori.jenis_kategori;
                
                // If Select2 is initialized, update its value
                if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
                    $(editSelect).val(kategori.jenis_kategori).trigger('change');
                }
                
                editKategoriModal.show();
            });

            tableBody.appendChild(row);
        });

        // Update pagination controls
        updatePaginationControls();
    }

    // Fungsi untuk memperbarui kontrol pagination
    function updatePaginationControls() {
        const totalPages = Math.ceil(filteredKategoriData.length / rowsPerPage);
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
>>>>>>> ce23015 (fix 90% kategori)
            } else {
                const pageItem = document.createElement('li');
                pageItem.className = `page-item ${page === currentPage ? 'active' : ''}`;
                pageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${page}); return false;">${page}</a>`;
                paginationContainer.appendChild(pageItem);
            }
<<<<<<< HEAD
        })
        .catch(error => {
            console.error('Error:', error);
            showKategoriToast('Terjadi kesalahan saat menambahkan kategori.', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-save me-1"></i>Simpan';
=======
>>>>>>> ce23015 (fix 90% kategori)
        });
        
        // Next button
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
        nextItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;"><i class="bi bi-chevron-right"></i></a>`;
        paginationContainer.appendChild(nextItem);

        // Update count display
        const countDisplay = document.querySelector('.card-footer .text-muted small');
        if (countDisplay) {
            countDisplay.innerHTML = `Menampilkan <strong>${Math.min(rowsPerPage, filteredKategoriData.length - (currentPage - 1) * rowsPerPage)}</strong> dari <strong>${filteredKategoriData.length}</strong> entri`;
        }
    }

    // Fungsi untuk mengganti halaman
    function changePage(page) {
        if (page < 1 || page > Math.ceil(filteredKategoriData.length / rowsPerPage)) {
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
            filteredKategoriData = [...allKategoriData];
        } else {
            // Filter data based on search term
            filteredKategoriData = allKategoriData.filter(kategori => 
                kategori.nama_kategori.toLowerCase().includes(searchTerm) ||
                kategori.jenis_kategori.toLowerCase().includes(searchTerm)
            );
        }
        
        currentPage = 1; // Reset to first page when searching
        renderTable(); // Re-render the table with filtered data
    }

    // Event listener untuk form tambah kategori
    if (addKategoriForm) {
        addKategoriForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Show spinner and disable button - get the submit button from the modal footer
            const submitBtn = document.querySelector('#addKategoriModal button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const originalDisabled = submitBtn.disabled;
            
            // Create spinner overlay inside the modal
            const modalBody = document.querySelector('#addKategoriModal .modal-body');
            
            // Disable the form
            const formElements = addKategoriForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }
            
            // Show spinner overlay
            const spinnerOverlay = document.createElement('div');
            spinnerOverlay.id = 'add-kategori-spinner-overlay';
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
            const modalDialog = document.querySelector('#addKategoriModal .modal-dialog');
            modalDialog.style.position = 'relative';
            modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
            
            // Update button state
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
            submitBtn.disabled = true;

            // Get the select value properly for Select2
            const jenis_kategori_element = document.getElementById('jenis_kategori');
            const jenis_kategori_value = $(jenis_kategori_element).val() || jenis_kategori_element.value;

            const newKategori = {
                nama_kategori: document.getElementById('nama_kategori').value,
                jenis_kategori: jenis_kategori_value
            };

            fetch('/api/kategori.create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newKategori),
            })
            .then(response => {
                console.log('Response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('Server response:', data); // Debug log
                if (data.success) {
                    showKategoriToast('Kategori berhasil ditambahkan!');
                    addKategoriModal.hide(); // Sembunyikan modal
                    addKategoriForm.reset(); // Reset form
                    
                    // Reset the Select2 element after form reset
                    setTimeout(() => {
                        if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
                            $('#jenis_kategori').val('').trigger('change');
                        }
                    }, 100);
                    
                    fetchKategoriData(); // Muat ulang data
                } else {
                    showKategoriToast('Gagal menambahkan kategori: ' + (data.message || data.error || data.error), 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showKategoriToast('Terjadi kesalahan saat menambahkan kategori.', 'error');
            })
            .finally(() => {
                // Remove spinner overlay
                const spinnerOverlay = document.getElementById('add-kategori-spinner-overlay');
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

    // Event listener untuk form edit kategori
<<<<<<< HEAD
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
=======
    if (editKategoriForm) {
        editKategoriForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Show spinner and disable button - get the submit button from the modal footer
            const submitBtn = document.querySelector('#editKategoriModal button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const originalDisabled = submitBtn.disabled;
            
            // Create spinner overlay inside the modal
            const modalBody = document.querySelector('#editKategoriModal .modal-body');
            
            // Disable the form
            const formElements = editKategoriForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }
            
            // Show spinner overlay
            const spinnerOverlay = document.createElement('div');
            spinnerOverlay.id = 'edit-kategori-spinner-overlay';
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
            const modalDialog = document.querySelector('#editKategoriModal .modal-dialog');
            modalDialog.style.position = 'relative';
            modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
            
            // Update button state
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
            submitBtn.disabled = true;

            // Get the select value properly for Select2
            const edit_jenis_kategori_element = document.getElementById('edit_jenis_kategori');
            const edit_jenis_kategori_value = $(edit_jenis_kategori_element).val() || edit_jenis_kategori_element.value;

            const updatedKategori = {
                id_kategori: document.getElementById('edit_id_kategori').value,
                nama_kategori: document.getElementById('edit_nama_kategori').value,
                jenis_kategori: edit_jenis_kategori_value
            };

            fetch('/api/kategori.update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedKategori),
            })
            .then(response => {
                console.log('Edit response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('Edit server response:', data); // Debug log
                if (data.success) {
                    showKategoriToast('Kategori berhasil diperbarui!');
                    editKategoriModal.hide();
                    fetchKategoriData();
                } else {
                    showKategoriToast('Gagal memperbarui kategori: ' + (data.message || data.error || data.error), 'error');
                }
            })
            .catch(error => {
                console.error('Edit Error:', error);
                showKategoriToast('Terjadi kesalahan saat memperbarui kategori.', 'error');
            })
            .finally(() => {
                // Remove spinner overlay
                const spinnerOverlay = document.getElementById('edit-kategori-spinner-overlay');
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
>>>>>>> ce23015 (fix 90% kategori)
        });
    } else {
        console.error('Edit form not found, cannot attach submit event listener');
    }

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
<<<<<<< HEAD
    fetchAndDisplayKategori();
});
=======
    fetchKategoriData();
    
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
>>>>>>> ce23015 (fix 90% kategori)
