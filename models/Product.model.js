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
    lowercase: true
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
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\u0621-\u064A0-9-]/g, '');
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
