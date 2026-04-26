# Backend Architecture & Implementation Guide

## Technology Stack

- **Framework:** FastAPI with Python
- **Package Manager:** uv (Python package manager)
- **Database:** SQLite (local file-based)
- **ORM:** SQLAlchemy
- **AI Integration:** OpenRouter API with google/gemma-4-31b-it:free model
- **Container:** Docker with uv inside
- **Server:** Uvicorn (FastAPI's async server)

## Project Structure (To Be Built)

```
backend/
├── main.py                      # FastAPI application entry point
├── config.py                    # Configuration and environment variables
├── database.py                  # Database connection and initialization
├── requirements.txt             # Python dependencies (managed by uv)
├── pyproject.toml               # Project metadata for uv
├── models/
│   ├── __init__.py
│   ├── user.py                 # SQLAlchemy User model
│   ├── board.py                # SQLAlchemy Board model
│   ├── column.py               # SQLAlchemy Column model
│   ├── card.py                 # SQLAlchemy Card model
│   └── conversation.py         # SQLAlchemy ConversationHistory model
├── schemas/
│   ├── __init__.py
│   ├── user.py                 # Pydantic request/response schemas
│   ├── board.py
│   ├── column.py
│   ├── card.py
│   └── ai.py                   # AI request/response schemas
├── routes/
│   ├── __init__.py
│   ├── auth.py                 # Authentication endpoints
│   ├── boards.py               # Board management endpoints
│   ├── cards.py                # Card management endpoints
│   ├── columns.py              # Column management endpoints
│   └── ai.py                   # AI integration endpoints
├── services/
│   ├── __init__.py
│   ├── auth_service.py         # Authentication business logic
│   ├── board_service.py        # Board operations
│   ├── card_service.py         # Card operations
│   └── ai_service.py           # OpenRouter integration
├── middleware/
│   ├── __init__.py
│   └── auth.py                 # JWT/session authentication middleware
├── tests/
│   ├── __init__.py
│   ├── test_auth.py            # Auth endpoint tests
│   ├── test_boards.py          # Board endpoint tests
│   ├── test_cards.py           # Card endpoint tests
│   ├── test_ai.py              # AI integration tests
│   └── conftest.py             # Pytest fixtures
├── database.db                  # SQLite database (created on startup)
└── Dockerfile                   # Docker image definition
```

## Key Components (To Be Implemented)

### Part 2: Scaffolding & Docker
**Files:** Dockerfile, docker-compose.yml, main.py (basic), database.py

- Basic FastAPI app structure
- SQLite connection initialization
- Database auto-creation on startup
- Static file serving for "Hello World"
- Health check endpoint at `/api/health`

### Part 3: Frontend Integration
**Files:** main.py (updated)

- Serve NextJS static build from `/`
- Proper static asset routing
- Remove static test HTML

### Part 4: Authentication (UI Only)
**Files:** No backend changes yet**

- Frontend adds login/logout
- Backend still uses hardcoded session

### Part 5: Database Schema
**Files:** models/*.py, schemas/*.py

**Tables:**
- `users` (id, username, created_at, updated_at)
- `boards` (id, user_id, name, created_at, updated_at)
- `columns` (id, board_id, name, position, created_at, updated_at)
- `cards` (id, column_id, title, description, position, created_at, updated_at)
- `conversation_history` (id, user_id, board_id, role, message, created_at)

### Part 6: API Implementation
**Files:** routes/auth.py, routes/boards.py, routes/cards.py, routes/columns.py, tests/test_*.py

**Endpoints:**
```
POST   /api/auth/login              - User login
POST   /api/auth/logout             - User logout
GET    /api/boards                  - List user's boards
GET    /api/boards/{board_id}       - Get board with columns and cards
POST   /api/boards/{board_id}/cards - Create card
PATCH  /api/cards/{card_id}         - Update card
DELETE /api/cards/{card_id}         - Delete card
PATCH  /api/columns/{column_id}     - Update column
```

### Part 7: Frontend Integration
**Files:** routes/*.py (updated)

- Frontend makes real API calls
- Backend persists all changes
- Session management
- User isolation enforced

### Part 8: AI Integration
**Files:** services/ai_service.py, routes/ai.py, tests/test_ai.py

**Endpoints:**
```
POST /api/ai/test  - Simple "2+2" test
```

- OpenRouter API client
- Error handling and retries
- Logging and monitoring

### Part 9: AI Chat with Kanban
**Files:** services/ai_service.py (updated), routes/ai.py (updated)

**Endpoints:**
```
POST /api/ai/chat  - Send question with Kanban state, get response and optional updates
```

- Structured output schema
- Kanban update parsing
- Conversation history storage
- System prompt engineering

### Part 10: AI Chat UI (No Backend Changes)
- Frontend consumes /api/ai/chat endpoint
- Real-time updates via response

## API Response Format

### Standard Response
```json
{
  "success": true,
  "data": {...},
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Database Models (Part 5 Onwards)

### User
- id: Integer (PK)
- username: String
- created_at: DateTime
- updated_at: DateTime
- Relationships: boards, conversation_history

### Board
- id: Integer (PK)
- user_id: Integer (FK)
- name: String
- created_at: DateTime
- updated_at: DateTime
- Relationships: columns, cards

### Column
- id: Integer (PK)
- board_id: Integer (FK)
- name: String
- position: Integer
- created_at: DateTime
- updated_at: DateTime
- Relationships: cards

### Card
- id: Integer (PK)
- column_id: Integer (FK)
- title: String
- description: String (nullable)
- position: Integer
- created_at: DateTime
- updated_at: DateTime

### ConversationHistory
- id: Integer (PK)
- user_id: Integer (FK)
- board_id: Integer (FK)
- role: String (user/assistant)
- message: String
- created_at: DateTime

## Environment Variables

**Required in .env (project root):**
```
OPENROUTER_API_KEY=sk-...    # From OpenRouter
DEBUG=false                   # Debug mode
DATABASE_URL=sqlite:///database.db
```

## Testing Strategy

### Unit Tests (pytest)
- Endpoint request/response validation
- Service logic
- Database operations
- AI response parsing

### Integration Tests
- Full API flows
- Database persistence
- OpenRouter API calls
- Concurrent operations

### Test Fixtures
- Pytest fixtures for:
  - Test database
  - Sample boards/cards
  - Mock OpenRouter responses

## Development Workflow

### Local Development (No Docker)
```bash
cd backend
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uv pip install -r requirements.txt
python main.py
```

### Docker Development
```bash
docker-compose up
```

### Running Tests
```bash
pytest tests/
pytest tests/ -v --cov=.
```

## Key Implementation Notes

1. **Session Management:** Currently hardcoded "user" credential. Database ready for expansion.
2. **Concurrency:** FastAPI handles concurrent requests with async/await
3. **CORS:** Will be configured as needed for frontend
4. **Error Handling:** Comprehensive error responses with proper HTTP status codes
5. **Logging:** Request logging for debugging and monitoring
6. **AI Integration:** OpenRouter free tier with structured outputs
7. **Data Validation:** Pydantic schemas for all requests/responses

## Dependencies (To Be Added)

```
fastapi>=0.104.0
uvicorn>=0.24.0
sqlalchemy>=2.0
pydantic>=2.0
python-dotenv>=1.0
httpx>=0.25.0  # For OpenRouter API calls
pytest>=7.0
pytest-asyncio>=0.21.0
pytest-cov>=4.0
```

## Build Process

### Docker Image
- Base: python:3.12-slim
- Install uv
- Copy requirements, install with uv
- Copy source code
- Expose port 8000
- CMD: uvicorn main:app

### NextJS Integration
- Frontend builds to `frontend/out/` (static)
- Docker copies build to backend static serving directory
- Backend serves from static path

## Next Steps

1. Part 2: Initialize FastAPI project structure
2. Part 3: Integrate NextJS build
3. Part 5: Create SQLAlchemy models and database initialization
4. Part 6: Implement all API endpoints
7. Part 8: Add OpenRouter integration
9. Part 9: Add AI chat with Kanban updates
