require('dotenv').config();

const mongoose = require('mongoose');

const User = require('../src/models/User');

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to seed an admin user.');
  }

  await mongoose.connect(process.env.MONGO_URI);
};

const adminAccounts = [
  {
    name: 'Super Admin',
    email: 'superadmin@company.com',
    role: 'super-admin',
    password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
  },
  {
    name: 'Product Manager',
    email: 'products@company.com',
    role: 'product-manager',
    password: process.env.PRODUCT_MANAGER_PASSWORD || 'ProductManager@123',
  },
  {
    name: 'Support Admin',
    email: 'support@company.com',
    role: 'support',
    password: process.env.SUPPORT_ADMIN_PASSWORD || 'SupportAdmin@123',
  },
];

const seedAdminAccount = async account => {
  const existingUser = await User.findOne({email: account.email}).select('+password +tokenVersion');

  if (existingUser) {
    existingUser.name = account.name;
    existingUser.role = account.role;
    existingUser.blocked = false;
    existingUser.isVerified = true;
    existingUser.password = account.password;
    existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1;

    await existingUser.save();
    return {email: account.email, role: account.role, status: 'updated'};
  }

  await User.create({
    name: account.name,
    email: account.email,
    password: account.password,
    role: account.role,
    isVerified: true,
    blocked: false,
  });

  return {email: account.email, role: account.role, status: 'created'};
};

const seedAdmin = async () => {
  const results = [];

  for (const account of adminAccounts) {
    results.push(await seedAdminAccount(account));
  }

  console.table(results);
};

const main = async () => {
  try {
    await connect();
    await seedAdmin();
  } finally {
    await mongoose.disconnect();
  }
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
