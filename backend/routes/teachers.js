const express = require('express');
const Teacher = require('../models/Teacher');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All teacher routes require login
router.use(protect);

// @route   GET /api/teachers
// @desc    List all teachers
// @access  Admin, Teacher (teachers can see colleague directory)
router.get('/', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { subjectSpecialization: { $regex: search, $options: 'i' } },
      ];
    }

    const teachers = await Teacher.find(filter).sort({ firstName: 1 });
    res.json({ count: teachers.length, teachers });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching teachers', error: err.message });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get a single teacher by ID
// @access  Admin, Teacher
router.get('/:id', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ teacher });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching teacher', error: err.message });
  }
});

// @route   POST /api/teachers
// @desc    Create a new teacher
// @access  Admin only
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.status(201).json({ teacher });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A teacher with this email already exists' });
    }
    res.status(400).json({ message: 'Error creating teacher', error: err.message });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update a teacher
// @access  Admin only
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ teacher });
  } catch (err) {
    res.status(400).json({ message: 'Error updating teacher', error: err.message });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Deactivate (soft-delete) a teacher
// @access  Admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting teacher', error: err.message });
  }
});

module.exports = router;
