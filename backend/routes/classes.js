const express = require('express');
const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/classes
// @desc    List all classes
// @access  All logged-in users
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .populate('classTeacher', 'firstName lastName email')
      .sort({ name: 1, section: 1 });
    res.json({ count: classes.length, classes });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching classes', error: err.message });
  }
});

// @route   GET /api/classes/:id
router.get('/:id', async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate('classTeacher', 'firstName lastName email');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ class: cls });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching class', error: err.message });
  }
});

// @route   POST /api/classes
// @access  Admin only
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const cls = await Class.create(req.body);
    res.status(201).json({ class: cls });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This class + section already exists for this academic year' });
    }
    res.status(400).json({ message: 'Error creating class', error: err.message });
  }
});

// @route   PUT /api/classes/:id
// @access  Admin only
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ class: cls });
  } catch (err) {
    res.status(400).json({ message: 'Error updating class', error: err.message });
  }
});

// @route   DELETE /api/classes/:id
// @access  Admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting class', error: err.message });
  }
});

module.exports = router;
