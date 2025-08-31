// D:\ghichu\be\src\routes\calendarRoutes.js
const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', calendarController.getCalendars);
router.post('/', calendarController.createCalendar);

module.exports = router;
