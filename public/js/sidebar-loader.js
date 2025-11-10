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
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure the container element exists before loading
    setTimeout(() => {
        loadSidebar();
    }, 10);
});