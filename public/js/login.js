document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already logged in - redirect to index if so
    if (sessionStorage.getItem('userData')) {
        window.location.href = '/index';
        return;
    }

    // DOM Elements
    const captchaText = document.getElementById('captcha-text');
    const captchaInput = document.getElementById('captcha-input');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const messageContainer = document.getElementById('message-container');

    // Check for blocked login status on page load
    checkLoginBlockedStatus();

    // Generate simple alphanumeric captcha
    function generateCaptcha() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Display captcha
    function displayCaptcha() {
        const captcha = generateCaptcha();
        captchaText.textContent = captcha;
        return captcha;
    }

    // Initialize captcha
    let currentCaptcha = displayCaptcha();

    // Refresh captcha on click
    captchaText.addEventListener('click', function() {
        currentCaptcha = displayCaptcha();
    });

    // Toggle password visibility
    togglePassword.addEventListener('click', function () {
        // Toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle the eye icon
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

    // Function to show message using Bootstrap callout
    function showMessage(message, type = 'warning') {
        // Clear previous messages
        messageContainer.innerHTML = '';

        // Create message element with Bootstrap callout styling
        const messageElement = document.createElement('div');
        messageElement.className = `bd-callout bd-callout-${type} mb-3`;
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);

        // Scroll to the message
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Function to clear messages
    function clearMessage() {
        messageContainer.innerHTML = '';
    }

    // Check if login is currently blocked
    function isLoginBlocked() {
        const blockedUntil = localStorage.getItem('loginBlockedUntil');
        if (blockedUntil) {
            const now = new Date().getTime();
            const blockTime = parseInt(blockedUntil);
            if (now < blockTime) {
                return true;
            } else {
                // Remove the block if it's expired
                localStorage.removeItem('loginBlockedUntil');
                localStorage.removeItem('loginAttempts');
                return false;
            }
        }
        return false;
    }

    // Check login blocked status and update UI
    function checkLoginBlockedStatus() {
        if (isLoginBlocked()) {
            const blockedUntil = localStorage.getItem('loginBlockedUntil');
            const remainingTime = Math.ceil((parseInt(blockedUntil) - new Date().getTime()) / 1000 / 60);
            showMessage(`Login terblokir karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${remainingTime} menit.`, 'warning');

            // Disable form
            loginForm.querySelectorAll('input, button').forEach(element => {
                element.disabled = true;
            });

            // Start countdown
            startCountdown();
        }
    }

    // Start countdown timer for login attempts
    function startCountdown() {
        const timerInterval = setInterval(() => {
            if (!isLoginBlocked()) {
                clearInterval(timerInterval);
                // Re-enable form
                loginForm.querySelectorAll('input, button').forEach(element => {
                    element.disabled = false;
                });

                // Reset button text
                document.getElementById('login-form').querySelector('button[type="submit"]').textContent = 'Masuk';

                showMessage('Anda dapat mencoba login kembali sekarang.', 'success');
                return;
            }

            const blockedUntil = localStorage.getItem('loginBlockedUntil');
            const remainingTime = Math.ceil((parseInt(blockedUntil) - new Date().getTime()) / 1000 / 60);
            const secondsRemaining = Math.floor((parseInt(blockedUntil) - new Date().getTime()) / 1000) % 60;
            document.getElementById('login-form').querySelector('button[type="submit"]').textContent =
                `Login (${remainingTime}m ${secondsRemaining}s)`;
        }, 1000);
    }

    // Handle form submission
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Show spinner and change button text
        document.getElementById('login-text').classList.add('d-none');
        document.getElementById('login-spinner').classList.remove('d-none');
        document.getElementById('login-btn').disabled = true;

        // Clear any existing messages
        clearMessage();

        // Check if login is blocked
        if (isLoginBlocked()) {
            // Hide spinner and restore button if login is blocked
            document.getElementById('login-text').classList.remove('d-none');
            document.getElementById('login-spinner').classList.add('d-none');
            document.getElementById('login-btn').disabled = false;
            showMessage('Login terblokir karena terlalu banyak percobaan gagal. Silakan coba lagi nanti.', 'warning');
            return;
        }

        // Validate captcha first
        if (captchaInput.value !== currentCaptcha) {
            showMessage('Captcha salah. Silakan coba lagi.', 'warning');
            currentCaptcha = displayCaptcha();
            captchaInput.value = '';
            return;
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        fetch('/api/pegawai.login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear any stored blocked status on successful login
                localStorage.removeItem('loginBlockedUntil');
                localStorage.removeItem('loginAttempts');

                sessionStorage.setItem('userData', JSON.stringify(data.data));
                window.location.href = '/index'; // Redirect to index page
            } else {
                // Hide spinner and restore button after login attempt
                document.getElementById('login-text').classList.remove('d-none');
                document.getElementById('login-spinner').classList.add('d-none');
                document.getElementById('login-btn').disabled = false;

                // Handle failed login - increment attempt counter
                let attempts = parseInt(localStorage.getItem('loginAttempts')) || 0;
                attempts++;

                if (attempts >= 3) {
                    // Block for 3 minutes (180,000 milliseconds)
                    const blockedUntil = new Date().getTime() + (3 * 60 * 1000);
                    localStorage.setItem('loginBlockedUntil', blockedUntil.toString());
                    localStorage.setItem('loginAttempts', '0');

                    showMessage(`Login gagal: ${data.message}. Login Anda telah diblokir selama 3 menit karena terlalu banyak percobaan gagal.`, 'danger');

                    // Disable form
                    loginForm.querySelectorAll('input, button').forEach(element => {
                        element.disabled = true;
                    });

                    // Start countdown
                    startCountdown();
                } else {
                    localStorage.setItem('loginAttempts', attempts.toString());
                    showMessage(`Login gagal: ${data.message}. Percobaan ${attempts}/3`, 'warning');
                }

                // Refresh captcha
                currentCaptcha = displayCaptcha();
                captchaInput.value = '';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            // Hide spinner and restore button after error
            document.getElementById('login-text').classList.remove('d-none');
            document.getElementById('login-spinner').classList.add('d-none');
            document.getElementById('login-btn').disabled = false;
            showMessage('Terjadi kesalahan saat mencoba login.', 'danger');
            currentCaptcha = displayCaptcha();
            captchaInput.value = '';
        });
    });
});
