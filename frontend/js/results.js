Auth.requireLogin();
renderNavbar('results');

const user = Auth.getUser();
const canManage = user.role === 'admin' || user.role === 'teacher';

const enterMarksCard = document.getElementById('enterMarksCard');
const viewResultsCard = document.getElementById('viewResultsCard');
const ownResultsCard = document.getElementById('ownResultsCard');

const examSelect = document.getElementById('examSelect');
const loadExamBtn = document.getElementById('loadExamBtn');
const marksTableWrapper = document.getElementById('marksTableWrapper');
const marksTableBody = document.getElementById('marksTableBody');
const examMeta = document.getElementById('examMeta');
const noStudentsState = document.getElementById('noStudentsState');
const saveResultsBtn = document.getElementById('saveResultsBtn');
const saveSuccessMsg = document.getElementById('saveSuccessMsg');
const saveErrorMsg = document.getElementById('saveErrorMsg');
const viewResultsTableBody = document.getElementById('viewResultsTableBody');

const ownResultsTableBody = document.getElementById('ownResultsTableBody');
const ownEmptyState = document.getElementById('ownEmptyState');

let currentExam = null;

if (canManage) {
  showEl(enterMarksCard);
  showEl(viewResultsCard);
  init();
} else {
  showEl(ownResultsCard);
  loadOwnResults();
}

async function loadExamOptions() {
  try {
    const data = await apiRequest('/exams');
    examSelect.innerHTML =
      '<option value="">-- Select exam --</option>' +
      data.exams
        .map(
          (ex) =>
            `<option value="${ex._id}">${ex.name} (${ex.classId ? ex.classId.name + '-' + ex.classId.section : ''} / ${
              ex.subjectId ? ex.subjectId.name : ''
            })</option>`
        )
        .join('');
  } catch (err) {
    // ignore
  }
}

loadExamBtn.addEventListener('click', () => {
  if (examSelect.value) loadExamForEntry(examSelect.value);
});

async function loadExamForEntry(examId) {
  hideEl(saveSuccessMsg);
  hideEl(saveErrorMsg);

  try {
    const examData = await apiRequest(`/exams/${examId}`);
    currentExam = examData.exam;
    examMeta.textContent = `Max Marks: ${currentExam.maxMarks} | Pass Marks: ${currentExam.passMarks} | Date: ${new Date(
      currentExam.examDate
    ).toLocaleDateString()}`;

    const { name, section } = currentExam.classId;
    const studentsData = await apiRequest(
      `/students?${new URLSearchParams({ className: name, section }).toString()}`
    );

    if (!studentsData.students.length) {
      hideEl(marksTableWrapper);
      showEl(noStudentsState);
      return;
    }
    hideEl(noStudentsState);

    // Pull any existing results for this exam to pre-fill the form
    let existingResults = [];
    try {
      const resultsData = await apiRequest(`/results?examId=${examId}`);
      existingResults = resultsData.results;
    } catch (err) {
      // no results yet, that's fine
    }

    renderMarksTable(studentsData.students, existingResults);
    showEl(marksTableWrapper);
    renderExamResultsView(existingResults);
  } catch (err) {
    alert(err.message);
  }
}

function renderMarksTable(students, existingResults) {
  marksTableBody.innerHTML = '';
  students.forEach((s) => {
    const existing = existingResults.find((r) => r.studentId && r.studentId._id === s._id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.rollNumber}</td>
      <td>${s.firstName} ${s.lastName}</td>
      <td><input type="number" min="0" max="${currentExam.maxMarks}" data-marks-id="${s._id}" value="${
      existing ? existing.marksObtained : ''
    }" required></td>
      <td><input type="text" data-remarks-id="${s._id}" placeholder="Optional" value="${
      existing && existing.remarks ? existing.remarks : ''
    }"></td>
    `;
    marksTableBody.appendChild(tr);
  });
}

saveResultsBtn.addEventListener('click', async () => {
  hideEl(saveSuccessMsg);
  hideEl(saveErrorMsg);

  const marksInputs = marksTableBody.querySelectorAll('[data-marks-id]');
  const records = Array.from(marksInputs)
    .filter((input) => input.value !== '')
    .map((input) => {
      const studentId = input.getAttribute('data-marks-id');
      const remarksInput = marksTableBody.querySelector(`[data-remarks-id="${studentId}"]`);
      return {
        studentId,
        marksObtained: Number(input.value),
        remarks: remarksInput ? remarksInput.value.trim() : '',
      };
    });

  if (!records.length) {
    saveErrorMsg.textContent = 'Enter at least one mark before saving.';
    showEl(saveErrorMsg);
    return;
  }

  try {
    const data = await apiRequest('/results/enter', {
      method: 'POST',
      body: { examId: currentExam._id, records },
    });
    showEl(saveSuccessMsg);
    renderExamResultsView(data.results);
  } catch (err) {
    saveErrorMsg.textContent = err.message;
    showEl(saveErrorMsg);
  }
});

function renderExamResultsView(results) {
  viewResultsTableBody.innerHTML = '';
  if (!results.length) return;

  results.forEach((r) => {
    const tr = document.createElement('tr');
    const studentLabel = r.studentId
      ? `${r.studentId.firstName || ''} ${r.studentId.lastName || ''}`.trim()
      : '';
    const rollNo = r.studentId ? r.studentId.rollNumber : '-';
    tr.innerHTML = `
      <td>${rollNo}</td>
      <td>${studentLabel}</td>
      <td>${r.marksObtained} / ${r.maxMarks}</td>
      <td>${r.percentage}%</td>
      <td>${r.grade}</td>
      <td>${r.passed ? '<span style="color:#16a34a;">Pass</span>' : '<span style="color:#dc2626;">Fail</span>'}</td>
    `;
    viewResultsTableBody.appendChild(tr);
  });
}

async function loadOwnResults() {
  try {
    const studentsData = await apiRequest('/students'); // scoped to own record
    if (!studentsData.students.length) {
      showEl(ownEmptyState);
      return;
    }
    const ownStudentId = studentsData.students[0]._id;
    const data = await apiRequest(`/results/student/${ownStudentId}`);

    if (!data.results.length) {
      showEl(ownEmptyState);
      return;
    }
    hideEl(ownEmptyState);

    ownResultsTableBody.innerHTML = '';
    data.results.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.examId ? r.examId.name : '-'}</td>
        <td>${r.examId && r.examId.subjectId ? r.examId.subjectId.name : '-'}</td>
        <td>${r.marksObtained} / ${r.maxMarks}</td>
        <td>${r.percentage}%</td>
        <td>${r.grade}</td>
        <td>${r.passed ? '<span style="color:#16a34a;">Pass</span>' : '<span style="color:#dc2626;">Fail</span>'}</td>
      `;
      ownResultsTableBody.appendChild(tr);
    });
  } catch (err) {
    ownEmptyState.textContent = err.message;
    showEl(ownEmptyState);
  }
}

async function init() {
  await loadExamOptions();

  // Support being linked here directly from Exams page with ?examId=...
  const params = new URLSearchParams(window.location.search);
  const examIdFromUrl = params.get('examId');
  if (examIdFromUrl) {
    examSelect.value = examIdFromUrl;
    loadExamForEntry(examIdFromUrl);
  }
}
