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
        // Fetch all required data
        await Promise.all([
            fetchAssetData(),
            fetchMustahikData(),
            fetchTotalData(),
            fetchPaymentFitrahData(),
            fetchMonthlyTransactionsData()
        ]);

        // Calculate and update additional statistics
        calculateAdditionalStats();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
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
            // Display asset count and total harga separately
            const totalActive = data.data.active_and_not_broken_count || 0;
            const totalHarga = data.data.total_harga || 0;

            document.getElementById('total-asset-amount').textContent = formatRupiah(totalHarga);
            document.getElementById('total-asset-count').textContent = `${totalActive} Items`;
        } else {
            console.error('Asset data response not as expected:', data);
            document.getElementById('total-asset-amount').textContent = 'Error';
            document.getElementById('total-asset-count').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching asset data:', error);
        document.getElementById('total-asset-amount').textContent = 'Error';
        document.getElementById('total-asset-count').textContent = 'Error';
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

            // Update the detailed breakdown cards
            document.getElementById('total-kas').textContent = formatRupiah(kasFisikSaldo);
            document.getElementById('total-bank').textContent = formatRupiah(rekeningBankSaldo);

            // Calculate and show combined total
            const totalCombined = kasFisikSaldo + rekeningBankSaldo;
            document.getElementById('total-saldo-combined').textContent = formatRupiah(totalCombined);
        } else {
            console.error('Total data response not as expected:', data);
            document.getElementById('total-kas').textContent = 'Error';
            document.getElementById('total-bank').textContent = 'Error';
            document.getElementById('total-saldo-combined').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching total data:', error);
        document.getElementById('total-kas').textContent = 'Error';
        document.getElementById('total-bank').textContent = 'Error';
        document.getElementById('total-saldo-combined').textContent = 'Error';
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
            // Update the total fitrah field for the main card - combining both berat (weight) and uang (money)
            const totalBerat = data.data.total_berat || 0;
            const totalUang = data.data.total_uang || 0;

            // Update the separate elements for money and weight
            document.getElementById('total-fitrah').textContent = formatRupiah(totalUang);
            const weightElement = document.querySelector('#total-fitrah ~ p.text-muted');
            if (weightElement) {
                weightElement.textContent = `${totalBerat} kg beras`;
            }
        } else {
            console.error('Payment fitrah data response not as expected:', data);
            document.getElementById('total-fitrah').textContent = 'Error';
            const weightElement = document.querySelector('#total-fitrah ~ p.text-muted');
            if (weightElement) {
                weightElement.textContent = '0 kg beras';
            }
        }
    } catch (error) {
        console.error('Error fetching payment fitrah data:', error);
        document.getElementById('total-fitrah').textContent = 'Error';
        const weightElement = document.querySelector('#total-fitrah ~ p.text-muted');
        if (weightElement) {
            weightElement.textContent = '0 kg beras';
        }
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

// Function to calculate and update additional statistics
function calculateAdditionalStats() {
    // Calculate values for additional dashboard elements
    const penerimaan = parseFloat(document.getElementById('total-penerimaan').textContent.replace(/[Rp. ]/g, '')) || 0;
    const pengeluaran = parseFloat(document.getElementById('total-pengeluaran').textContent.replace(/[Rp. ]/g, '')) || 0;
    const kas = parseFloat(document.getElementById('total-kas').textContent.replace(/[Rp. ]/g, '')) || 0;
    const bank = parseFloat(document.getElementById('total-bank').textContent.replace(/[Rp. ]/g, '')) || 0;

    // Net balance calculation
    const netBalance = penerimaan - pengeluaran;
    document.getElementById('net-balance').textContent = formatRupiah(netBalance);

    // Calculate progress for balance (based on max of penerimaan and pengeluaran)
    const maxAmount = Math.max(penerimaan, pengeluaran, 1); // Avoid division by zero
    const progressPercentage = (Math.abs(netBalance) / maxAmount) * 100;
    document.getElementById('balance-progress').style.width = Math.min(progressPercentage, 100) + '%';
    document.getElementById('balance-progress').setAttribute('aria-valuenow', Math.min(progressPercentage, 100));

    // Update color based on net balance
    const balanceProgress = document.getElementById('balance-progress');
    if (netBalance >= 0) {
        balanceProgress.className = 'progress-bar bg-success';
    } else {
        balanceProgress.className = 'progress-bar bg-danger';
    }

    // Update monthly stats
    document.getElementById('monthly-income').textContent = formatRupiah(penerimaan);
    document.getElementById('monthly-expenses').textContent = formatRupiah(pengeluaran);

    // Calculate savings ratio (if penerimaan > 0)
    const savingsRatio = penerimaan > 0 ? Math.round((netBalance / penerimaan) * 100) : 0;
    document.getElementById('savings-ratio').textContent = savingsRatio + '%';

    // Create finance chart
    createFinanceChart(penerimaan, pengeluaran);
}

// Function to create the finance chart
function createFinanceChart(penerimaan, pengeluaran) {
    const ctx = document.getElementById('financeChart').getContext('2d');

    // Destroy existing chart if it exists to avoid duplication
    if (window.financeChartInstance) {
        window.financeChartInstance.destroy();
    }

    // Create new chart
    window.financeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                label: 'Jumlah (Rp)',
                data: [penerimaan, pengeluaran],
                backgroundColor: [
                    'rgba(37, 211, 102, 0.7)', // WhatsApp green for income
                    'rgba(220, 53, 69, 0.7)'    // Danger red for expenses
                ],
                borderColor: [
                    'rgba(37, 211, 102, 1)',
                    'rgba(220, 53, 69, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Perbandingan Pemasukan vs Pengeluaran'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
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