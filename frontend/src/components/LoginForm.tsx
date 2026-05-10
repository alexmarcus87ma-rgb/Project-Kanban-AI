"use client"

import { useState, FormEvent } from "react"
import { LayoutDashboard, LogIn, UserPlus, Loader2, AlertCircle, User, Lock } from "lucide-react"

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>
  onRegister: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
}

export function LoginForm({ onLogin, onRegister }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required")
      return
    }

    if (isRegisterMode && password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (isRegisterMode && username.length < 3) {
      setError("Username must be at least 3 characters")
      return
    }

    setIsLoading(true)
    setError("")

    if (isRegisterMode) {
      const result = await onRegister(username, password)
      setIsLoading(false)
      if (!result.success) {
        setError(result.error ?? "Registration failed")
      }
    } else {
      const success = await onLogin(username, password)
      setIsLoading(false)
      if (!success) {
        setError("Invalid username or password")
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="rounded-2xl border border-[var(--stroke)] bg-white p-8 shadow-[var(--shadow-lg)]">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary-purple)] text-white">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--navy-dark)]">
            {isRegisterMode ? "Create account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-[var(--gray-text)]">
            {isRegisterMode
              ? "Sign up for your Kanban board"
              : "Sign in to your Kanban board"}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-semibold text-[var(--gray-text)]"
            >
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-light)]" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl border border-[var(--stroke)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--navy-dark)] placeholder-[var(--gray-light)] outline-none transition focus:border-[var(--primary-blue)] focus:bg-white"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold text-[var(--gray-text)]"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-light)]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegisterMode ? "Min. 6 characters" : "Enter password"}
                className="w-full rounded-xl border border-[var(--stroke)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--navy-dark)] placeholder-[var(--gray-light)] outline-none transition focus:border-[var(--primary-blue)] focus:bg-white"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--secondary-purple)] px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 hover:enabled:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRegisterMode ? "Creating account..." : "Logging in..."}
              </>
            ) : isRegisterMode ? (
              <>
                <UserPlus className="h-4 w-4" />
                Create account
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Log in
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode)
                setError("")
              }}
              className="text-sm text-[var(--primary-blue)] hover:underline"
            >
              {isRegisterMode
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
