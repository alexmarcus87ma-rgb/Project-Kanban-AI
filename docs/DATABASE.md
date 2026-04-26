# Database Schema Documentation

## Overview

SQLite relational database schema for Project Management MVP. Supports multiple users and boards, with hardcoded authentication in MVP phase.

**Database File:** `backend/database.db`  
**ORM:** SQLAlchemy 2.0+  
**Creation:** Automatic on first run via `Base.metadata.create_all()`

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          USERS                              │
├─────────────────────────────────────────────────────────────┤
│ PK  id                  INTEGER                             │
│     username            TEXT (UNIQUE)                       │
│     password_hash       TEXT                                │
│     created_at          DATETIME (DEFAULT: CURRENT_TIME)    │
│     updated_at          DATETIME (DEFAULT: CURRENT_TIME)    │
└─────────────────────────────────────────────────────────────┘
         │
         │ 1:N (one user → many boards)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                        BOARDS                               │
├─────────────────────────────────────────────────────────────┤
│ PK  id                  INTEGER                             │
│ FK  user_id             INTEGER (references users.id)       │
│     name                TEXT                                │
│     created_at          DATETIME (DEFAULT: CURRENT_TIME)    │
│     updated_at          DATETIME (DEFAULT: CURRENT_TIME)    │
└─────────────────────────────────────────────────────────────┘
         │
         │ 1:N (one board → many columns)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                       COLUMNS                               │
├─────────────────────────────────────────────────────────────┤
│ PK  id                  INTEGER                             │
│ FK  board_id            INTEGER (references boards.id)      │
│     name                TEXT                                │
│     position            INTEGER (display order)             │
│     created_at          DATETIME (DEFAULT: CURRENT_TIME)    │
│     updated_at          DATETIME (DEFAULT: CURRENT_TIME)    │
└─────────────────────────────────────────────────────────────┘
         │
         │ 1:N (one column → many cards)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                        CARDS                                │
├─────────────────────────────────────────────────────────────┤
│ PK  id                  INTEGER                             │
│ FK  column_id           INTEGER (references columns.id)     │
│     title               TEXT                                │
│     description         TEXT (nullable)                     │
│     position            INTEGER (display order)             │
│     created_at          DATETIME (DEFAULT: CURRENT_TIME)    │
│     updated_at          DATETIME (DEFAULT: CURRENT_TIME)    │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│                CONVERSATION_HISTORY                         │
├─────────────────────────────────────────────────────────────┤
│ PK  id                  INTEGER                             │
│ FK  user_id             INTEGER (references users.id)       │
│ FK  board_id            INTEGER (references boards.id)      │
│     role                TEXT ('user' or 'assistant')        │
│     message             TEXT                                │
│     created_at          DATETIME (DEFAULT: CURRENT_TIME)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Table Specifications

### USERS
Stores application users and authentication details.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PK, AI | Unique user identifier |
| username | TEXT | NOT NULL, UNIQUE | Login username (e.g., "user") |
| password_hash | TEXT | NOT NULL | Bcrypt hash of password; MVP uses hardcoded credentials in frontend |
| created_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last modification timestamp |

**Notes:**
- For MVP: hardcoded credentials in frontend (`src/lib/auth.ts`)
- Future: implement backend authentication with hashed passwords
- One-to-many relationship with boards

### BOARDS
Projects owned by users. MVP: one board per user. Schema supports multiple boards per user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PK, AI | Unique board identifier |
| user_id | INTEGER | NOT NULL, FK(users.id) | Owner of the board |
| name | TEXT | NOT NULL | Board display name (e.g., "Q1 Planning") |
| created_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Board creation timestamp |
| updated_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last modification timestamp |

**Notes:**
- Foreign key to users.id — cannot delete board without handling user reference
- Index on user_id for fast user board lookup

### COLUMNS
Kanban board columns (e.g., "Backlog", "In Progress", "Done"). MVP ships with 5 fixed columns.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PK, AI | Unique column identifier |
| board_id | INTEGER | NOT NULL, FK(boards.id) | Parent board |
| name | TEXT | NOT NULL | Column title (e.g., "Backlog") |
| position | INTEGER | NOT NULL | Display order (0, 1, 2, ...) |
| created_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last modification timestamp |

**Notes:**
- Composite index on (board_id, position) for fast ordered retrieval
- position allows reordering without renumbering all columns
- MVP: position is immutable (fixed order); future: allow reordering

### CARDS
Task cards within columns. Each card belongs to exactly one column.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PK, AI | Unique card identifier |
| column_id | INTEGER | NOT NULL, FK(columns.id) | Parent column |
| title | TEXT | NOT NULL | Card title/name (e.g., "Fix login bug") |
| description | TEXT | nullable | Detailed notes or specifications |
| position | INTEGER | NOT NULL | Display order within column |
| created_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Last modification timestamp |

**Notes:**
- position tracks vertical order in the column; updated on drag-and-drop
- Composite index on (column_id, position) for fast retrieval
- description is optional (nullable)

### CONVERSATION_HISTORY
Messages exchanged with the AI assistant, scoped per board.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PK, AI | Unique message identifier |
| user_id | INTEGER | NOT NULL, FK(users.id) | User who initiated the conversation |
| board_id | INTEGER | NOT NULL, FK(boards.id) | Board context for the conversation |
| role | TEXT | NOT NULL | Message sender: "user" or "assistant" |
| message | TEXT | NOT NULL | Full message content |
| created_at | DATETIME | NOT NULL, DEFAULT: CURRENT_TIMESTAMP | Message timestamp |

**Notes:**
- Composite FK on (user_id, board_id) — messages tied to both user and board context
- Index on board_id for fast message retrieval by board
- One-directional: user → assistant, no back-references to cards or columns
- Messages immutable (no updates or deletes in MVP)

---

## Indexes

### Lookup Optimization

| Index Name | Table | Columns | Purpose |
|---|---|---|---|
| idx_boards_user_id | boards | (user_id) | Find all boards for a user |
| idx_columns_board_id | columns | (board_id) | Find all columns on a board |
| idx_columns_position | columns | (board_id, position) | Ordered column retrieval |
| idx_cards_column_id | cards | (column_id) | Find all cards in a column |
| idx_cards_position | cards | (column_id, position) | Ordered card retrieval within column |
| idx_conversation_board | conversation_history | (board_id) | Retrieve conversation history for a board |

### Notes
- No indexes on (updated_at, created_at) for MVP — not used in queries
- Future: add timestamp indexes if audit/logging queries become common
- Primary keys are indexed automatically by SQLite

---

## Data Flow

### MVP: User Login & Kanban Access
1. Frontend validates hardcoded credentials (no API call)
2. On board load: backend fetches user's board by user_id
3. Frontend displays columns + cards by board_id

### Stage 6+: API Persistence
1. POST /api/auth/login → check users table, return session
2. GET /api/boards → fetch user's board(s)
3. GET /api/boards/{id} → fetch board + columns + cards
4. POST /api/cards → insert into cards table
5. PATCH /api/cards/{id} → update position/title in cards table
6. DELETE /api/cards/{id} → delete from cards table

### Stage 9+: AI Conversation
1. POST /api/ai/chat → user question + board context
2. Backend inserts user message into conversation_history
3. AI assistant responds with text + optional Kanban updates
4. Backend inserts assistant message into conversation_history
5. Kanban changes applied (cards created/moved/deleted)

---

## Constraints & Referential Integrity

| Constraint | Details |
|---|---|
| users.username | UNIQUE — no duplicate logins |
| boards.user_id | FK → users.id (no orphaned boards) |
| columns.board_id | FK → boards.id (no orphaned columns) |
| cards.column_id | FK → columns.id (no orphaned cards) |
| conversation_history.user_id | FK → users.id |
| conversation_history.board_id | FK → boards.id |

**Note:** SQLite enforces FK constraints if `PRAGMA foreign_keys = ON` (enabled by default in SQLAlchemy 2.0+).

---

## Migration Strategy

### MVP Phase (Development)
- Schema defined in SQLAlchemy models (`backend/models/*.py`)
- `Base.metadata.create_all()` on app startup
- Dropping/recreating database acceptable during development
- No migration framework needed

### Schema Changes
To evolve the schema:
1. Update SQLAlchemy model definitions
2. Drop existing database (during dev) or run a migration tool (production)
3. Restart app — `create_all()` recreates tables with new schema

### Future: Production Migrations
If/when schema changes need backward compatibility:
- Implement Alembic (SQLAlchemy migration framework)
- Generate migrations via `alembic revision --autogenerate`
- Apply with `alembic upgrade head`

---

## Sample Queries

### Find user's board with columns and cards
```sql
SELECT
  b.id, b.name,
  c.id AS column_id, c.name AS column_name, c.position,
  ca.id AS card_id, ca.title, ca.description, ca.position AS card_position
FROM users u
JOIN boards b ON u.id = b.user_id
LEFT JOIN columns c ON b.id = c.board_id
LEFT JOIN cards ca ON c.id = ca.column_id
WHERE u.id = 1
ORDER BY c.position, ca.position;
```

### Recent conversation for a board
```sql
SELECT role, message, created_at
FROM conversation_history
WHERE board_id = 1
ORDER BY created_at DESC
LIMIT 50;
```

### Move a card (update position)
```sql
UPDATE cards
SET position = 3, updated_at = CURRENT_TIMESTAMP
WHERE id = 42 AND column_id = 2;
```

---

## Performance Considerations

### Read Performance
- Indexes on foreign keys enable fast joins
- Composite indexes (board_id, position) allow sorted retrieval in single pass
- No N+1 queries if backend loads relations eagerly

### Write Performance
- position updates may cause reordering of multiple rows
- For large boards (100+ cards), consider storing positions as gaps (0, 10, 20, ...) for cheaper reordering

### Storage
- SQLite file grows with data; no specific limits for MVP
- Conversation history can grow large if many chat sessions — consider archiving old messages

---

## File Location
- **Schema definition:** `pm/docs/schema.json`
- **Database file (runtime):** `pm/backend/database.db`
- **SQLAlchemy models:** `pm/backend/models/` (implemented in Stage 6)
