const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Debug log để kiểm tra Multer
console.log('Multer loaded:', !!multer);

// Cloudinary storage cho sản phẩm
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '') || 'jpg';
    let resource_type = 'image';
    if (file.mimetype.startsWith('video')) {
      resource_type = 'video';
    } else if (!file.mimetype.startsWith('image')) {
      resource_type = 'raw'; // Cho các file như PDF, ZIP, DOCX
    }
    return {
      folder: 'products',
      format: ext,
      resource_type,
      public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    };
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 6 // Giới hạn tối đa 6 file (1 thumbnail + 4 media + 1 file)
  }
});

// Debug log để kiểm tra upload
console.log('Upload middleware initialized:', !!upload);

// Middleware cho sản phẩm
const productUpload = upload;

// Middleware lỗi multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Tệp vượt quá kích thước cho phép (100MB)!' });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Số lượng tệp vượt quá giới hạn (6 tệp)!' });
    } else {
      return res.status(400).json({ error: `Lỗi upload file: ${err.message}` });
    }
  } else if (err && err.message) {
    if (err.message.includes('Cloudinary')) {
      return res.status(500).json({ error: 'Lỗi khi tải lên Cloudinary, vui lòng thử lại sau' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = {
  productUpload,
  handleMulterError
};