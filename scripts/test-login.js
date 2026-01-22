import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const testLogin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esdaly';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@esdaly.com';
    const password = 'admin123';

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('Running seeder to create admin...');
      process.exit(1);
    }

    console.log('\n📋 User Found:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   IsActive:', user.isActive);
    console.log('   Has Password:', !!user.password);

    // Test password
    const isMatch = await user.comparePassword(password);
    console.log('\n🔐 Password Test:');
    console.log('   Password "admin123" matches:', isMatch);

    if (!isMatch) {
      console.log('\n⚠️  Password mismatch!');
      console.log('   Trying to reset password...');
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      
      console.log('✅ Password reset! Try logging in again.');
    } else {
      console.log('✅ Password is correct!');
    }

    // Verify again
    const user2 = await User.findOne({ email }).select('+password');
    const isMatch2 = await user2.comparePassword(password);
    console.log('\n✅ Final verification:', isMatch2 ? 'PASSED' : 'FAILED');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testLogin();
