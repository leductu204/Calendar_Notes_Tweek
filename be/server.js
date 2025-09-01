// be/server.js
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');

require('./src/config/passport');
const passport = require('passport');

const authRoutes     = require('./src/routes/authRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const somedayRoutes  = require('./src/routes/somedayRoutes');
const taskRoutes     = require('./src/routes/taskRoutes');
const shareRoutes    = require('./src/routes/shareRoutes');

const notFound       = require('./src/middleware/notFound');
const errorHandler   = require('./src/middleware/errorHandler');
const authMiddleware = require('./src/middleware/authMiddleware');
const ensureCalendar = require('./src/middleware/ensureCalendar');

const app = express();

app.use((req, res, next) => {
  console.log('[hit]', req.method, req.url);
  next();
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_APP_URL || 'http://localhost:5173',
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Calendar-Id'],
  credentials: false,
}));
app.use(express.json());
app.use(passport.initialize());

app.get('/healthz', (req, res) => res.json({ ok: true }));

// Public: auth
app.use('/api/auth', authRoutes);

// Private: calendars
app.use('/api/calendars', authMiddleware, calendarRoutes);

// Private + cần calendarId
app.use('/api/tasks',   authMiddleware, ensureCalendar, taskRoutes);
app.use('/api/someday', authMiddleware, ensureCalendar, somedayRoutes);

// Public: share links
app.use('/s', shareRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
