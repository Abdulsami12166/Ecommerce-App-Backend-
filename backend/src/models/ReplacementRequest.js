const mongoose = require('mongoose');

const replacementItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    originalProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, trim: true, default: 'Not specified' },
    condition: { type: String, trim: true, default: 'Good' },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  { _id: false },
);

const replacementRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    replacementItems: { type: [replacementItemSchema], default: [] },
    status: {
      type: String,
      enum: ['initiated', 'approved', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'initiated',
    },
    pickupAddress: addressSchema,
    images: [{ type: String }],
    adminNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ReplacementRequest', replacementRequestSchema);
