const Inventory = require('../../models/Inventory');
const Product = require('../../models/Product');
const AuditLog = require('../../models/AuditLog');

const syncInventoryWithProducts = async () => {
  try {
    const products = await Product.find({}).select('_id stock');
    const existingInventories = await Inventory.find({}).select('product');
    const existingProductIds = new Set(existingInventories.map(inv => String(inv.product)));

    const missingProducts = products.filter(p => !existingProductIds.has(String(p._id)));
    if (missingProducts.length > 0) {
      const bulkDocs = missingProducts.map(p => ({
        product: p._id,
        currentStock: p.stock || 0,
        availableStock: p.stock || 0,
        reorderLevel: 10,
        reorderQuantity: 50,
        lowStockAlert: (p.stock || 0) <= 10,
        outOfStockAlert: (p.stock || 0) === 0
      }));
      await Inventory.insertMany(bulkDocs, { ordered: false });
    }
  } catch (err) {
    console.error('Error syncing inventory with products:', err);
  }
};

/**
 * Get all inventory items with pagination
 */
exports.getAllInventory = async (req, res) => {
  try {
    await syncInventoryWithProducts();
    const { page = 1, limit = 20, search, lowStock, sortBy = '-currentStock' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      const products = await Product.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.product = { $in: products.map(p => p._id) };
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    }

    const total = await Inventory.countDocuments(query);
    const inventory = await Inventory.find(query)
      .populate('product', 'title sku category price')
      .populate('lastRestockedBy', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { inventory },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get inventory for a product
 */
exports.getProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;

    const inventory = await Inventory.findOne({ product: productId })
      .populate('product');

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    res.json({ success: true, data: { inventory } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update stock quantity
 */
exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, type = 'in', reason } = req.body; // type: 'in', 'out', 'adjustment'

    let inventory = await Inventory.findOne({ product: productId });

    if (!inventory) {
      inventory = new Inventory({ product: productId, currentStock: 0 });
    }

    const previousStock = inventory.currentStock;

    // Use the model's addMovement method which handles stock updates + saves
    await inventory.addMovement({
      type,
      quantity,
      reason: reason || `${type} movement`,
      performedBy: req.adminUser._id,
    });

    // Log audit
    await AuditLog.create({
      actor: req.adminUser._id,
      action: 'update_stock',
      entityType: 'inventory',
      entityId: inventory._id,
      changes: {
        before: { stock: previousStock },
        after: { stock: inventory.currentStock }
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      resourcePath: `/api/admin/inventory/${productId}/stock`
    });

    res.json({ 
      success: true, 
      data: inventory,
      message: `Stock ${type === 'in' ? 'added' : type === 'out' ? 'removed' : 'adjusted'}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update reorder settings
 */
exports.updateReorderSettings = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reorderLevel, reorderQuantity } = req.body;

    let inventory = await Inventory.findOne({ product: productId });

    if (!inventory) {
      inventory = new Inventory({ product: productId });
    }

    inventory.reorderLevel = reorderLevel;
    inventory.reorderQuantity = reorderQuantity;
    await inventory.save();

    res.json({ success: true, data: { inventory }, message: 'Reorder settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get low stock products
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    })
      .populate('product', 'title sku category price')
      .limit(parseInt(limit))
      .sort('-reorderLevel');

    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get stock movement history
 */
exports.getStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const inventory = await Inventory.findOne({ product: productId });
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    let movements = [...inventory.stockMovements];

    if (type) {
      movements = movements.filter(m => m.type === type);
    }

    if (startDate) {
      movements = movements.filter(m => m.createdAt >= new Date(startDate));
    }

    if (endDate) {
      movements = movements.filter(m => m.createdAt <= new Date(endDate));
    }

    const total = movements.length;
    movements = movements
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: movements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get inventory statistics
 */
exports.getInventoryStats = async (req, res) => {
  try {
    await syncInventoryWithProducts();
    const totalProducts = await Inventory.countDocuments();
    const lowStockCount = await Inventory.countDocuments({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    });
    const outOfStockCount = await Inventory.countDocuments({ currentStock: 0 });

    const totalStock = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$currentStock' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalStock: totalStock[0]?.total || 0,
        healthPercentage: totalProducts > 0 
          ? (((totalProducts - lowStockCount - outOfStockCount) / totalProducts) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
