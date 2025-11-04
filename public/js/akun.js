document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    const addAkunForm = document.getElementById('add-akun-form');
    const addAkunModal = new bootstrap.Modal(document.getElementById('addAkunModal'));
    const editAkunForm = document.getElementById('edit-akun-form');
    const editAkunModal = new bootstrap.Modal(document.getElementById('editAkunModal'));

    // Fungsi untuk mengambil dan menampilkan data akun
    function fetchAndDisplayAkun() {
        fetch('/api/akun.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const tableBody = document.querySelector('#akun-table tbody');
                    tableBody.innerHTML = ''; // Kosongkan body tabel sebelum mengisi
                    let counter = 1;
                    data.data.forEach(akun => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${counter++}</td>
                            <td>${akun.nama_akun}</td>
                            <td>${akun.saldo_awal}</td>
                            <td>${akun.saldo_akhir}</td>
                            <td>
                                <button class="btn btn-sm btn-warning edit-btn">Edit</button>
                            </td>
                        `;

                        const editButton = row.querySelector('.edit-btn');
                        editButton.addEventListener('click', () => {
                            document.getElementById('edit_id_akun').value = akun.id_akun;
                            document.getElementById('edit_nama_akun').value = akun.nama_akun;
                            document.getElementById('edit_jenis_akun').value = akun.jenis_akun;
                            document.getElementById('edit_nomor_rekening').value = akun.nomor_rekening || '';
                            document.getElementById('edit_nama_bank').value = akun.nama_bank || '';
                            document.getElementById('edit_deskripsi').value = akun.deskripsi || '';
                            document.getElementById('edit_no_referensi').value = akun.no_referensi || '';
                            editAkunModal.show();
                        });

                        tableBody.appendChild(row);
                    });
                } else {
                    alert('Gagal memuat data akun: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Terjadi kesalahan saat mengambil data.');
            });
    }

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

        const newAkun = {
            nama_akun: document.getElementById('nama_akun').value,
            jenis_akun: document.getElementById('jenis_akun').value,
            saldo_awal: parseFloat(document.getElementById('saldo_awal').value) || 0.00,
            nomor_rekening: document.getElementById('nomor_rekening').value || null,
            nama_bank: document.getElementById('nama_bank').value || null,
            deskripsi: document.getElementById('deskripsi').value || null,
            no_referensi: document.getElementById('no_referensi').value || null,
            saldo_akhir: parseFloat(document.getElementById('saldo_awal').value) || 0.00 // Saldo akhir sama dengan saldo awal saat pembuatan
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
            jenis_akun: document.getElementById('edit_jenis_akun').value,
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
