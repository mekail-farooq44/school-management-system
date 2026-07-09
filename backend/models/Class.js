const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Grade 5"
    section: { type: String, required: true, trim: true, default: 'A' }, // e.g. "A"
    academicYear: { type: String, trim: true, default: () => `${new Date().getFullYear()}` },
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A given class name + section should be unique per academic year
classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
