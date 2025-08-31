// D:\ghichu\be\src\routes\somedayRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ensureCalendar = require('../middleware/ensureCalendar');
const s = require('../controllers/somedayController');

router.use(auth);

router.get('/', ensureCalendar, s.getBoard);                
router.post('/columns', ensureCalendar, s.createColumn);
router.patch('/columns/:id', ensureCalendar, s.updateColumn);
router.delete('/columns/:id', ensureCalendar, s.deleteColumn);

router.post('/tasks', ensureCalendar, s.createSomedayTask);
router.patch('/tasks/:id', ensureCalendar, s.updateSomedayTask);
router.post('/tasks/:id/move-to-date', ensureCalendar, s.moveToDate);
router.delete('/tasks/:id', ensureCalendar, s.deleteSomedayTask);

module.exports = router;
