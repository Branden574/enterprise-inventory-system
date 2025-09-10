const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'staff', 'user'], default: 'user' },
  requirePasswordChange: { type: Boolean, default: false }, // Default to false
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
