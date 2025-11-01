document.addEventListener('DOMContentLoaded', function() {
    const assetTableBody = document.querySelector('#asset-table tbody');
    const addAssetModal = new bootstrap.Modal(document.getElementById('addAssetModal'));
    const editAssetModal = new bootstrap.Modal(document.getElementById('editAssetModal'));

    // Get logged in user's ID from session storage
    function getLoggedInUserId() {
        const userData = sessionStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            return user.id_pegawai;
        }
        return null;
    }

    // Load asset data on page load
    loadAssetData();

    // Handle form submission for adding new asset
    document.getElementById('add-asset-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get logged in user's ID
        const id_pegawai = getLoggedInUserId();
        if (!id_pegawai) {
            alert('Anda harus login terlebih dahulu untuk menambahkan asset.');
            window.location.href = '/login';
            return;
        }

        const hargaStr = document.getElementById('harga').value;
        const harga = parseFloat(hargaStr.replace(/\./g, '')); // Remove dots and parse as float

        const formData = {
            nama_barang: document.getElementById('nama_barang').value,
            kode_barang: document.getElementById('kode_barang').value,
            jenis_asset: document.getElementById('jenis_asset').value,
            harga: harga,
            id_pegawai: id_pegawai, // Get from session storage
            isHibah: document.getElementById('isHibah').checked,
            aktif: document.getElementById('aktif').checked,
            isBroken: document.getElementById('isBroken').checked,
            gambar_url: document.getElementById('gambar_url').value // Add the image URL
        };

        try {
            const response = await fetch('/api/asset.create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Asset berhasil ditambahkan!');
                document.getElementById('add-asset-form').reset();
                addAssetModal.hide();
                loadAssetData(); // Reload data
            } else {
                alert('Gagal menambahkan asset: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Gagal menambahkan asset: ' + error.message);
        }
    });

    // Handle form submission for editing asset
    document.getElementById('edit-asset-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get logged in user's ID
        const id_pegawai = getLoggedInUserId();
        if (!id_pegawai) {
            alert('Anda harus login terlebih dahulu untuk mengedit asset.');
            window.location.href = '/login';
            return;
        }

        const hargaStr = document.getElementById('edit_harga').value;
        const harga = parseFloat(hargaStr.replace(/\./g, '')); // Remove dots and parse as float

        const formData = {
            kode_barang: document.getElementById('edit_kode_barang').value,
            nama_barang: document.getElementById('edit_nama_barang').value,
            jenis_asset: document.getElementById('edit_jenis_asset').value,
            harga: harga,
            id_pegawai: id_pegawai, // Get from session storage
            isHibah: document.getElementById('edit_isHibah').checked,
            aktif: document.getElementById('edit_aktif').checked,
            isBroken: document.getElementById('edit_isBroken').checked,
            gambar_url: document.getElementById('edit_gambar_url').value // Add the image URL
        };

        try {
            const response = await fetch('/api/asset.update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Asset berhasil diperbarui!');
                editAssetModal.hide();
                loadAssetData(); // Reload data
            } else {
                alert('Gagal memperbarui asset: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Gagal memperbarui asset: ' + error.message);
        }
    });

    // Function to load asset data
    async function loadAssetData() {
        try {
            const response = await fetch('/api/asset.list');
            const result = await response.json();

            if (result.success && result.data) {
                renderAssetTable(result.data);
            } else {
                assetTableBody.innerHTML = '<tr><td colspan="11" class="text-center">Tidak ada data asset</td></tr>';
            }
        } catch (error) {
            console.error('Error loading asset data:', error);
            assetTableBody.innerHTML = `<tr><td colspan="11" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
        }
    }

    // Function to format number with thousands separators
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Function to render asset table
    function renderAssetTable(assets) {
        assetTableBody.innerHTML = '';

        if (assets.length === 0) {
            assetTableBody.innerHTML = '<tr><td colspan="11" class="text-center">Tidak ada data asset</td></tr>';
            return;
        }

        assets.forEach((asset, index) => {
            // Format harga to currency without decimals
            const formattedHarga = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(asset.harga);

            // Format status as Ya/Tidak
            const hibahStatus = asset.isHibah ? 'Ya' : 'Tidak';
            const aktifStatus = asset.aktif ? 'Ya' : 'Tidak';
            const brokenStatus = asset.isBroken ? 'Ya' : 'Tidak';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${asset.nama_barang}</td>
                <td>${asset.kode_barang}</td>
                <td>${asset.created_at}</td>
                <td>${asset.jenis_asset}</td>
                <td>${formattedHarga}</td>
                <td>${asset.nama_lengkap}</td>
                <td>${hibahStatus}</td>
                <td>${aktifStatus}</td>
                <td>${brokenStatus}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" 
                            data-id="${asset.id_asset}"
                            data-kode="${asset.kode_barang}"
                            data-nama="${asset.nama_barang}"
                            data-jenis="${asset.jenis_asset}"
                            data-harga="${asset.harga}"
                            data-pegawai="${asset.id_pegawai}"
                            data-hibah="${asset.isHibah}"
                            data-aktif="${asset.aktif}"
                            data-broken="${asset.isBroken}"
                            data-gambar-url="${asset.gambar_url || ''}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn ms-1" 
                            data-kode="${asset.kode_barang}"
                            data-nama="${asset.nama_barang}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;

            assetTableBody.appendChild(row);
        });

        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function() {
                const assetId = this.getAttribute('data-id');
                const kodeBarang = this.getAttribute('data-kode');
                const namaBarang = this.getAttribute('data-nama');
                const jenisAsset = this.getAttribute('data-jenis');
                const harga = this.getAttribute('data-harga');
                const idPegawai = this.getAttribute('data-pegawai');
                const isHibah = this.getAttribute('data-hibah') === 'True' || this.getAttribute('data-hibah') === 'true';
                const aktif = this.getAttribute('data-aktif') === 'True' || this.getAttribute('data-aktif') === 'true';
                const isBroken = this.getAttribute('data-broken') === 'True' || this.getAttribute('data-broken') === 'true';
                const gambarUrl = this.getAttribute('data-gambar-url');

                document.getElementById('edit_id_asset').value = assetId;
                document.getElementById('edit_kode_barang').value = kodeBarang;
                document.getElementById('edit_nama_barang').value = namaBarang;
                document.getElementById('edit_jenis_asset').value = jenisAsset;
                document.getElementById('edit_harga').value = formatNumber(harga);
                document.getElementById('edit_gambar_url').value = gambarUrl;
                document.getElementById('edit_isHibah').checked = isHibah;
                document.getElementById('edit_aktif').checked = aktif;
                document.getElementById('edit_isBroken').checked = isBroken;

                editAssetModal.show();
            });
        });

        // Calculate summary values
        let totalHarga = 0;
        let totalHibah = 0;
        let totalAktif = 0;
        let totalRusak = 0;

        assets.forEach(asset => {
            totalHarga += asset.harga;
            if (asset.isHibah) totalHibah++;
            if (asset.aktif) totalAktif++;
            if (asset.isBroken) totalRusak++;
        });

        // Format summary values
        const formattedTotalHarga = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(totalHarga);

        // Add summary rows at the bottom of the table
        const summaryRow1 = document.createElement('tr');
        summaryRow1.style.fontWeight = 'bold';
        summaryRow1.style.backgroundColor = '#f8f9fa';
        summaryRow1.innerHTML = `
            <td colspan="5" class="text-end">TOTAL</td>
            <td>${formattedTotalHarga}</td>
            <td></td>
            <td>${totalHibah}</td>
            <td>${totalAktif}</td>
            <td>${totalRusak}</td>
            <td></td>
        `;

        assetTableBody.appendChild(summaryRow1);

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const kodeBarang = this.getAttribute('data-kode');
                const namaBarang = this.getAttribute('data-nama');
                
                if (confirm(`Apakah Anda yakin ingin menghapus asset "${namaBarang}" (Kode: ${kodeBarang})?`)) {
                    deleteAsset(kodeBarang);
                }
            });
        });
    }

    // Function to delete asset (placeholder - implement as needed)
    async function deleteAsset(kode_barang) {
        try {
            // In a real application, you would make an API call to delete the asset
            // For now, we'll just show an alert
            alert(`Asset dengan kode ${kode_barang} akan dihapus. Fungsi delete belum diimplementasikan sepenuhnya.`);
            // await fetch(`/api/asset.delete/${kode_barang}`, { method: 'DELETE' });
            // loadAssetData(); // Reload data
        } catch (error) {
            alert('Gagal menghapus asset: ' + error.message);
        }
    }
});