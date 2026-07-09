const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Mathematics"
    code: { type: String, trim: true, uppercase: true }, // e.g. "MATH101"
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.index({ name: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
