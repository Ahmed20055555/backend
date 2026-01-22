import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esdaly';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@esdaly.com';
    const newPassword = 'admin123';

    // Find user
    let user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found! Creating new admin...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      user = await User.create({
        name: 'Super Admin',
        email: email,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        phone: '+966501234567'
      });
      
      console.log('✅ Admin user created!');
    } else {
      console.log('📋 User found, resetting password...');
      
      // Reset password using updateOne to bypass pre-save hook
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await User.updateOne(
        { email },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            isActive: true
          } 
        }
      );
      
      console.log('✅ Password reset successfully!');
    }

    // Verify using direct bcrypt comparison
    const verifyUser = await User.findOne({ email }).select('+password');
    const directMatch = await bcrypt.compare(newPassword, verifyUser.password);
    const methodMatch = await verifyUser.comparePassword(newPassword);
    
    console.log('\n🔐 Verification:');
    console.log('   Email:', verifyUser.email);
    console.log('   Role:', verifyUser.role);
    console.log('   Direct bcrypt test:', directMatch ? '✅ PASSED' : '❌ FAILED');
    console.log('   Method test:', methodMatch ? '✅ PASSED' : '❌ FAILED');
    
    if (directMatch || methodMatch) {
      console.log('\n✅ SUCCESS! You can now login with:');
      console.log('   Email: admin@esdaly.com');
      console.log('   Password: admin123');
    } else {
      console.log('\n⚠️  Still having issues. Trying one more time...');
      // Force save without pre-save hook
      const salt2 = await bcrypt.genSalt(10);
      const hashed2 = await bcrypt.hash(newPassword, salt2);
      await User.updateOne(
        { email },
        { $set: { password: hashed2 } }
      );
      console.log('✅ Password updated directly in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();
