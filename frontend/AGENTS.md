# Frontend Architecture & Code Overview

## Project Setup

- **Framework:** NextJS 16.1.6 with React 19.2.3
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Build Tool:** NextJS built-in build system
- **Testing:** Vitest for unit tests, Playwright for E2E tests

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Home page (renders Kanban)
│   │   ├── globals.css          # Global styles
│   │   └── favicon.ico
│   ├── components/
│   │   ├── KanbanBoard.tsx       # Main Kanban board container
│   │   ├── KanbanBoard.test.tsx  # Tests for KanbanBoard
│   │   ├── KanbanColumn.tsx      # Individual column component
│   │   ├── KanbanCard.tsx        # Individual card component
│   │   ├── KanbanCardPreview.tsx # Card preview during drag
│   │   └── NewCardForm.tsx       # Form to create new card
│   ├── lib/
│   │   ├── kanban.ts            # Kanban state management & types
│   │   └── kanban.test.ts       # Tests for kanban logic
│   └── test/
│       ├── setup.ts             # Vitest configuration
│       └── vitest.d.ts          # Vitest type definitions
├── tests/
│   └── (Playwright E2E tests)
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # NextJS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
└── postcss.config.mjs            # PostCSS configuration

```

## Key Components

### KanbanBoard.tsx
Main container component that manages the overall Kanban board state and layout.
- Manages columns and cards
- Handles drag-and-drop operations using @dnd-kit
- Renders KanbanColumn components
- Supports card creation and editing

### KanbanColumn.tsx
Represents a single Kanban column (e.g., "To Do", "In Progress", "Done").
- Renders column title
- Contains multiple KanbanCard components
- Handles drop-zone for drag-and-drop
- Supports column operations

### KanbanCard.tsx
Individual task card component.
- Displays card title and description
- Handles drag-start events
- Interactive selection and editing

### KanbanCardPreview.tsx
Visual preview of card during drag-and-drop operation.
- Renders clone of card while dragging
- Provides visual feedback to user

### NewCardForm.tsx
Form component for creating new cards.
- Input for card title
- Submit button
- Form validation

## Data & State Management

### kanban.ts Library
Contains mock data and type definitions for the Kanban board.

**Key Types:**
- `Board` - Complete board with columns and cards
- `Column` - Kanban column with position and cards
- `Card` - Individual task card

**Mock Data:**
Currently uses hardcoded sample data with:
- 3 columns: "To Do", "In Progress", "Done"
- Sample cards with titles and descriptions

**State Management:**
Currently uses React's built-in state management (useState).
Will be replaced with API calls to backend in Part 7.

## Testing

### Unit Tests (Vitest)
- `KanbanBoard.test.tsx` - Tests for main board component
- `kanban.test.ts` - Tests for data and utility functions

Run: `npm run test:unit` or `npm run test:unit:watch`

### E2E Tests (Playwright)
- Tests in `tests/` directory
- Test real user workflows

Run: `npm run test:e2e`

### Test All
Run: `npm run test:all`

## Styling

### Tailwind CSS 4
- Custom color scheme defined in globals.css
- Responsive design with Tailwind utilities
- Color palette:
  - Accent Yellow: `#ecad0a`
  - Blue Primary: `#209dd7`
  - Purple Secondary: `#753991`
  - Dark Navy: `#032147`
  - Gray Text: `#888888`

## Build & Development

### Development
```bash
npm run dev
```
Runs NextJS dev server with hot reload on `http://localhost:3000`

### Production Build
```bash
npm run build
npm run start
```
Creates optimized static build for deployment.

### Linting
```bash
npm run lint
```

## Dependencies Overview

### Core
- **next:** Framework for React with SSR/SSG
- **react, react-dom:** UI library
- **typescript:** Type safety

### UI & Styling
- **tailwindcss:** Utility-first CSS
- **clsx:** Conditional className helper

### Drag & Drop
- **@dnd-kit/core:** Core drag-and-drop library
- **@dnd-kit/sortable:** Sortable preset for dnd-kit
- **@dnd-kit/utilities:** Helper utilities for dnd-kit

### Testing
- **vitest:** Fast unit test framework
- **@testing-library/react:** React component testing utilities
- **@testing-library/user-event:** User interaction simulation
- **@testing-library/jest-dom:** DOM matchers
- **@vitest/coverage-v8:** Code coverage
- **@playwright/test:** E2E testing framework
- **jsdom:** DOM implementation for tests

### Development
- **eslint:** Code linting
- **eslint-config-next:** NextJS linting rules

## Next Steps (Part 3 Onwards)

1. Configure NextJS build to output static files
2. Update build process to integrate with FastAPI backend
3. Replace mock data with API calls to `/api/boards/*` endpoints
4. Add authentication flow in Part 4
5. Implement chat sidebar in Part 10

## Important Notes

- Frontend currently runs standalone at `http://localhost:3000`
- All data is mock/in-memory (no persistence yet)
- Will be integrated into FastAPI backend via static build in Part 3
- Drag-and-drop is fully functional with visual previews
- Color scheme is already applied per project spec
