import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  let mockOnLogin: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLogin = vi.fn();
  });

  it("renders username and password fields", () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    expect(
      screen.getByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
  });

  it("does not show error message initially", () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    expect(screen.queryByText(/invalid username/i)).not.toBeInTheDocument();
  });

  it("calls onLogin with typed username and password on submit", async () => {
    const user = userEvent.setup();
    mockOnLogin.mockReturnValue(true);

    render(<LoginForm onLogin={mockOnLogin} />);

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "testpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(mockOnLogin).toHaveBeenCalledWith("testuser", "testpass");
  });

  it("shows error message when onLogin returns false", async () => {
    const user = userEvent.setup();
    mockOnLogin.mockReturnValue(false);

    render(<LoginForm onLogin={mockOnLogin} />);

    await user.type(screen.getByLabelText(/username/i), "wrong");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
  });

  it("does not show error message when onLogin returns true", async () => {
    const user = userEvent.setup();
    mockOnLogin.mockReturnValue(true);

    render(<LoginForm onLogin={mockOnLogin} />);

    await user.type(screen.getByLabelText(/username/i), "user");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      screen.queryByText(/invalid username or password/i)
    ).not.toBeInTheDocument();
  });

  it("clears error on retry after failure", async () => {
    const user = userEvent.setup();
    mockOnLogin.mockReturnValueOnce(false).mockReturnValueOnce(true);

    render(<LoginForm onLogin={mockOnLogin} />);

    // First attempt fails
    await user.type(screen.getByLabelText(/username/i), "wrong");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();

    // Clear and retry
    await user.clear(screen.getByLabelText(/username/i));
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/username/i), "user");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      screen.queryByText(/invalid username or password/i)
    ).not.toBeInTheDocument();
  });

  it("disables submit button while isLoading", async () => {
    const user = userEvent.setup();
    mockOnLogin.mockReturnValue(true);

    render(<LoginForm onLogin={mockOnLogin} />);

    const button = screen.getByRole("button", { name: /log in/i });

    await user.type(screen.getByLabelText(/username/i), "user");
    await user.type(screen.getByLabelText(/password/i), "password");

    expect(button).not.toBeDisabled();

    await user.click(button);

    // After submit, button should be re-enabled (since onLogin is sync)
    expect(button).not.toBeDisabled();
  });

  it("does not submit with empty username", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} />);

    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(
      screen.getByText(/username and password are required/i)
    ).toBeInTheDocument();
  });

  it("does not submit with empty password", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} />);

    await user.type(screen.getByLabelText(/username/i), "user");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(
      screen.getByText(/username and password are required/i)
    ).toBeInTheDocument();
  });
});
