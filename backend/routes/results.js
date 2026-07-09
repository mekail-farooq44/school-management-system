const express = require('express');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Simple percentage-based letter grade
function computeGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function attachGrade(resultDoc, exam) {
  const percentage = (resultDoc.marksObtained / exam.maxMarks) * 100;
  return {
    ...resultDoc.toObject(),
    maxMarks: exam.maxMarks,
    percentage: Math.round(percentage * 100) / 100,
    grade: computeGrade(percentage),
    passed: resultDoc.marksObtained >= exam.passMarks,
  };
}

// @route   POST /api/results/enter
// @desc    Enter/update marks for multiple students for one exam (upsert)
// @body    { examId, records: [{ studentId, marksObtained, remarks }] }
// @access  Admin, Teacher
router.post('/enter', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { examId, records } = req.body;

    if (!examId || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'examId and a non-empty records array are required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const invalid = records.find((r) => r.marksObtained > exam.maxMarks || r.marksObtained < 0);
    if (invalid) {
      return res.status(400).json({ message: `Marks must be between 0 and ${exam.maxMarks}` });
    }

    const results = await Promise.all(
      records.map(({ studentId, marksObtained, remarks }) =>
        Result.findOneAndUpdate(
          { examId, studentId },
          { examId, studentId, marksObtained, remarks, gradedBy: req.user._id },
          { upsert: true, new: true, runValidators: true }
        )
      )
    );

    res.json({
      message: 'Results saved successfully',
      count: results.length,
      results: results.map((r) => attachGrade(r, exam)),
    });
  } catch (err) {
    res.status(400).json({ message: 'Error saving results', error: err.message });
  }
});

// @route   GET /api/results?examId=...
// @desc    Get all results for a given exam
// @access  Admin, Teacher
router.get('/', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { examId } = req.query;
    if (!examId) return res.status(400).json({ message: 'examId query param is required' });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const results = await Result.find({ examId }).populate('studentId', 'firstName lastName rollNumber');
    res.json({ count: results.length, exam, results: results.map((r) => attachGrade(r, exam)) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching results', error: err.message });
  }
});

// @route   GET /api/results/student/:studentId
// @desc    Get a student's full result history across all exams
// @access  Admin, Teacher (any student); Student (own record only)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userAccount: req.user._id });
      if (!student || String(student._id) !== String(studentId)) {
        return res.status(403).json({ message: 'Forbidden: cannot view another student\'s results' });
      }
    }

    const results = await Result.find({ studentId }).populate({
      path: 'examId',
      select: 'name examDate maxMarks passMarks subjectId classId',
      populate: { path: 'subjectId', select: 'name code' },
    });

    const withGrades = results
      .filter((r) => r.examId) // guard against exams that were hard-deleted
      .map((r) => attachGrade(r, r.examId));

    res.json({ count: withGrades.length, results: withGrades });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student results', error: err.message });
  }
});

module.exports = router;
