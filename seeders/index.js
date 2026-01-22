import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import Product from '../models/Product.model.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esdaly';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // ============================================
    // 1. Create Super Admin User
    // ============================================
    console.log('\n📦 Seeding Admin User...');
    const existingAdmin = await User.findOne({ email: 'admin@esdaly.com' });
    
    if (existingAdmin) {
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('✅ Admin user already exists - Updated to admin role');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        name: 'Super Admin',
        email: 'admin@esdaly.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        phone: '+966501234567'
      });

      console.log('✅ Super Admin user created!');
      console.log('   Email: admin@esdaly.com');
      console.log('   Password: admin123');
    }

    // ============================================
    // 2. Create Sample Categories
    // ============================================
    console.log('\n📦 Seeding Categories...');
    const categories = [
      { name: 'سديلات', nameEn: 'Hijabs', description: 'أجود أنواع السديلات' },
      { name: 'عبايات', nameEn: 'Abayas', description: 'عبايات عصرية وأنيقة' },
      { name: 'أغطية رأس', nameEn: 'Head Covers', description: 'أغطية رأس متنوعة' }
    ];

    for (const catData of categories) {
      const existingCategory = await Category.findOne({ name: catData.name });
      if (!existingCategory) {
        await Category.create(catData);
        console.log(`✅ Created category: ${catData.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${catData.name}`);
      }
    }

    // ============================================
    // 3. Create Sample Products (Optional)
    // ============================================
    console.log('\n📦 Seeding Sample Products...');
    const hijabCategory = await Category.findOne({ name: 'سديلات' });
    
    if (hijabCategory) {
      const sampleProducts = [
        {
          name: 'سديلة قطنية فاخرة',
          description: 'سديلة قطنية عالية الجودة، مريحة وأنيقة',
          shortDescription: 'سديلة قطنية فاخرة',
          price: 89.99,
          comparePrice: 120.00,
          category: hijabCategory._id,
          images: [{
            url: '/uploads/products/sample-hijab-1.jpg',
            alt: 'سديلة قطنية',
            isPrimary: true
          }],
          stock: {
            quantity: 50,
            trackInventory: true,
            lowStockThreshold: 10
          },
          attributes: {
            size: ['واحد'],
            color: ['أسود', 'بيج', 'رمادي'],
            material: 'قطن'
          },
          tags: ['قطن', 'فاخر', 'مريح'],
          isActive: true,
          isFeatured: true
        },
        {
          name: 'سديلة شيفون أنيقة',
          description: 'سديلة شيفون خفيفة وأنيقة، مناسبة لجميع المناسبات',
          shortDescription: 'سديلة شيفون أنيقة',
          price: 75.00,
          category: hijabCategory._id,
          images: [{
            url: '/uploads/products/sample-hijab-2.jpg',
            alt: 'سديلة شيفون',
            isPrimary: true
          }],
          stock: {
            quantity: 30,
            trackInventory: true,
            lowStockThreshold: 10
          },
          attributes: {
            size: ['واحد'],
            color: ['أسود', 'أبيض', 'وردي'],
            material: 'شيفون'
          },
          tags: ['شيفون', 'أنيق', 'خفيف'],
          isActive: true,
          isFeatured: false
        }
      ];

      for (const productData of sampleProducts) {
        const existingProduct = await Product.findOne({ name: productData.name });
        if (!existingProduct) {
          await Product.create(productData);
          console.log(`✅ Created product: ${productData.name}`);
        } else {
          console.log(`⏭️  Product already exists: ${productData.name}`);
        }
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Admin User: admin@esdaly.com (Password: admin123)');
    console.log('   - Categories: Created/Updated');
    console.log('   - Sample Products: Created (if categories exist)');
    console.log('\n⚠️  Remember to change the admin password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
