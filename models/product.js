const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên sản phẩm không được vượt quá 100 ký tự']
  },
  thumbnail: {
    type: String,
    required: [true, 'Ảnh thumbnail là bắt buộc'],
  },
  media: {
    type: [String],
    required: [true, 'Ít nhất 1 ảnh hoặc video chi tiết là bắt buộc'],
  },
  file: {
    type: String,
  },
  fileType: {
    type: String,
    required: [true, 'Loại tệp là bắt buộc'],
    default: 'image'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Danh mục là bắt buộc']
  },
  fileSize: {
    type: Number,
    required: [true, 'Dung lượng file là bắt buộc'],
    min: [0, 'Dung lượng file không được nhỏ hơn 0']
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Lượt tải không được nhỏ hơn 0']
  }
}, {
  timestamps: true
});

productSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('Product', productSchema);