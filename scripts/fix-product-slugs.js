import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.model.js';

dotenv.config();

const generateSlug = (name) => {
  if (!name || !name.trim()) {
    return `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
  
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0621-\u064Aa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (!slug || slug.trim() === '') {
    slug = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
  
  return slug;
};

const fixProductSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products with empty or missing slugs
    const products = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`📦 Found ${products.length} products with empty/missing slugs`);

    for (const product of products) {
      let slug = generateSlug(product.name);
      let counter = 1;
      let finalSlug = slug;

      // Ensure uniqueness
      while (await Product.findOne({ slug: finalSlug, _id: { $ne: product._id } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      product.slug = finalSlug;
      await product.save();
      console.log(`✅ Fixed slug for product: ${product.name} -> ${finalSlug}`);
    }

    console.log('✅ All product slugs fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing slugs:', error);
    process.exit(1);
  }
};

fixProductSlugs();
