function renderNavbar(activePage) {
  const user = Auth.getUser();
  if (!user) return;

  const links = [
    { href: '/dashboard.html', label: 'Dashboard', key: 'dashboard' },
    { href: '/students.html', label: 'Students', key: 'students' },
    { href: '/teachers.html', label: 'Teachers', key: 'teachers' },
    { href: '/classes.html', label: 'Classes', key: 'classes' },
    { href: '/subjects.html', label: 'Subjects', key: 'subjects' },
    { href: '/attendance.html', label: 'Attendance', key: 'attendance' },
    { href: '/exams.html', label: 'Exams', key: 'exams' },
    { href: '/results.html', label: 'Results', key: 'results' },
  ];

  const navHtml = links
    .map(
      (l) =>
        `<a href="${l.href}" class="${l.key === activePage ? 'active' : ''}">${l.label}</a>`
    )
    .join('');

  const navbarEl = document.getElementById('navbar');
  navbarEl.innerHTML = `
    <div class="brand"> EduNova </div>
    <nav>${navHtml}</nav>
    <div class="user-info">
      <span>${user.name}</span>
      <span class="badge">${user.role}</span>
      <button class="btn btn-secondary btn-sm" id="logoutBtn">Logout</button>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
}
