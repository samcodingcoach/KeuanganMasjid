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

let allMuzakkiData = [];

// Load muzakki data
async function loadMuzakkiData() {
    try {
        const response = await fetch('/api/muzakki.list');
        const result = await response.json();

        if (result.success && result.data) {
            allMuzakkiData = result.data;
            renderTable(allMuzakkiData);
        } else {
            const muzakkiTableBody = document.querySelector('#muzakki-table tbody');
            muzakkiTableBody.innerHTML = '<tr><td colspan="12" class="text-center">Tidak ada data muzakki</td></tr>';
        }
    } catch (error) {
        console.error('Error loading muzakki data:', error);
        const muzakkiTableBody = document.querySelector('#muzakki-table tbody');
        muzakkiTableBody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function renderTable(data) {
    const muzakkiTableBody = document.querySelector('#muzakki-table tbody');
    muzakkiTableBody.innerHTML = '';

    if (data.length === 0) {
        muzakkiTableBody.innerHTML = '<tr><td colspan="12" class="text-center">Tidak ada data ditemukan</td></tr>';
        updatePaginationInfo(0, 0);
        return;
    }

    data.forEach((muzakki, index) => {
        const row = document.createElement('tr');
        const fakirStatus = muzakki.fakir ? 'Ya' : 'Tidak';
        const aktifStatus = muzakki.aktif ? 'Ya' : 'Tidak';
        const tanggalLahir = muzakki.tanggal_lahir ? new Date(muzakki.tanggal_lahir).toLocaleDateString('id-ID') : '-';

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${muzakki.nama_lengkap}</td>
            <td>${muzakki.alamat || ''}</td>
            <td>${muzakki.no_telepon || ''}</td>
            <td>${muzakki.no_ktp || ''}</td>
            <td>${muzakki.gps || '-'}</td>
            <td>${fakirStatus}</td>
            <td>${tanggalLahir}</td>
            <td>${aktifStatus}</td>
            <td>${muzakki.keterangan || '-'}</td>
            <td>${muzakki.kategori || ''}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-btn" data-id="${muzakki.id_muzakki}"><i class="bi bi-pencil"></i></button>
            </td>
        `;
        muzakkiTableBody.appendChild(row);
    });

    updatePaginationInfo(data.length, allMuzakkiData.length);
    addEventListeners();
}

function updatePaginationInfo(displayed, total) {
    const paginationInfo = document.querySelector('.card-footer small');
    if (paginationInfo) {
        paginationInfo.innerHTML = `Menampilkan <strong>${displayed}</strong> dari <strong>${total}</strong> entri`;
    }
}

function addEventListeners() {
    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const muzakki = allMuzakkiData.find(m => m.id_muzakki == id);
            if (muzakki) {
                showEditModal(muzakki);
            }
        });
    });
}

function showEditModal(muzakki) {
    document.getElementById('edit_id_muzakki').value = muzakki.id_muzakki;
    document.getElementById('edit_nama_lengkap').value = muzakki.nama_lengkap;
    document.getElementById('edit_alamat').value = muzakki.alamat || '';
    document.getElementById('edit_no_telepon').value = muzakki.no_telepon || '';
    document.getElementById('edit_no_ktp').value = muzakki.no_ktp || '';
    document.getElementById('edit_gps').value = muzakki.gps || '';
    document.getElementById('edit_tanggal_lahir').value = muzakki.tanggal_lahir || '';
    document.getElementById('edit_aktif').checked = muzakki.aktif;
    document.getElementById('edit_fakir').checked = muzakki.fakir;
    document.getElementById('edit_keterangan').value = muzakki.keterangan || '';
    
    // Set value for Select2
    $('#edit_kategori').val(muzakki.kategori).trigger('change');
    
    const editModal = new bootstrap.Modal(document.getElementById('editMuzakkiModal'));
    editModal.show();
}

// Handle search
document.getElementById('search-button').addEventListener('click', () => {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filteredData = allMuzakkiData.filter(muzakki => 
        muzakki.nama_lengkap.toLowerCase().includes(searchTerm)
    );
    renderTable(filteredData);
});

document.getElementById('search-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const filteredData = allMuzakkiData.filter(muzakki => 
            muzakki.nama_lengkap.toLowerCase().includes(searchTerm)
        );
        renderTable(filteredData);
    }
});


// Handle form submission for adding new muzakki
document.getElementById('save-muzakki-btn').addEventListener('click', async function() {
    if (!checkLoginStatus()) return;
    
    const formData = {
        nama_lengkap: document.getElementById('nama_lengkap').value,
        alamat: document.getElementById('alamat').value,
        no_telepon: document.getElementById('no_telepon').value,
        no_ktp: document.getElementById('no_ktp').value,
        gps: document.getElementById('gps').value || null,
        tanggal_lahir: document.getElementById('tanggal_lahir').value || null,
        aktif: document.getElementById('aktif').checked,
        fakir: document.getElementById('fakir').checked,
        keterangan: document.getElementById('keterangan').value || null,
        kategori: $('#kategori').val()
    };

    try {
        const response = await fetch('/api/muzakki.create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showMuzakkiToast('Muzakki berhasil ditambahkan!');
            document.getElementById('add-muzakki-form').reset();
            $('#kategori').val(null).trigger('change');
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addMuzakkiModal'));
            addModal.hide();
            loadMuzakkiData(); // Reload data
        } else {
            showMuzakkiToast('Gagal menambahkan muzakki: ' + (result.message || result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showMuzakkiToast('Gagal menambahkan muzakki: ' + error.message, 'error');
    }
});

// Handle form submission for editing muzakki
document.getElementById('update-muzakki-btn').addEventListener('click', async function() {
    if (!checkLoginStatus()) return;
    
    const formData = {
        id_muzakki: document.getElementById('edit_id_muzakki').value,
        nama_lengkap: document.getElementById('edit_nama_lengkap').value,
        alamat: document.getElementById('edit_alamat').value,
        no_telepon: document.getElementById('edit_no_telepon').value,
        no_ktp: document.getElementById('edit_no_ktp').value,
        gps: document.getElementById('edit_gps').value || null,
        tanggal_lahir: document.getElementById('edit_tanggal_lahir').value || null,
        aktif: document.getElementById('edit_aktif').checked,
        fakir: document.getElementById('edit_fakir').checked,
        keterangan: document.getElementById('edit_keterangan').value || null,
        kategori: $('#edit_kategori').val()
    };

    try {
        const response = await fetch('/api/muzakki.update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showMuzakkiToast('Muzakki berhasil diperbarui!');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editMuzakkiModal'));
            editModal.hide();
            loadMuzakkiData(); // Reload data
        } else {
            showMuzakkiToast('Gagal memperbarui muzakki: ' + (result.message || result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showMuzakkiToast('Gagal memperbarui muzakki: ' + error.message, 'error');
    }
});


// Function to show toast notification for muzakki
function showMuzakkiToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container-muzakki');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-muzakki';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'muzakki-toast-' + Date.now();
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

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (checkLoginStatus()) {
        loadMuzakkiData();
    }

    // Initialize Select2 for modals
    $('#addMuzakkiModal').on('shown.bs.modal', function () {
        $('#kategori').select2({
            theme: 'bootstrap-5',
            placeholder: 'Pilih Kategori',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#addMuzakkiModal')
        });
    });

    $('#editMuzakkiModal').on('shown.bs.modal', function () {
        $('#edit_kategori').select2({
            theme: 'bootstrap-5',
            placeholder: 'Pilih Kategori',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#editMuzakkiModal')
        });
    });
});