if (Auth.isLoggedIn()) {
  window.location.href = '/dashboard.html';
}

const registerForm = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl(errorMsg);

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
    });
    Auth.setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errorMsg.textContent = err.message;
    showEl(errorMsg);
  }
});
