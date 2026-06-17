const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'damage', 'return'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, trim: true },
    reference: { type: String, trim: true }, // Order ID, etc.
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const inventorySchema = new mongoose.Schema(
  {
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true,
      unique: true 
    },
    currentStock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    availableStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    reorderQuantity: { type: Number, default: 50, min: 1 },
    lowStockAlert: { type: Boolean, default: false },
    outOfStockAlert: { type: Boolean, default: false },
    stockMovements: [stockMovementSchema],
    lastRestockedAt: { type: Date },
    location: { type: String, trim: true }, // Warehouse location
    binLocation: { type: String, trim: true }, // Specific bin/shelf
  },
  { timestamps: true },
);

// Calculate available stock before saving
inventorySchema.pre('save', function(next) {
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  this.lowStockAlert = this.currentStock <= this.reorderLevel;
  this.outOfStockAlert = this.currentStock === 0;
  next();
});

// Method to add stock movement
inventorySchema.methods.addMovement = function(movementData) {
  const movement = {
    ...movementData,
    createdAt: new Date(),
  };
  
  this.stockMovements.push(movement);
  
  // Update stock based on movement type
  switch (movement.type) {
    case 'in':
    case 'return':
      this.currentStock += movement.quantity;
      this.lastRestockedAt = new Date();
      break;
    case 'out':
    case 'damage':
      this.currentStock = Math.max(0, this.currentStock - movement.quantity);
      break;
    case 'adjustment':
      this.currentStock = movement.quantity;
      break;
  }
  
  return this.save();
};

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function() {
  return this.find({ lowStockAlert: true }).populate('product', 'name price category images');
};

// Static method to get out of stock items
inventorySchema.statics.getOutOfStockItems = function() {
  return this.find({ outOfStockAlert: true }).populate('product', 'name price category images');
};

module.exports = mongoose.model('Inventory', inventorySchema);
