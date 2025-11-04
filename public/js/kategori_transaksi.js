document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    const addKategoriForm = document.getElementById('add-kategori-form');
    const addKategoriModal = new bootstrap.Modal(document.getElementById('addKategoriModal'));
    const editKategoriForm = document.getElementById('edit-kategori-form');
    const editKategoriModal = new bootstrap.Modal(document.getElementById('editKategoriModal'));

    // Fungsi untuk mengambil dan menampilkan data kategori
    function fetchAndDisplayKategori() {
        fetch('/api/kategori.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const tableBody = document.querySelector('#kategori-table tbody');
                    tableBody.innerHTML = ''; // Kosongkan body tabel sebelum mengisi
                    let counter = 1;
                    data.data.forEach(kategori => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${counter++}</td>
                            <td>${kategori.nama_kategori}</td>
                            <td>${kategori.jenis_kategori}</td>
                            <td>
                                <button class="btn btn-sm btn-warning edit-btn">Edit</button>
                            </td>
                        `;

                        const editButton = row.querySelector('.edit-btn');
                        editButton.addEventListener('click', () => {
                            document.getElementById('edit_id_kategori').value = kategori.id_kategori;
                            document.getElementById('edit_nama_kategori').value = kategori.nama_kategori;
                            document.getElementById('edit_jenis_kategori').value = kategori.jenis_kategori;
                            editKategoriModal.show();
                        });

                        tableBody.appendChild(row);
                    });
                } else {
                    alert('Gagal memuat data kategori: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Terjadi kesalahan saat mengambil data.');
            });
    }

    // Event listener untuk form tambah kategori
    addKategoriForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show spinner and disable button
        const submitBtn = addKategoriForm.querySelector('button[type="submit"]');
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
                addKategoriModal.hide(); // Sembunyikan modal
                addKategoriForm.reset(); // Reset form
                fetchAndDisplayKategori(); // Muat ulang data
            } else {
                showKategoriToast('Gagal menambahkan kategori: ' + (data.message || data.error), 'error');
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

    // Event listener untuk form edit kategori
    editKategoriForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show spinner and disable button
        const submitBtn = editKategoriForm.querySelector('button[type="submit"]');
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
    });

    // Function to show toast notification for kategori
    function showKategoriToast(message, type = 'success') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container-kategori');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container-kategori';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1100';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'kategori-toast-' + Date.now();
        const toastEl = document.createElement('div');
        toastEl.id = toastId;
        toastEl.className = 'toast rounded-3';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        // Determine toast header color based on type
        let headerBg = 'linear-gradient(180deg, #075E54 0%, #128C7E 100%)';
        if (type === 'error') {
            headerBg = 'linear-gradient(180deg, #dc3545 0%, #c82333 100%)'; // Red gradient for error
        }
        
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
        
        // Initialize and show the toast
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        
        // Remove toast element after it's hidden to keep DOM clean
        toastEl.addEventListener('hidden.bs.toast', function() {
            toastEl.remove();
        });
    }

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayKategori();
});
