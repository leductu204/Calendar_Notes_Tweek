# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Application Overview

GHiChu1 is a full-stack task management application with calendar and "someday" views. It features:
- Weekly calendar-based task organization
- "Someday" columns for future/unscheduled tasks  
- Multi-calendar support per user
- OAuth authentication (Google)
- Task sharing capabilities
- SQLite database (with PostgreSQL backup configuration)

## Project Structure

```
GHiChu1/
├── be/                    # Backend (Express.js API)
│   ├── server.js         # Main entry point
│   └── src/
│       ├── config/       # Database and passport config
│       ├── controllers/  # API controllers
│       ├── middleware/   # Auth and utility middleware
│       └── routes/       # API routes
├── fe/                   # Frontend (React + Vite)
│   ├── index.html       
│   ├── vite.config.js   
│   └── src/
│       ├── api/         # API client layer
│       ├── app/         # Main app components
│       ├── components/  # UI components
│       ├── context/     # React contexts
│       ├── hooks/       # Custom hooks
│       └── utils/       # Helper functions
└── ghichu1.db           # SQLite database file
```

## Development Commands

### Backend Development
```powershell
# Start backend server (from be/ directory)
cd be
npm install
npm start    # Runs server.js on port 4000
```

### Frontend Development
```powershell
# Start frontend dev server (from fe/ directory)
cd fe
npm install
npm run dev     # Vite dev server on port 5173
npm run build   # Build for production
npm run preview # Preview built app
```

### Full Stack Development
```powershell
# Start both services (run in separate terminals)
# Terminal 1 - Backend
cd be && npm start

# Terminal 2 - Frontend  
cd fe && npm run dev
```

## Database Configuration

The application uses SQLite for development with PostgreSQL configuration available:

- **Current**: SQLite database at `./ghichu1.db`
- **Backup**: PostgreSQL config in `be/src/config/db-postgresql.js.backup`
- **Switch databases**: Modify `be/src/config/db.js` to require the desired config

## API Architecture

### Authentication Flow
- Routes use `authMiddleware` for protected endpoints
- Calendar-specific routes require `ensureCalendar` middleware
- Supports JWT tokens and OAuth (Google)

### Main API Endpoints
- `/api/auth/*` - Authentication (public)
- `/api/calendars/*` - Calendar management (auth required)
- `/api/tasks/*` - Task operations (auth + calendar required)  
- `/api/someday/*` - Someday task operations (auth + calendar required)
- `/s/*` - Public share links

### Frontend API Client
- Centralized in `fe/src/api/` with automatic token injection
- Auto-appends active calendar ID to requests
- Base URL configurable via `VITE_API_BASE_URL` environment variable

## Key Technical Details

### Database Schema
- **users**: User accounts
- **calendars**: User calendars (multiple per user)
- **tasks**: Calendar tasks with due_date OR someday_column_id
- **someday_columns**: Organizational columns for someday tasks

### Frontend State Management
- **DataContext**: Task and calendar data management
- **UiContext**: UI state (modals, selections)
- **SomedayContext**: Someday-specific functionality
- React hooks for week navigation and data fetching

### Component Architecture
- **App.jsx**: Main application shell with context providers
- **CalendarGrid**: Weekly calendar view
- **SomedaySection**: Someday task columns
- **Modal system**: TaskModal, AuthModal, SearchModal, etc.

## Environment Setup

### Backend Environment Variables
Create `be/.env`:
```
PORT=4000
FRONTEND_APP_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
```

### Frontend Environment Variables  
Create `fe/.env`:
```
VITE_API_BASE_URL=http://localhost:4000
```

## Common Development Patterns

### Adding New API Endpoints
1. Create controller in `be/src/controllers/`
2. Add route in `be/src/routes/`
3. Register route in `be/server.js`
4. Add client method in `fe/src/api/`

### Database Migration Pattern
- Modify schema in `be/src/config/db-sqlite.js` initialization
- For PostgreSQL: Update `db-postgresql.js.backup` accordingly
- Delete `ghichu1.db` to recreate with new schema (development only)

### Task Data Structure
Tasks contain:
- Basic fields: `text`, `notes`, `color`, `is_done`
- Metadata: `subtasks`, `attachments`, `links` (JSON arrays)
- Scheduling: `repeat_info`, `reminder_info` (JSON objects)
- Sharing: `share_info` (JSON object)

### Component Communication
- Use context providers for global state
- Custom events for cross-component communication
- Ref-based APIs for parent-child component interaction
