document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    
    mobileToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Skip adding event listener if it's already handled by sidebar-loader.js
    if(sidebarCollapse && !sidebarCollapse.hasAttribute('data-listener-set')) {
        sidebarCollapse.addEventListener('click', function() {
            if (window.innerWidth > 768) { // Only for desktop
                sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed');
                
                // Update icon
                const icon = this.querySelector('i');
                if (sidebar.classList.contains('collapsed')) {
                    icon.classList.remove('bi-chevron-left');
                    icon.classList.add('bi-chevron-right');
                } else {
                    icon.classList.remove('bi-chevron-right');
                    icon.classList.add('bi-chevron-left');
                }
            }
        });
        
        // Mark that event listener has been set to avoid duplication
        sidebarCollapse.setAttribute('data-listener-set', 'true');
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = mobileToggle.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });
});