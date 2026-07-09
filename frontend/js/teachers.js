Auth.requireLogin();
renderNavbar('teachers');

const user = Auth.getUser();
const isAdmin = user.role === 'admin';

const addTeacherBtn = document.getElementById('addTeacherBtn');
const actionsHeader = document.getElementById('actionsHeader');
const tableBody = document.getElementById('teachersTableBody');
const emptyState = document.getElementById('emptyState');
const teacherModal = document.getElementById('teacherModal');
const teacherForm = document.getElementById('teacherForm');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');

if (isAdmin) {
  showEl(addTeacherBtn);
  actionsHeader.style.display = '';
}

addTeacherBtn.addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', () => closeModal());

document.getElementById('searchBtn').addEventListener('click', loadTeachers);
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadTeachers();
});

function openModal(teacher = null) {
  hideEl(modalError);
  teacherForm.reset();
  document.getElementById('teacherId').value = '';

  if (teacher) {
    modalTitle.textContent = 'Edit Teacher';
    document.getElementById('teacherId').value = teacher._id;
    document.getElementById('firstName').value = teacher.firstName || '';
    document.getElementById('lastName').value = teacher.lastName || '';
    document.getElementById('email').value = teacher.email || '';
    document.getElementById('phone').value = teacher.phone || '';
    document.getElementById('subjectSpecialization').value = teacher.subjectSpecialization || '';
    document.getElementById('qualification').value = teacher.qualification || '';
    document.getElementById('assignedClasses').value = (teacher.assignedClasses || []).join(', ');
    document.getElementById('address').value = teacher.address || '';
  } else {
    modalTitle.textContent = 'Add Teacher';
  }

  teacherModal.classList.add('open');
}

function closeModal() {
  teacherModal.classList.remove('open');
}

teacherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl(modalError);

  const id = document.getElementById('teacherId').value;
  const assignedClassesRaw = document.getElementById('assignedClasses').value.trim();

  const payload = {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    subjectSpecialization: document.getElementById('subjectSpecialization').value.trim(),
    qualification: document.getElementById('qualification').value.trim(),
    assignedClasses: assignedClassesRaw
      ? assignedClassesRaw.split(',').map((c) => c.trim()).filter(Boolean)
      : [],
    address: document.getElementById('address').value.trim(),
  };

  try {
    if (id) {
      await apiRequest(`/teachers/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/teachers', { method: 'POST', body: payload });
    }
    closeModal();
    loadTeachers();
  } catch (err) {
    modalError.textContent = err.message;
    showEl(modalError);
  }
});

async function deleteTeacher(id) {
  if (!confirm('Deactivate this teacher record?')) return;
  try {
    await apiRequest(`/teachers/${id}`, { method: 'DELETE' });
    loadTeachers();
  } catch (err) {
    alert(err.message);
  }
}

async function loadTeachers() {
  const search = document.getElementById('searchInput').value.trim();
  const params = new URLSearchParams();
  if (search) params.set('search', search);

  try {
    const data = await apiRequest(`/teachers?${params.toString()}`);
    renderTable(data.teachers);
  } catch (err) {
    tableBody.innerHTML = '';
    emptyState.textContent = err.message;
    showEl(emptyState);
  }
}

function renderTable(teachers) {
  tableBody.innerHTML = '';

  if (!teachers.length) {
    showEl(emptyState);
    return;
  }
  hideEl(emptyState);

  teachers.forEach((t) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.firstName} ${t.lastName}</td>
      <td>${t.email}</td>
      <td>${t.phone || '-'}</td>
      <td>${t.subjectSpecialization || '-'}</td>
      <td>${(t.assignedClasses || []).join(', ') || '-'}</td>
      ${
        isAdmin
          ? `<td class="actions-cell">
              <button class="btn btn-sm btn-secondary" data-edit="${t._id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-delete="${t._id}">Delete</button>
            </td>`
          : ''
      }
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-edit');
      const data = await apiRequest(`/teachers/${id}`);
      openModal(data.teacher);
    });
  });

  tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteTeacher(btn.getAttribute('data-delete')));
  });
}

loadTeachers();
