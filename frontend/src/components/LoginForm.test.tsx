import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  let mockOnLogin: ReturnType<typeof vi.fn>;
  let mockOnRegister: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLogin = vi.fn();
    mockOnRegister = vi.fn();
  });

  it("renders username and password fields", () => {
    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders a login button by default", () => {
    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("does not show error message initially", () => {
    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);
    expect(screen.queryByText(/invalid username/i)).not.toBeInTheDocument();
  });

  it("calls onLogin with typed username and password on submit", async () => {
    const user = userEvent.setup();
    mockOnLogin.mockReturnValue(true);

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "testpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(mockOnLogin).toHaveBeenCalledWith("testuser", "testpass");
  });

  it("shows error message when onLogin returns false", async () => {
    const user = userEvent.setup();
    mockOnLogin.mockReturnValue(false);

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.type(screen.getByLabelText(/username/i), "wrong");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
  });

  it("does not submit with empty username", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/username and password are required/i)).toBeInTheDocument();
  });

  it("does not submit with empty password", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.type(screen.getByLabelText(/username/i), "user");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(screen.getByText(/username and password are required/i)).toBeInTheDocument();
  });

  // Registration mode tests

  it("toggles to registration mode", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.click(screen.getByText(/don't have an account/i));

    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("calls onRegister in registration mode", async () => {
    const user = userEvent.setup();
    mockOnRegister.mockReturnValue({ success: true });

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.click(screen.getByText(/don't have an account/i));
    await user.type(screen.getByLabelText(/username/i), "newuser");
    await user.type(screen.getByLabelText(/password/i), "newpass123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockOnRegister).toHaveBeenCalledWith("newuser", "newpass123");
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it("shows error for short password in register mode", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.click(screen.getByText(/don't have an account/i));
    await user.type(screen.getByLabelText(/username/i), "newuser");
    await user.type(screen.getByLabelText(/password/i), "12345");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockOnRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it("shows error for short username in register mode", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.click(screen.getByText(/don't have an account/i));
    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockOnRegister).not.toHaveBeenCalled();
    expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
  });

  it("shows registration error from server", async () => {
    const user = userEvent.setup();
    mockOnRegister.mockReturnValue({ success: false, error: "Username already taken" });

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.click(screen.getByText(/don't have an account/i));
    await user.type(screen.getByLabelText(/username/i), "existing");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/username already taken/i)).toBeInTheDocument();
  });

  it("toggles back to login mode", async () => {
    const user = userEvent.setup();

    render(<LoginForm onLogin={mockOnLogin} onRegister={mockOnRegister} />);

    await user.click(screen.getByText(/don't have an account/i));
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();

    await user.click(screen.getByText(/already have an account/i));
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });
});
