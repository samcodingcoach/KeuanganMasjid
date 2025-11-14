// Global variables to hold all transactions and filtered transactions
let allIncomeTransactions = [];
let filteredTransactions = [];

// Fetch data from the API endpoint
fetch('http://127.0.0.1:5002/api/transaksi.list')
    .then(response => response.json())
    .then(response => {
        if (response.success && response.data) {
            // Filter transactions to only show income transactions (kode_transaksi starting with 'FI')
            allIncomeTransactions = response.data.filter(transaction =>
                transaction.kode_transaksi && transaction.kode_transaksi.startsWith('FI')
            );

            // Initialize the table with all transactions
            filteredTransactions = allIncomeTransactions;
            renderTable();
        } else {
            console.error('API returned error:', response);
            document.querySelector('#transaction-table tbody').innerHTML = '<tr><td colspan="6" class="text-center py-3">No data available</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        document.querySelector('#transaction-table tbody').innerHTML = '<tr><td colspan="6" class="text-center py-3">Error loading data</td></tr>';
    });

// Function to render the table with filtered transactions
function renderTable() {
    const tbody = document.querySelector('#transaction-table tbody');
    let totalPenerimaan = 0;

    tbody.innerHTML = ''; // Clear the table

    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">Tidak ada data penerimaan</td></tr>';
        document.getElementById('total-penerimaan-td').textContent = 'Rp 0';
    } else {
        filteredTransactions.forEach((transaction, index) => {
            const row = document.createElement('tr');

            // Format the total with Indonesian currency format (using dots as thousands separator)
            const formattedTotal = 'Rp ' + (transaction.total || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

            // Add to total penerimaan
            totalPenerimaan += parseInt(transaction.total || 0);

            // Format the row with the required data
            const isClosed = transaction.isClose === 1 || transaction.isClose === true;
            const addButtonHtml = isClosed ? '' : `
                <button class="btn btn-sm btn-outline-whatsapp p-1 me-1" onclick="addIncomeDetail(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" style="border-radius: 8px; width: 36px; height: 36px;" title="Tambah Detail">
                    <i class="bi bi-plus"></i>
                </button>
            `;
            const finishButtonHtml = isClosed ? '' : `
                <button class="btn btn-sm btn-outline-success p-1" onclick="finishTransaction(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" style="border-radius: 8px; width: 36px; height: 36px;" title="Finish">
                    <i class="bi bi-check-lg"></i>
                </button>
            `;
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${transaction.kode_transaksi || '-'}</td>
                <td>${formatDate(transaction.tanggal_transaksi)}</td>
                <td>${transaction.nama_akun || '-'}</td>
                <td class="text-end">${formattedTotal}</td>
                <td>
                    ${addButtonHtml}
                    <button class="btn btn-sm btn-outline-whatsapp p-1 me-1" onclick="showDetail(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" style="border-radius: 8px; width: 36px; height: 36px;" title="Detail Transaksi">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${finishButtonHtml}
                </td>
            `;

            tbody.appendChild(row);
        });

        // Format total penerimaan and display it
        document.getElementById('total-penerimaan-td').textContent = 'Rp ' + totalPenerimaan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Update pagination info
    const totalEntries = filteredTransactions.length;
    document.querySelector('.text-muted strong:first-child').textContent = totalEntries > 0 ? '1' : '0';
    document.querySelector('.text-muted strong:nth-child(2)').textContent = totalEntries;
    document.querySelector('.text-muted strong:last-child').textContent = totalEntries;
}

// Function to filter transactions based on search and date filters
function filterTransactions() {
    // Get filter values
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const startDate = document.getElementById('start-date-filter').value;
    const endDate = document.getElementById('end-date-filter').value;

    // Filter transactions based on all criteria
    filteredTransactions = allIncomeTransactions.filter(transaction => {
        // Check search criteria - search in kode_transaksi
        const matchesSearch = !searchValue ||
            (transaction.kode_transaksi && transaction.kode_transaksi.toLowerCase().includes(searchValue));

        // Check date criteria
        let matchesDate = true;
        if (startDate || endDate) {
            // Convert transaction date to YYYY-MM-DD format for comparison
            const transactionDate = new Date(transaction.tanggal_transaksi);
            const transactionDateStr = transactionDate.toISOString().split('T')[0]; // YYYY-MM-DD

            if (startDate && transactionDateStr < startDate) {
                matchesDate = false;
            }
            if (endDate && transactionDateStr > endDate) {
                matchesDate = false;
            }
        }

        return matchesSearch && matchesDate;
    });

    // Render the filtered table
    renderTable();
}

// Add event listeners for the search and date filters
document.getElementById('search-button').addEventListener('click', filterTransactions);
document.getElementById('search-input').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        filterTransactions();
    }
});
document.getElementById('start-date-filter').addEventListener('change', filterTransactions);
document.getElementById('end-date-filter').addEventListener('change', filterTransactions);

function showDetail(transaction) {
    // Fill the info tab with transaction data
    document.getElementById('detail_kode_transaksi').textContent = transaction.kode_transaksi || '-';
    document.getElementById('detail_nama_akun').textContent = transaction.nama_akun || '-';
    document.getElementById('detail_nama_lengkap').textContent = transaction.nama_lengkap || '-';
    document.getElementById('detail_nama_muzakki').textContent = transaction.nama_muzakki || '-';
    document.getElementById('detail_tanggal_transaksi').textContent = formatDate(transaction.tanggal_transaksi);
    document.getElementById('detail_total').textContent = 'Rp ' + (transaction.total || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Fill the detail tab (table) with transaction details
    const detailTableBody = document.getElementById('detail_table_body');
    detailTableBody.innerHTML = ''; // Clear existing content

    // Check if the transaction has a 'details' property and populate the table
    if (transaction.details && Array.isArray(transaction.details) && transaction.details.length > 0) {
        transaction.details.forEach((detail, index) => {
            const row = document.createElement('tr');

            // Conditionally show edit button based on isClose status
            const isClosed = transaction.isClose === 1 || transaction.isClose === true;
            const editButtonHtml = isClosed ? '' : `
                <td>
                    <button class="btn btn-sm btn-outline-whatsapp p-1" onclick="editDetail(${JSON.stringify(detail).replace(/"/g, '&quot;')}, ${JSON.stringify(transaction).replace(/"/g, '&quot;')})" style="border-radius: 8px; width: 36px; height: 36px;">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;

            // Format the row with the requested fields
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div>${formatDate(detail.created_at)}</div>
                    <div class="text-muted small">Deskripsi: ${detail.deskripsi || '-'}</div>
                    <div class="text-muted small">${detail.jenis_kategori || '-'}</div>
                    <div class="text-muted small">${detail.nama_kategori || '-'}</div>
                </td>
                <td>${detail.jumlah || '-'}</td>
                <td>${detail.nominal ? 'Rp ' + detail.nominal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '-'}</td>
                <td>${detail.subtotal ? 'Rp ' + detail.subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '-'}</td>
                ${isClosed ? '<td></td>' : editButtonHtml}
            `;

            detailTableBody.appendChild(row);
        });
    } else {
        // If no details found, show a single row with "No data" message
        const row = document.createElement('tr');
        // Show empty cell for edit button column
        const isClosed = transaction.isClose === 1 || transaction.isClose === true;
        row.innerHTML = `
            <td colspan="6" class="text-center">Tidak ada detail transaksi</td>
        `;
        detailTableBody.appendChild(row);
    }

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

// Function to edit transaction detail
function editDetail(detail, transaction) {
    // Fill the edit modal with current detail data
    document.getElementById('edit_detail_id').value = detail.id_detail;
    document.getElementById('edit_transaction_id').value = detail.id_transaksi;
    document.getElementById('edit_keterangan').value = detail.deskripsi || '';
    document.getElementById('edit_jumlah').value = formatNumber(detail.jumlah || '');
    document.getElementById('edit_nominal').value = formatNumber(detail.nominal || '');
    document.getElementById('edit_subtotal').value = formatNumber(detail.subtotal || '');
    document.getElementById('edit_is_asset').value = detail.isAsset ? '1' : '0';

    // Load categories for the dropdown
    loadEditCategories(detail.id_kategori);

    // Show the edit modal
    const modal = new bootstrap.Modal(document.getElementById('editDetailModal'));
    modal.show();
}

// Function to load categories for edit modal and select the current category
function loadEditCategories(currentCategoryId) {
    fetch('http://127.0.0.1:5002/api/kategori.list')
        .then(response => response.json())
        .then(response => {
            if (response.success && response.data) {
                const selectElement = document.getElementById('edit_kategori_penerimaan');
                selectElement.innerHTML = '<option value="">Pilih Kategori Penerimaan</option>'; // Clear existing options

                response.data.forEach(category => {
                    if (category.jenis_kategori === 'Penerimaan') { // Only show income categories
                        const option = document.createElement('option');
                        option.value = category.id_kategori;
                        option.text = category.nama_kategori;
                        if (category.id_kategori == currentCategoryId) {
                            option.selected = true;
                        }
                        selectElement.appendChild(option);
                    }
                });

                // Initialize Select2 for editable category dropdown
                setTimeout(function() {
                    if ($('#edit_kategori_penerimaan').data('select2')) {
                        $('#edit_kategori_penerimaan').select2('destroy');
                    }
                    $('#edit_kategori_penerimaan').select2({
                        theme: 'bootstrap-5',
                        placeholder: 'Pilih Kategori Penerimaan',
                        allowClear: true,
                        width: '100%',
                        dropdownParent: $('#editDetailModal')
                    });
                }, 100);
            } else {
                console.error('API kategori.list returned error:', response);
            }
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
        });
}

// Function to format currency in Indonesian style
function formatCurrency(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Function to format date in 'Day Month Year, Time WITA' format
function formatDate(dateString) {
    if (!dateString) return '-';

    // Parse the date string - handle both 'T' format and space format
    let date;
    if (typeof dateString === 'string') {
        // Replace space with 'T' to handle 'YYYY-MM-DD HH:mm:ss' format properly
        if (dateString.includes(' ')) {
            dateString = dateString.replace(' ', 'T');
        }
        date = new Date(dateString);
    } else {
        date = dateString;
    }

    // Array of month names in Indonesian
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Get date components
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Format as 'Day Month Year, Time WITA'
    return `${day} ${month} ${year}, ${hours}:${minutes} WITA`;
}

// Function to generate kode transaksi in format FIXXX-YYMMDD
function generateKodeTransaksi(transactions, selectedDate = null) {
    if (!selectedDate) {
        selectedDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    }

    // Extract date components for YYMMDD part
    var dateObj;
    if (selectedDate instanceof Date) {
        dateObj = selectedDate;
    } else if (typeof selectedDate === 'string' && selectedDate.includes('T')) {
        // Handle datetime string (YYYY-MM-DDTHH:mm format)
        const datePart = selectedDate.split('T')[0];
        dateObj = new Date(datePart);
    } else {
        // Handle date string (YYYY-MM-DD format)
        dateObj = new Date(selectedDate);
    }
    
    const year = String(dateObj.getFullYear()).slice(2); // Get last 2 digits of year
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(dateObj.getDate()).padStart(2, '0');

    const datePart = `${year}${month}${day}`;
    const prefix = 'FI'; // Fixed prefix for income transactions

    // Filter transactions for the same date
    const todayTransactions = transactions.filter(transaction => {
        if (!transaction.tanggal_transaksi) return false;
        
        // Handle datetime string from transaction data (may be in 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD HH:mm:ss' format)
        let transactionDateString = transaction.tanggal_transaksi;
        if (transactionDateString && transactionDateString.includes('T')) {
            // Datetime format with 'T' (e.g., '2025-11-12T14:30')
            transactionDateString = transactionDateString.split('T')[0];
        } else if (transactionDateString && transactionDateString.includes(' ')) {
            // Datetime format with space (e.g., '2025-11-12 14:30:00')
            transactionDateString = transactionDateString.split(' ')[0];
        }
        
        const transactionDate = new Date(transactionDateString);
        const transYear = String(transactionDate.getFullYear()).slice(2);
        const transMonth = String(transactionDate.getMonth() + 1).toString().padStart(2, '0');
        const transDay = String(transactionDate.getDate()).toString().padStart(2, '0');
        const transactionDatePart = `${transYear}${transMonth}${transDay}`;
        return transactionDatePart === datePart && transaction.kode_transaksi.startsWith(prefix);
    });

    // Find the highest number used today
    let maxNumber = 0;
    todayTransactions.forEach(transaction => {
        const match = transaction.kode_transaksi.match(/^FI(\d{3})-\d{6}$/);
        if (match) {
            const number = parseInt(match[1]);
            if (number > maxNumber) {
                maxNumber = number;
            }
        }
    });

    // Generate the next number (increment by 1)
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');

    return `${prefix}${nextNumber}-${datePart}`;
}

// Function to validate date (prevent selecting future dates)
function validateDateInput() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to start of day for comparison

    const dateInput = document.getElementById('tanggal_transaksi');
    const selectedDateStr = dateInput.value;
    const selectedDate = new Date(selectedDateStr);
    selectedDate.setHours(0, 0, 0, 0); // Set time to start of day for comparison

    if (selectedDate > today) {
        alert('Tanggal transaksi tidak boleh di masa depan');
        // Set to today's date
        const todayFormatted = today.toISOString().split('T')[0];
        dateInput.value = todayFormatted;
    }

    // Generate new kode_transaksi when date changes
    if (allIncomeTransactions) {
        const newKode = generateKodeTransaksi(allIncomeTransactions, selectedDateStr);
        document.getElementById('kode_transaksi').value = newKode;
    }
}

// Event listener for modal opening to auto-generate kode_transaksi
document.getElementById('addTransactionModal').addEventListener('shown.bs.modal', function() {
    // Set default date and time to now
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().substring(0, 5); // HH:MM

    document.getElementById('tanggal_transaksi').value = dateStr;
    document.getElementById('waktu_transaksi').value = timeStr;

    // Generate kode transaksi based on today's date
    const newKode = generateKodeTransaksi(allIncomeTransactions || [], dateStr);
    document.getElementById('kode_transaksi').value = newKode;

    // Load accounts and muzakki when modal opens to ensure data is fresh
    loadAccounts();
    loadMuzakki();

    // Initialize Select2 for searchable dropdowns when modal is shown
    // Use a slight delay to ensure data is loaded before initializing
    setTimeout(function() {
        $('.searchable-select').each(function() {
            if (!$(this).data('select2')) {
                $(this).select2({
                    theme: 'bootstrap-5',
                    placeholder: $(this).data('placeholder'),
                    allowClear: true,
                    width: '100%',
                    dropdownParent: $('#addTransactionModal')
                });
            }
        });
    }, 100); // Small delay to ensure data is loaded before initializing
});

// Event listener for date input change
document.getElementById('tanggal_transaksi').addEventListener('change', validateDateInput);

// Set max date to today to prevent future date selection in the date picker
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format YYYY-MM-DD for date input
    document.getElementById('tanggal_transaksi').setAttribute('max', todayString);
});

// Function to load accounts from API and populate dropdown
function loadAccounts() {
    fetch('http://127.0.0.1:5002/api/akun.list')
        .then(response => response.json())
        .then(response => {
            if (response.success && response.data) {
                const selectElement = document.getElementById('nama_akun');
                selectElement.innerHTML = '<option value="">Pilih Nama Akun</option>'; // Clear existing options

                response.data.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.id_akun;
                    option.text = account.nama_akun;
                    selectElement.appendChild(option);
                });

                // Refresh Select2 to reflect the new options
                // Only initialize or refresh if modal is currently shown
                if ($('#addTransactionModal').hasClass('show')) {
                    if ($('#nama_akun').data('select2')) {
                        $('#nama_akun').select2('destroy').select2({
                            theme: 'bootstrap-5',
                            placeholder: 'Pilih Nama Akun',
                            allowClear: true,
                            width: '100%',
                            dropdownParent: $('#addTransactionModal')
                        });
                    } else {
                        // Initialize Select2 if not already done
                        $('#nama_akun').select2({
                            theme: 'bootstrap-5',
                            placeholder: 'Pilih Nama Akun',
                            allowClear: true,
                            width: '100%',
                            dropdownParent: $('#addTransactionModal')
                        });
                    }
                }
            } else {
                console.error('API akun.list returned error:', response);
            }
        })
        .catch(error => {
            console.error('Error fetching accounts:', error);
        });
}

// Function to load muzakki from API and populate dropdown
function loadMuzakki() {
    fetch('http://127.0.0.1:5002/api/muzakki.list')
        .then(response => response.json())
        .then(response => {
            if (response.success && response.data) {
                const selectElement = document.getElementById('nama_muzakki');
                selectElement.innerHTML = '<option value="">Pilih Nama Muzakki</option>'; // Clear existing options

                response.data.forEach(muzakki => {
                    const option = document.createElement('option');
                    option.value = muzakki.id_muzakki;
                    option.text = muzakki.nama_lengkap + ' [' + muzakki.kategori + ']';
                    selectElement.appendChild(option);
                });

                // Refresh Select2 to reflect the new options
                // Only initialize or refresh if modal is currently shown
                if ($('#addTransactionModal').hasClass('show')) {
                    if ($('#nama_muzakki').data('select2')) {
                        $('#nama_muzakki').select2('destroy').select2({
                            theme: 'bootstrap-5',
                            placeholder: 'Pilih Nama Muzakki',
                            allowClear: true,
                            width: '100%',
                            dropdownParent: $('#addTransactionModal')
                        });
                    } else {
                        // Initialize Select2 if not already done
                        $('#nama_muzakki').select2({
                            theme: 'bootstrap-5',
                            placeholder: 'Pilih Nama Muzakki',
                            allowClear: true,
                            width: '100%',
                            dropdownParent: $('#addTransactionModal')
                        });
                    }
                }
            } else {
                console.error('API muzakki.list returned error:', response);
            }
        })
        .catch(error => {
            console.error('Error fetching muzakki:', error);
        });
}

// Load muzakki when DOM is ready (accounts are loaded when modal is opened)
document.addEventListener('DOMContentLoaded', function() {
    loadMuzakki();
});

// Function to finish a transaction
function finishTransaction(transaction) {
    // Display the confirmation modal
    document.getElementById('transaction-kode-display').textContent = transaction.kode_transaksi;

    // Store the transaction data in a global variable for use in the confirmation
    window.currentFinishTransaction = transaction;

    // Show the confirmation modal
    const modal = new bootstrap.Modal(document.getElementById('confirmFinishModal'));
    modal.show();
}

// Event listener for the confirm finish button
document.getElementById('confirm-finish-btn').addEventListener('click', function() {
    const transaction = window.currentFinishTransaction;

    if (transaction) {
        // Call the API to finish the transaction
        fetch('http://127.0.0.1:5002/api/transaksi.close', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_transaksi: transaction.id_transaksi
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showTransactionToast('Transaksi berhasil diselesaikan');
                // Refresh the transaction list
                fetch('http://127.0.0.1:5002/api/transaksi.list')
                    .then(response => response.json())
                    .then(response => {
                        if (response.success && response.data) {
                            // Filter transactions to only show income transactions (kode_transaksi starting with 'FI')
                            allIncomeTransactions = response.data.filter(transaction =>
                                transaction.kode_transaksi && transaction.kode_transaksi.startsWith('FI')
                            );
                            filteredTransactions = allIncomeTransactions;
                            renderTable();
                        }
                    })
                    .catch(error => {
                        console.error('Error refreshing data:', error);
                    });
            } else {
                showTransactionToast('Gagal menyelesaikan transaksi: ' + (data.message || data.error), 'error');
            }
        })
        .catch(error => {
            console.error('Error finishing transaction:', error);
            showTransactionToast('Terjadi kesalahan saat menyelesaikan transaksi', 'error');
        });

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmFinishModal'));
        if (modal) {
            modal.hide();
        }
    }
});

// Function to show toast notification for transactions
function showTransactionToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container-transaction');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container-transaction';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1100';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'transaction-toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = 'toast rounded-3';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

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

    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', function() {
        toastEl.remove();
    });
}

// Function to open the add income detail modal
function addIncomeDetail(transaction) {
    // Set the transaction ID in the hidden input
    document.getElementById('selected_transaction_id').value = transaction.id_transaksi;

    // Load categories when modal opens
    loadCategories();

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('addIncomeDetailModal'));
    modal.show();
}

// Function to load categories from API and populate dropdown
function loadCategories() {
    fetch('http://127.0.0.1:5002/api/kategori.list')
        .then(response => response.json())
        .then(response => {
            if (response.success && response.data) {
                const selectElement = document.getElementById('kategori_penerimaan');
                selectElement.innerHTML = '<option value="">Pilih Kategori Penerimaan</option>'; // Clear existing options

                response.data.forEach(category => {
                    if (category.jenis_kategori === 'Penerimaan') { // Only show income categories
                        const option = document.createElement('option');
                        option.value = category.id_kategori;
                        option.text = category.nama_kategori;
                        selectElement.appendChild(option);
                    }
                });
            } else {
                console.error('API kategori.list returned error:', response);
            }
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
        });
}

// Function to calculate subtotal (jumlah * nominal)
function calculateSubtotal() {
    const jumlah = parseFloat(unformatNumber(document.getElementById('jumlah').value)) || 0;
    const nominal = parseFloat(unformatNumber(document.getElementById('nominal').value)) || 0;
    const subtotal = jumlah * nominal;
    document.getElementById('subtotal').value = formatNumber(subtotal);
}

// Function to calculate edit subtotal (jumlah * nominal)
function calculateEditSubtotal() {
    const jumlah = parseFloat(unformatNumber(document.getElementById('edit_jumlah').value)) || 0;
    const nominal = parseFloat(unformatNumber(document.getElementById('edit_nominal').value)) || 0;
    const subtotal = jumlah * nominal;
    document.getElementById('edit_subtotal').value = formatNumber(subtotal);
}

// Event listener for modal opening to initialize fields
document.getElementById('addIncomeDetailModal').addEventListener('shown.bs.modal', function() {
    // Clear form fields when modal opens
    document.getElementById('keterangan').value = '';
    document.getElementById('jumlah').value = '1';
    document.getElementById('nominal').value = '';
    document.getElementById('subtotal').value = '';
    document.getElementById('is_asset').checked = false;
    document.getElementById('bukti').value = '';

    // Format the jumlah field with thousand separator
    document.getElementById('jumlah').value = formatNumber('1');

    // Remove any existing event listeners
    document.getElementById('jumlah').removeEventListener('input', calculateSubtotal);
    document.getElementById('nominal').removeEventListener('input', calculateSubtotal);

    // Add event listeners for calculating subtotal
    document.getElementById('jumlah').addEventListener('input', calculateSubtotal);
    document.getElementById('nominal').addEventListener('input', calculateSubtotal);

    // Initialize numeric formatting for all numeric inputs
    handleNumericInput('jumlah');
    handleNumericInput('nominal');

    // Add event listener for nominal to update subtotal when value changes
    document.getElementById('nominal').addEventListener('input', function(e) {
        // Format the input as the user types
        let value = e.target.value;
        value = value.replace(/[^\d]/g, '');
        e.target.value = formatNumber(value);

        // Then calculate the subtotal
        calculateSubtotal();
    });

    // Add event listener for jumlah to update subtotal when value changes
    document.getElementById('jumlah').addEventListener('input', function(e) {
        // Format the input as the user types
        let value = e.target.value;
        value = value.replace(/[^\d]/g, '');
        e.target.value = formatNumber(value);

        // Then calculate the subtotal
        calculateSubtotal();
    });

    // Initialize Select2 for searchable dropdowns when modal is shown
    setTimeout(function() {
        $('#kategori_penerimaan').select2({
            theme: 'bootstrap-5',
            placeholder: 'Pilih Kategori Penerimaan',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#addIncomeDetailModal')
        });
    }, 100);
});

// Event listener for edit modal opening to initialize fields
document.getElementById('editDetailModal').addEventListener('shown.bs.modal', function() {
    // Remove any existing event listeners from previous modal instances
    document.getElementById('edit_jumlah').removeEventListener('input', calculateEditSubtotal);
    document.getElementById('edit_nominal').removeEventListener('input', calculateEditSubtotal);

    // Add event listeners for calculating subtotal for edit modal
    document.getElementById('edit_jumlah').addEventListener('input', calculateEditSubtotal);
    document.getElementById('edit_nominal').addEventListener('input', calculateEditSubtotal);

    // Initialize numeric formatting for all numeric inputs in edit modal
    handleNumericInput('edit_jumlah');
    handleNumericInput('edit_nominal');

    // Add event listener for edit nominal to update subtotal when value changes
    document.getElementById('edit_nominal').addEventListener('input', function(e) {
        // Format the input as the user types
        let value = e.target.value;
        value = value.replace(/[^\d]/g, '');
        e.target.value = formatNumber(value);

        // Then calculate the subtotal
        calculateEditSubtotal();
    });

    // Add event listener for edit jumlah to update subtotal when value changes
    document.getElementById('edit_jumlah').addEventListener('input', function(e) {
        // Format the input as the user types
        let value = e.target.value;
        value = value.replace(/[^\d]/g, '');
        e.target.value = formatNumber(value);

        // Then calculate the subtotal
        calculateEditSubtotal();
    });

    // Initialize Select2 for searchable dropdowns when modal is shown
    setTimeout(function() {
        if ($('#edit_kategori_penerimaan').data('select2')) {
            $('#edit_kategori_penerimaan').select2('destroy');
        }
        $('#edit_kategori_penerimaan').select2({
            theme: 'bootstrap-5',
            placeholder: 'Pilih Kategori Penerimaan',
            allowClear: true,
            width: '100%',
            dropdownParent: $('#editDetailModal')
        });
    }, 100);
});

// Function to format number with thousand separator
function formatNumber(num) {
    // Remove any existing formatting
    const number = parseFloat(num.toString().replace(/[^\d]/g, ''));
    if (isNaN(number)) return '';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Function to unformat number (remove thousand separators)
function unformatNumber(str) {
    return str.toString().replace(/[^\d]/g, '');
}

// Function to handle numeric input formatting
function handleNumericInput(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // Remove thousand separators when user types
    input.addEventListener('input', function(e) {
        let value = e.target.value;
        // Keep only numbers and remove formatting temporarily
        value = value.replace(/[^\d]/g, '');
        e.target.value = value;
    });

    // Add thousand separators when focus is lost
    input.addEventListener('blur', function(e) {
        let value = e.target.value;
        if (value !== '') {
            const unformatted = unformatNumber(value);
            e.target.value = formatNumber(unformatted);
        }
    });

    // Ensure only numbers can be entered
    input.addEventListener('keypress', function(e) {
        // Allow: backspace, delete, tab, escape, enter, and decimal point
        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
}

// Function to save new income detail
document.getElementById('save-income-detail-btn').addEventListener('click', async function() {
    // Get form values and unformat numeric fields
    const id_transaksi = document.getElementById('selected_transaction_id').value;
    const keterangan = document.getElementById('keterangan').value;
    const id_kategori = document.getElementById('kategori_penerimaan').value;
    const jumlah = unformatNumber(document.getElementById('jumlah').value);
    const nominal = unformatNumber(document.getElementById('nominal').value);
    const is_asset = document.getElementById('is_asset').checked;
    const subtotal = unformatNumber(document.getElementById('subtotal').value);
    const bukti = document.getElementById('bukti').files[0];  // File object

    // Validate required fields
    if (!id_transaksi || !keterangan || !id_kategori || !jumlah || !nominal) {
        showTransactionToast('Harap lengkapi semua data yang diperlukan', 'error');
        return;
    }

    let url_bukti = null;

    if (bukti) {
        const formData = new FormData();
        const transaction = allIncomeTransactions.find(t => t.id_transaksi == id_transaksi);
        if (!transaction) {
            showTransactionToast('Transaksi tidak ditemukan', 'error');
            return;
        }
        const newFileName = `${Date.now()}_${transaction.kode_transaksi}.${bukti.name.split('.').pop()}`;
        formData.append('file', bukti, newFileName);
        formData.append('filename', newFileName); // Send the generated filename to the backend

        try {
            const uploadResponse = await fetch('/api/transaksi.upload', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (uploadResult.success) {
                url_bukti = uploadResult.url;
            } else {
                showTransactionToast(`Gagal mengunggah bukti: ${uploadResult.message}`, 'error');
                return;
            }
        } catch (error) {
            showTransactionToast(`Terjadi kesalahan saat mengunggah file: ${error.message}`, 'error');
            return;
        }
    }

    // Prepare data for API request
    const requestData = {
        id_transaksi: parseInt(id_transaksi),
        deskripsi: keterangan,
        id_kategori: parseInt(id_kategori),
        jumlah: parseFloat(jumlah),
        nominal: parseFloat(nominal),
        isAsset: is_asset,  // Boolean value
        subtotal: parseFloat(subtotal),
        url_bukti: url_bukti
    };

    // Call the API to save the income detail
    fetch('http://127.0.0.1:5002/api/transaksi.createdetail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showTransactionToast('Detail penerimaan berhasil disimpan');

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addIncomeDetailModal'));
            modal.hide();

            // Refresh the transaction list to show updated totals
            fetch('http://127.0.0.1:5002/api/transaksi.list')
                .then(response => response.json())
                .then(response => {
                    if (response.success && response.data) {
                        // Filter transactions to only show income transactions (kode_transaksi starting with 'FI')
                        allIncomeTransactions = response.data.filter(transaction =>
                            transaction.kode_transaksi && transaction.kode_transaksi.startsWith('FI')
                        );

                        // Update the filtered transactions and re-render the table
                        filteredTransactions = allIncomeTransactions;
                        renderTable();
                    }
                })
                .catch(error => {
                    console.error('Error refreshing data:', error);
                });
        } else {
            showTransactionToast('Gagal menyimpan detail penerimaan: ' + (data.message || data.error), 'error');
        }
    })
    .catch(error => {
        console.error('Error saving income detail:', error);
        showTransactionToast('Terjadi kesalahan saat menyimpan detail penerimaan', 'error');
    });
});

// Event listener for the save edit button
document.getElementById('save-edit-detail-btn').addEventListener('click', async function() {
    // Get form values and unformat numeric fields
    const id_detail = document.getElementById('edit_detail_id').value;
    const id_transaksi = document.getElementById('edit_transaction_id').value;
    const keterangan = document.getElementById('edit_keterangan').value;
    const id_kategori = document.getElementById('edit_kategori_penerimaan').value;
    const jumlah = unformatNumber(document.getElementById('edit_jumlah').value);
    const nominal = unformatNumber(document.getElementById('edit_nominal').value);
    const is_asset = document.getElementById('edit_is_asset').value === '1' ? true : false;
    const subtotal = unformatNumber(document.getElementById('edit_subtotal').value);

    // Validate required fields
    if (!id_detail || !id_transaksi || !keterangan || !id_kategori || !jumlah || !nominal) {
        showTransactionToast('Harap lengkapi semua data yang diperlukan', 'error');
        return;
    }

    // Prepare data for API request
    const requestData = {
        id_detail: parseInt(id_detail),
        deskripsi: keterangan,
        id_kategori: parseInt(id_kategori),
        jumlah: parseFloat(jumlah),
        nominal: parseFloat(nominal),
        isAsset: is_asset,  // Boolean value
        subtotal: parseFloat(subtotal)
    };

    // Call the API to update the income detail
    fetch('http://127.0.0.1:5002/api/transaksi.updatedetail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showTransactionToast('Detail penerimaan berhasil diperbarui');

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editDetailModal'));
            modal.hide();

            // Update the main transaction list to reflect the changes
            fetch('http://127.0.0.1:5002/api/transaksi.list')
                .then(response => response.json())
                .then(response => {
                    if (response.success && response.data) {
                        // Filter transactions to only show income transactions (kode_transaksi starting with 'FI')
                        allIncomeTransactions = response.data.filter(transaction =>
                            transaction.kode_transaksi && transaction.kode_transaksi.startsWith('FI')
                        );

                        // Update the filtered transactions and re-render the table
                        filteredTransactions = allIncomeTransactions;
                        renderTable();

                        // Find the updated transaction and refresh the detail modal to show changes
                        const currentTransactionId = document.getElementById('edit_transaction_id').value;
                        const updatedTransaction = allIncomeTransactions.find(t => t.id_transaksi == currentTransactionId);

                        if (updatedTransaction) {
                            // Re-show the detail modal to reflect the changes
                            showDetail(updatedTransaction);

                            // Switch to the detail tab after showing the modal
                            setTimeout(() => {
                                const detailTabElement = document.querySelector('#detail-detail-tab');
                                if (detailTabElement) {
                                    // Create a bootstrap tab instance and show it
                                    const detailTab = new bootstrap.Tab(detailTabElement);
                                    detailTab.show();
                                }
                            }, 100); // Small delay to ensure modal is fully loaded
                        }
                    }
                })
                .catch(error => {
                    console.error('Error refreshing data:', error);
                });
        } else {
            showTransactionToast('Gagal memperbarui detail penerimaan: ' + (data.message || data.error), 'error');
        }
    })
    .catch(error => {
        console.error('Error updating income detail:', error);
        showTransactionToast('Terjadi kesalahan saat memperbarui detail penerimaan', 'error');
    });
});

// Function to save new transaction
document.getElementById('save-transaction-btn').addEventListener('click', function() {
    // Get user data from sessionStorage
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData || !userData.id_pegawai) {
        showTransactionToast('Silakan login terlebih dahulu', 'error');
        window.location.href = '/login';
        return;
    }

    // Get form values
    const tanggal_transaksi_input = document.getElementById('tanggal_transaksi').value; // YYYY-MM-DD
    const waktu_transaksi = document.getElementById('waktu_transaksi').value; // HH:MM
    // Combine date and time in YYYY-MM-DD HH:MM:SS format for the API
    const tanggal_transaksi = tanggal_transaksi_input + ' ' + waktu_transaksi + ':00';
    const id_akun = document.getElementById('nama_akun').value;
    const id_muzakki = document.getElementById('nama_muzakki').value;
    const kode_transaksi = document.getElementById('kode_transaksi').value;

    // Validate required fields
    if (!tanggal_transaksi || !id_akun || !id_muzakki || !kode_transaksi) {
        showTransactionToast('Harap lengkapi semua data yang diperlukan', 'error');
        return;
    }

    // Prepare data for API request
    const requestData = {
        tanggal_transaksi: tanggal_transaksi,
        id_akun: id_akun,
        id_pegawai: userData.id_pegawai,  // Get from session
        kode_transaksi: kode_transaksi,
        id_muzakki: id_muzakki,
        total: 0,  // Set to 0 as specified
        id_mustahik: null  // Set to NULL as specified
    };

    // Call the API to save the transaction
    fetch('http://127.0.0.1:5002/api/transaksi.create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showTransactionToast('Transaksi berhasil disimpan');

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
            modal.hide();

            // Refresh the transaction list
            fetch('http://127.0.0.1:5002/api/transaksi.list')
                .then(response => response.json())
                .then(response => {
                    if (response.success && response.data) {
                        // Filter transactions to only show income transactions (kode_transaksi starting with 'FI')
                        allIncomeTransactions = response.data.filter(transaction =>
                            transaction.kode_transaksi && transaction.kode_transaksi.startsWith('FI')
                        );

                        // Update the filtered transactions and re-render the table
                        filteredTransactions = allIncomeTransactions;
                        renderTable();

                        // Generate new kode transaksi for next transaction
                        const newKode = generateKodeTransaksi(allIncomeTransactions);
                        document.getElementById('kode_transaksi').value = newKode;
                    }
                })
                .catch(error => {
                    console.error('Error refreshing data:', error);
                });
        } else {
            showTransactionToast('Gagal menyimpan transaksi: ' + (data.message || data.error), 'error');
        }
    })
    .catch(error => {
        console.error('Error saving transaction:', error);
        showTransactionToast('Terjadi kesalahan saat menyimpan transaksi', 'error');
    });
});