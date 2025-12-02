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
const notesRoutes    = require('./src/routes/notesRoutes');

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
// Build a flexible allowed origins list from env vars.
// - FRONTEND_APP_URL (single url) OR
// - ALLOWED_ORIGINS (comma-separated list, supports simple wildcard like https://*.trycloudflare.com or '*' to allow any)
// Build allowed origins list from env vars.
// For development convenience we also allow trycloudflare tunnels (https://*.trycloudflare.com)
// so the app works while using cloudflared local tunnel previews.
const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_APP_URL || 'http://localhost:5173,http://localhost:5174,http://localhost:5175';
const allowedOrigins = allowedOriginsRaw.split(',').map(s => s.trim()).filter(Boolean);

// If running in development and the user didn't already include trycloudflare patterns
// add a permissive trycloudflare wildcard so tunnels work out of the box.
if (process.env.NODE_ENV !== 'production') {
  const hasTrycloud = allowedOrigins.some(o => o.includes('trycloudflare.com'));
  if (!hasTrycloud) {
    // include both https and http forms just in case the preview uses http
    allowedOrigins.push('https://*.trycloudflare.com');
    allowedOrigins.push('http://*.trycloudflare.com');
  }
}

function originAllowed(origin) {
  // If there's no origin header it's usually a non-browser request (server-to-server)
  // so allow it by default.
  if (!origin) {
    console.debug('[cors] no origin header — allowing');
    return true;
  }
  if (allowedOrigins.indexOf('*') !== -1) return true;
  if (allowedOrigins.indexOf(origin) !== -1) return true;

  // support simple wildcard patterns in allowed origins like https://*.trycloudflare.com
  for (const pattern of allowedOrigins) {
      if (pattern.includes('*')) {
        // convert to regex safely: escape regex metacharacters except '*' (we'll expand '*')
        // then replace '*' with '.*' so simple wildcards like https://*.trycloudflare.com work
        const escapedExceptStar = pattern.replace(/[-+?.^${}()|[\]\\]/g, '\\$&');
        const regexStr = '^' + escapedExceptStar.replace(/\*/g, '.*') + '$';
        const regex = new RegExp(regexStr);
      if (regex.test(origin)) {
        console.debug('[cors] origin matched pattern:', pattern, 'origin:', origin);
        return true;
      }
    }
  }
  console.debug('[cors] origin not allowed:', origin, 'allowedPatterns:', allowedOrigins);
  return false;
}

app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Calendar-Id'],
  credentials: true,
  exposedHeaders: ['Authorization']
}));
app.use(express.json());
app.use(passport.initialize());

app.get('/healthz', (req, res) => res.json({ ok: true }));

// Public: auth
app.use('/api/auth', authRoutes);

// Private: calendars
app.use('/api/calendars', authMiddleware, calendarRoutes);

// Private: notes - standalone note-taking
app.use('/api/notes', authMiddleware, notesRoutes);

// Private + cần calendarId
app.use('/api/tasks',   authMiddleware, ensureCalendar, taskRoutes);
app.use('/api/someday', authMiddleware, ensureCalendar, somedayRoutes);

// Public: share links
app.use('/s', shareRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Add error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  // Print the final resolved allowed origins so devs can quickly verify what's allowed
  try {
    // clone so we don't accidentally expose runtime changes
    const shown = Array.isArray(allowedOrigins) ? allowedOrigins.slice(0, 50) : allowedOrigins;
    console.log('[cors] resolved allowedOrigins:', shown);
  } catch (e) { /* ignore */ }
  console.log('Server is ready to accept connections');
});

// Keep the server alive
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
