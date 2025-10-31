document.addEventListener('DOMContentLoaded', function () {
    const captchaQuestion = document.getElementById('captcha-question');
    const captchaInput = document.getElementById('captcha-input');
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        captchaQuestion.textContent = `Berapa ${num1} + ${num2}?`;
        return num1 + num2;
    }

    let correctAnswer = generateCaptcha();

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const userAnswer = parseInt(captchaInput.value, 10);

        if (userAnswer !== correctAnswer) {
            alert('Jawaban captcha salah. Silakan coba lagi.');
            correctAnswer = generateCaptcha();
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
                sessionStorage.setItem('userData', JSON.stringify(data.data));
                window.location.href = '/index'; // Redirect to index page
            } else {
                alert(`Login gagal: ${data.message}`);
                correctAnswer = generateCaptcha();
                captchaInput.value = '';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mencoba login.');
            correctAnswer = generateCaptcha();
            captchaInput.value = '';
        });
    });

    togglePassword.addEventListener('click', function () {
        // Toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle the eye icon
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });
});
