// // models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

// const userSchema = new mongoose.Schema({
//   firstName: { type: String, required: true },
//   lastName: { type: String, required: true },
//   staffId: { type: String, unique: true, required: true },
//   email: { type: String, unique: true, required: true },
//   username: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['Admin', 'User'], default: 'User' },
// }, { timestamps: true });

// // Hash password before saving user
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// const User = mongoose.model('User', userSchema);
// module.exports = User;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// const userSchema = new mongoose.Schema({
//   firstName: { type: String, required: true },
//   lastName: { type: String, required: true },
//   staffId: { type: String, unique: true, required: true },
//   email: { type: String, unique: true, required: true },
//   username: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['Admin', 'User'], default: 'User' },
//   isActive: { type: Boolean, default: true },
//   isVerified: {type: Boolean,default: false},verificationToken: String,
//   resetPasswordToken: String,
//   resetPasswordExpires: Date
// }, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  staffId: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true, lowercase: true },
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: false, minlength: 8 },
  role: { type: String, enum: ['Admin', 'User'], default: 'User' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;