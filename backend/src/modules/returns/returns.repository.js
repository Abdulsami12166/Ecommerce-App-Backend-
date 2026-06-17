const ReturnRequest = require('../../models/ReturnRequest');
const Order = require('../../models/Order');
const Product = require('../../models/Product');

const returnsRepository = {
  async createReturnRequest(returnData) {
    // Verify order exists and belongs to user
    const order = await Order.findById(returnData.order);
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.user.toString() !== returnData.user.toString()) {
      throw new Error('Unauthorized access to order');
    }

    // Validate return items
    for (const item of returnData.returnItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
    }

    const returnRequest = new ReturnRequest(returnData);
    return await returnRequest.save();
  },

  async getReturnRequests(filter = {}) {
    return await ReturnRequest.find(filter)
      .populate('user', 'name email')
      .populate('order', 'code totalAmount status')
      .populate('returnItems.product', 'name price images')
      .sort({ createdAt: -1 });
  },

  async getReturnRequestById(returnId) {
    return await ReturnRequest.findById(returnId)
      .populate('user', 'name email')
      .populate('order', 'code totalAmount status')
      .populate('returnItems.product', 'name price images');
  },

  async updateReturnStatus(returnId, status, adminNotes, rejectionReason) {
    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    if (status === 'shipped') {
      updateData.shippedAt = new Date();
    }
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    return await ReturnRequest.findByIdAndUpdate(
      returnId,
      updateData,
      { new: true }
    ).populate('user', 'name email')
     .populate('order', 'code totalAmount status')
     .populate('returnItems.product', 'name price images');
  },
};

module.exports = returnsRepository;
