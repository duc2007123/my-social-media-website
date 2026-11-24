import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Strict Auth: rejects if not authenticated
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_traveljournal_btl_2026');
      
      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({ success: false, message: 'Người dùng không tồn tại hoặc đã bị xóa' });
        }
        if (user.isLocked) {
          return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên' });
        }
        req.user = user;
      } else {
        // Fallback user context
        req.user = {
          _id: decoded.id,
          name: 'Thành viên TravelGram',
          role: decoded.id === '65f000000000000000000001' ? 'admin' : 'member',
          following: [],
          followers: []
        };
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Không có quyền truy cập, thiếu token xác thực' });
  }
};

// Optional Auth: if token is present, decode user, otherwise continue as guest (req.user = null)
export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_traveljournal_btl_2026');
      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(decoded.id).select('-password');
        if (user && !user.isLocked) {
          req.user = user;
        }
      } else {
        req.user = {
          _id: decoded.id,
          name: 'Thành viên TravelGram',
          role: decoded.id === '65f000000000000000000001' ? 'admin' : 'member',
          following: [],
          followers: []
        };
      }
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

// Admin only check
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Chỉ Quản trị viên (Admin) mới có quyền thực hiện thao tác này' });
  }
};
