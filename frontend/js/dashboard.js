Auth.requireLogin();
renderNavbar('dashboard');

const user = Auth.getUser();
document.getElementById('welcomeName').textContent = user.name;
document.getElementById('roleLabel').textContent = user.role;

async function loadStats() {
  try {
    const studentsData = await apiRequest('/students');
    document.getElementById('studentCount').textContent = studentsData.count;
  } catch (err) {
    document.getElementById('studentCount').textContent = '0';
  }

  try {
    const teachersData = await apiRequest('/teachers');
    document.getElementById('teacherCount').textContent = teachersData.count;
  } catch (err) {
    // Students/parents aren't authorized to list teachers — that's expected
    document.getElementById('teacherCount').textContent = '—';
  }

  try {
    const classesData = await apiRequest('/classes');
    document.getElementById('classCount').textContent = classesData.count;
  } catch (err) {
    document.getElementById('classCount').textContent = '—';
  }

  try {
    const examsData = await apiRequest('/exams');
    document.getElementById('examCount').textContent = examsData.count;
  } catch (err) {
    document.getElementById('examCount').textContent = '—';
  }
}

loadStats();
