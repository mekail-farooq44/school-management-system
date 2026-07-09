const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Normalize a date to midnight UTC so one record exists per calendar day
function normalizeDate(dateInput) {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// @route   POST /api/attendance/mark
// @desc    Mark attendance for multiple students in a class on a given date (upsert)
// @body    { classId, date, records: [{ studentId, status, remarks }] }
// @access  Admin, Teacher
router.post('/mark', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { classId, date, records } = req.body;

    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'classId, date, and a non-empty records array are required' });
    }

    const day = normalizeDate(date);

    const results = await Promise.all(
      records.map(async ({ studentId, status, remarks }) => {
        return Attendance.findOneAndUpdate(
          { studentId, date: day },
          { studentId, classId, date: day, status, remarks, markedBy: req.user._id },
          { upsert: true, new: true, runValidators: true }
        );
      })
    );

    res.json({ message: 'Attendance marked successfully', count: results.length, attendance: results });
  } catch (err) {
    res.status(400).json({ message: 'Error marking attendance', error: err.message });
  }
});

// @route   GET /api/attendance?classId=...&date=YYYY-MM-DD
// @desc    Get attendance for an entire class on a given date
// @access  Admin, Teacher
router.get('/', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) {
      return res.status(400).json({ message: 'classId and date query params are required' });
    }

    const day = normalizeDate(date);
    const records = await Attendance.find({ classId, date: day }).populate(
      'studentId',
      'firstName lastName rollNumber'
    );

    res.json({ count: records.length, date: day, attendance: records });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance', error: err.message });
  }
});

// @route   GET /api/attendance/student/:studentId?from=YYYY-MM-DD&to=YYYY-MM-DD
// @desc    Get a specific student's attendance history
// @access  Admin, Teacher (any student); Student (own record only)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { from, to } = req.query;

    // Students may only view their own attendance
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userAccount: req.user._id });
      if (!student || String(student._id) !== String(studentId)) {
        return res.status(403).json({ message: 'Forbidden: cannot view another student\'s attendance' });
      }
    }

    const filter = { studentId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = normalizeDate(from);
      if (to) filter.date.$lte = normalizeDate(to);
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    const summary = records.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { present: 0, absent: 0, leave: 0, late: 0 }
    );

    res.json({ count: records.length, summary, attendance: records });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student attendance', error: err.message });
  }
});

module.exports = router;
