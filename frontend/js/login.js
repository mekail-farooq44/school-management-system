// Redirect to dashboard if already logged in
if (Auth.isLoggedIn()) {
  window.location.href = '/dashboard.html';
}

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl(errorMsg);

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    Auth.setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errorMsg.textContent = err.message;
    showEl(errorMsg);
  }
});
