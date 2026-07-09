Auth.requireLogin();
renderNavbar('subjects');

const user = Auth.getUser();
const isAdmin = user.role === 'admin';

const addSubjectBtn = document.getElementById('addSubjectBtn');
const actionsHeader = document.getElementById('actionsHeader');
const tableBody = document.getElementById('subjectsTableBody');
const emptyState = document.getElementById('emptyState');
const subjectModal = document.getElementById('subjectModal');
const subjectForm = document.getElementById('subjectForm');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');
const classIdSelect = document.getElementById('classId');
const teacherIdSelect = document.getElementById('teacherId');
const classFilter = document.getElementById('classFilter');

if (isAdmin) {
  showEl(addSubjectBtn);
  actionsHeader.style.display = '';
}

addSubjectBtn.addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', () => closeModal());
classFilter.addEventListener('change', loadSubjects);

async function loadClassOptions() {
  try {
    const data = await apiRequest('/classes');
    const classOptionsHtml = data.classes
      .map((c) => `<option value="${c._id}">${c.name} - ${c.section}</option>`)
      .join('');
    classIdSelect.innerHTML = '<option value="">-- Select class --</option>' + classOptionsHtml;
    classFilter.innerHTML = '<option value="">All classes</option>' + classOptionsHtml;
  } catch (err) {
    // ignore
  }
}

async function loadTeacherOptions() {
  try {
    const data = await apiRequest('/teachers');
    teacherIdSelect.innerHTML = '<option value="">-- None --</option>';
    data.teachers.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t._id;
      opt.textContent = `${t.firstName} ${t.lastName}`;
      teacherIdSelect.appendChild(opt);
    });
  } catch (err) {
    // Non-admins may not be authorized; leave default
  }
}

function openModal(subject = null) {
  hideEl(modalError);
  subjectForm.reset();
  document.getElementById('subjectId').value = '';

  if (subject) {
    modalTitle.textContent = 'Edit Subject';
    document.getElementById('subjectId').value = subject._id;
    document.getElementById('name').value = subject.name || '';
    document.getElementById('code').value = subject.code || '';
    classIdSelect.value = subject.classId ? subject.classId._id : '';
    teacherIdSelect.value = subject.teacherId ? subject.teacherId._id : '';
  } else {
    modalTitle.textContent = 'Add Subject';
  }

  subjectModal.classList.add('open');
}

function closeModal() {
  subjectModal.classList.remove('open');
}

subjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl(modalError);

  const id = document.getElementById('subjectId').value;
  const payload = {
    name: document.getElementById('name').value.trim(),
    code: document.getElementById('code').value.trim(),
    classId: classIdSelect.value,
    teacherId: teacherIdSelect.value || null,
  };

  try {
    if (id) {
      await apiRequest(`/subjects/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/subjects', { method: 'POST', body: payload });
    }
    closeModal();
    loadSubjects();
  } catch (err) {
    modalError.textContent = err.message;
    showEl(modalError);
  }
});

async function deleteSubject(id) {
  if (!confirm('Deactivate this subject?')) return;
  try {
    await apiRequest(`/subjects/${id}`, { method: 'DELETE' });
    loadSubjects();
  } catch (err) {
    alert(err.message);
  }
}

async function loadSubjects() {
  const classId = classFilter.value;
  const params = new URLSearchParams();
  if (classId) params.set('classId', classId);

  try {
    const data = await apiRequest(`/subjects?${params.toString()}`);
    renderTable(data.subjects);
  } catch (err) {
    tableBody.innerHTML = '';
    emptyState.textContent = err.message;
    showEl(emptyState);
  }
}

function renderTable(subjects) {
  tableBody.innerHTML = '';

  if (!subjects.length) {
    showEl(emptyState);
    return;
  }
  hideEl(emptyState);

  subjects.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.code || '-'}</td>
      <td>${s.classId ? `${s.classId.name} - ${s.classId.section}` : '-'}</td>
      <td>${s.teacherId ? `${s.teacherId.firstName} ${s.teacherId.lastName}` : '-'}</td>
      ${
        isAdmin
          ? `<td class="actions-cell">
              <button class="btn btn-sm btn-secondary" data-edit="${s._id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-delete="${s._id}">Delete</button>
            </td>`
          : ''
      }
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-edit');
      const data = await apiRequest(`/subjects/${id}`);
      openModal(data.subject);
    });
  });

  tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteSubject(btn.getAttribute('data-delete')));
  });
}

async function init() {
  await loadClassOptions();
  await loadTeacherOptions();
  await loadSubjects();
}

init();
