const express = require('express');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All student routes require login
router.use(protect);

// @route   GET /api/students
// @desc    List students (admin/teacher see all, student/parent see limited view)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { className, section, search } = req.query;
    const filter = { isActive: true };

    if (className) filter.className = className;
    if (section) filter.section = section;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Students can only view their own record
    if (req.user.role === 'student') {
      filter.userAccount = req.user._id;
    }
    // Parents: simplified — in a full implementation, link parent to specific children.
    // For now, parents see only students explicitly linked via userAccount matching a future Parent-Student link.

    const students = await Student.find(filter).sort({ className: 1, section: 1, rollNumber: 1 });
    res.json({ count: students.length, students });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

// @route   GET /api/students/:id
// @desc    Get a single student by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (req.user.role === 'student' && String(student.userAccount) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: cannot view another student\'s record' });
    }

    res.json({ student });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student', error: err.message });
  }
});

// @route   POST /api/students
// @desc    Create a new student
// @access  Admin, Teacher
router.post('/', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A student with this roll number already exists in this class/section' });
    }
    res.status(400).json({ message: 'Error creating student', error: err.message });
  }
});

// @route   PUT /api/students/:id
// @desc    Update a student
// @access  Admin, Teacher
router.put('/:id', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ student });
  } catch (err) {
    res.status(400).json({ message: 'Error updating student', error: err.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Deactivate (soft-delete) a student
// @access  Admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting student', error: err.message });
  }
});

module.exports = router;
