const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String, default: 'M' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'paid',
        'processing',
        'order-confirmed',
        'packed',
        'shipped',
        'near-delivery',
        'out-for-delivery',
        'delivered',
        'cancelled',
        'failed',
        'returned',
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        label: { type: String, default: '' },
        timestamp: { type: Date, required: true, default: Date.now },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String, default: 'card' },
    paymentReference: { type: String, default: '' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '', select: false },
    transactionStatus: {
      type: String,
      enum: ['pending', 'authorized', 'paid', 'failed'],
      default: 'pending',
    },
    transactionVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
