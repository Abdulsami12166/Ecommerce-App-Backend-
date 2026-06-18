const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' }); // Assuming there is a .env file

const Inventory = require('./src/models/Inventory');
const Shipment = require('./src/models/Shipment');
const SupportTicket = require('./src/models/SupportTicket');
const Product = require('./src/models/Product');
const User = require('./src/models/User');
const Order = require('./src/models/Order');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get an admin and user
    const admin = await User.findOne({ role: { $in: ['admin', 'super-admin'] } });
    const user = await User.findOne({ role: 'user' });
    const product = await Product.findOne();

    if (!admin || !user || !product) {
      console.log('Need at least 1 admin, 1 user, 1 product to seed data.');
      process.exit(1);
    }

    // Seed Inventory
    if (await Inventory.countDocuments() === 0) {
      console.log('Seeding Inventory...');
      const products = await Product.find().limit(2);
      const inventoryData = [
        {
          product: products[0]._id,
          currentStock: 5,
          reorderLevel: 10,
          reorderQuantity: 50,
          lastRestockedAt: new Date(),
          lastRestockedBy: admin._id,
          stockMovements: [{ type: 'in', quantity: 50, reason: 'Initial load', createdBy: admin._id }]
        }
      ];
      if (products.length > 1) {
        inventoryData.push({
          product: products[1]._id,
          currentStock: 100,
          reorderLevel: 20,
          reorderQuantity: 100,
          lastRestockedAt: new Date(),
          lastRestockedBy: admin._id
        });
      }
      await Inventory.create(inventoryData);
    }

    // Seed Shipment
    if (await Shipment.countDocuments() === 0) {
      const order = await Order.findOne() || await Order.create({
        user: user._id,
        items: [{ product: product._id, title: product.title, quantity: 1, price: product.price }],
        subtotal: product.price,
        totalAmount: product.price,
        paymentMethod: 'card',
      });

      console.log('Seeding Shipments...');
      await Shipment.create({
        order: order._id,
        trackingNumber: 'TRK123456789',
        carrier: 'FedEx',
        status: 'in_transit',
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        shippingAddress: {
          name: 'John Doe',
          phone: '+919999999999',
          address: '123 Test St',
          city: 'Testville',
          state: 'Tamil Nadu',
          postalCode: '12345',
          country: 'India'
        },
        trackingEvents: [{ status: 'in_transit', location: 'Warehouse', description: 'Package left facility' }]
      });
    }

    // Seed Tickets
    if (await SupportTicket.countDocuments() === 0) {
      console.log('Seeding Support Tickets...');
      await SupportTicket.create([
        {
          user: user._id,
          subject: 'Issue with delivery',
          description: 'My package is late, please help.',
          status: 'open',
          priority: 'high',
          category: 'delivery',
          messages: [{ sender: user._id, senderModel: 'User', message: 'My package is late, please help.' }]
        },
        {
          user: user._id,
          subject: 'Refund request',
          description: 'Item is damaged.',
          status: 'in_progress',
          priority: 'medium',
          category: 'refund',
          assignedTo: admin._id
        }
      ]);
    }

    console.log('Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
