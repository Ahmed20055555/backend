import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح لك بالوصول إلى هذا المسار'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود أو غير نشط'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'رمز الدخول غير صحيح أو منتهي الصلاحية'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطأ في المصادقة'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذا المسار'
      });
    }
    next();
  };
};
