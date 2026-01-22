import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Product from '../models/Product.model.js';
import Category from '../models/Category.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload, uploadMultiple } from '../utils/upload.js';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional(),
  query('sort').optional().isIn(['price-asc', 'price-desc', 'rating', 'newest', 'popular'])
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Build query
    let query = Product.find(filter);

    // Search
    if (req.query.search) {
      query = query.find({
        $text: { $search: req.query.search }
      });
    }

    // Sort
    const sortBy = req.query.sort || 'newest';
    switch (sortBy) {
      case 'price-asc':
        query = query.sort({ price: 1 });
        break;
      case 'price-desc':
        query = query.sort({ price: -1 });
        break;
      case 'rating':
        query = query.sort({ 'rating.average': -1 });
        break;
      case 'popular':
        query = query.sort({ 'sales.count': -1 });
        break;
      default:
        query = query.sort({ createdAt: -1 });
    }

    // Execute query
    const products = await query
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المنتجات',
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المنتج غير صحيح'
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name avatar'
        },
        options: { sort: { createdAt: -1 }, limit: 10 }
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المنتج',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin
router.post('/', protect, authorize('admin'), uploadMultiple.array('images', 10), [
  body('name').trim().notEmpty().withMessage('اسم المنتج مطلوب'),
  body('description').trim().notEmpty().withMessage('وصف المنتج مطلوب'),
  body('price').isFloat({ min: 0 }).withMessage('السعر يجب أن يكون رقم أكبر من أو يساوي صفر'),
  body('category').optional().notEmpty().withMessage('الفئة مطلوبة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description, shortDescription, price, comparePrice, category, stock, attributes, tags } = req.body;

    // إذا لم تكن هناك فئة، نحاول إنشاء فئة افتراضية أو استخدام فئة موجودة
    let categoryId = category;
    if (!categoryId) {
      // البحث عن فئة افتراضية أو إنشاء واحدة
      let defaultCategory = await Category.findOne({ name: 'عام' });
      
      if (!defaultCategory) {
        defaultCategory = await Category.create({
          name: 'عام',
          nameEn: 'General',
          description: 'فئة عامة للمنتجات',
          isActive: true
        });
      }
      categoryId = defaultCategory._id.toString();
    }

    // Handle images
    const images = req.files?.map((file, index) => ({
      url: `/uploads/products/${file.filename}`,
      alt: name,
      isPrimary: index === 0
    })) || [];

    console.log('📸 Files received:', req.files?.length || 0);
    console.log('📸 Images array:', images);

    // Check if images are provided
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يجب إضافة صورة واحدة على الأقل للمنتج'
      });
    }

    // Parse stock if it's a JSON string
    let stockData = {
      quantity: 0,
      trackInventory: true,
      lowStockThreshold: 10
    };
    
    if (stock) {
      try {
        if (typeof stock === 'string') {
          stockData = JSON.parse(stock);
        } else {
          stockData = stock;
        }
      } catch (e) {
        // If parsing fails, use defaults
        console.error('Error parsing stock:', e);
      }
    }

    const product = await Product.create({
      name,
      description,
      shortDescription,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      category: categoryId,
      images,
      stock: {
        quantity: parseInt(stockData.quantity) || 0,
        trackInventory: stockData.trackInventory !== false,
        lowStockThreshold: parseInt(stockData.lowStockThreshold) || 10
      },
      attributes: attributes ? (typeof attributes === 'string' ? (attributes.trim() ? (() => {
        try {
          return JSON.parse(attributes);
        } catch (e) {
          console.error('Error parsing attributes:', e);
          return {};
        }
      })() : {}) : attributes) : {},
      tags: tags ? (Array.isArray(tags) ? tags : (typeof tags === 'string' && tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : [])) : [],
      isActive: req.body.isActive !== undefined ? (req.body.isActive === 'true' || req.body.isActive === true || req.body.isActive === '1') : true,
      isFeatured: req.body.isFeatured !== undefined ? (req.body.isFeatured === 'true' || req.body.isFeatured === true || req.body.isFeatured === '1') : false
    });

    console.log('✅ Product created successfully:', product.name);
    console.log('📸 Product images:', product.images);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المنتج بنجاح',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء المنتج',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), uploadMultiple.array('images', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    const { name, description, shortDescription, price, comparePrice, category, stock, attributes, tags, isActive, isFeatured } = req.body;

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        alt: name || product.name,
        isPrimary: product.images.length === 0 && index === 0
      }));
      product.images = [...product.images, ...newImages];
    }

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (price) product.price = parseFloat(price);
    if (comparePrice !== undefined) product.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
    if (category) product.category = category;
    if (stock) {
      product.stock = {
        quantity: stock.quantity || product.stock.quantity,
        trackInventory: stock.trackInventory !== undefined ? stock.trackInventory : product.stock.trackInventory,
        lowStockThreshold: stock.lowStockThreshold || product.stock.lowStockThreshold
      };
    }
    if (attributes) product.attributes = JSON.parse(attributes);
    if (tags) product.tags = Array.isArray(tags) ? tags : tags.split(',');
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;

    await product.save();

    res.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث المنتج',
      error: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المنتج',
      error: error.message
    });
  }
});

export default router;
