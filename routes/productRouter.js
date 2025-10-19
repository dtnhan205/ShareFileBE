const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { productUpload, handleMulterError } = require('../middlewares/upload');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  incrementDownloadCount,
  downloadFile
} = require('../controllers/productController');

// Route sản phẩm công khai
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/download', downloadFile);
router.patch('/:id/download', incrementDownloadCount);

// Route sản phẩm yêu cầu admin
router.post('/', authMiddleware, isAdmin, productUpload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'media', maxCount: 4 },
  { name: 'file', maxCount: 1 }
]), handleMulterError, createProduct);
router.put('/:id', authMiddleware, isAdmin, productUpload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'media', maxCount: 4 },
  { name: 'file', maxCount: 1 }
]), handleMulterError, updateProduct);
router.delete('/:id', authMiddleware, isAdmin, deleteProduct);

module.exports = router;