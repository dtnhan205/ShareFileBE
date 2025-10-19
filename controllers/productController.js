const Product = require('../models/product');
const Category = require('../models/category');
const cloudinary = require('../config/cloudinary');

// Tạo sản phẩm mới (Chỉ admin)
const createProduct = async (req, res) => {
  try {
    const { name, fileType, category, fileSize } = req.body;
    const productData = { name, fileType, category, fileSize, downloadCount: 0 };

    // Kiểm tra danh mục tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Danh mục không tồn tại' });
    }

    // Xử lý thumbnail, media và file
    if (req.files) {
      const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
      const mediaFiles = req.files['media'] || [];
      const file = req.files['file'] ? req.files['file'][0] : null;

      if (!thumbnailFile) {
        return res.status(400).json({ error: 'Ảnh thumbnail là bắt buộc' });
      }
      if (mediaFiles.length === 0) {
        return res.status(400).json({ error: 'Ít nhất 1 ảnh hoặc video chi tiết là bắt buộc' });
      }

      productData.thumbnail = thumbnailFile.path;
      productData.media = mediaFiles.map(file => file.path);
      if (file) {
        productData.file = file.path;
      }
    } else {
      return res.status(400).json({ error: 'Ảnh thumbnail và ít nhất 1 ảnh/video chi tiết là bắt buộc' });
    }

    const product = new Product(productData);
    await product.save();
    res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
  } catch (err) {
    console.error('Lỗi khi tạo sản phẩm:', err);
    res.status(400).json({ error: err.message || 'Không thể tạo sản phẩm' });
  }
};

// Lấy danh sách sản phẩm
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Lấy chi tiết sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json(product);
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Cập nhật sản phẩm (Chỉ admin)
const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Kiểm tra danh mục nếu được cung cấp
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(400).json({ error: 'Danh mục không tồn tại' });
      }
    }

    // Xử lý thumbnail, media và file nếu có
    if (req.files) {
      const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
      const mediaFiles = req.files['media'] || [];
      const file = req.files['file'] ? req.files['file'][0] : null;

      // Xóa file cũ trên Cloudinary nếu có file mới
      const product = await Product.findById(req.params.id);
      if (product) {
        const oldFiles = [product.thumbnail, ...product.media];
        if (product.file) oldFiles.push(product.file);
        for (const file of oldFiles) {
          const publicId = file.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`products/${publicId}`, {
            resource_type: file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.ogg') ? 'video' : 'image'
          });
        }
      }

      if (thumbnailFile) {
        updateData.thumbnail = thumbnailFile.path;
      }
      if (mediaFiles.length > 0) {
        updateData.media = mediaFiles.map(file => file.path);
      }
      if (file) {
        updateData.file = file.path;
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ message: 'Cập nhật sản phẩm thành công', product });
  } catch (err) {
    console.error('Lỗi khi cập nhật sản phẩm:', err);
    res.status(400).json({ error: err.message || 'Không thể cập nhật sản phẩm' });
  }
};

// Xóa sản phẩm (Chỉ admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    // Xóa file trên Cloudinary
    const oldFiles = [product.thumbnail, ...product.media];
    if (product.file) oldFiles.push(product.file);
    for (const file of oldFiles) {
      const publicId = file.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`products/${publicId}`, {
        resource_type: file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.ogg') ? 'video' : 'image'
      });
    }

    res.status(200).json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Tăng lượt tải
const incrementDownloadCount = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    ).populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ message: 'Tăng lượt tải thành công', product });
  } catch (err) {
    console.error('Lỗi khi tăng lượt tải:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Tải file sản phẩm
const downloadFile = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.file) {
      return res.status(404).json({ error: 'Sản phẩm hoặc file không tồn tại' });
    }

    // Tăng lượt tải trước khi redirect
    await Product.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });

    // Extract resource_type từ URL (image, video, raw)
    const url = new URL(product.file);
    const pathnameParts = url.pathname.split('/');
    const uploadIdx = pathnameParts.indexOf('upload');
    if (uploadIdx === -1 || uploadIdx === 0) {
      return res.status(500).json({ error: 'URL Cloudinary không hợp lệ' });
    }
    const resourceType = pathnameParts[uploadIdx - 1] || 'image'; // Mặc định image

    // Extract public_id
    const afterUpload = pathnameParts.slice(uploadIdx + 1);
    const versionIdx = afterUpload.findIndex(part => /^v\d+$/.test(part));
    if (versionIdx === -1) {
      return res.status(500).json({ error: 'URL Cloudinary không hợp lệ (không tìm thấy version)' });
    }
    let publicIdFull = afterUpload.slice(versionIdx + 1).join('/');
    if (!publicIdFull) {
      return res.status(500).json({ error: 'Không thể extract public_id' });
    }

    // Lấy extension từ full path
    const extMatch = publicIdFull.match(/\.[^.\/]+$/);
    const ext = extMatch ? extMatch[0].slice(1) : product.fileType || 'jpg'; // Fallback

    // Tên file download
    const filename = `${product.name}.${ext}`;

    // Extract public_id without extension
    const publicId = publicIdFull.replace(/\.[^.\/]+$/, '');

    // Generate Cloudinary download URL với fl_attachment:filename để force download và set tên file
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      format: ext, // Giữ nguyên format gốc
      transformation: [
        { flags: `attachment:${filename}` } // fl_attachment:<filename> để force download với tên custom
      ]
    });

    // Redirect đến download URL - browser sẽ tự động tải file với tên đúng và count đã tăng
    res.redirect(301, downloadUrl);
  } catch (err) {
    console.error('Lỗi khi tải file:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  incrementDownloadCount,
  downloadFile
};