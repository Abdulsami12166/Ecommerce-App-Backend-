const Shipment = require('../../models/Shipment');
const Order = require('../../models/Order');
const {
  sendSuccess,
  sendError,
  sendServerError,
} = require('../../utils/feedback');
const { auditAction, auditError } = require('../../utils/workflow');

/**
 * Get all shipments
 */
exports.getAllShipments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, trackingNumber, search, sortBy = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (trackingNumber) {
      query.trackingNumber = { $regex: trackingNumber, $options: 'i' };
    }

    if (search) {
      const orders = await Order.find({
        $or: [
          { razorpayOrderId: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.order = { $in: orders.map(o => o._id) };
    }

    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query)
      .populate('order', 'razorpayOrderId totalAmount')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    return sendSuccess(res, 200, 'Admin shipments fetched successfully', {
      shipments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendServerError(res, error.message, error.stack);
  }
};

/**
 * Get shipment details
 */
exports.getShipmentDetails = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await Shipment.findById(shipmentId)
      .populate({
        path: 'order',
        populate: { path: 'user', select: 'name email phone' }
      });

    if (!shipment) {
      return sendError(res, 404, 'Shipment not found');
    }

    return sendSuccess(res, 200, 'Shipment details fetched successfully', { shipment });
  } catch (error) {
    return sendServerError(res, error.message, error.stack);
  }
};

/**
 * Create shipment for order
 */
exports.createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { carrier, estimatedDeliveryDate, weight, dimensions, trackingNumber, isInsured, insuranceCost, cost } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if shipment already exists
    const existingShipment = await Shipment.findOne({ order: orderId });
    if (existingShipment) {
      return res.status(400).json({ success: false, message: 'Shipment already exists for this order' });
    }

    const shipment = new Shipment({
      order: orderId,
      carrier: carrier || 'Standard',
      trackingNumber,
      estimatedDeliveryDate: new Date(estimatedDeliveryDate),
      weight,
      dimensions,
      shippingAddress: req.body.shippingAddress,
      isInsured,
      insuranceCost,
      cost,
      trackingEvents: [
        {
          status: 'created',
          location: 'Origin Facility',
          description: 'Shipment created',
          createdBy: req.adminUser._id
        }
      ]
    });

    await shipment.save();

    // Update order status and status history
    order.orderStatus = 'shipped';
    order.statusHistory = [
      ...(Array.isArray(order.statusHistory) ? order.statusHistory : []).filter(
        item => item.status !== 'shipped',
      ),
      {
        status: 'shipped',
        label: 'Shipped',
        timestamp: new Date(),
      },
    ];
    await order.save();

    // Emit socket events for real-time tracking updates
    const payload = {
      orderId: String(order._id),
      userId: String(order.user),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      statusHistory: order.statusHistory || [],
      updatedAt: order.updatedAt,
    };

    try {
      const { emitToAdmins, emitToUser, socketEvents } = require('../../shared/events/eventBus');
      emitToAdmins(req.app, socketEvents.LEGACY.ORDER_STATUS_CHANGED, payload);
      emitToAdmins(req.app, socketEvents.DOMAIN.ORDER_UPDATED, payload);
      emitToUser(req.app, order.user, socketEvents.DOMAIN.ORDER_UPDATED, payload);
    } catch (socketErr) {
      // Log socket error but don't fail the request
      console.error('Socket emission failed in createShipment:', socketErr.message);
    }

    await auditAction(req, 'create_shipment', 'shipment', shipment._id, null, shipment.toObject(), {
      resourcePath: `/api/admin/shipments/${orderId}`,
    });

    return sendSuccess(res, 201, 'Shipment created successfully', { shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update tracking status
 */
exports.updateTrackingStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, location, description } = req.body;

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    // Add tracking event
    shipment.trackingEvents.push({
      status,
      location,
      description,
      timestamp: new Date(),
      createdBy: req.adminUser._id
    });

    // Update shipment status
    shipment.status = status;

    // Map shipment status to orderStatus
    let orderStatus = null;
    if (status === 'packed') {
      orderStatus = 'packed';
    } else if (status === 'in_transit') {
      orderStatus = 'shipped';
    } else if (status === 'out_for_delivery') {
      orderStatus = 'out-for-delivery';
    } else if (status === 'delivered') {
      orderStatus = 'delivered';
      shipment.actualDeliveryDate = new Date();
    }

    if (orderStatus) {
      const order = await Order.findById(shipment.order);
      if (order) {
        order.orderStatus = orderStatus;

        const ORDER_STATUS_LABELS = {
          'order-confirmed': 'Order Confirmed',
          packed: 'Packed',
          shipped: 'Shipped',
          'out-for-delivery': 'Out For Delivery',
          delivered: 'Delivered',
        };

        order.statusHistory = [
          ...(Array.isArray(order.statusHistory) ? order.statusHistory : []).filter(
            item => item.status !== orderStatus,
          ),
          {
            status: orderStatus,
            label: ORDER_STATUS_LABELS[orderStatus] || orderStatus,
            timestamp: new Date(),
          },
        ];

        await order.save();

        // Emit socket events for real-time tracking updates
        const payload = {
          orderId: String(order._id),
          userId: String(order.user),
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          statusHistory: order.statusHistory || [],
          updatedAt: order.updatedAt,
        };

        try {
          const { emitToAdmins, emitToUser, socketEvents } = require('../../shared/events/eventBus');
          emitToAdmins(req.app, socketEvents.LEGACY.ORDER_STATUS_CHANGED, payload);
          emitToAdmins(req.app, socketEvents.DOMAIN.ORDER_UPDATED, payload);
          emitToUser(req.app, order.user, socketEvents.DOMAIN.ORDER_UPDATED, payload);
        } catch (socketErr) {
          console.error('Socket emission failed in updateTrackingStatus:', socketErr.message);
        }
      }
    }

    await shipment.save();

    await auditAction(req, 'update_tracking', 'shipment', shipment._id, null, { status, location }, {
      resourcePath: `/api/admin/shipments/${shipmentId}/tracking`,
    });

    return sendSuccess(res, 200, 'Tracking updated successfully', { shipment });
  } catch (error) {
    await auditError(req, 'update_tracking', 'shipment', req.params.shipmentId, error);
    return sendServerError(res, error.message, error.stack);
  }
};

/**
 * Get tracking history
 */
exports.getTrackingHistory = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await Shipment.findById(shipmentId).select('trackingNumber trackingEvents status');
    
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    return sendSuccess(res, 200, 'Shipment tracking history fetched successfully', {
      trackingNumber: shipment.trackingNumber,
      currentStatus: shipment.status,
      trackingEvents: shipment.trackingEvents.sort((a, b) => b.timestamp - a.timestamp),
    });
  } catch (error) {
    return sendServerError(res, error.message, error.stack);
  }
};

/**
 * Get shipments by status
 */
exports.getShipmentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50 } = req.query;

    const shipments = await Shipment.find({ status })
      .populate('order', 'razorpayOrderId totalAmount')
      .limit(parseInt(limit))
      .sort('-createdAt');

    return sendSuccess(res, 200, 'Shipments by status fetched successfully', {
      shipments,
      count: shipments.length,
    });
  } catch (error) {
    return sendServerError(res, error.message, error.stack);
  }
};

/**
 * Get shipment statistics
 */
exports.getShipmentStats = async (req, res) => {
  try {
    const stats = await Shipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Shipment.countDocuments();
    const avgDeliveryTime = await Shipment.aggregate([
      {
        $match: { actualDeliveryDate: { $exists: true } }
      },
      {
        $group: {
          _id: null,
          avgDays: {
            $avg: {
              $divide: [
                { $subtract: ['$actualDeliveryDate', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      }
    ]);

    const byStatus = stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
    return sendSuccess(res, 200, 'Shipment statistics fetched successfully', {
      byStatus,
      pending: byStatus.pending || 0,
      inTransit: byStatus.in_transit || 0,
      delivered: byStatus.delivered || 0,
      failed: byStatus.failed || 0,
      total,
      avgDeliveryTime: avgDeliveryTime[0]?.avgDays || 0,
    });
  } catch (error) {
    return sendServerError(res, error.message, error.stack);
  }
};
