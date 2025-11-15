// public/js/confirmation.js
// Handles email confirmation with 6-digit code

const API_BASE = '/api/auth';

// Get email from URL query parameter or localStorage
const urlParams = new URLSearchParams(window.location.search);
const userEmail = urlParams.get('email') || localStorage.getItem('pendingConfirmationEmail');

// Redirect if no email
if (!userEmail) {
    window.location.href = '/html/signup.html';
}

// Display email
document.getElementById('email-display').textContent = userEmail;

// Code input handling
const inputs = [
    document.getElementById('digit1'),
    document.getElementById('digit2'),
    document.getElementById('digit3'),
    document.getElementById('digit4'),
    document.getElementById('digit5'),
    document.getElementById('digit6')
];

// Auto-focus next input and handle paste
inputs.forEach((input, index) => {
    // Move to next input on valid digit
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Only allow digits
        if (!/^\d$/.test(value)) {
            e.target.value = '';
            return;
        }

        // Clear error state
        inputs.forEach(inp => inp.classList.remove('error'));
        
        // Move to next input
        if (value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    // Handle backspace
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            inputs[index - 1].focus();
        }
    });

    // Handle paste
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Check if it's a 6-digit code
        if (/^\d{6}$/.test(pastedData)) {
            pastedData.split('').forEach((digit, i) => {
                if (inputs[i]) {
                    inputs[i].value = digit;
                }
            });
            inputs[5].focus();
        }
    });
});

// Focus first input on load
inputs[0].focus();

// Verify button handler
document.getElementById('verify-button').addEventListener('click', async () => {
    const code = inputs.map(input => input.value).join('');
    
    if (code.length !== 6) {
        showMessage('Please enter all 6 digits', 'error');
        inputs.forEach(inp => inp.classList.add('error'));
        return;
    }

    const button = document.getElementById('verify-button');
    button.disabled = true;
    button.textContent = 'Verifying...';

    try {
        const response = await fetch(`${API_BASE}/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, code })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message || 'Email confirmed successfully!', 'success');
            
            // Clear pending email
            localStorage.removeItem('pendingConfirmationEmail');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/html/login.html';
            }, 2000);
        } else {
            showMessage(data.error || 'Invalid code. Please try again.', 'error');
            inputs.forEach(inp => {
                inp.classList.add('error');
                inp.value = '';
            });
            inputs[0].focus();
            button.disabled = false;
            button.textContent = 'Verify Code';
        }
    } catch (error) {
        console.error('Verification error:', error);
        showMessage('Network error. Please try again.', 'error');
        button.disabled = false;
        button.textContent = 'Verify Code';
    }
});

// Resend code functionality with 1-minute timer
let resendTimer = 60; // 60 seconds
let timerInterval;

function startResendTimer() {
    const resendButton = document.getElementById('resend-button');
    const timerDisplay = document.getElementById('timer');
    
    resendButton.disabled = true;
    
    timerInterval = setInterval(() => {
        resendTimer--;
        timerDisplay.textContent = `Wait ${resendTimer}s before resending`;
        
        if (resendTimer <= 0) {
            clearInterval(timerInterval);
            resendButton.disabled = false;
            timerDisplay.textContent = '';
        }
    }, 1000);
}

// Start timer on page load
startResendTimer();

// Resend button handler
document.getElementById('resend-button').addEventListener('click', async () => {
    const button = document.getElementById('resend-button');
    button.disabled = true;
    button.textContent = 'Sending...';

    try {
        const response = await fetch(`${API_BASE}/resend-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message || 'New code sent successfully!', 'success');
            
            // Clear input fields
            inputs.forEach(inp => {
                inp.value = '';
                inp.classList.remove('error');
            });
            inputs[0].focus();

            // Restart timer
            resendTimer = 60;
            startResendTimer();
        } else {
            showMessage(data.error || 'Failed to resend code', 'error');
            button.disabled = false;
        }
    } catch (error) {
        console.error('Resend error:', error);
        showMessage('Network error. Please try again.', 'error');
        button.disabled = false;
    } finally {
        button.textContent = 'Resend Code';
    }
});

// Helper function to show messages
function showMessage(text, type) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="message ${type}">${text}</div>`;
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

// Handle Enter key to verify
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('verify-button').click();
    }
});
