// Check if user is logged in
function checkLoginStatus() {
    const userData = sessionStorage.getItem('userData');
    if (!userData) {
        alert('Anda harus login terlebih dahulu!');
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Load mustahik data
async function loadMustahikData() {
    try {
        const response = await fetch('/api/mustahik.list');
        const result = await response.json();

        const mustahikTableBody = document.querySelector('#mustahik-table tbody');
        
        if (result.success && result.data) {
            mustahikTableBody.innerHTML = '';
            
            result.data.forEach((mustahik, index) => {
                // Format status as Ya/Tidak
                const fakirStatus = mustahik.fakir ? 'Ya' : 'Tidak';
                const aktifStatus = mustahik.aktif ? 'Ya' : 'Tidak';
                
                const tanggalLahir = mustahik.tanggal_lahir ? new Date(mustahik.tanggal_lahir).toLocaleDateString('id-ID') : '-';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${mustahik.nama_lengkap}</td>
                    <td>${mustahik.alamat || ''}</td>
                    <td>${mustahik.no_telepon || ''}</td>
                    <td>${mustahik.no_ktp || ''}</td>
                    <td>${mustahik.gps || '-'}</td>
                    <td>${fakirStatus}</td>
                    <td>${tanggalLahir}</td>
                    <td>${aktifStatus}</td>
                    <td>${mustahik.keterangan || '-'}</td>
                    <td>${mustahik.kategori || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm edit-btn" 
                                data-id="${mustahik.id_mustahik}"
                                data-nama="${mustahik.nama_lengkap}"
                                data-alamat="${mustahik.alamat || ''}"
                                data-no-telepon="${mustahik.no_telepon || ''}"
                                data-no-ktp="${mustahik.no_ktp || ''}"
                                data-gps="${mustahik.gps || ''}"
                                data-fakir="${mustahik.fakir}"
                                data-tanggal-lahir="${mustahik.tanggal_lahir || ''}"
                                data-aktif="${mustahik.aktif}"
                                data-keterangan="${mustahik.keterangan || ''}"
                                data-kategori="${mustahik.kategori || ''}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-success btn-sm change-btn ms-1" 
                                data-id="${mustahik.id_mustahik}"
                                data-nama="${mustahik.nama_lengkap}"
                                data-aktif="${mustahik.aktif}">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    </td>
                `;
                
                mustahikTableBody.appendChild(row);
            });
            
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    const nama = this.getAttribute('data-nama');
                    const alamat = this.getAttribute('data-alamat');
                    const noTelepon = this.getAttribute('data-no-telepon');
                    const noKtp = this.getAttribute('data-no-ktp');
                    const gps = this.getAttribute('data-gps');
                    const fakir = this.getAttribute('data-fakir') === 'True' || this.getAttribute('data-fakir') === 'true';
                    const tanggalLahir = this.getAttribute('data-tanggal-lahir');
                    const aktif = this.getAttribute('data-aktif') === 'True' || this.getAttribute('data-aktif') === 'true';
                    const keterangan = this.getAttribute('data-keterangan');
                    const kategori = this.getAttribute('data-kategori');
                    
                    document.getElementById('edit_id_mustahik').value = id;
                    document.getElementById('edit_nama_lengkap').value = nama;
                    document.getElementById('edit_alamat').value = alamat;
                    document.getElementById('edit_no_telepon').value = noTelepon;
                    document.getElementById('edit_no_ktp').value = noKtp;
                    document.getElementById('edit_gps').value = gps;
                    document.getElementById('edit_fakir').checked = fakir;
                    document.getElementById('edit_tanggal_lahir').value = tanggalLahir;
                    document.getElementById('edit_aktif').checked = aktif;
                    document.getElementById('edit_keterangan').value = keterangan;
                    document.getElementById('edit_kategori').value = kategori;
                    
                    const editModal = new bootstrap.Modal(document.getElementById('editMustahikModal'));
                    editModal.show();
                });
            });
            
            // Add event listeners for change buttons (toggle active status)
            document.querySelectorAll('.change-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    const nama = this.getAttribute('data-nama');
                    const currentAktif = this.getAttribute('data-aktif') === 'True' || this.getAttribute('data-aktif') === 'true';
                    
                    toggleMustahikActiveStatus(id, nama, currentAktif);
                });
            });
        } else {
            mustahikTableBody.innerHTML = '<tr><td colspan="12" class="text-center">Tidak ada data mustahik</td></tr>';
        }
    } catch (error) {
        console.error('Error loading mustahik data:', error);
        const mustahikTableBody = document.querySelector('#mustahik-table tbody');
        mustahikTableBody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

// Handle form submission for adding new mustahik
document.getElementById('save-mustahik-btn').addEventListener('click', async function() {
    if (!checkLoginStatus()) return;
    
    // Show spinner and disable button
    const saveBtn = document.getElementById('save-mustahik-btn');
    const originalText = saveBtn.innerHTML;
    const originalDisabled = saveBtn.disabled;
    
    // Create spinner overlay inside the modal
    const modalBody = document.querySelector('#addMustahikModal .modal-body');
    
    // Disable the form
    const formElements = document.getElementById('add-mustahik-form').elements;
    for (let i = 0; i < formElements.length; i++) {
        formElements[i].disabled = true;
    }
    
    // Show spinner overlay
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.id = 'save-mustahik-spinner-overlay';
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
    const modalDialog = document.querySelector('#addMustahikModal .modal-dialog');
    modalDialog.style.position = 'relative';
    modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
    
    // Update button state
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
    saveBtn.disabled = true;
    
    const formData = {
        nama_lengkap: document.getElementById('nama_lengkap').value,
        alamat: document.getElementById('alamat').value,
        no_telepon: document.getElementById('no_telepon').value,
        no_ktp: document.getElementById('no_ktp').value,
        gps: document.getElementById('gps').value || null,
        fakir: document.getElementById('fakir').checked,
        tanggal_lahir: document.getElementById('tanggal_lahir').value || null,
        aktif: document.getElementById('aktif').checked,
        keterangan: document.getElementById('keterangan').value || null,
        kategori: document.getElementById('kategori').value
    };

    try {
        const response = await fetch('/api/mustahik.create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showMustahikToast('Mustahik berhasil ditambahkan!');
            document.getElementById('add-mustahik-form').reset();
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addMustahikModal'));
            addModal.hide();
            loadMustahikData(); // Reload data
        } else {
            showMustahikToast('Gagal menambahkan mustahik: ' + (result.message || result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showMustahikToast('Gagal menambahkan mustahik: ' + error.message, 'error');
    } finally {
        // Remove spinner overlay
        const spinnerOverlay = document.getElementById('save-mustahik-spinner-overlay');
        if (spinnerOverlay) {
            spinnerOverlay.remove();
        }
        
        // Re-enable form elements
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = false;
        }
        
        // Restore button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = originalDisabled;
    }
});

// Handle form submission for editing mustahik
document.getElementById('update-mustahik-btn').addEventListener('click', async function() {
    if (!checkLoginStatus()) return;
    
    // Show spinner and disable button
    const updateBtn = document.getElementById('update-mustahik-btn');
    const originalText = updateBtn.innerHTML;
    const originalDisabled = updateBtn.disabled;
    
    // Create spinner overlay inside the modal
    const modalBody = document.querySelector('#editMustahikModal .modal-body');
    
    // Disable the form
    const formElements = document.getElementById('edit-mustahik-form').elements;
    for (let i = 0; i < formElements.length; i++) {
        formElements[i].disabled = true;
    }
    
    // Show spinner overlay
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.id = 'update-mustahik-spinner-overlay';
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
    const modalDialog = document.querySelector('#editMustahikModal .modal-dialog');
    modalDialog.style.position = 'relative';
    modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);
    
    // Update button state
    updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
    updateBtn.disabled = true;
    
    const formData = {
        id_mustahik: document.getElementById('edit_id_mustahik').value,
        nama_lengkap: document.getElementById('edit_nama_lengkap').value,
        alamat: document.getElementById('edit_alamat').value,
        no_telepon: document.getElementById('edit_no_telepon').value,
        no_ktp: document.getElementById('edit_no_ktp').value,
        gps: document.getElementById('edit_gps').value || null,
        fakir: document.getElementById('edit_fakir').checked,
        tanggal_lahir: document.getElementById('edit_tanggal_lahir').value || null,
        aktif: document.getElementById('edit_aktif').checked,
        keterangan: document.getElementById('edit_keterangan').value || null,
        kategori: document.getElementById('edit_kategori').value
    };

    try {
        const response = await fetch('/api/mustahik.update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showMustahikToast('Mustahik berhasil diperbarui!');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editMustahikModal'));
            editModal.hide();
            loadMustahikData(); // Reload data
        } else {
            showMustahikToast('Gagal memperbarui mustahik: ' + (result.message || result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showMustahikToast('Gagal memperbarui mustahik: ' + error.message, 'error');
    } finally {
        // Remove spinner overlay
        const spinnerOverlay = document.getElementById('update-mustahik-spinner-overlay');
        if (spinnerOverlay) {
            spinnerOverlay.remove();
        }
        
        // Re-enable form elements
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = false;
        }
        
        // Restore button state
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = originalDisabled;
    }
});

// Function to toggle mustahik active status
async function toggleMustahikActiveStatus(id, nama, currentAktif) {
    if (!checkLoginStatus()) return;
    
    const newAktifStatus = !currentAktif;
    const statusText = newAktifStatus ? 'aktif' : 'non-aktif';
    
    if (confirm(`Apakah Anda yakin ingin mengubah status mustahik "${nama}" menjadi ${statusText}?`)) {
        try {
            // Get the current mustahik data to update only the aktif field
            const formData = {
                id_mustahik: id,
                aktif: newAktifStatus
            };

            const response = await fetch('/api/mustahik.update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(`Status mustahik "${nama}" berhasil diubah menjadi ${statusText}!`);
                loadMustahikData(); // Reload data to reflect changes
            } else {
                alert('Gagal mengubah status mustahik: ' + (result.message || result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Gagal mengubah status mustahik: ' + error.message);
        }
    }
}

// Function to show toast notification for mustahik
function showMustahikToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container-mustahik');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-mustahik';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'mustahik-toast-' + Date.now();
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

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMustahikData();
});