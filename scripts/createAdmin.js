const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fantabeach.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    // Check if admin already exists by email
    let existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.isAdmin = true;
      existingAdmin.isVerified = true;
      // Always update password if provided
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash(adminPassword, salt);
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`👤 Username: ${existingAdmin.username}`);
      console.log(`🔑 Password: ${adminPassword}`);
    } else {
      // Check if username already exists
      const existingUsername = await User.findOne({ username: adminUsername });
      
      if (existingUsername) {
        // Update existing user with this username
        existingUsername.email = adminEmail;
        existingUsername.isAdmin = true;
        existingUsername.isVerified = true;
        const salt = await bcrypt.genSalt(10);
        existingUsername.password = await bcrypt.hash(adminPassword, salt);
        await existingUsername.save();
        console.log('✅ Admin user updated successfully!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`👤 Username: ${adminUsername}`);
        console.log(`🔑 Password: ${adminPassword}`);
      } else {
        // Create new admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const admin = await User.create({
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          isAdmin: true,
          isVerified: true
        });

        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`👤 Username: ${adminUsername}`);
        console.log(`🔑 Password: ${adminPassword}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

