import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم المنتج مطلوب'],
    trim: true
  },
  nameEn: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true  // Allow multiple null/undefined values but enforce uniqueness for non-null values
  },
  description: {
    type: String,
    required: [true, 'وصف المنتج مطلوب'],
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'سعر المنتج مطلوب'],
    min: [0, 'السعر يجب أن يكون أكبر من أو يساوي صفر']
  },
  comparePrice: {
    type: Number,
    default: null
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'الفئة مطلوبة']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  stock: {
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    trackInventory: {
      type: Boolean,
      default: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    }
  },
  variants: [{
    name: String,
    options: [String],
    price: Number
  }],
  attributes: {
    size: [String],
    color: [String],
    material: String,
    brand: String
  },
  tags: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sales: {
    count: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  metaTitle: String,
  metaDescription: String,
  seoKeywords: [String]
}, {
  timestamps: true
});

// Generate slug before saving
productSchema.pre('save', async function(next) {
  // Generate slug if slug is empty or not set (regardless of whether name changed)
  if (!this.slug || this.slug.trim() === '') {
    if (this.name && this.name.trim()) {
      // Create slug from name - support both Arabic and English
      let slug = this.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\u0621-\u064Aa-z0-9-]/g, '') // Keep Arabic, English letters, numbers, and hyphens
        .replace(/-+/g, '-')             // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, '');          // Remove leading/trailing hyphens
      
      // If slug is still empty (e.g., only special characters), use fallback
      if (!slug || slug.trim() === '') {
        slug = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      }
      
      // Ensure slug is unique - if duplicate exists, append number
      let finalSlug = slug;
      let counter = 1;
      const Product = this.constructor;
      
      while (await Product.findOne({ slug: finalSlug, _id: { $ne: this._id } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      
      this.slug = finalSlug;
    } else {
      // Fallback if name is empty (shouldn't happen due to validation)
      this.slug = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
  }
  
  // Final safety check: ensure slug is never empty
  if (!this.slug || this.slug.trim() === '') {
    this.slug = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
  
  next();
});

// Generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku && this.name) {
    const prefix = this.name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `${prefix}-${random}`;
  }
  next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });

export default mongoose.model('Product', productSchema);
