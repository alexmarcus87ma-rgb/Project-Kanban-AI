"use client"

import { useState, FormEvent } from "react"

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required")
      return
    }

    setIsLoading(true)
    setError("")

    const success = await onLogin(username, password)

    setIsLoading(false)

    if (!success) {
      setError("Invalid username or password")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="rounded-[32px] border border-[var(--stroke)] bg-white p-10 shadow-[var(--shadow)]">
        <h1 className="font-display text-3xl font-semibold text-[var(--navy-dark)]">
          Log in
        </h1>
        <p className="mt-2 text-sm text-[var(--gray-text)]">
          Enter your credentials to access your Kanban board.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--gray-text)]"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user"
              className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--navy-dark)] placeholder-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-1 focus:ring-[var(--primary-blue)]"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--gray-text)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--navy-dark)] placeholder-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-1 focus:ring-[var(--primary-blue)]"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-full border border-[var(--secondary-purple)] bg-[var(--secondary-purple)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition disabled:opacity-60 hover:enabled:bg-[#6a2d80]"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </div>
      </div>
    </form>
  )
}
