const express = require('express');
const Exam = require('../models/Exam');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/exams?classId=&subjectId=
// @desc    List exams, optionally filtered by class or subject
// @access  All logged-in users
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;

    const exams = await Exam.find(filter)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .sort({ examDate: -1 });

    res.json({ count: exams.length, exams });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching exams', error: err.message });
  }
});

// @route   GET /api/exams/:id
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ exam });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching exam', error: err.message });
  }
});

// @route   POST /api/exams
// @access  Admin, Teacher
router.post('/', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json({ exam });
  } catch (err) {
    res.status(400).json({ message: 'Error creating exam', error: err.message });
  }
});

// @route   PUT /api/exams/:id
// @access  Admin, Teacher
router.put('/:id', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ exam });
  } catch (err) {
    res.status(400).json({ message: 'Error updating exam', error: err.message });
  }
});

// @route   DELETE /api/exams/:id
// @access  Admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting exam', error: err.message });
  }
});

module.exports = router;
