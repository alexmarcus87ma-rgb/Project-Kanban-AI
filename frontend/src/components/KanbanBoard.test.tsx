import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";

// Mock the API - vi.mock is hoisted, so data must be inline
vi.mock("@/lib/api", () => ({
  api: {
    getBoards: vi.fn().mockResolvedValue([
      { id: 1, name: "Test Board", user_id: 1, created_at: "2025-01-01", updated_at: "2025-01-01" },
    ]),
    getBoard: vi.fn().mockResolvedValue({
      id: 1,
      user_id: 1,
      name: "Test Board",
      columns: [
        {
          id: 1, board_id: 1, name: "Backlog", position: 0,
          created_at: "2025-01-01", updated_at: "2025-01-01",
          cards: [
            { id: 1, column_id: 1, title: "Test Card", description: "A test", position: 0, priority: null, due_date: null, labels: [], created_at: "2025-01-01", updated_at: "2025-01-01" },
          ],
        },
        {
          id: 2, board_id: 1, name: "In Progress", position: 1,
          created_at: "2025-01-01", updated_at: "2025-01-01",
          cards: [],
        },
      ],
      labels: [],
    }),
    createBoard: vi.fn().mockResolvedValue({ id: 2, name: "New Board" }),
    deleteBoard: vi.fn().mockResolvedValue(null),
    updateBoard: vi.fn().mockResolvedValue({}),
    createCard: vi.fn().mockResolvedValue({ id: 99, title: "New card", description: "Notes", position: 0, priority: null, due_date: null, labels: [] }),
    updateCard: vi.fn().mockResolvedValue({}),
    deleteCard: vi.fn().mockResolvedValue(null),
    updateColumn: vi.fn().mockResolvedValue({}),
    chat: vi.fn().mockResolvedValue({ reply: "Hello", model: "test", actions_executed: 0, board_updated: false }),
  },
}));

describe("KanbanBoard", () => {
  it("renders columns from API data", async () => {
    render(<KanbanBoard />);
    await waitFor(() => {
      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders cards from API data", async () => {
    render(<KanbanBoard />);
    await waitFor(() => {
      expect(screen.getByText("Test Card")).toBeInTheDocument();
    });
  });

  it("renders a Log out button when onLogout prop is provided", async () => {
    const mockOnLogout = vi.fn();
    render(<KanbanBoard onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("calls onLogout when Log out button is clicked", async () => {
    const mockOnLogout = vi.fn();
    render(<KanbanBoard onLogout={mockOnLogout} />);
    await waitFor(() => {
      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(mockOnLogout).toHaveBeenCalledOnce();
  });

  it("does not render Log out button when onLogout prop is omitted", async () => {
    render(<KanbanBoard />);
    await waitFor(() => {
      expect(screen.getByText("Backlog")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
  });

  it("renders the board selector with the board name", async () => {
    render(<KanbanBoard />);
    await waitFor(() => {
      expect(screen.getByText("Test Board")).toBeInTheDocument();
    });
  });

  it("shows correct card and column counts", async () => {
    render(<KanbanBoard />);
    await waitFor(() => {
      expect(screen.getByText(/2 columns/)).toBeInTheDocument();
      expect(screen.getByText(/1 cards/)).toBeInTheDocument();
    });
  });
});
