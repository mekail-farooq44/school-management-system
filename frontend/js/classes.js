Auth.requireLogin();
renderNavbar('classes');

const user = Auth.getUser();
const isAdmin = user.role === 'admin';

const addClassBtn = document.getElementById('addClassBtn');
const actionsHeader = document.getElementById('actionsHeader');
const tableBody = document.getElementById('classesTableBody');
const emptyState = document.getElementById('emptyState');
const classModal = document.getElementById('classModal');
const classForm = document.getElementById('classForm');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');
const teacherSelect = document.getElementById('classTeacher');

if (isAdmin) {
  showEl(addClassBtn);
  actionsHeader.style.display = '';
}

addClassBtn.addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', () => closeModal());

async function loadTeacherOptions() {
  try {
    const data = await apiRequest('/teachers');
    teacherSelect.innerHTML = '<option value="">-- None --</option>';
    data.teachers.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t._id;
      opt.textContent = `${t.firstName} ${t.lastName}`;
      teacherSelect.appendChild(opt);
    });
  } catch (err) {
    // Non-admins may not be authorized to list teachers; that's fine, leave the default option
  }
}

function openModal(cls = null) {
  hideEl(modalError);
  classForm.reset();
  document.getElementById('classId').value = '';

  if (cls) {
    modalTitle.textContent = 'Edit Class';
    document.getElementById('classId').value = cls._id;
    document.getElementById('name').value = cls.name || '';
    document.getElementById('section').value = cls.section || '';
    document.getElementById('academicYear').value = cls.academicYear || '';
    teacherSelect.value = cls.classTeacher ? cls.classTeacher._id : '';
  } else {
    modalTitle.textContent = 'Add Class';
  }

  classModal.classList.add('open');
}

function closeModal() {
  classModal.classList.remove('open');
}

classForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl(modalError);

  const id = document.getElementById('classId').value;
  const payload = {
    name: document.getElementById('name').value.trim(),
    section: document.getElementById('section').value.trim(),
    academicYear: document.getElementById('academicYear').value.trim(),
    classTeacher: teacherSelect.value || null,
  };

  try {
    if (id) {
      await apiRequest(`/classes/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/classes', { method: 'POST', body: payload });
    }
    closeModal();
    loadClasses();
  } catch (err) {
    modalError.textContent = err.message;
    showEl(modalError);
  }
});

async function deleteClass(id) {
  if (!confirm('Deactivate this class?')) return;
  try {
    await apiRequest(`/classes/${id}`, { method: 'DELETE' });
    loadClasses();
  } catch (err) {
    alert(err.message);
  }
}

async function loadClasses() {
  try {
    const data = await apiRequest('/classes');
    renderTable(data.classes);
  } catch (err) {
    tableBody.innerHTML = '';
    emptyState.textContent = err.message;
    showEl(emptyState);
  }
}

function renderTable(classes) {
  tableBody.innerHTML = '';

  if (!classes.length) {
    showEl(emptyState);
    return;
  }
  hideEl(emptyState);

  classes.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.section}</td>
      <td>${c.academicYear || '-'}</td>
      <td>${c.classTeacher ? `${c.classTeacher.firstName} ${c.classTeacher.lastName}` : '-'}</td>
      ${
        isAdmin
          ? `<td class="actions-cell">
              <button class="btn btn-sm btn-secondary" data-edit="${c._id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-delete="${c._id}">Delete</button>
            </td>`
          : ''
      }
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-edit');
      const data = await apiRequest(`/classes/${id}`);
      openModal(data.class);
    });
  });

  tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteClass(btn.getAttribute('data-delete')));
  });
}

loadTeacherOptions();
loadClasses();
