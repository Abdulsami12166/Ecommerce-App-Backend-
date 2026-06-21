const CustomerAuditLog = require('../../models/CustomerAuditLog');
const Order = require('../../models/Order');
const User = require('../../models/User');
const SupportTicket = require('../../models/SupportTicket');
const { sendSuccess, sendError, sendServerError } = require('../../utils/feedback');

exports.getCustomerAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const { module, action, platform, search } = req.query;

    let query = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (platform) query.platform = platform;
    
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = users.map(u => String(u._id));
      
      query.$or = [
        { details: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }

    const total = await CustomerAuditLog.countDocuments(query);
    const logs = await CustomerAuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const resolvedLogs = await Promise.all(logs.map(async (log) => {
      const obj = log.toObject();
      if (typeof obj.user === 'string') {
        const u = await User.findById(obj.user).select('name email role');
        if (u) obj.user = u.toObject();
      }
      return obj;
    }));

    return sendSuccess(res, 200, 'Customer audit logs fetched successfully', {
      logs: resolvedLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getSingleCustomerAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    
    let userQuery = id;
    try {
      const { ObjectId } = require('mongoose').Types;
      userQuery = { $in: [id, new ObjectId(id)] };
    } catch (e) {}
    
    const query = { user: userQuery };
    const total = await CustomerAuditLog.countDocuments(query);
    const logs = await CustomerAuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, 'Single customer audit logs fetched successfully', {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerHistorySummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = id;

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    const userDoc = await User.findById(userId).populate('wishlist');
    const wishlist = userDoc ? userDoc.wishlist : [];

    const tickets = await SupportTicket.find({ user: userId }).sort({ createdAt: -1 });

    let userQuery = userId;
    try {
      const { ObjectId } = require('mongoose').Types;
      userQuery = { $in: [userId, new ObjectId(userId)] };
    } catch (e) {}

    const loginHistory = await CustomerAuditLog.find({
      user: userQuery,
      action: 'login'
    }).sort({ createdAt: -1 });

    const timeline = await CustomerAuditLog.find({
      user: userQuery
    }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Customer history summary fetched successfully', {
      orders,
      wishlist,
      tickets,
      loginHistory,
      timeline
    });
  } catch (error) {
    next(error);
  }
};
