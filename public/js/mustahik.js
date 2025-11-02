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
            alert('Mustahik berhasil ditambahkan!');
            document.getElementById('add-mustahik-form').reset();
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addMustahikModal'));
            addModal.hide();
            loadMustahikData(); // Reload data
        } else {
            alert('Gagal menambahkan mustahik: ' + (result.message || result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Gagal menambahkan mustahik: ' + error.message);
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
            alert('Mustahik berhasil diperbarui!');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editMustahikModal'));
            editModal.hide();
            loadMustahikData(); // Reload data
        } else {
            alert('Gagal memperbarui mustahik: ' + (result.message || result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Gagal memperbarui mustahik: ' + error.message);
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

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMustahikData();
});