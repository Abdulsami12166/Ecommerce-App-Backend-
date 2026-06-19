const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    // Compatibility fields
    type: { type: String },
    description: { type: String },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ponytail: pre-validate hook to map legacy/alternative fields for simplicity and compatibility
userActivitySchema.pre('validate', function(next) {
  if (!this.action && this.type) {
    this.action = this.type;
  }
  if (!this.details && this.description) {
    this.details = this.description;
  }
  next();
});

module.exports = mongoose.model('UserActivity', userActivitySchema);