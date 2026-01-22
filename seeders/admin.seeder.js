import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esdaly';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@esdaly.com' });
    
    if (existingAdmin) {
      // Update existing user to ensure it's admin
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('✅ Admin user already exists - Updated to admin role');
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Use insertOne to bypass pre-save hook
      await User.collection.insertOne({
        name: 'Super Admin',
        email: 'admin@esdaly.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        phone: '+966501234567',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Super Admin user created successfully!');
      console.log('📧 Email: admin@esdaly.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the password after first login!');
    }

    // Display admin user info
    const admin = await User.findOne({ email: 'admin@esdaly.com' }).select('-password');
    console.log('\n📋 Admin User Details:');
    console.log(JSON.stringify(admin, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

// Run seeder
createAdminUser();
