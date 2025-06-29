const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  googleCalendarTokens: {
    type: Object,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'superuser'],
    default: 'user'
  }
});

module.exports = mongoose.model('User', UserSchema);