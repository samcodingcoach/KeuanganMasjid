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

let allMustahikData = [];

// Load mustahik data
async function loadMustahikData() {
    try {
        const response = await fetch('/api/mustahik.list');
        const result = await response.json();

        if (result.success && result.data) {
            allMustahikData = result.data;
            renderTable(allMustahikData);
        } else {
            const mustahikTableBody = document.querySelector('#mustahik-table tbody');
            mustahikTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data mustahik</td></tr>';
        }
    } catch (error) {
        console.error('Error loading mustahik data:', error);
        const mustahikTableBody = document.querySelector('#mustahik-table tbody');
        mustahikTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function renderTable(data) {
    const mustahikTableBody = document.querySelector('#mustahik-table tbody');
    mustahikTableBody.innerHTML = '';

    if (data.length === 0) {
        mustahikTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data ditemukan</td></tr>';
        updatePaginationInfo(0, 0);
        return;
    }

    data.forEach((mustahik, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${mustahik.nama_lengkap}</td>
            <td>${mustahik.no_telepon || ''}</td>
            <td>${mustahik.kategori || ''}</td>
            <td>
                <button class="btn btn-info btn-sm detail-btn" data-id="${mustahik.id_mustahik}"><i class="bi bi-eye"></i></button>
                <button class="btn btn-warning btn-sm edit-btn" data-id="${mustahik.id_mustahik}"><i class="bi bi-pencil"></i></button>
            </td>
        `;
        mustahikTableBody.appendChild(row);
    });

    updatePaginationInfo(data.length, allMustahikData.length);
    addEventListeners();
}

function updatePaginationInfo(displayed, total) {
    const paginationInfo = document.querySelector('.card-footer small');
    if (paginationInfo) {
        paginationInfo.innerHTML = `Menampilkan <strong>${displayed}</strong> dari <strong>${total}</strong> entri`;
    }
}

function addEventListeners() {
    // Add event listeners for detail buttons
    document.querySelectorAll('.detail-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const mustahik = allMustahikData.find(m => m.id_mustahik == id);
            if (mustahik) {
                showDetailModal(mustahik);
            }
        });
    });

    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const mustahik = allMustahikData.find(m => m.id_mustahik == id);
            if (mustahik) {
                showEditModal(mustahik);
            }
        });
    });
}

function showDetailModal(mustahik) {
    const aktifStatus = mustahik.aktif ? '<span class="badge bg-success">Aktif</span>' : '<span class="badge bg-danger">Tidak Aktif</span>';
    const fakirStatus = mustahik.fakir ? '<span class="badge bg-info">Ya</span>' : '<span class="badge bg-secondary">Tidak</span>';
    const tanggalLahir = mustahik.tanggal_lahir ? new Date(mustahik.tanggal_lahir).toLocaleDateString('id-ID') : '-';

    document.getElementById('detail_nama_lengkap').textContent = mustahik.nama_lengkap;
    document.getElementById('detail_tanggal_lahir').textContent = tanggalLahir;
    document.getElementById('detail_no_ktp').textContent = mustahik.no_ktp || '-';
    document.getElementById('detail_alamat').textContent = mustahik.alamat || '-';
    document.getElementById('detail_gps').textContent = mustahik.gps || '-';
    document.getElementById('detail_no_telepon').textContent = mustahik.no_telepon || '-';
    document.getElementById('detail_kategori').textContent = mustahik.kategori || '-';
    document.getElementById('detail_keterangan').textContent = mustahik.keterangan || '-';
    document.getElementById('detail_aktif').innerHTML = aktifStatus;
    document.getElementById('detail_fakir').innerHTML = fakirStatus;

    const detailModal = new bootstrap.Modal(document.getElementById('detailMustahikModal'));
    detailModal.show();
}

function showEditModal(mustahik) {
    document.getElementById('edit_id_mustahik').value = mustahik.id_mustahik;
    document.getElementById('edit_nama_lengkap').value = mustahik.nama_lengkap;
    document.getElementById('edit_alamat').value = mustahik.alamat || '';
    document.getElementById('edit_no_telepon').value = mustahik.no_telepon || '';
    document.getElementById('edit_no_ktp').value = mustahik.no_ktp || '';
    document.getElementById('edit_gps').value = mustahik.gps || '';
    document.getElementById('edit_tanggal_lahir').value = mustahik.tanggal_lahir || '';
    document.getElementById('edit_aktif').checked = mustahik.aktif;
    document.getElementById('edit_keterangan').value = mustahik.keterangan || '';
    
    // Set value for Select2
    $('#edit_kategori').val(mustahik.kategori).trigger('change');
    
    const editModal = new bootstrap.Modal(document.getElementById('editMustahikModal'));
    editModal.show();
}

// Handle search
document.getElementById('search-button').addEventListener('click', () => {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filteredData = allMustahikData.filter(mustahik => 
        mustahik.nama_lengkap.toLowerCase().includes(searchTerm)
    );
    renderTable(filteredData);
});

document.getElementById('search-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const filteredData = allMustahikData.filter(mustahik => 
            mustahik.nama_lengkap.toLowerCase().includes(searchTerm)
        );
        renderTable(filteredData);
    }
});


// Handle form submission for adding new mustahik
document.getElementById('save-mustahik-btn').addEventListener('click', async function() {
    if (!checkLoginStatus()) return;
    
    const formData = {
        nama_lengkap: document.getElementById('nama_lengkap').value,
        alamat: document.getElementById('alamat').value,
        no_telepon: document.getElementById('no_telepon').value,
        no_ktp: document.getElementById('no_ktp').value,
        gps: document.getElementById('gps').value || null,
        tanggal_lahir: document.getElementById('tanggal_lahir').value || null,
        aktif: document.getElementById('aktif').checked,
        keterangan: document.getElementById('keterangan').value || null,
        kategori: $('#kategori').val()
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
            $('#kategori').val(null).trigger('change');
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addMustahikModal'));
            addModal.hide();
            loadMustahikData(); // Reload data
        } else {
            showMustahikToast('Gagal menambahkan mustahik: ' + (result.message || result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        showMustahikToast('Gagal menambahkan mustahik: ' + error.message, 'error');
    }
});

// Handle form submission for editing mustahik
document.getElementById('update-mustahik-btn').addEventListener('click', async function() {
    if (!checkLoginStatus()) return;
    
    const formData = {
        id_mustahik: document.getElementById('edit_id_mustahik').value,
        nama_lengkap: document.getElementById('edit_nama_lengkap').value,
        alamat: document.getElementById('edit_alamat').value,
        no_telepon: document.getElementById('edit_no_telepon').value,
        no_ktp: document.getElementById('edit_no_ktp').value,
        gps: document.getElementById('edit_gps').value || null,
        tanggal_lahir: document.getElementById('edit_tanggal_lahir').value || null,
        aktif: document.getElementById('edit_aktif').checked,
        keterangan: document.getElementById('edit_keterangan').value || null,
        kategori: $('#edit_kategori').val()
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
    }
});


// Function to show toast notification for mustahik
function showMustahikToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container-mustahik');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-mustahik';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'mustahik-toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast rounded-3';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    let headerBg = 'linear-gradient(180deg, #075E54 0%, #128C7E 100%)';
    if (type === 'error') {
        headerBg = 'linear-gradient(180deg, #dc3545 0%, #c82333 100%)';
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
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (checkLoginStatus()) {
        loadMustahikData();
    }

    // Initialize Select2 for modals
    $('#addMustahikModal').on('shown.bs.modal', function () {
        $('#kategori').select2({
            theme: 'bootstrap-5',
            placeholder: 'Pilih Kategori',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#addMustahikModal')
        });
    });

    $('#editMustahikModal').on('shown.bs.modal', function () {
        $('#edit_kategori').select2({
            theme: 'bootstrap-5',
            placeholder: 'Pilih Kategori',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#editMustahikModal')
        });
    });
});