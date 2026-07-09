Auth.requireLogin();
renderNavbar('students');

const user = Auth.getUser();
const canManage = user.role === 'admin' || user.role === 'teacher';
const canDelete = user.role === 'admin';

const addStudentBtn = document.getElementById('addStudentBtn');
const actionsHeader = document.getElementById('actionsHeader');
const tableBody = document.getElementById('studentsTableBody');
const emptyState = document.getElementById('emptyState');
const studentModal = document.getElementById('studentModal');
const studentForm = document.getElementById('studentForm');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');

if (canManage) {
  showEl(addStudentBtn);
  actionsHeader.style.display = '';
}

addStudentBtn.addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', () => closeModal());

document.getElementById('searchBtn').addEventListener('click', loadStudents);
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadStudents();
});

function openModal(student = null) {
  hideEl(modalError);
  studentForm.reset();
  document.getElementById('studentId').value = '';

  if (student) {
    modalTitle.textContent = 'Edit Student';
    document.getElementById('studentId').value = student._id;
    document.getElementById('firstName').value = student.firstName || '';
    document.getElementById('lastName').value = student.lastName || '';
    document.getElementById('className').value = student.className || '';
    document.getElementById('section').value = student.section || '';
    document.getElementById('rollNumber').value = student.rollNumber || '';
    document.getElementById('gender').value = student.gender || '';
    document.getElementById('contactNumber').value = student.contactNumber || '';
    document.getElementById('address').value = student.address || '';
    document.getElementById('parentName').value = student.parentName || '';
    document.getElementById('parentContact').value = student.parentContact || '';
  } else {
    modalTitle.textContent = 'Add Student';
  }

  studentModal.classList.add('open');
}

function closeModal() {
  studentModal.classList.remove('open');
}

studentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl(modalError);

  const id = document.getElementById('studentId').value;
  const payload = {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    className: document.getElementById('className').value.trim(),
    section: document.getElementById('section').value.trim(),
    rollNumber: document.getElementById('rollNumber').value.trim(),
    gender: document.getElementById('gender').value,
    contactNumber: document.getElementById('contactNumber').value.trim(),
    address: document.getElementById('address').value.trim(),
    parentName: document.getElementById('parentName').value.trim(),
    parentContact: document.getElementById('parentContact').value.trim(),
  };

  try {
    if (id) {
      await apiRequest(`/students/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/students', { method: 'POST', body: payload });
    }
    closeModal();
    loadStudents();
  } catch (err) {
    modalError.textContent = err.message;
    showEl(modalError);
  }
});

async function deleteStudent(id) {
  if (!confirm('Deactivate this student record?')) return;
  try {
    await apiRequest(`/students/${id}`, { method: 'DELETE' });
    loadStudents();
  } catch (err) {
    alert(err.message);
  }
}

async function loadStudents() {
  const search = document.getElementById('searchInput').value.trim();
  const className = document.getElementById('classFilter').value.trim();

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (className) params.set('className', className);

  try {
    const data = await apiRequest(`/students?${params.toString()}`);
    renderTable(data.students);
  } catch (err) {
    tableBody.innerHTML = '';
    emptyState.textContent = err.message;
    showEl(emptyState);
  }
}

function renderTable(students) {
  tableBody.innerHTML = '';

  if (!students.length) {
    showEl(emptyState);
    return;
  }
  hideEl(emptyState);

  students.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.rollNumber}</td>
      <td>${s.firstName} ${s.lastName}</td>
      <td>${s.className}</td>
      <td>${s.section || '-'}</td>
      <td>${s.contactNumber || '-'}</td>
      <td>${s.parentName || '-'}</td>
      ${
        canManage
          ? `<td class="actions-cell">
              <button class="btn btn-sm btn-secondary" data-edit="${s._id}">Edit</button>
              ${canDelete ? `<button class="btn btn-sm btn-danger" data-delete="${s._id}">Delete</button>` : ''}
            </td>`
          : ''
      }
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-edit');
      const data = await apiRequest(`/students/${id}`);
      openModal(data.student);
    });
  });

  tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteStudent(btn.getAttribute('data-delete')));
  });
}

loadStudents();
