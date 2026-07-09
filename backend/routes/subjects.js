const express = require('express');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/subjects
// @desc    List all subjects (optionally filtered by classId)
// @access  All logged-in users
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.classId) filter.classId = req.query.classId;

    const subjects = await Subject.find(filter)
      .populate('classId', 'name section')
      .populate('teacherId', 'firstName lastName email')
      .sort({ name: 1 });
    res.json({ count: subjects.length, subjects });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subjects', error: err.message });
  }
});

// @route   GET /api/subjects/:id
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('classId', 'name section')
      .populate('teacherId', 'firstName lastName email');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ subject });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subject', error: err.message });
  }
});

// @route   POST /api/subjects
// @access  Admin only
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ subject });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This subject already exists for this class' });
    }
    res.status(400).json({ message: 'Error creating subject', error: err.message });
  }
});

// @route   PUT /api/subjects/:id
// @access  Admin only
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ subject });
  } catch (err) {
    res.status(400).json({ message: 'Error updating subject', error: err.message });
  }
});

// @route   DELETE /api/subjects/:id
// @access  Admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting subject', error: err.message });
  }
});

module.exports = router;
