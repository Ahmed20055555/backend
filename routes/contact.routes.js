import express from 'express';
import { body, validationResult } from 'express-validator';
import Contact from '../models/Contact.model.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Create new contact message
// @access  Public
router.post('/', [
  body('name').trim().notEmpty().withMessage('الاسم مطلوب'),
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('message').trim().notEmpty().withMessage('الرسالة مطلوبة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, phone, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      phone: phone || undefined,
      message
    });

    res.status(201).json({
      success: true,
      message: 'تم إرسال رسالتك بنجاح',
      contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال الرسالة',
      error: error.message
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الرسائل',
      error: error.message
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get single contact message
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    // Mark as read
    if (!contact.isRead) {
      contact.isRead = true;
      contact.status = 'read';
      await contact.save();
    }

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الرسالة',
      error: error.message
    });
  }
});

// @route   PUT /api/contact/:id/status
// @desc    Update contact message status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), [
  body('status').isIn(['new', 'read', 'replied', 'archived']).withMessage('حالة غير صحيحة')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    contact.status = req.body.status;
    if (req.body.status === 'read' || req.body.status === 'replied') {
      contact.isRead = true;
    }
    await contact.save();

    res.json({
      success: true,
      message: 'تم تحديث حالة الرسالة',
      contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الرسالة',
      error: error.message
    });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact message
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    await contact.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الرسالة',
      error: error.message
    });
  }
});

export default router;
