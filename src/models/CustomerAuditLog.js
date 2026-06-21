const mongoose = require('mongoose');

const customerAuditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    details: { type: String, default: '' },
    relatedEntityId: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    platform: { type: String, enum: ['Android', 'iOS', 'Web', 'unknown'], default: 'unknown' },
    deviceInfo: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

customerAuditLogSchema.index({ user: 1 });
customerAuditLogSchema.index({ action: 1 });
customerAuditLogSchema.index({ module: 1 });
customerAuditLogSchema.index({ platform: 1 });
customerAuditLogSchema.index({ createdAt: -1 });
customerAuditLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CustomerAuditLog', customerAuditLogSchema);
