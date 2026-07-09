const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subjectSpecialization: { type: String, trim: true }, // e.g. "Mathematics"
    qualification: { type: String, trim: true },
    joiningDate: { type: Date, default: Date.now },
    address: { type: String, trim: true },
    assignedClasses: [{ type: String, trim: true }], // e.g. ["Grade 5-A", "Grade 6-B"]
    // Optional link to a User account (for teacher login)
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);
