document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah login
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        alert('Anda harus login untuk mengakses halaman ini.');
        window.location.href = '/login';
        return;
    }

    const addPegawaiModal = new bootstrap.Modal(document.getElementById('addPegawaiModal'));
    const addPegawaiForm = document.getElementById('add-pegawai-form');

    // Fungsi untuk generate default password YYMMDDHHMM
    function generateDefaultPassword() {
        const d = new Date();
        const year = String(d.getFullYear()).slice(-2);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}`;
    }

    // Set default password when modal is shown
    document.getElementById('addPegawaiModal').addEventListener('show.bs.modal', function () {
        document.getElementById('password').value = generateDefaultPassword();
    });

    // Show/hide password
    const togglePassword = document.querySelector('#togglePassword');
    const password = document.querySelector('#password');
    togglePassword.addEventListener('click', function (e) {
        // toggle the type attribute
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        // toggle the eye / eye slash icon
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

    // Event listener untuk form tambah pegawai
    addPegawaiForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const newPegawai = {
            nama_lengkap: document.getElementById('nama_lengkap').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value
        };

        fetch('/api/pegawai.create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPegawai),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Pegawai berhasil ditambahkan!');
                addPegawaiModal.hide();
                addPegawaiForm.reset();
                fetchAndDisplayPegawai();
            } else {
                alert('Gagal menambahkan pegawai: ' + (data.message || data.error));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menambahkan pegawai.');
        });
    });

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
