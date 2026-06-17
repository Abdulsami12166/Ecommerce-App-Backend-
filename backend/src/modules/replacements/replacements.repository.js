const ReplacementRequest = require('../../models/ReplacementRequest');
const Order = require('../../models/Order');
const Product = require('../../models/Product');

const replacementsRepository = {
  async createReplacementRequest(replacementData) {
    // Verify order exists and belongs to user
    const order = await Order.findById(replacementData.order);
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.user.toString() !== replacementData.user.toString()) {
      throw new Error('Unauthorized access to order');
    }

    // Validate replacement items
    for (const item of replacementData.replacementItems) {
      const originalProduct = await Product.findById(item.originalProduct);
      const newProduct = await Product.findById(item.product);
      if (!originalProduct || !newProduct) {
        throw new Error('Product not found');
      }
    }

    const replacementRequest = new ReplacementRequest(replacementData);
    return await replacementRequest.save();
  },

  async getReplacementRequests(filter = {}) {
    return await ReplacementRequest.find(filter)
      .populate('user', 'name email')
      .populate('order', 'code totalAmount status')
      .populate('replacementItems.product', 'name price images')
      .populate('replacementItems.originalProduct', 'name price images')
      .sort({ createdAt: -1 });
  },

  async getReplacementRequestById(replacementId) {
    return await ReplacementRequest.findById(replacementId)
      .populate('user', 'name email')
      .populate('order', 'code totalAmount status')
      .populate('replacementItems.product', 'name price images')
      .populate('replacementItems.originalProduct', 'name price images');
  },

  async updateReplacementStatus(replacementId, status, adminNotes, rejectionReason, trackingNumber) {
    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    if (status === 'shipped') {
      updateData.shippedAt = new Date();
    }
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    return await ReplacementRequest.findByIdAndUpdate(
      replacementId,
      updateData,
      { new: true }
    ).populate('user', 'name email')
     .populate('order', 'code totalAmount status')
     .populate('replacementItems.product', 'name price images')
     .populate('replacementItems.originalProduct', 'name price images');
  },
};

module.exports = replacementsRepository;
