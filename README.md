# Project Management MVP

A web-based Kanban board application with AI-powered task management.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- .env file with OPENROUTER_API_KEY in project root

### Start the Application

**On Mac/Linux:**
```bash
./scripts/start.sh
```

**On Windows:**
```bash
scripts\start.bat
```

The application will be available at: http://localhost:8000/

### Stop the Application

**On Mac/Linux:**
```bash
./scripts/start.sh
```

**On Windows:**
```bash
scripts\stop.bat
```

## Architecture

- **Frontend:** NextJS (React) with TypeScript
- **Backend:** FastAPI (Python)
- **Database:** SQLite
- **Container:** Docker with Docker Compose
- **AI:** OpenRouter API integration

## Project Structure

```
pm/
├── frontend/          # NextJS React application
├── backend/           # FastAPI Python backend
├── scripts/           # Start/stop scripts for all platforms
├── docs/              # Project documentation
├── docker-compose.yml # Docker Compose configuration
└── .env               # Environment variables (create from template)
```

## Development

### Start Docker containers
```bash
docker-compose up
```

### View logs
```bash
docker-compose logs -f backend
```

### Stop containers
```bash
docker-compose down
```

## API Endpoints

- `GET /` - Hello World page (will be replaced by frontend in Part 3)
- `GET /api/health` - API health check

## Configuration

Create a `.env` file in the project root:
```
OPENROUTER_API_KEY=sk-...
DEBUG=false
DATABASE_URL=sqlite:///./database.db
```

## Next Steps

- Part 3: Frontend integration
- Part 4: Authentication UI
- Part 5: Database schema
- Part 6: Backend API endpoints
- Part 7: Full frontend-backend integration
- Part 8: OpenRouter AI integration
- Part 9: AI chat with Kanban updates
- Part 10: AI chat UI
