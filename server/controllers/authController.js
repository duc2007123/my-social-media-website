import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Pre-seeded fallback users for instant offline testing if MongoDB is not connected
const fallbackUsers = [
  {
    _id: '65f000000000000000000001',
    name: 'Quản Trị Viên',
    username: 'admin',
    email: 'admin@travel.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Hệ thống Quản trị Nhật ký Du lịch TravelGram.',
    isLocked: false,
    followers: [],
    following: []
  },
  {
    _id: '65f000000000000000000002',
    name: 'Hoàng Nam',
    username: 'hoangnam_traveler',
    email: 'nam@travel.com',
    passwordHash: bcrypt.hashSync('123456', 10),
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Kẻ mê xê dịch, thích ngắm bình minh trên các cung đèo Tây Bắc 🌄.',
    isLocked: false,
    followers: [],
    following: []
  }
];

// Helper to generate JWT token with expiration
const generateToken = (id) => {
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET || 'supersecretjwtkey_traveljournal_btl_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các trường thông tin' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const userExists = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
      });

      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản hoặc email này đã tồn tại trong hệ thống'
        });
      }

      const user = await User.create({
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password
      });

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      // In-Memory Fallback if MongoDB is offline
      const exists = fallbackUsers.some(
        (u) => u.email === email.toLowerCase() || u.username === username.toLowerCase()
      );
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản hoặc email này đã tồn tại trong hệ thống'
        });
      }

      const newUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: bcrypt.hashSync(password, 10),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: 'member',
        isLocked: false,
        followers: [],
        following: []
      };
      fallbackUsers.push(newUser);

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công (Chế độ offline dự phòng)',
        data: {
          _id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar,
          role: newUser.role,
          token: generateToken(newUser._id)
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findOne({
        $or: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername.toLowerCase() }
        ]
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Thông tin tài khoản hoặc mật khẩu không chính xác' });
      }

      if (user.isLocked) {
        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Thông tin tài khoản hoặc mật khẩu không chính xác' });
      }

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      // In-Memory Fallback Login
      const user = fallbackUsers.find(
        (u) =>
          u.email === emailOrUsername.toLowerCase() ||
          u.username === emailOrUsername.toLowerCase()
      );

      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'Thông tin tài khoản hoặc mật khẩu không chính xác' });
      }

      if (user.isLocked) {
        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công (Chế độ offline dự phòng)',
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id).select('-password');
      return res.status(200).json({ success: true, data: user });
    } else {
      const user = fallbackUsers.find((u) => u._id.toString() === req.user._id.toString());
      if (user) {
        const { passwordHash, ...safeUser } = user;
        return res.status(200).json({ success: true, data: safeUser });
      }
      return res.status(200).json({ success: true, data: req.user });
    }
  } catch (error) {
    next(error);
  }
};
