document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    // Ambil data dari API
    fetch('/api/akun.list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tableBody = document.querySelector('#akun-table tbody');
                // Kosongkan body tabel sebelum mengisi
                tableBody.innerHTML = ''; 
                
                                        let counter = 1;
                                        data.data.forEach(akun => {
                                            const row = document.createElement('tr');
                                            row.innerHTML = `
                                                <td>${counter++}</td>
                                                <td>${akun.nama_akun}</td>
                                                <td>${akun.saldo_awal}</td>
                                                <td>${akun.saldo_akhir}</td>
                                            `;                    tableBody.appendChild(row);
                });
            } else {
                alert('Gagal memuat data akun: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Terjadi kesalahan saat mengambil data.');
        });
});
