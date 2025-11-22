// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();

    // Initialize Select2 when the page loads (for consistency with admin.html)
    if (typeof $ !== 'undefined') {
        $('.searchable-select').select2({
            theme: 'bootstrap-5',
            placeholder: 'Pilih opsi...',
            allowClear: true,
            width: '100%',
            dropdownParent: $(document.body) // Ensure dropdown appears correctly
        });
    }
});

// Function to load all dashboard data from APIs
async function loadDashboardData() {
    try {
        // Fetch asset data
        await fetchAssetData();

        // Fetch mustahik data
        await fetchMustahikData();

        // Fetch total data (saldo)
        await fetchTotalData();

        // Fetch payment fitrah data
        await fetchPaymentFitrahData();

        // Fetch monthly transactions data
        await fetchMonthlyTransactionsData();

        // Additional data that could be displayed (placeholder values)
        updateAdditionalStats();
        updateProgressBars();

        // Show success notification
        showNotification('Data dashboard berhasil dimuat!', 'success');

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Gagal memuat data dashboard', 'error');
    }
}

// Function to fetch asset data from api/beranda.asset
async function fetchAssetData() {
    try {
        const response = await fetch('/api/beranda.asset');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && data.data) {
            // Display asset count and total harga
            const totalActive = data.data.active_and_not_broken_count || 0;
            const totalHarga = data.data.total_harga || 0;
            document.getElementById('total-asset').textContent = `${totalActive} item(s), ${formatRupiah(totalHarga)}`;
        } else {
            console.error('Asset data response not as expected:', data);
            document.getElementById('total-asset').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching asset data:', error);
        document.getElementById('total-asset').textContent = 'Error';
    }
}

// Function to fetch mustahik data from api/beranda.mustahik
async function fetchMustahikData() {
    try {
        const response = await fetch('/api/beranda.mustahik');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && data.data && data.data.total_mustahik !== undefined) {
            // Display total mustahik count
            document.getElementById('total-mustahik').textContent = data.data.total_mustahik;
        } else {
            console.error('Mustahik data response not as expected:', data);
            document.getElementById('total-mustahik').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching mustahik data:', error);
        document.getElementById('total-mustahik').textContent = 'Error';
    }
}

// Function to fetch total data (saldo) from api/beranda.total
async function fetchTotalData() {
    try {
        const response = await fetch('/api/beranda.total');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            let kasFisikSaldo = 0;
            let rekeningBankSaldo = 0;

            data.data.forEach(account => {
                if (account.jenis_akun) {
                    const jenisAkunLower = account.jenis_akun.toLowerCase();
                    const saldo = parseFloat(account.total_saldo) || 0;

                    if (jenisAkunLower.includes('kas') || jenisAkunLower.includes('fisik')) {
                        kasFisikSaldo += saldo;
                    } else if (jenisAkunLower.includes('rekening') || jenisAkunLower.includes('bank')) {
                        rekeningBankSaldo += saldo;
                    }
                }
            });

            // Update the detailed breakdown cards (no main total card anymore)
            document.getElementById('total-kas').textContent = formatRupiah(kasFisikSaldo);
            document.getElementById('total-bank').textContent = formatRupiah(rekeningBankSaldo);
        } else {
            console.error('Total data response not as expected:', data);
            document.getElementById('total-kas').textContent = 'Error';
            document.getElementById('total-bank').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching total data:', error);
        document.getElementById('total-kas').textContent = 'Error';
        document.getElementById('total-bank').textContent = 'Error';
    }
}

// Function to fetch payment fitrah data from api/beranda.pembayaran-fitrah
async function fetchPaymentFitrahData() {
    try {
        const response = await fetch('/api/beranda.pembayaran-fitrah');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && data.data) {
            // Update the total fitrah field for the main card
            const totalUangFitrah = data.data.total_uang || 0;
            document.getElementById('total-fitrah').textContent = formatRupiah(totalUangFitrah);

            // Note: total-beras and total-uang elements no longer exist since the detail card was removed
            // If those elements are needed elsewhere, they would need to be added back to HTML
        } else {
            console.error('Payment fitrah data response not as expected:', data);
            document.getElementById('total-fitrah').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching payment fitrah data:', error);
        document.getElementById('total-fitrah').textContent = 'Error';
    }
}

// Function to fetch monthly transactions data from api/beranda.tx-bulan
async function fetchMonthlyTransactionsData() {
    try {
        const response = await fetch('/api/beranda.tx-bulan');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            // Aggregate monthly transactions by category
            let totalPenerimaan = 0;
            let totalPengeluaran = 0;

            // Process each transaction category to determine if it's income or expense
            for (const item of data.data) {
                const jenis_kategori = item.jenis_kategori;
                const total_subtotal = item.total_subtotal || 0;

                // Determine if this is income or expense based on the category
                // Common income category names
                const incomeCategories = ['pemasukan', 'penerimaan', 'zakat', 'infaq', 'sodakoh', 'shodaqoh', 'fitrah'];
                // Common expense category names
                const expenseCategories = ['pengeluaran', 'biaya', 'operasional', 'pembelian'];

                const lowerKategori = jenis_kategori.toLowerCase();

                if (incomeCategories.some(cat => lowerKategori.includes(cat))) {
                    totalPenerimaan += parseFloat(total_subtotal) || 0;
                } else if (expenseCategories.some(cat => lowerKategori.includes(cat))) {
                    totalPengeluaran += parseFloat(total_subtotal) || 0;
                } else {
                    // If it's not clearly income or expense, you can categorize based on your system
                    // For now, default to adding it to penerimaan (income)
                    totalPenerimaan += parseFloat(total_subtotal) || 0;
                }
            }

            document.getElementById('total-penerimaan').textContent = formatRupiah(totalPenerimaan);
            document.getElementById('total-pengeluaran').textContent = formatRupiah(totalPengeluaran);
        } else {
            console.error('Monthly transactions data response not as expected:', data);
            document.getElementById('total-penerimaan').textContent = 'Error';
            document.getElementById('total-pengeluaran').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching monthly transactions data:', error);
        document.getElementById('total-penerimaan').textContent = 'Error';
        document.getElementById('total-pengeluaran').textContent = 'Error';
    }
}

// Function to update additional statistics (placeholder data)
function updateAdditionalStats() {
    // In a real implementation, these would be fetched from actual API endpoints
    // For now, we'll use placeholder values or calculate from existing data
    document.getElementById('total-transaksi').textContent = '0';
    document.getElementById('total-zakat').textContent = '0';
    document.getElementById('total-infaq').textContent = '0';
}

// Function to update progress bars (placeholder data)
function updateProgressBars() {
    // In a real implementation, these would be calculated based on actual targets
    // For now, we'll use placeholder values
    document.getElementById('target-zakat-persen').textContent = '0%';
    document.getElementById('target-zakat-bar').style.width = '0%';
    document.getElementById('target-zakat-bar').setAttribute('aria-valuenow', '0');

    document.getElementById('distribusi-persen').textContent = '0%';
    document.getElementById('distribusi-bar').style.width = '0%';
    document.getElementById('distribusi-bar').setAttribute('aria-valuenow', '0');

    document.getElementById('mustahik-persen').textContent = '0%';
    document.getElementById('mustahik-bar').style.width = '0%';
    document.getElementById('mustahik-bar').setAttribute('aria-valuenow', '0');
}

// Function to format numbers as Rupiah (IDR)
function formatRupiah(angka) {
    if (angka === null || angka === undefined) return 'Rp 0';
    const number = parseFloat(angka);
    if (isNaN(number)) return 'Rp 0';

    // Convert to string and format with dots as thousand separators, with "Rp " prefix
    return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Function to show notification toast
function showNotification(message, type = 'success') {
    // Update the toast body text
    const toastBody = document.getElementById('toast-body');
    if (toastBody) {
        toastBody.textContent = message;
    }

    // Update toast header based on type
    const toastHeader = document.querySelector('#liveToast .toast-header');
    if (toastHeader) {
        if (type === 'success') {
            toastHeader.style.background = 'linear-gradient(180deg, #075E54 0%, #128C7E 100%)';
            const icon = toastHeader.querySelector('i');
            if (icon) icon.className = 'bi bi-check-circle me-2 text-white';
        } else {
            toastHeader.style.background = 'linear-gradient(180deg, #dc3545 0%, #c82333 100%)';
            const icon = toastHeader.querySelector('i');
            if (icon) icon.className = 'bi bi-x-circle me-2 text-white';
        }
    }

    // Initialize and show the toast
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
        // Create new bootstrap Toast instance to avoid conflicts
        const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
        toast.show();
    }
}