Auth.requireLogin();
renderNavbar('exams');

const user = Auth.getUser();
const canManage = user.role === 'admin' || user.role === 'teacher';

const addExamBtn = document.getElementById('addExamBtn');
const actionsHeader = document.getElementById('actionsHeader');
const tableBody = document.getElementById('examsTableBody');
const emptyState = document.getElementById('emptyState');
const examModal = document.getElementById('examModal');
const examForm = document.getElementById('examForm');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');
const classIdSelect = document.getElementById('classId');
const subjectIdSelect = document.getElementById('subjectId');
const classFilter = document.getElementById('classFilter');

let allClasses = [];

if (canManage) {
  showEl(addExamBtn);
  actionsHeader.style.display = '';
}

addExamBtn.addEventListener('click', () => openModal());
document.getElementById('cancelBtn').addEventListener('click', () => closeModal());
classFilter.addEventListener('change', loadExams);
classIdSelect.addEventListener('change', () => loadSubjectsForClass(classIdSelect.value));

async function loadClassOptions() {
  try {
    const data = await apiRequest('/classes');
    allClasses = data.classes;
    const optionsHtml = allClasses.map((c) => `<option value="${c._id}">${c.name} - ${c.section}</option>`).join('');
    classIdSelect.innerHTML = '<option value="">-- Select class --</option>' + optionsHtml;
    classFilter.innerHTML = '<option value="">All classes</option>' + optionsHtml;
  } catch (err) {
    // ignore
  }
}

async function loadSubjectsForClass(classId) {
  if (!classId) {
    subjectIdSelect.innerHTML = '<option value="">-- Select class first --</option>';
    return;
  }
  try {
    const data = await apiRequest(`/subjects?classId=${classId}`);
    subjectIdSelect.innerHTML =
      '<option value="">-- Select subject --</option>' +
      data.subjects.map((s) => `<option value="${s._id}">${s.name}</option>`).join('');
  } catch (err) {
    subjectIdSelect.innerHTML = '<option value="">-- Select subject --</option>';
  }
}

function openModal(exam = null) {
  hideEl(modalError);
  examForm.reset();
  document.getElementById('examId').value = '';

  if (exam) {
    modalTitle.textContent = 'Edit Exam';
    document.getElementById('examId').value = exam._id;
    document.getElementById('name').value = exam.name || '';
    document.getElementById('examDate').value = exam.examDate ? exam.examDate.split('T')[0] : '';
    document.getElementById('maxMarks').value = exam.maxMarks;
    document.getElementById('passMarks').value = exam.passMarks;
    classIdSelect.value = exam.classId ? exam.classId._id : '';
    loadSubjectsForClass(classIdSelect.value).then(() => {
      subjectIdSelect.value = exam.subjectId ? exam.subjectId._id : '';
    });
  } else {
    modalTitle.textContent = 'Add Exam';
    subjectIdSelect.innerHTML = '<option value="">-- Select class first --</option>';
  }

  examModal.classList.add('open');
}

function closeModal() {
  examModal.classList.remove('open');
}

examForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideEl(modalError);

  const id = document.getElementById('examId').value;
  const payload = {
    name: document.getElementById('name').value.trim(),
    classId: classIdSelect.value,
    subjectId: subjectIdSelect.value,
    examDate: document.getElementById('examDate').value,
    maxMarks: Number(document.getElementById('maxMarks').value),
    passMarks: Number(document.getElementById('passMarks').value),
  };

  try {
    if (id) {
      await apiRequest(`/exams/${id}`, { method: 'PUT', body: payload });
    } else {
      await apiRequest('/exams', { method: 'POST', body: payload });
    }
    closeModal();
    loadExams();
  } catch (err) {
    modalError.textContent = err.message;
    showEl(modalError);
  }
});

async function deleteExam(id) {
  if (!confirm('Deactivate this exam?')) return;
  try {
    await apiRequest(`/exams/${id}`, { method: 'DELETE' });
    loadExams();
  } catch (err) {
    alert(err.message);
  }
}

async function loadExams() {
  const classId = classFilter.value;
  const params = new URLSearchParams();
  if (classId) params.set('classId', classId);

  try {
    const data = await apiRequest(`/exams?${params.toString()}`);
    renderTable(data.exams);
  } catch (err) {
    tableBody.innerHTML = '';
    emptyState.textContent = err.message;
    showEl(emptyState);
  }
}

function renderTable(exams) {
  tableBody.innerHTML = '';

  if (!exams.length) {
    showEl(emptyState);
    return;
  }
  hideEl(emptyState);

  exams.forEach((ex) => {
    const tr = document.createElement('tr');
    const dateStr = new Date(ex.examDate).toLocaleDateString();
    tr.innerHTML = `
      <td>${ex.name}</td>
      <td>${ex.classId ? `${ex.classId.name} - ${ex.classId.section}` : '-'}</td>
      <td>${ex.subjectId ? ex.subjectId.name : '-'}</td>
      <td>${dateStr}</td>
      <td>${ex.maxMarks}</td>
      <td>${ex.passMarks}</td>
      ${
        canManage
          ? `<td class="actions-cell">
              <button class="btn btn-sm btn-secondary" data-edit="${ex._id}">Edit</button>
              <button class="btn btn-sm btn-secondary" data-enter-marks="${ex._id}">Enter Marks</button>
              ${user.role === 'admin' ? `<button class="btn btn-sm btn-danger" data-delete="${ex._id}">Delete</button>` : ''}
            </td>`
          : ''
      }
    `;
    tableBody.appendChild(tr);
  });

  tableBody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-edit');
      const data = await apiRequest(`/exams/${id}`);
      openModal(data.exam);
    });
  });

  tableBody.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteExam(btn.getAttribute('data-delete')));
  });

  tableBody.querySelectorAll('[data-enter-marks]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = `/results.html?examId=${btn.getAttribute('data-enter-marks')}`;
    });
  });
}

async function init() {
  await loadClassOptions();
  await loadExams();
}

init();
