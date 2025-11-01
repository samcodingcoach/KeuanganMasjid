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

// Load muzakki data
async function loadMuzakkiData() {
    try {
        const response = await fetch('/api/muzakki.list');
        const result = await response.json();

        const muzakkiTableBody = document.querySelector('#muzakki-table tbody');
        
        if (result.success && result.data) {
            muzakkiTableBody.innerHTML = '';
            
            result.data.forEach((muzakki, index) => {
                // Format status as Ya/Tidak
                const fakirStatus = muzakki.fakir ? 'Ya' : 'Tidak';
                const aktifStatus = muzakki.aktif ? 'Ya' : 'Tidak';
                
                const tanggalLahir = muzakki.tanggal_lahir ? new Date(muzakki.tanggal_lahir).toLocaleDateString('id-ID') : '-';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${muzakki.nama_lengkap}</td>
                    <td>${muzakki.alamat || ''}</td>
                    <td>${muzakki.no_telepon}</td>
                    <td>${muzakki.no_ktp || ''}</td>
                    <td>${muzakki.gps || '-'}</td>
                    <td>${fakirStatus}</td>
                    <td>${tanggalLahir}</td>
                    <td>${aktifStatus}</td>
                    <td>${muzakki.keterangan || '-'}</td>
                    <td>${muzakki.kategori || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm edit-btn" 
                                data-id="${muzakki.id_muzakki}"
                                data-nama="${muzakki.nama_lengkap}"
                                data-alamat="${muzakki.alamat || ''}"
                                data-no-telepon="${muzakki.no_telepon}"
                                data-no-ktp="${muzakki.no_ktp || ''}"
                                data-gps="${muzakki.gps || ''}"
                                data-fakir="${muzakki.fakir}"
                                data-tanggal-lahir="${muzakki.tanggal_lahir || ''}"
                                data-aktif="${muzakki.aktif}"
                                data-keterangan="${muzakki.keterangan || ''}"
                                data-kategori="${muzakki.kategori || ''}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-success btn-sm change-btn ms-1" 
                                data-id="${muzakki.id_muzakki}"
                                data-nama="${muzakki.nama_lengkap}"
                                data-aktif="${muzakki.aktif}">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                    </td>
                `;
                
                muzakkiTableBody.appendChild(row);
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
                    
                    document.getElementById('edit_id_muzakki').value = id;
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
                    
                    const editModal = new bootstrap.Modal(document.getElementById('editMuzakkiModal'));
                    editModal.show();
                });
            });
            
            // Add event listeners for change buttons (toggle active status)
            document.querySelectorAll('.change-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    const nama = this.getAttribute('data-nama');
                    const currentAktif = this.getAttribute('data-aktif') === 'True' || this.getAttribute('data-aktif') === 'true';
                    
                    toggleMuzakkiActiveStatus(id, nama, currentAktif);
                });
            });
        } else {
            muzakkiTableBody.innerHTML = '<tr><td colspan="12" class="text-center">Tidak ada data muzakki</td></tr>';
        }
    } catch (error) {
        console.error('Error loading muzakki data:', error);
        const muzakkiTableBody = document.querySelector('#muzakki-table tbody');
        muzakkiTableBody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

// Handle form submission for adding new muzakki
document.getElementById('save-muzakki-btn').addEventListener('click', async function() {
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
        const response = await fetch('/api/muzakki.create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Muzakki berhasil ditambahkan!');
            document.getElementById('add-muzakki-form').reset();
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addMuzakkiModal'));
            addModal.hide();
            loadMuzakkiData(); // Reload data
        } else {
            alert('Gagal menambahkan muzakki: ' + (result.message || result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Gagal menambahkan muzakki: ' + error.message);
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
        fakir: document.getElementById('edit_fakir').checked,
        tanggal_lahir: document.getElementById('edit_tanggal_lahir').value || null,
        aktif: document.getElementById('edit_aktif').checked,
        keterangan: document.getElementById('edit_keterangan').value || null,
        kategori: document.getElementById('edit_kategori').value
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
            alert('Muzakki berhasil diperbarui!');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editMuzakkiModal'));
            editModal.hide();
            loadMuzakkiData(); // Reload data
        } else {
            alert('Gagal memperbarui muzakki: ' + (result.message || result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Gagal memperbarui muzakki: ' + error.message);
    }
});

// Function to toggle muzakki active status
async function toggleMuzakkiActiveStatus(id, nama, currentAktif) {
    if (!checkLoginStatus()) return;
    
    const newAktifStatus = !currentAktif;
    const statusText = newAktifStatus ? 'aktif' : 'non-aktif';
    
    if (confirm(`Apakah Anda yakin ingin mengubah status muzakki "${nama}" menjadi ${statusText}?`)) {
        try {
            // Get the current muzakki data to update only the aktif field
            const formData = {
                id_muzakki: id,
                aktif: newAktifStatus
            };

            const response = await fetch('/api/muzakki.update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(`Status muzakki "${nama}" berhasil diubah menjadi ${statusText}!`);
                loadMuzakkiData(); // Reload data to reflect changes
            } else {
                alert('Gagal mengubah status muzakki: ' + (result.message || result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Gagal mengubah status muzakki: ' + error.message);
        }
    }
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMuzakkiData();
});