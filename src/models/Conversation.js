const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  mediaType: {
    type: String,
    enum: ['text', 'image', 'audio'],
    default: 'text'
  },
  mediaUrl: String
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  messages: [messageSchema],
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  context: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true
});

// Update lastInteraction on every new message
conversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastInteraction = new Date();
  }
  next();
});

// Index for querying recent conversations
conversationSchema.index({ lastInteraction: -1 });

// Method to add a message to the conversation
conversationSchema.methods.addMessage = function(role, content, mediaType = 'text', mediaUrl = null) {
  this.messages.push({
    role,
    content,
    mediaType,
    mediaUrl,
    timestamp: new Date()
  });
  return this.save();
};

// Method to get recent messages for context
conversationSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Method to update context
conversationSchema.methods.updateContext = function(key, value) {
  this.context.set(key, value);
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
