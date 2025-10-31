document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    // Fungsi untuk mengambil dan menampilkan data pegawai
    function fetchAndDisplayPegawai() {
        fetch('/api/pegawai.list')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const tableBody = document.querySelector('#pegawai-table tbody');
                    tableBody.innerHTML = ''; // Kosongkan body tabel sebelum mengisi
                    let counter = 1;
                    data.data.forEach(pegawai => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${counter++}</td>
                            <td>${pegawai.nama_lengkap}</td>
                            <td>${pegawai.email}</td>
                            <td>${pegawai.role}</td>
                            <td>${new Date(pegawai.created_at).toISOString().slice(0, 16).replace('T', ' ')}</td>
                            <td>
                                <button class="btn btn-sm btn-warning edit-btn">Edit</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    alert('Gagal memuat data pegawai: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Terjadi kesalahan saat mengambil data.');
            });
    }

    // Panggil fungsi untuk pertama kali memuat data
    fetchAndDisplayPegawai();
});
