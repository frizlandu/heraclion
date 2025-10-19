# Copilot Instructions for AI Coding Agents

## Project Overview
This codebase is a full-stack JavaScript application for document analysis, PDF generation, and business management. It consists of a Node.js/Express backend (`backend/`) and a React frontend (`frontend/`).

## Architecture & Major Components
- **Backend (`backend/`)**: Handles API endpoints, document analysis, PDF processing, business logic, and database interactions. Key files:
  - `server.js`: Main Express server entry point.
  - `controllers/`, `routes/`, `models/`: MVC structure for business logic, routing, and data models.
  - `config/`: Database and PDF config files.
  - `jobs/`: Scheduled/background tasks.
  - `migrations/`: SQL and JS scripts for DB schema changes.
- **Frontend (`frontend/`)**: React app for user interaction. Key files:
  - `src/pages/`: Main page components (e.g., `ProformasPage.js`).
  - `public/`: Static assets.
  - Tailwind CSS and PostCSS for styling.

## Developer Workflows
- **Backend**
  - Start server: `node backend/server.js` or use scripts in `backend/package.json`.
  - Run tests: `npm test` in `backend/` (Jest config: `jest.config.js`).
  - DB migrations: Run SQL/JS files in `backend/migrations/`.
- **Frontend**
  - Start dev server: `npm start` in `frontend/`.
  - Build: `npm run build` in `frontend/`.
  - Cypress for E2E tests (see `frontend/cypress/`).

## Project-Specific Patterns & Conventions
- **PDF Configuration**: Custom user config in `backend/config/pdf-config-user.json` and logic in `backend/config/pdfConfig.js`.
- **WebSocket Communication**: Real-time updates via `backend/wsServer.js` and `backend/wsDashboardPush.js`.
- **Error Handling**: Centralized middleware in `backend/middleware/errorHandler.js`.
- **Authorization**: Role-based access in `backend/middleware/authorizeRoles.js`.
- **Document Analysis**: Main logic in `backend/analyze-documents.js` and related test files.
- **API Documentation**: Swagger setup in `backend/docs/swagger.js` and related files.

## Integration Points
- **Database**: Configured in `backend/config/database.js`.
- **External APIs**: See `stocks_api_response.json` for example data.
- **PDF Generation**: Custom logic in `backend/diagnostic-pdf.js` and related modules.

## Examples of Key Patterns
- **Route Definition**: See `backend/routes/*.js` for Express route patterns.
- **Model Usage**: See `backend/models/*.js` for Sequelize/ORM models.
- **Job Scheduling**: See `backend/jobs/scheduler.js` for cron/task patterns.

## Recommendations for AI Agents
- Always check for existing config and conventions before introducing new patterns.
- Use centralized error and auth middleware for new endpoints.
- Follow the MVC structure for backend additions.
- Reference existing test files for coverage and structure.
- For PDF and document logic, reuse helpers in `backend/config/` and `backend/utils/`.

---
If any section is unclear or missing important project-specific details, please provide feedback to improve these instructions.