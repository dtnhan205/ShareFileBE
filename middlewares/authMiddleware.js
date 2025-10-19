const jwt = require('jsonwebtoken');
const User = require('../models/admin');

// Middleware xác thực JWT
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Kiểm tra header Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Không có token xác thực' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Kiểm tra JWT_SECRET từ biến môi trường
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET không được cấu hình trong biến môi trường');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm người dùng trong database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'Người dùng không tồn tại' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn' });
    }
    console.error('Lỗi xác thực:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }
  next();
};

module.exports = { authMiddleware, isAdmin };