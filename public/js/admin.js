document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebarCollapse = document.getElementById('sidebarCollapse');

    if(mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Skip adding event listener if it's already handled by sidebar-loader.js
    if(sidebarCollapse && sidebar && !sidebarCollapse.hasAttribute('data-listener-set')) {
        sidebarCollapse.addEventListener('click', function() {
            if (window.innerWidth > 768) { // Only for desktop
                sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed');

                // Update icon
                const icon = this.querySelector('i');
                if (icon && sidebar.classList.contains('collapsed')) {
                    icon.classList.remove('bi-chevron-left');
                    icon.classList.add('bi-chevron-right');
                } else if (icon) {
                    icon.classList.remove('bi-chevron-right');
                    icon.classList.add('bi-chevron-left');
                }
            }
        });

        // Mark that event listener has been set to avoid duplication
        sidebarCollapse.setAttribute('data-listener-set', 'true');
    }

    // Close sidebar when clicking outside on mobile (only if all elements exist)
    if(sidebar && mobileToggle) {
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnToggle = mobileToggle.contains(event.target);

                if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // Initialize Select2 for searchable selects (from admin.html)
    if (typeof $ !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
        function initializeSelect2() {
            $('.searchable-select').select2({
                theme: 'bootstrap-5',
                placeholder: 'Pilih opsi...',
                allowClear: true,
                width: '100%',
                dropdownParent: $(document.body) // Ensure dropdown appears correctly
            });
        }

        // Initialize on page load
        initializeSelect2();

        // Also initialize when modals are shown to ensure proper initialization of modal content
        $('.modal').on('shown.bs.modal', function() {
            $(this).find('.searchable-select').select2({
                theme: 'bootstrap-5',
                placeholder: 'Pilih opsi...',
                allowClear: true,
                width: '100%',
                dropdownParent: $(document.body) // Ensure dropdown appears correctly
            });
        });
    }
});