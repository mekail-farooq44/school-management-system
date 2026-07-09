// Shared helpers for talking to the backend API and managing auth state.
// Token and user info are kept in memory + sessionStorage-free (localStorage is fine
// here since it's not a browser artifact environment, just a plain served app).

const API_BASE = '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('sms_token');
  },
  getUser() {
    const raw = localStorage.getItem('sms_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem('sms_token', token);
    localStorage.setItem('sms_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
    }
  },
  logout() {
    this.clearSession();
    window.location.href = '/index.html';
  },
};

async function apiRequest(path, { method = 'GET', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

function showEl(el) { el.style.display = 'block'; }
function hideEl(el) { el.style.display = 'none'; }
