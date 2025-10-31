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
                alert('Akun berhasil ditambahkan!');
                addAkunModal.hide(); // Sembunyikan modal
                addAkunForm.reset(); // Reset form
                fetchAndDisplayAkun(); // Muat ulang data
            } else {
                alert('Gagal menambahkan akun: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menambahkan akun.');
        });
    });

    // Event listener untuk form edit akun
    editAkunForm.addEventListener('submit', function(event) {
        event.preventDefault();

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
                alert('Akun berhasil diperbarui!');
                editAkunModal.hide();
                fetchAndDisplayAkun();
            } else {
                alert('Gagal memperbarui akun: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat memperbarui akun.');
        });
    });

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayAkun();
});
