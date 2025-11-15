// public/js/auth.js
// Minimal vanilla JS helper for signup and login forms

const apiBase = '/api/auth';

async function postJson(path, data) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body: json };
}

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? 'crimson' : 'green';
}

// Attach handlers on load
window.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  if (signupForm) {
    const msg = document.getElementById('msg');
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      showMessage(msg, 'Creating account...');
      const result = await postJson(apiBase + '/signup', { username, email, password });
      if (result.ok) {
        showMessage(msg, 'Account created! Check your email for confirmation code.');
        // Store email for confirmation page
        localStorage.setItem('pendingConfirmationEmail', email);
        setTimeout(() => location.href = `/html/confirmation.html?email=${encodeURIComponent(email)}`, 1500);
      } else {
        showMessage(msg, result.body?.error || 'Signup failed', true);
      }
    });
  }

  if (loginForm) {
    const msg = document.getElementById('msg');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      showMessage(msg, 'Logging in...');
      const result = await postJson(apiBase + '/login', { email, password });
      if (result.ok) {
        // store token in localStorage
        const token = result.body?.token;
        if (token) {
          localStorage.setItem('jwt', token);
          localStorage.setItem('username', result.body.username || '');
          showMessage(msg, 'Login successful — redirecting...');
          setTimeout(() => location.href = '/', 600);
        } else {
          showMessage(msg, 'Login succeeded but no token returned', true);
        }
      } else {
        showMessage(msg, result.body?.error || 'Login failed', true);
      }
    });
  }
});

// Render login/signup links or username/logout in header if element exists
function renderAuthLinks() {
  const container = document.getElementById('auth-links');
  if (!container) return;

  const token = localStorage.getItem('jwt');
  const username = localStorage.getItem('username');

  if (token) {
    container.innerHTML = `
      <a href="#" id="show-user">${username || 'Account'}</a>
      <a href="#" id="logout" style="margin-left:8px;background:#db4b4b;padding:6px 10px;border-radius:6px;">Logout</a>
    `;
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('jwt');
        localStorage.removeItem('username');
        // refresh to update UI
        location.reload();
      });
    }
  } else {
    container.innerHTML = `
      <a href="/html/login.html">Login</a>
      <a href="/html/signup.html" style="margin-left:8px;background:#4CAF50;padding:6px 10px;border-radius:6px;color:white;">Sign up</a>
    `;
  }
}

// call on DOMContentLoaded if index page is loaded
window.addEventListener('DOMContentLoaded', () => {
  renderAuthLinks();
});
