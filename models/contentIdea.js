const mongoose = require('mongoose');

const ContentIdeaSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  postDateNeeded: {
    type: Date,
    required: true
  },
  filmDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Not Started', 'Edited', 'Posted'],
    default: 'Not Started'
  },
  videoConcept: {
    type: String,
    required: true
  },
  hook: {
    type: String,
    required: true
  },
  script: {
    type: String,
    default: ''
  },
  sound: {
    type: String,
    default: ''
  },
  props: {
    type: String,
    default: ''
  },
  syncToGoogle: {
    type: Boolean,
    default: false
  },
  googleCalendarEventId: {
    type: String,
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  sequence: {
    type: Number,
    default: 1
  },
  url: {
    type: String,
    default: ''
  },
  finishedURL: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContentIdea', ContentIdeaSchema); 