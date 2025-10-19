const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên danh mục là bắt buộc'],
    trim: true,
    maxlength: [50, 'Tên danh mục không được vượt quá 50 ký tự'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Mô tả danh mục không được vượt quá 200 ký tự']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);