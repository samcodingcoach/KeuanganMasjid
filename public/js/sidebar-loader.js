// Function to load the sidebar component into the page
async function loadSidebar() {
    try {
        const response = await fetch('/components/sidebar.html');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let sidebarHtml = await response.text();

        // Fetch mosque name from API
        try {
            const masjidResponse = await fetch('/api/masjid.list');
            if (masjidResponse.ok) {
                const masjidData = await masjidResponse.json();
                if (masjidData.success && masjidData.data && masjidData.data.length > 0) {
                    // Get the first mosque name (trying different possible field names)
                    const mosque = masjidData.data[0];
                    const mosqueName = mosque.nama_mesjid || mosque.nama_masjid || 'Masjid';
                    // Replace all occurrences of "Masjid App" with just the mosque name
                    sidebarHtml = sidebarHtml.replace(/Masjid App/g, mosqueName);
                }
            }
        } catch (apiError) {
            console.error('Error fetching mosque data:', apiError);
            // If API call fails, we'll still load the sidebar with the original text
        }

        // Insert the sidebar HTML into the element with id "sidebar-container"
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = sidebarHtml;

            // After inserting the sidebar, update user profile info and set up event listeners
            updateUserInfo();
            setupSidebarToggle();
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
        // Fallback: show error message in the sidebar container
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = '<div class="alert alert-danger">Failed to load sidebar</div>';
        }
    }
}

// Function to set up sidebar toggle functionality
function setupSidebarToggle() {
    // Set up the mobile toggle button
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const sidebarCollapse = document.getElementById('sidebarCollapse');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
    }

    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
            this.innerHTML = sidebar.classList.contains('collapsed') ?
                '<i class="bi bi-chevron-right"></i>' : '<i class="bi bi-chevron-left"></i>';
        });
    }

    // Function to highlight the active menu item based on current page
    setActiveMenuItem();
}

// Function to highlight the active menu item based on current page
function setActiveMenuItem() {
    // Get the current page from the URL
    const currentPath = window.location.pathname;

    // Find all sidebar links
    const sidebarLinks = document.querySelectorAll('#sidebar .nav-link');

    // Remove active class from all links
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to the link matching the current page
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href === currentPath) {
            link.classList.add('active');
        }
    });
}

// Function to update user profile information in the sidebar
function updateUserInfo() {
    // Get user data from sessionStorage
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    if (userData) {
        // Update user name
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = userData.nama_lengkap || 'Admin User';
        }
        
        // Update user role
        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement) {
            userRoleElement.textContent = userData.role || 'Administrator';
        }
        
        // Create initial avatar from name if user name exists
        if (userData.nama_lengkap) {
            const userAvatar = document.querySelector('.user-avatar');
            if (userAvatar) {
                const nameParts = userData.nama_lengkap.trim().split(' ');
                if (nameParts.length >= 2) {
                    // Take first letter of first and last name
                    const initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                    userAvatar.textContent = initials;
                } else if (nameParts.length === 1) {
                    // Take first letter of the single name
                    userAvatar.textContent = nameParts[0][0].toUpperCase();
                }
            }
        }
        
        // Set up profile settings button click event
        setupProfileSettings(userData);
    }
}

// Function to set up profile settings button functionality
function setupProfileSettings(userData) {
    const profileSettingsBtn = document.querySelector('.profile-settings-btn');
    
    if (profileSettingsBtn) {
        profileSettingsBtn.addEventListener('click', function() {
            // Populate the modal fields with current user data
            document.getElementById('profileNamaLengkap').value = userData.nama_lengkap || '';
            document.getElementById('profileEmail').value = userData.email || '';
            
            // Clear password fields
            document.getElementById('profilePassword').value = '';
            document.getElementById('profileConfirmPassword').value = '';
            
            // Show the modal
            const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
            profileModal.show();
        });
    }
    
    // Set up password visibility toggle functionality for profile modal
    setupPasswordToggle();
    
    // Set up form validation for profile modal
    setupProfileFormValidation();
}

// Function to set up password visibility toggle
function setupPasswordToggle() {
    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('profilePassword');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }
    
    // Toggle confirm password visibility
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('profileConfirmPassword');
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }
}

// Function to set up profile form validation
function setupProfileFormValidation() {
    const btnSave = document.getElementById('btnSimpanPerubahan');
    const profileForm = document.getElementById('profileForm');

    if (btnSave && profileForm) {
        btnSave.addEventListener('click', async function() {
            const namaLengkap = document.getElementById('profileNamaLengkap').value;
            const email = document.getElementById('profileEmail').value;
            const password = document.getElementById('profilePassword').value;
            const confirmPassword = document.getElementById('profileConfirmPassword').value;

            // Check if passwords match
            if (password !== '' && password !== confirmPassword) {
                alert('Password baru dan konfirmasi password tidak cocok!');
                return;
            }

            // Form is valid, proceed with update
            const userData = JSON.parse(sessionStorage.getItem('userData'));
            if (!userData || !userData.id_pegawai) {
                alert('Data pengguna tidak ditemukan. Silakan login kembali.');
                logout();
                return;
            }

            try {
                // Show loading state
                btnSave.innerHTML = 'Memproses...';
                btnSave.disabled = true;

                const response = await fetch('/api/pegawai.update_pribadi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id_pegawai: userData.id_pegawai,
                        nama_lengkap: namaLengkap,
                        email: email,
                        password: password
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Update user data in sessionStorage
                    userData.nama_lengkap = namaLengkap;
                    userData.email = email;
                    sessionStorage.setItem('userData', JSON.stringify(userData));

                    // Show success notification
                    alert('Profil berhasil diperbarui! Anda akan otomatis logout untuk menerapkan perubahan.');

                    // Automatically log out after successful update
                    logout();
                } else {
                    alert('Gagal memperbarui profil: ' + (result.message || 'Terjadi kesalahan'));
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Terjadi kesalahan saat memperbarui profil: ' + error.message);
            } finally {
                // Reset button state
                btnSave.innerHTML = 'Simpan Perubahan';
                btnSave.disabled = false;
            }
        });
    }
}

// Function to handle logout
function logout() {
    // Clear all session storage
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '/login';
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure the container element exists before loading
    setTimeout(() => {
        loadSidebar();
    }, 10);
});