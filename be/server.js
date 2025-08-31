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

const notFound     = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

console.log('[server] PID =', process.pid);
console.log('[server] CWD =', process.cwd());
console.log('[server] __dirname =', __dirname);

app.use((req, res, next) => {
  console.log('[hit]', req.method, req.url);
  next();
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_APP_URL || 'http://localhost:5173',
}));
app.use(express.json());
app.use(passport.initialize());

app.get('/healthz', (req, res) => res.json({ ok: true }));

console.log('[server] mount /api/auth');
app.use('/api/auth', authRoutes);

console.log('[server] mount /api/calendars');
app.use('/api/calendars', calendarRoutes);

console.log('[server] mount /api/someday');
app.use('/api/someday', somedayRoutes);

console.log('[server] mount /api/tasks');
app.use('/api/tasks', taskRoutes);

console.log('[server] mount /s');
app.use('/s', shareRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
