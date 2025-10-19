const Category = require('../models/category');

// Tạo danh mục mới (Chỉ admin)
const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({ message: 'Tạo danh mục thành công', category });
  } catch (err) {
    console.error('Lỗi khi tạo danh mục:', err);
    res.status(400).json({ error: err.message || 'Không thể tạo danh mục' });
  }
};

// Lấy danh sách danh mục
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const categories = await Category.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Category.countDocuments(query);

    res.status(200).json({
      categories,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách danh mục:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Lấy chi tiết danh mục theo ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Danh mục không tồn tại' });
    }
    res.status(200).json(category);
  } catch (err) {
    console.error('Lỗi khi lấy danh mục:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Cập nhật danh mục (Chỉ admin)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ error: 'Danh mục không tồn tại' });
    }
    res.status(200).json({ message: 'Cập nhật danh mục thành công', category });
  } catch (err) {
    console.error('Lỗi khi cập nhật danh mục:', err);
    res.status(400).json({ error: err.message || 'Không thể cập nhật danh mục' });
  }
};

// Xóa danh mục (Chỉ admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Danh mục không tồn tại' });
    }

    // Kiểm tra xem danh mục có sản phẩm nào không
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Không thể xóa danh mục vì vẫn còn sản phẩm liên kết' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Xóa danh mục thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa danh mục:', err);
    res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};