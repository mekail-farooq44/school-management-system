Auth.requireLogin();
renderNavbar('attendance');

const user = Auth.getUser();
const canMark = user.role === 'admin' || user.role === 'teacher';

const markAttendanceCard = document.getElementById('markAttendanceCard');
const classSelect = document.getElementById('classSelect');
const dateInput = document.getElementById('dateInput');
const loadStudentsBtn = document.getElementById('loadStudentsBtn');
const markingTableWrapper = document.getElementById('markingTableWrapper');
const markingTableBody = document.getElementById('markingTableBody');
const noStudentsState = document.getElementById('noStudentsState');
const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
const saveSuccessMsg = document.getElementById('saveSuccessMsg');
const saveErrorMsg = document.getElementById('saveErrorMsg');

const studentPickerWrapper = document.getElementById('studentPickerWrapper');
const studentSelect = document.getElementById('studentSelect');
const summaryStats = document.getElementById('summaryStats');
const historyTableBody = document.getElementById('historyTableBody');
const historyEmptyState = document.getElementById('historyEmptyState');
const historyTitle = document.getElementById('historyTitle');

// Default the date picker to today
dateInput.value = new Date().toISOString().split('T')[0];

let currentClassId = ''; // Mongo _id of the currently loaded Class for marking

if (canMark) {
  showEl(markAttendanceCard);
  showEl(studentPickerWrapper);
  loadClassOptions();
  loadStudentOptions();
} else {
  historyTitle.textContent = 'My Attendance';
  loadOwnAttendance();
}

async function loadClassOptions() {
  try {
    const data = await apiRequest('/classes');
    classSelect.innerHTML =
      '<option value="">-- Select class --</option>' +
      data.classes.map((c) => `<option value="${c._id}">${c.name} - ${c.section}</option>`).join('');
  } catch (err) {
    // ignore
  }
}

async function loadStudentOptions() {
  try {
    const data = await apiRequest('/students');
    studentSelect.innerHTML =
      '<option value="">-- Select a student --</option>' +
      data.students
        .map((s) => `<option value="${s._id}">${s.firstName} ${s.lastName} (${s.className}-${s.section})</option>`)
        .join('');
  } catch (err) {
    // ignore
  }
}

loadStudentsBtn.addEventListener('click', async () => {
  hideEl(saveSuccessMsg);
  hideEl(saveErrorMsg);

  const classId = classSelect.value;
  if (!classId) {
    alert('Please select a class first.');
    return;
  }
  currentClassId = classId;

  try {
    const classData = await apiRequest(`/classes/${classId}`);
    const { name, section } = classData.class;

    const studentsData = await apiRequest(
      `/students?${new URLSearchParams({ className: name, section }).toString()}`
    );

    if (!studentsData.students.length) {
      hideEl(markingTableWrapper);
      showEl(noStudentsState);
      return;
    }

    hideEl(noStudentsState);
    renderMarkingTable(studentsData.students);
    showEl(markingTableWrapper);
  } catch (err) {
    alert(err.message);
  }
});

function renderMarkingTable(students) {
  markingTableBody.innerHTML = '';
  students.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.rollNumber}</td>
      <td>${s.firstName} ${s.lastName}</td>
      <td>
        <select data-student-id="${s._id}" class="status-select">
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="leave">Leave</option>
        </select>
      </td>
      <td><input type="text" data-remarks-id="${s._id}" placeholder="Optional"></td>
    `;
    markingTableBody.appendChild(tr);
  });
}

saveAttendanceBtn.addEventListener('click', async () => {
  hideEl(saveSuccessMsg);
  hideEl(saveErrorMsg);

  const statusSelects = markingTableBody.querySelectorAll('.status-select');
  const records = Array.from(statusSelects).map((sel) => {
    const studentId = sel.getAttribute('data-student-id');
    const remarksInput = markingTableBody.querySelector(`[data-remarks-id="${studentId}"]`);
    return {
      studentId,
      status: sel.value,
      remarks: remarksInput ? remarksInput.value.trim() : '',
    };
  });

  try {
    await apiRequest('/attendance/mark', {
      method: 'POST',
      body: { classId: currentClassId, date: dateInput.value, records },
    });
    showEl(saveSuccessMsg);
  } catch (err) {
    saveErrorMsg.textContent = err.message;
    showEl(saveErrorMsg);
  }
});

studentSelect.addEventListener('change', () => {
  if (studentSelect.value) {
    loadAttendanceHistory(studentSelect.value);
  } else {
    historyTableBody.innerHTML = '';
    hideEl(summaryStats);
    hideEl(historyEmptyState);
  }
});

async function loadOwnAttendance() {
  try {
    const data = await apiRequest('/students'); // scoped to own record for student role
    if (!data.students.length) {
      showEl(historyEmptyState);
      return;
    }
    const ownStudentId = data.students[0]._id;
    loadAttendanceHistory(ownStudentId);
  } catch (err) {
    historyEmptyState.textContent = err.message;
    showEl(historyEmptyState);
  }
}

async function loadAttendanceHistory(studentId) {
  try {
    const data = await apiRequest(`/attendance/student/${studentId}`);
    renderSummary(data.summary);
    renderHistory(data.attendance);
  } catch (err) {
    historyTableBody.innerHTML = '';
    hideEl(summaryStats);
    historyEmptyState.textContent = err.message;
    showEl(historyEmptyState);
  }
}

function renderSummary(summary) {
  summaryStats.innerHTML = `
    <div class="stat-card"><div class="stat-value">${summary.present}</div><div class="stat-label">Present</div></div>
    <div class="stat-card"><div class="stat-value">${summary.absent}</div><div class="stat-label">Absent</div></div>
    <div class="stat-card"><div class="stat-value">${summary.late}</div><div class="stat-label">Late</div></div>
    <div class="stat-card"><div class="stat-value">${summary.leave}</div><div class="stat-label">Leave</div></div>
  `;
  showEl(summaryStats);
}

function renderHistory(records) {
  historyTableBody.innerHTML = '';

  if (!records.length) {
    showEl(historyEmptyState);
    return;
  }
  hideEl(historyEmptyState);

  records.forEach((r) => {
    const tr = document.createElement('tr');
    const dateStr = new Date(r.date).toLocaleDateString();
    tr.innerHTML = `
      <td>${dateStr}</td>
      <td style="text-transform:capitalize;">${r.status}</td>
      <td>${r.remarks || '-'}</td>
    `;
    historyTableBody.appendChild(tr);
  });
}
