const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
