import express from 'express';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import User from '../models/User.model.js';
import Review from '../models/Review.model.js';
import Category from '../models/Category.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total Revenue
    const revenueResult = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Total Orders
    const totalOrders = await Order.countDocuments(dateFilter);

    // Pending Orders
    const pendingOrders = await Order.countDocuments({
      ...dateFilter,
      status: 'pending'
    });

    // Total Products
    const totalProducts = await Product.countDocuments();

    // Low Stock Products
    const lowStockProducts = await Product.countDocuments({
      'stock.quantity': { $lte: '$stock.lowStockThreshold' },
      'stock.trackInventory': true
    });

    // Total Users
    const totalUsers = await User.countDocuments();

    // New Users (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Revenue by Status
    const revenueByStatus = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$status',
          revenue: { $sum: '$pricing.total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top Selling Products
    const topProducts = await Product.find()
      .sort({ 'sales.count': -1 })
      .limit(5)
      .select('name images sales price')
      .lean();

    // Recent Orders
    const recentOrders = await Order.find(dateFilter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber status pricing.total createdAt')
      .lean();

    // Sales Chart Data (Last 7 days)
    const salesChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate },
            status: { $ne: 'cancelled' }
          }
        },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]);

      salesChartData.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue[0]?.total || 0
      });
    }

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        totalUsers,
        newUsers,
        revenueByStatus,
        topProducts,
        recentOrders,
        salesChartData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/products
// @desc    Get products for dashboard
// @access  Private/Admin
router.get('/products', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments();

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

export default router;
