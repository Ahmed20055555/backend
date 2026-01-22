import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders (user's orders or all orders for admin)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلبات',
      error: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذا الطلب'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلب',
      error: error.message
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, [
  body('items').isArray({ min: 1 }).withMessage('يجب إضافة منتج واحد على الأقل'),
  body('shippingAddress').notEmpty().withMessage('عنوان الشحن مطلوب'),
  body('pricing.total').isFloat({ min: 0 }).withMessage('المجموع الكلي مطلوب')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { items, shippingAddress, billingAddress, pricing, payment, notes, isTest } = req.body;

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'stripe'];
    if (payment?.method && !validPaymentMethods.includes(payment.method)) {
      return res.status(400).json({
        success: false,
        message: 'طريقة الدفع غير صحيحة'
      });
    }

    // Validate bank transfer transaction ID if method is bank_transfer
    if (payment?.method === 'bank_transfer' && !payment?.transactionId) {
      return res.status(400).json({
        success: false,
        message: 'رقم المعاملة مطلوب للتحويل البنكي'
      });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.product) {
        console.error('❌ Missing product ID in item:', item);
        return res.status(400).json({
          success: false,
          message: 'معرف المنتج مفقود في أحد العناصر'
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        console.error('❌ Product not found:', item.product);
        return res.status(400).json({
          success: false,
          message: `المنتج غير موجود (ID: ${item.product})`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `المنتج ${product.name} غير متاح حالياً`
        });
      }

      // Check stock (skip in test mode)
      if (!isTest && product.stock.trackInventory && product.stock.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `الكمية المتاحة من ${product.name} غير كافية`
        });
      }

      const itemPrice = product.price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: product.images[0]?.url || '',
        variant: item.variant || null
      });
    }

    // Calculate final pricing
    const finalPricing = {
      subtotal: pricing.subtotal || subtotal,
      shipping: pricing.shipping || 0,
      tax: pricing.tax || 0,
      discount: pricing.discount || 0,
      total: pricing.total || (subtotal + (pricing.shipping || 0) + (pricing.tax || 0) - (pricing.discount || 0))
    };

    // Create order
    console.log('📝 Creating order with data:', {
      itemsCount: orderItems.length,
      isTest: isTest || false,
      paymentMethod: payment?.method || 'cash'
    });

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      pricing: finalPricing,
      payment: {
        method: payment?.method || 'cash',
        status: 'pending',
        ...(payment?.transactionId && { transactionId: payment.transactionId }),
        ...(payment?.accountNumber && { accountNumber: payment.accountNumber })
      },
      notes,
      isTest: isTest || false
    });

    console.log('✅ Order created successfully:', order.orderNumber);

    // Update product stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product && product.stock.trackInventory) {
        product.stock.quantity -= item.quantity;
        product.sales.count += item.quantity;
        product.sales.revenue += product.price * item.quantity;
        await product.save();
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name images price')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: isTest 
        ? 'تم إنشاء الطلب التجريبي بنجاح (Test Mode)' 
        : 'تم إنشاء الطلب بنجاح',
      order: populatedOrder,
      isTest: isTest || false
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    console.error('Error stack:', error.stack);
    
    // Return detailed error message
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: 'خطأ في إنشاء الطلب',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.toString()
      })
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('حالة الطلب غير صحيحة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    const { status, trackingNumber, estimatedDelivery } = req.body;

    order.status = status;

    if (status === 'shipped' && !order.shipping.shippedAt) {
      order.shipping.shippedAt = new Date();
    }

    if (status === 'delivered' && !order.shipping.deliveredAt) {
      order.shipping.deliveredAt = new Date();
    }

    if (status === 'cancelled' && !order.cancelledAt) {
      order.cancelledAt = new Date();
      // Restore stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && product.stock.trackInventory) {
          product.stock.quantity += item.quantity;
          product.sales.count -= item.quantity;
          product.sales.revenue -= item.price * item.quantity;
          await product.save();
        }
      }
    }

    if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.shipping.estimatedDelivery = new Date(estimatedDelivery);

    await order.save();

    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الطلب',
      error: error.message
    });
  }
});

export default router;
