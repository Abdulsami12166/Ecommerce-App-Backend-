require('dotenv').config();

const mongoose = require('mongoose');

const User = require('../src/models/User');

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to seed an admin user.');
  }

  await mongoose.connect(process.env.MONGO_URI);
};

const seedAdmin = async () => {
  const name = process.env.ADMIN_SEED_NAME || 'Primary Admin';
  const email = (process.env.ADMIN_SEED_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || '';
  const phone = process.env.ADMIN_SEED_PHONE || '';

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required.');
  }

  const existingUser = await User.findOne({email}).select('+password');

  if (existingUser) {
    existingUser.name = name;
    existingUser.phone = phone;
    existingUser.role = 'admin';
    existingUser.blocked = false;
    existingUser.isVerified = true;

    if (password) {
      existingUser.password = password;
    }

    await existingUser.save();
    console.log(`Updated admin user: ${email}`);
    return;
  }

  await User.create({
    name,
    email,
    password,
    phone,
    role: 'admin',
    isVerified: true,
    blocked: false,
  });

  console.log(`Created admin user: ${email}`);
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
