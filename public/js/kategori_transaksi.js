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
        .then(response => {
            console.log('Raw response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Parsed data:', data);
            if (data.success) {
                alert('Kategori berhasil ditambahkan!');
                addKategoriModal.hide(); // Sembunyikan modal
                addKategoriForm.reset(); // Reset form
                fetchAndDisplayKategori(); // Muat ulang data
            } else {
                alert('Gagal menambahkan kategori: ' + (data.message || data.error));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menambahkan kategori.');
        });
    });

    // Event listener untuk form edit kategori
    editKategoriForm.addEventListener('submit', function(event) {
        event.preventDefault();

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
                .then(response => {
            console.log('Raw response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Parsed data:', data);
            if (data.success) {
                alert('Kategori berhasil diperbarui!');
                editKategoriModal.hide();
                fetchAndDisplayKategori();
            } else {
                alert('Gagal memperbarui kategori: ' + (data.message || data.error));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat memperbarui kategori.');
        });
    });

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayKategori();
});
