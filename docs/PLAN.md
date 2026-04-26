# Project Management MVP - Detailed Execution Plan

## Part 1: Enriched Plan & Documentation

**Objective:** Create detailed specifications and documentation for the entire project, with success criteria and test plans.

### Substeps
- [ ] Expand this plan document with all 10 parts (COMPLETE - this document)
- [ ] Add substeps, tests, and success criteria for each part
- [ ] Create AGENTS.md in pm/frontend/ describing existing NextJS code
- [ ] Create AGENTS.md in pm/backend/ with backend architecture overview
- [ ] Review and get user approval on complete plan
- [ ] Set up docs/ directory structure

### Tests
- Documentation review checklist passes
- All AGENTS.md files are comprehensive and accurate
- Plan document has clear success criteria for each part

### Success Criteria
- ✓ Complete plan document exists with all 10 parts detailed
- ✓ AGENTS.md files created and reviewed
- ✓ User has approved the plan
- ✓ All team members understand project scope and tech stack

---

## Part 2: Scaffolding & Docker Setup

**Objective:** Set up Docker infrastructure, FastAPI backend, and scripts for local development.

### Substeps
- [ ] Create Dockerfile with Python uv package manager
- [ ] Create docker-compose.yml for containerization
- [ ] Initialize FastAPI backend project structure in backend/
- [ ] Create start.sh script for Mac/Linux in scripts/
- [ ] Create start.bat script for Windows in scripts/
- [ ] Create stop.sh script for Mac/Linux in scripts/
- [ ] Create stop.bat script for Windows in scripts/
- [ ] Set up basic FastAPI app serving static "Hello World" HTML
- [ ] Configure FastAPI to serve static assets from frontend build
- [ ] Test scripts work on target OS

### Tests
- Docker image builds without errors
- Container starts successfully
- start/stop scripts execute properly
- Hello World page loads at http://localhost:8000
- Simple API endpoint responds (e.g., /api/health)

### Success Criteria
- ✓ Docker container runs locally
- ✓ Static HTML "Hello World" displays at /
- ✓ API health check works at /api/health
- ✓ Start and stop scripts functional for all OS targets
- ✓ No hardcoded paths or secrets in docker setup

---

## Part 3: Frontend Integration

**Objective:** Integrate existing NextJS frontend, build it statically, and serve via FastAPI.

### Substeps
- [ ] Review existing NextJS frontend structure in frontend/
- [ ] Configure NextJS build to output static site
- [ ] Create build script for frontend
- [ ] Integrate frontend build into Dockerfile
- [ ] Update FastAPI to serve NextJS static files from frontend build output
- [ ] Verify assets load correctly (CSS, JS, images)
- [ ] Test Kanban board displays correctly at /
- [ ] Run comprehensive frontend unit tests
- [ ] Run frontend integration tests with backend

### Tests
- NextJS builds successfully
- All static assets load without 404 errors
- Kanban board UI renders correctly
- Frontend unit tests pass (existing NextJS tests)
- All interactive elements respond to user input
- CSS colors match spec (yellow #ecad0a, blue #209dd7, etc.)

### Success Criteria
- ✓ Kanban board demo displays at http://localhost:8000/
- ✓ All frontend assets load and render
- ✓ No console errors in browser
- ✓ Unit and integration tests pass
- ✓ Frontend fully functional without backend API calls yet

---

## Part 4: Authentication UI

**Objective:** Add login/logout flow with hardcoded credentials (user/password).

### Substeps
- [ ] Create login page component in NextJS frontend
- [ ] Implement form validation (username/password)
- [ ] Create session/auth state management
- [ ] Implement logout button/functionality
- [ ] Add session persistence (localStorage or cookies)
- [ ] Redirect to login if not authenticated
- [ ] Redirect to Kanban if already authenticated
- [ ] Style login page per color scheme
- [ ] Add loading states and error messages
- [ ] Write comprehensive unit tests for auth flow
- [ ] Write integration tests (login → Kanban → logout)

### Tests
- Unit tests for login component
- Unit tests for auth state management
- Login with correct credentials (user/password) works
- Login with incorrect credentials shows error
- Logout clears session and redirects to login
- Refreshing page maintains session
- Cannot access Kanban without login
- Session timeout works (if implemented)
- Integration test: login → navigate → logout flow

### Success Criteria
- ✓ Login page displays with form
- ✓ Credentials validation works (user/password)
- ✓ Session persists on page refresh
- ✓ Logout clears session
- ✓ Unauthenticated users redirected to login
- ✓ All auth tests pass
- ✓ No hardcoded credentials in frontend code (use config)

---

## Part 5: Database Schema & Design

**Objective:** Design and document SQLite database schema for persistent Kanban.

### Substeps
- [ ] Design users table (id, username, created_at, updated_at)
- [ ] Design boards table (id, user_id, name, created_at, updated_at)
- [ ] Design columns table (id, board_id, name, position, created_at, updated_at)
- [ ] Design cards table (id, column_id, title, description, position, created_at, updated_at)
- [ ] Document schema as JSON (schema.json in docs/)
- [ ] Document schema as markdown (DATABASE.md in docs/)
- [ ] Include ER diagram or relationship notes
- [ ] Document indexing strategy
- [ ] Plan migration strategy for schema changes
- [ ] Get user sign-off on schema design

### Tests
- Schema document is clear and complete
- All tables have proper foreign keys
- Proper indexes for common queries
- No circular dependencies
- JSON schema is valid and parseable

### Success Criteria
- ✓ Database schema documented in docs/schema.json
- ✓ Schema documented in docs/DATABASE.md
- ✓ ER diagram or relationships explained
- ✓ User has reviewed and approved design
- ✓ Indexing strategy documented

---

## Part 6: Backend API & Database

**Objective:** Implement FastAPI routes with SQLite database integration.

### Substeps
- [ ] Initialize SQLite database connection in FastAPI
- [ ] Implement database migration/initialization (creates db if missing)
- [ ] Create database models using SQLAlchemy ORM
- [ ] Implement authentication endpoint (POST /api/auth/login)
- [ ] Implement logout endpoint (POST /api/auth/logout)
- [ ] Implement GET /api/boards - list user's boards
- [ ] Implement GET /api/boards/{board_id} - get board with columns and cards
- [ ] Implement POST /api/boards/{board_id}/cards - create card
- [ ] Implement PATCH /api/cards/{card_id} - update card (title, description, column)
- [ ] Implement DELETE /api/cards/{card_id} - delete card
- [ ] Implement PATCH /api/columns/{column_id} - update column name
- [ ] Add input validation and error handling
- [ ] Add request logging
- [ ] Write unit tests for each endpoint
- [ ] Write integration tests for full flows

### Tests
- Database creates on startup if missing
- Unit tests for each API endpoint (request/response)
- Integration tests for complete workflows
- Test data persistence across server restarts
- Test concurrent requests don't corrupt data
- Test invalid inputs return appropriate errors
- Test unauthenticated requests return 401
- Test user can only access their own data
- All backend tests pass

### Success Criteria
- ✓ All API endpoints working and tested
- ✓ Database persists data correctly
- ✓ Authentication enforced on protected routes
- ✓ User isolation working (can't access other users' data)
- ✓ All backend unit and integration tests pass
- ✓ No hardcoded users in code (use database)

---

## Part 7: Frontend ↔ Backend Integration

**Objective:** Connect frontend UI to backend API for persistent Kanban functionality.

### Substeps
- [ ] Update frontend to make API calls instead of using mock data
- [ ] Implement authentication flow using /api/auth/login
- [ ] Update Kanban board to fetch from /api/boards/{board_id}
- [ ] Implement card creation POST to /api/boards/{board_id}/cards
- [ ] Implement card drag-and-drop to PATCH /api/cards/{card_id}
- [ ] Implement card edit to PATCH /api/cards/{card_id}
- [ ] Implement card delete to DELETE /api/cards/{card_id}
- [ ] Implement column rename to PATCH /api/columns/{column_id}
- [ ] Add loading states and error handling
- [ ] Add loading spinners for async operations
- [ ] Implement optimistic UI updates
- [ ] Handle network errors gracefully
- [ ] Write integration tests (frontend calls real backend)
- [ ] End-to-end testing of complete flows

### Tests
- Frontend makes proper API calls
- Authentication flow works end-to-end
- Create card appears in real-time
- Drag-and-drop updates backend
- Edit card updates title/description
- Delete card removes from board
- Rename column persists
- Network errors shown to user
- Session expiry handled properly
- Multiple operations don't conflict
- All end-to-end tests pass

### Success Criteria
- ✓ Kanban board fully persistent with backend
- ✓ All user actions save to database
- ✓ Frontend properly handles API calls
- ✓ No data loss on page refresh
- ✓ Errors displayed appropriately
- ✓ All integration and e2e tests pass

---

## Part 8: OpenRouter AI Integration & Testing

**Objective:** Connect backend to OpenRouter API and verify AI connectivity.

### Substeps
- [ ] Read OPENROUTER_API_KEY from .env in backend startup
- [ ] Implement OpenRouter client in FastAPI backend
- [ ] Create POST /api/ai/test endpoint for simple test
- [ ] Implement "2+2" test: send simple math question to AI
- [ ] Verify response from google/gemma-4-31b-it:free model
- [ ] Add error handling for API failures
- [ ] Add request/response logging
- [ ] Implement timeout handling
- [ ] Add retry logic for transient failures
- [ ] Write unit tests for AI client
- [ ] Write integration tests with real OpenRouter API
- [ ] Document API key setup in README

### Tests
- OpenRouter API key is read correctly
- /api/ai/test endpoint responds
- "2+2" request returns correct response
- Malformed requests handled gracefully
- API timeout handled
- Retries work for transient failures
- All AI client tests pass
- Response contains expected data structure

### Success Criteria
- ✓ AI connectivity verified with test endpoint
- ✓ "2+2" test returns correct answer
- ✓ No API key exposed in logs or errors
- ✓ Error handling for API failures working
- ✓ All tests pass

---

## Part 9: AI Chat with Kanban Integration

**Objective:** Extend backend to accept Kanban state and questions, return AI responses with optional Kanban updates.

### Substeps
- [ ] Design Structured Output schema for AI responses
- [ ] Create schema with: response + optional kanban_update
- [ ] Implement POST /api/ai/chat endpoint
- [ ] Accept: question, kanban_state, conversation_history
- [ ] Send to OpenRouter with system prompt for Kanban context
- [ ] Parse structured output response
- [ ] Apply Kanban changes if included in response
- [ ] Return response with update status
- [ ] Add conversation history storage in database
- [ ] Implement conversation history retrieval
- [ ] Add proper error handling and validation
- [ ] Write unit tests for AI response parsing
- [ ] Write integration tests for Kanban updates from AI
- [ ] Test conversation history accuracy

### Tests
- AI receives full Kanban state context
- AI can respond with text only
- AI can respond with Kanban updates
- Kanban updates from AI persist correctly
- Conversation history stored and retrieved
- Concurrent requests handled properly
- Invalid responses handled gracefully
- AI cannot make unauthorized changes
- All Kanban updates are validated
- All tests pass

### Success Criteria
- ✓ /api/ai/chat endpoint working
- ✓ AI receives Kanban context
- ✓ AI can request Kanban updates via structured output
- ✓ Updates apply correctly
- ✓ Conversation history persists
- ✓ All tests pass

---

## Part 10: AI Chat UI & Real-time Updates

**Objective:** Add AI chat sidebar to frontend with real-time Kanban updates.

### Substeps
- [ ] Create chat sidebar component in NextJS
- [ ] Implement message input and display
- [ ] Implement POST to /api/ai/chat with question
- [ ] Display AI responses in real-time
- [ ] Display conversation history
- [ ] Listen for Kanban updates from AI responses
- [ ] Automatically update Kanban if AI made changes
- [ ] Add loading states while AI responds
- [ ] Add error states and retry button
- [ ] Implement auto-scroll to latest message
- [ ] Style chat UI per color scheme
- [ ] Add typing indicators
- [ ] Write unit tests for chat component
- [ ] Write integration tests (chat → backend → Kanban updates)
- [ ] End-to-end test complete workflow

### Tests
- Chat component renders
- Messages send and receive
- AI responses display correctly
- Kanban updates trigger UI refresh
- Conversation history displays
- Error states handled
- Loading states show
- All interactive elements work
- CSS matches color scheme
- Chat and Kanban updates synchronized
- All tests pass

### Success Criteria
- ✓ Chat sidebar displays and functions
- ✓ AI responses appear in chat
- ✓ Kanban updates in real-time from AI
- ✓ Conversation history visible
- ✓ Error handling works
- ✓ UI updates synchronized with backend
- ✓ All tests pass
- ✓ Full AI-powered Kanban MVP complete

---

## Overall Testing Strategy

### Unit Tests
- All backend endpoints
- All AI client functions
- All frontend components

### Integration Tests
- Frontend to Backend API calls
- Backend to OpenRouter AI calls
- Full workflows (auth → board → AI chat → updates)

### End-to-End Tests
- Complete user journey: login → view board → create card → ask AI → board updates

### Manual Testing
- Visual design review (colors, spacing)
- User interaction flows (drag-drop, etc.)
- Error scenarios and edge cases
