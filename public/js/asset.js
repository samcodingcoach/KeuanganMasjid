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

    // Function to compress image
    async function compressImage(file, maxSizeKB = 500) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function() {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;
                
                // Calculate the scale factor to ensure the image doesn't exceed the max file size
                const maxDimension = Math.max(width, height);
                
                if (maxDimension > 1200) { // Limit max dimension to 1200px for large images
                    const ratio = 1200 / maxDimension;
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                // Start with high quality
                let quality = 0.9;
                let compressedDataUrl;
                
                // Keep reducing quality until the file size is below the max size
                do {
                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    const compressedSizeKB = compressedDataUrl.length * 0.75 / 1024; // Rough estimation
                    
                    if (compressedSizeKB <= maxSizeKB) {
                        break;
                    }
                    
                    quality -= 0.1; // Reduce quality
                    
                    // If quality becomes too low, break to prevent extremely poor quality
                    if (quality < 0.1) {
                        break;
                    }
                } while (true);
                
                // Convert data URL back to Blob
                const byteString = atob(compressedDataUrl.split(',')[1]);
                const mimeString = compressedDataUrl.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                
                const blob = new Blob([ab], { type: mimeString });
                
                // Create a new File object with the compressed image
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                
                resolve(compressedFile);
            };
            
            img.onerror = function() {
                // If image couldn't be loaded, return the original file
                resolve(file);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Function to upload image file and return URL
    async function uploadImageFile(fileInput) {
        const file = fileInput.files[0];
        if (!file) return null;

        console.log('Starting image upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Validate file type (jpg/jpeg only)
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!file.type.match('image/jpeg') && fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
            showAssetToast('Hanya file JPG/JPEG yang diperbolehkan', 'error');
            return null;
        }

        // Check file size before compression
        const maxSizeKB = 500;
        let processedFile = file;
        
        if (file.size > maxSizeKB * 1024) {
            // Compress image if it exceeds 500KB
            showAssetToast('Mengompresi gambar...', 'info');
            processedFile = await compressImage(file, maxSizeKB);
        } else {
            // If file is under the limit, use it as is
            processedFile = file;
        }

        // Create FormData for upload
        const formData = new FormData();
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        formData.append('file', processedFile, fileName);
        formData.append('filename', fileName);

        try {
            const uploadResponse = await fetch('/api/asset.upload', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();
            console.log('Upload response:', uploadResult);

            if (uploadResult.success) {
                console.log('Upload successful, URL:', uploadResult.url);
                return uploadResult.url;
            } else {
                showAssetToast(`Gagal mengunggah gambar: ${uploadResult.message}`, 'error');
                return null;
            }
        } catch (error) {
            showAssetToast(`Terjadi kesalahan saat mengunggah gambar: ${error.message}`, 'error');
            return null;
        }
    }

    // Handle form submission for adding new asset
    document.getElementById('add-asset-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Show spinner and disable button
        const submitBtn = document.getElementById('save-asset-btn');
        if (!submitBtn) {
            console.error('Submit button not found');
            return;
        }
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;

        // Create spinner overlay inside the modal
        const modalBody = document.querySelector('#addAssetModal .modal-body');

        // Disable the form
        const formElements = document.getElementById('add-asset-form').elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }

        // Show spinner overlay
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'add-asset-spinner-overlay';
        spinnerOverlay.style.position = 'absolute';
        spinnerOverlay.style.top = '0';
        spinnerOverlay.style.left = '0';
        spinnerOverlay.style.width = '100%';
        spinnerOverlay.style.height = '100%';
        spinnerOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        spinnerOverlay.style.display = 'flex';
        spinnerOverlay.style.justifyContent = 'center';
        spinnerOverlay.style.alignItems = 'center';
        spinnerOverlay.style.zIndex = '9999';
        spinnerOverlay.style.borderRadius = '0.5rem';

        spinnerOverlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;

        // Position the overlay relative to the modal content
        const modalDialog = document.querySelector('#addAssetModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

        // Update button state
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        // Get logged in user's ID
        const id_pegawai = getLoggedInUserId();
        if (!id_pegawai) {
            showAssetToast('Anda harus login terlebih dahulu untuk menambahkan asset.', 'error');
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('add-asset-spinner-overlay');
            if (spinnerOverlay) {
                spinnerOverlay.remove();
            }

            // Re-enable form elements
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }

            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
            window.location.href = '/login';
            return;
        }

        // Handle image upload if a file is selected
        let url_gambar = document.getElementById('gambar_url').value;
        const gambarUpload = document.getElementById('gambar_upload');
        
        if (gambarUpload && gambarUpload.files[0]) {
            const uploadedUrl = await uploadImageFile(gambarUpload);
            if (uploadedUrl) {
                url_gambar = uploadedUrl; // Use the uploaded image URL, not the one from the text field
            } else {
                // If upload failed but there's a URL in the text field, use that
                // Otherwise, the form will submit with whatever value was in the text field
            }
        } else if (!url_gambar) {
            // If no file selected and no URL provided, set to null
            url_gambar = null;
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
            url_gambar: url_gambar // Use the processed image URL
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
                showAssetToast('Asset berhasil ditambahkan!');
                document.getElementById('add-asset-form').reset();
                // Reset file input
                if (gambarUpload) gambarUpload.value = '';
                // Reset Select2 elements after form reset
                $('#jenis_asset').val(null).trigger('change');
                addAssetModal.hide();
                loadAssetData(); // Reload data
            } else {
                showAssetToast('Gagal menambahkan asset: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showAssetToast('Gagal menambahkan asset: ' + error.message, 'error');
        } finally {
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('add-asset-spinner-overlay');
            if (spinnerOverlay) {
                spinnerOverlay.remove();
            }

            // Re-enable form elements
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }

            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
        }
    });

    // Handle form submission for editing asset
    document.getElementById('edit-asset-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Show spinner and disable button
        const submitBtn = document.getElementById('update-asset-btn');
        if (!submitBtn) {
            console.error('Update button not found');
            return;
        }
        const originalText = submitBtn.innerHTML;
        const originalDisabled = submitBtn.disabled;

        // Create spinner overlay inside the modal
        const modalBody = document.querySelector('#editAssetModal .modal-body');

        // Disable the form
        const formElements = document.getElementById('edit-asset-form').elements;
        for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
        }

        // Show spinner overlay
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.id = 'edit-asset-spinner-overlay';
        spinnerOverlay.style.position = 'absolute';
        spinnerOverlay.style.top = '0';
        spinnerOverlay.style.left = '0';
        spinnerOverlay.style.width = '100%';
        spinnerOverlay.style.height = '100%';
        spinnerOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        spinnerOverlay.style.display = 'flex';
        spinnerOverlay.style.justifyContent = 'center';
        spinnerOverlay.style.alignItems = 'center';
        spinnerOverlay.style.zIndex = '9999';
        spinnerOverlay.style.borderRadius = '0.5rem';

        spinnerOverlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;

        // Position the overlay relative to the modal content
        const modalDialog = document.querySelector('#editAssetModal .modal-dialog');
        modalDialog.style.position = 'relative';
        modalBody.parentNode.insertBefore(spinnerOverlay, modalBody);

        // Update button state
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Menyimpan...';
        submitBtn.disabled = true;

        // Get logged in user's ID
        const id_pegawai = getLoggedInUserId();
        if (!id_pegawai) {
            showAssetToast('Anda harus login terlebih dahulu untuk mengedit asset.', 'error');
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('edit-asset-spinner-overlay');
            if (spinnerOverlay) {
                spinnerOverlay.remove();
            }

            // Re-enable form elements
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }

            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
            window.location.href = '/login';
            return;
        }

        // Handle image upload if a file is selected
        let url_gambar = document.getElementById('edit_gambar_url').value;
        const gambarUpload = document.getElementById('edit_gambar_upload');
        
        if (gambarUpload && gambarUpload.files[0]) {
            const uploadedUrl = await uploadImageFile(gambarUpload);
            if (uploadedUrl) {
                url_gambar = uploadedUrl; // Use the uploaded image URL, not the one from the text field
            } else {
                // If upload failed but there's a URL in the text field, use that
                // Otherwise, the form will submit with whatever value was in the text field
            }
        } else if (!url_gambar) {
            // If no file selected and no URL provided, set to null
            url_gambar = null;
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
            url_gambar: url_gambar // Use the processed image URL
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
                showAssetToast('Asset berhasil diperbarui!');
                editAssetModal.hide();
                loadAssetData(); // Reload data
            } else {
                showAssetToast('Gagal memperbarui asset: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showAssetToast('Gagal memperbarui asset: ' + error.message, 'error');
        } finally {
            // Remove spinner overlay
            const spinnerOverlay = document.getElementById('edit-asset-spinner-overlay');
            if (spinnerOverlay) {
                spinnerOverlay.remove();
            }

            // Re-enable form elements
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = false;
            }

            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
        }
    });

    // Store original assets data globally for filtering
    let allAssetsData = [];

    // Function to load asset data
    async function loadAssetData() {
        try {
            const response = await fetch('/api/asset.list');
            const result = await response.json();

            if (result.success && result.data) {
                allAssetsData = result.data; // Store original data for filtering
                renderAssetTable(result.data);
                // Update total harga in the table footer
                updateTotalHarga(result.total_harga);
            } else {
                assetTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data asset</td></tr>';
                // Reset total harga to 0 when no data
                updateTotalHarga(0);
            }
        } catch (error) {
            console.error('Error loading asset data:', error);
            assetTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
            // Reset total harga to 0 on error
            updateTotalHarga(0);
        }
    }

    // Function to format number with thousands separators
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Function to unformat number (remove thousands separators)
    function unformatNumber(str) {
        return str.replace(/\./g, '');
    }

    // Function to render asset table
    function renderAssetTable(assets) {
        assetTableBody.innerHTML = '';

        if (assets.length === 0) {
            assetTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data asset</td></tr>';
            updatePaginationInfo(0, 0);
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

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${asset.nama_barang}</td>
                <td>${asset.created_at}</td>
                <td class="text-end">${formattedHarga}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info p-1 detail-btn" style="border-radius: 8px; width: 36px; height: 36px; margin-right: 0.25rem;"
                            data-id="${asset.id_asset}"
                            data-kode="${asset.kode_barang}"
                            data-nama="${asset.nama_barang}"
                            data-jenis="${asset.jenis_asset}"
                            data-harga="${asset.harga}"
                            data-pegawai="${asset.nama_lengkap}"
                            data-aktif="${asset.aktif}"
                            data-hibah="${asset.isHibah}"
                            data-broken="${asset.isBroken}"
                            data-url-gambar="${asset.url_gambar || ''}"
                            data-created-at="${asset.created_at}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-whatsapp p-1 edit-btn" style="border-radius: 8px; width: 36px; height: 36px;"
                            data-id="${asset.id_asset}"
                            data-kode="${asset.kode_barang}"
                            data-nama="${asset.nama_barang}"
                            data-jenis="${asset.jenis_asset}"
                            data-harga="${asset.harga}"
                            data-pegawai="${asset.id_pegawai}"
                            data-hibah="${asset.isHibah}"
                            data-aktif="${asset.aktif}"
                            data-broken="${asset.isBroken}"
                            data-url-gambar="${asset.url_gambar || ''}">
                        <i class="bi bi-pencil"></i>
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
                const gambarUrl = this.getAttribute('data-url-gambar');

                document.getElementById('edit_id_asset').value = assetId;
                document.getElementById('edit_kode_barang').value = kodeBarang;
                document.getElementById('edit_kode_barang_display').value = kodeBarang; // Update for the display field
                document.getElementById('edit_nama_barang').value = namaBarang;
                // Update Select2 value
                $('#edit_jenis_asset').val(jenisAsset).trigger('change');

                document.getElementById('edit_harga').value = formatNumber(harga);
                document.getElementById('edit_gambar_url').value = gambarUrl;
                // Reset the file input
                document.getElementById('edit_gambar_upload').value = '';
                document.getElementById('edit_isHibah').checked = isHibah;
                document.getElementById('edit_aktif').checked = aktif;
                document.getElementById('edit_isBroken').checked = isBroken;

                editAssetModal.show();
            });
        });

        // Add event listeners for detail buttons
        document.querySelectorAll('.detail-btn').forEach(button => {
            button.addEventListener('click', function() {
                const assetId = this.getAttribute('data-id');
                const kodeBarang = this.getAttribute('data-kode');
                const namaBarang = this.getAttribute('data-nama');
                const jenisAsset = this.getAttribute('data-jenis');
                const harga = this.getAttribute('data-harga');
                const namaPegawai = this.getAttribute('data-pegawai');
                const aktif = this.getAttribute('data-aktif') === 'True' || this.getAttribute('data-aktif') === 'true';
                const isHibah = this.getAttribute('data-hibah') === 'True' || this.getAttribute('data-hibah') === 'true';
                const isBroken = this.getAttribute('data-broken') === 'True' || this.getAttribute('data-broken') === 'true';
                const urlGambar = this.getAttribute('data-url-gambar');
                const createdAt = this.getAttribute('data-created-at');

                // Format harga to currency without decimals for detail
                const formattedHarga = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(harga);

                // Format status as Ya/Tidak
                const aktifStatus = aktif ? 'Ya' : 'Tidak';
                const hibahStatus = isHibah ? 'Ya' : 'Tidak';
                const brokenStatus = isBroken ? 'Ya' : 'Tidak';

                // Fill the detail modal with asset data
                document.getElementById('detail_nama_barang').textContent = namaBarang;
                document.getElementById('detail_kode_barang').textContent = kodeBarang;
                document.getElementById('detail_created_at').textContent = createdAt;
                document.getElementById('detail_harga').textContent = formattedHarga;
                document.getElementById('detail_jenis_asset').textContent = jenisAsset;
                document.getElementById('detail_nama_lengkap').textContent = namaPegawai;
                document.getElementById('detail_aktif').textContent = aktifStatus;
                document.getElementById('detail_isHibah').textContent = hibahStatus;
                document.getElementById('detail_isBroken').textContent = brokenStatus;
                
                // Display image in detail modal if available
                const urlGambarElement = document.getElementById('detail_url_gambar');
                if (urlGambar) {
                    urlGambarElement.innerHTML = `<img src="${urlGambar}" alt="Gambar Asset" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
                } else {
                    urlGambarElement.textContent = 'Tidak ada gambar';
                }

                // Show the detail modal
                const detailModal = new bootstrap.Modal(document.getElementById('detailAssetModal'));
                detailModal.show();
            });
        });

        updatePaginationInfo(assets.length, assets.length); // Update pagination info with actual data count
    }

    // Function to update pagination info
    function updatePaginationInfo(displayed, total) {
        const paginationInfo = document.querySelector('.card-footer small');
        if (paginationInfo) {
            paginationInfo.innerHTML = `Menampilkan <strong>${displayed}</strong> dari <strong>${total}</strong> entri`;
        }
    }

    // Function to update total harga display
    function updateTotalHarga(totalHarga) {
        const totalHargaElement = document.getElementById('total-harga-td');
        if (totalHargaElement) {
            // Format the total harga as currency
            const formattedTotalHarga = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(totalHarga);

            totalHargaElement.textContent = formattedTotalHarga;
        }
    }

    // Function to filter assets by name
    function filterAssetsByName(searchTerm, assets) {
        if (!searchTerm) return assets;

        const lowerSearchTerm = searchTerm.toLowerCase();
        return assets.filter(asset =>
            asset.nama_barang.toLowerCase().includes(lowerSearchTerm)
        );
    }

    // Add search functionality
    function initializeSearch() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');

        if (!searchInput || !searchButton) {
            console.error('Search input or button not found');
            return;
        }

        // Event listener for search button
        searchButton.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim();

            if (searchTerm) {
                // Filter assets based on search term from the stored data
                const filteredAssets = filterAssetsByName(searchTerm, allAssetsData);

                // Render the filtered assets
                renderAssetTable(filteredAssets);

                // Update total harga based on filtered data
                const totalHarga = filteredAssets.reduce((sum, asset) => sum + asset.harga, 0);
                updateTotalHarga(totalHarga);
            } else {
                // If search term is empty, load all assets
                renderAssetTable(allAssetsData);
                updateTotalHarga(allAssetsData.reduce((sum, asset) => sum + asset.harga, 0));
            }
        });

        // Event listener for Enter key in search input
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchButton.click();
            }
        });

        // Clear search when input is cleared
        searchInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                // Load all assets when search is cleared
                renderAssetTable(allAssetsData);
                updateTotalHarga(allAssetsData.reduce((sum, asset) => sum + asset.harga, 0));
            }
        });
    }

    // Initialize search functionality
    initializeSearch();

    // Helper function to update the display of searchable dropdown
    function updateSearchableDropdownDisplay(selectId, value) {
        // Find the original select element
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;

        // Set the value of the hidden select element
        selectElement.value = value;

        // Find the custom dropdown container that replaces the select
        const container = selectElement.parentNode.querySelector('.searchable-dropdown');
        if (!container) return;

        // Find the dropdown button and update its text to match the selected option
        const dropdownButton = container.querySelector('.dropdown-button');
        if (!dropdownButton) return;

        // Find the text for the selected option
        const selectedOption = Array.from(selectElement.options).find(option => option.value === value);
        if (selectedOption) {
            dropdownButton.innerHTML = selectedOption.text + ' <span class="caret"></span>';
        }
    }

    // Initialize select2 for searchable selects specifically for asset modals
    $(document).ready(function() {
        // Initialize jenis_asset select for add modal
        if ($('#jenis_asset').length) {
            $('#jenis_asset').select2({
                theme: 'bootstrap-5',
                width: '100%',
                placeholder: 'Pilih Jenis Asset',
                allowClear: true,
                dropdownParent: $('#addAssetModal') // Ensure dropdown appears within modal
            });
        }
        
        // Initialize jenis_asset select for edit modal
        if ($('#edit_jenis_asset').length) {
            $('#edit_jenis_asset').select2({
                theme: 'bootstrap-5',
                width: '100%',
                placeholder: 'Pilih Jenis Asset',
                allowClear: true,
                dropdownParent: $('#editAssetModal') // Ensure dropdown appears within modal
            });
        }
        
        // Reinitialize Select2 when modals are shown to ensure proper positioning
        $('#addAssetModal').on('shown.bs.modal', function() {
            if ($('#jenis_asset').length) {
                $('#jenis_asset').select2({
                    theme: 'bootstrap-5',
                    width: '100%',
                    placeholder: 'Pilih Jenis Asset',
                    allowClear: true,
                    dropdownParent: $('#addAssetModal')
                });
            }
        });
        
        $('#editAssetModal').on('shown.bs.modal', function() {
            if ($('#edit_jenis_asset').length) {
                $('#edit_jenis_asset').select2({
                    theme: 'bootstrap-5',
                    width: '100%',
                    placeholder: 'Pilih Jenis Asset',
                    allowClear: true,
                    dropdownParent: $('#editAssetModal')
                });
            }
        });
    });

    // Add event listeners to price inputs for thousands separator formatting
    document.getElementById('harga').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if(value) {
            e.target.value = formatNumber(value);
        }
    });

    document.getElementById('edit_harga').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if(value) {
            e.target.value = formatNumber(value);
        }
    });

    // Update save button event for add modal
    document.getElementById('save-asset-btn').addEventListener('click', function() {
        document.getElementById('add-asset-form').dispatchEvent(new Event('submit'));
    });

    // Update save button event for edit modal
    document.getElementById('update-asset-btn').addEventListener('click', function() {
        document.getElementById('edit-asset-form').dispatchEvent(new Event('submit'));
    });
});

// Function to show toast notification
function showAssetToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container-asset');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-asset';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = 'asset-toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast rounded-3';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    // Determine toast header color based on type
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

    // Initialize and show the toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Remove toast element after it's hidden to keep DOM clean
    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });
}