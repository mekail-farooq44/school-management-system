const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    className: { type: String, required: true, trim: true }, // e.g. "Grade 5"
    section: { type: String, trim: true }, // e.g. "A"
    rollNumber: { type: String, required: true, trim: true },
    contactNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    parentName: { type: String, trim: true },
    parentContact: { type: String, trim: true },
    admissionDate: { type: Date, default: Date.now },
    // Optional link to a User account (for student login)
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate roll numbers within the same class+section
studentSchema.index({ className: 1, section: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
