import express from 'express';
import { body, validationResult } from 'express-validator';
import Review from '../models/Review.model.js';
import Order from '../models/Order.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get reviews for a product
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { productId, page = 1, limit = 10 } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المنتج مطلوب'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ 
      product: productId, 
      isApproved: true 
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments({ 
      product: productId, 
      isApproved: true 
    });

    res.json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التقييمات',
      error: error.message
    });
  }
});

// @route   POST /api/reviews
// @desc    Create new review
// @access  Private
router.post('/', protect, [
  body('product').notEmpty().withMessage('المنتج مطلوب'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
  body('comment').trim().notEmpty().withMessage('التعليق مطلوب')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { product, order, rating, title, comment, images } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'لقد قمت بتقييم هذا المنتج من قبل'
      });
    }

    // Check if user has ordered this product (for verified purchase)
    let isVerified = false;
    if (order) {
      const userOrder = await Order.findOne({
        _id: order,
        user: req.user._id,
        status: 'delivered'
      });
      if (userOrder) {
        const hasProduct = userOrder.items.some(item => 
          item.product.toString() === product
        );
        isVerified = hasProduct;
      }
    }

    const review = await Review.create({
      user: req.user._id,
      product,
      order: order || null,
      rating: parseInt(rating),
      title: title || '',
      comment,
      images: images || [],
      isVerified,
      isApproved: true
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      review: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة التقييم',
      error: error.message
    });
  }
});

// @route   PUT /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.put('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'التقييم غير موجود'
      });
    }

    const userId = req.user._id.toString();
    const hasMarked = review.helpful.users.some(id => id.toString() === userId);

    if (hasMarked) {
      // Remove helpful
      review.helpful.users = review.helpful.users.filter(id => id.toString() !== userId);
      review.helpful.count = Math.max(0, review.helpful.count - 1);
    } else {
      // Add helpful
      review.helpful.users.push(req.user._id);
      review.helpful.count += 1;
    }

    await review.save();

    res.json({
      success: true,
      helpful: review.helpful
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث التقييم',
      error: error.message
    });
  }
});

export default router;
