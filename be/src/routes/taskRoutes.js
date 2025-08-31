// D:\ghichu\be\src\routes\taskRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ensureCalendar = require('../middleware/ensureCalendar');
const t = require('../controllers/taskController');

router.use(auth);

router.get('/', ensureCalendar, t.listByRange);              
router.post('/', ensureCalendar, t.createDay);
router.patch('/:id', ensureCalendar, t.update);
router.delete('/:id', ensureCalendar, t.remove);

module.exports = router;
