import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CardDetailModal } from "./CardDetailModal"
import type { Card } from "@/lib/kanban"

const mockCard: Card = {
  id: "1",
  title: "Test Card",
  details: "Test description",
  priority: "medium",
  dueDate: "2026-06-01",
  labels: [{ id: 1, name: "Bug", color: "#ef4444" }],
}

const mockLabels = [
  { id: 1, name: "Bug", color: "#ef4444" },
  { id: 2, name: "Feature", color: "#3b82f6" },
]

describe("CardDetailModal", () => {
  it("renders card title and description", () => {
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByDisplayValue("Test Card")).toBeTruthy()
    expect(screen.getByDisplayValue("Test description")).toBeTruthy()
  })

  it("shows column name", () => {
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("In Progress")).toBeTruthy()
  })

  it("shows priority buttons with medium selected", () => {
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("Medium")).toBeTruthy()
    expect(screen.getByText("Low")).toBeTruthy()
    expect(screen.getByText("High")).toBeTruthy()
    expect(screen.getByText("Urgent")).toBeTruthy()
  })

  it("shows due date input with value", () => {
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const dateInput = screen.getByDisplayValue("2026-06-01")
    expect(dateInput).toBeTruthy()
  })

  it("shows board labels", () => {
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("Bug")).toBeTruthy()
    expect(screen.getByText("Feature")).toBeTruthy()
  })

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn()
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByText("Cancel"))
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onDelete and onClose when delete is clicked", () => {
    const onDelete = vi.fn()
    const onClose = vi.fn()
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={onDelete}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByText("Delete"))
    expect(onDelete).toHaveBeenCalledWith("1")
    expect(onClose).toHaveBeenCalled()
  })

  it("enables save button when title changes", () => {
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const saveButton = screen.getByText("Save")
    expect(saveButton.closest("button")?.disabled).toBe(true)

    fireEvent.change(screen.getByDisplayValue("Test Card"), {
      target: { value: "Updated Card" },
    })

    expect(saveButton.closest("button")?.disabled).toBe(false)
  })

  it("calls onSave with updated data", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <CardDetailModal
        card={mockCard}
        columnName="In Progress"
        boardLabels={mockLabels}
        onSave={onSave}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    fireEvent.change(screen.getByDisplayValue("Test Card"), {
      target: { value: "Updated Card" },
    })

    fireEvent.click(screen.getByText("Save"))

    expect(onSave).toHaveBeenCalledWith("1", {
      title: "Updated Card",
      description: "Test description",
      priority: "medium",
      due_date: "2026-06-01",
      label_ids: [1],
    })
  })

  it("renders with no labels gracefully", () => {
    const cardNoLabels = { ...mockCard, labels: [] }
    render(
      <CardDetailModal
        card={cardNoLabels}
        columnName="Backlog"
        boardLabels={[]}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByDisplayValue("Test Card")).toBeTruthy()
  })
})
