const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const { login, getAdmin, createAdmin } = require('../controllers/adminController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

router.post('/login',login);
router.get('/me', authMiddleware,isAdmin, getAdmin);
router.post('/create',authMiddleware,isAdmin, createAdmin);

module.exports = router; 