// D:\ghichu\be\src\routes\shareRoutes.js
const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

router.get('/t/:token', shareController.getSharedTask);

module.exports = router;
