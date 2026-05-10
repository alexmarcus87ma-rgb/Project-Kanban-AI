"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { saveSession, clearSession, getSession } from "@/lib/auth"
import { api } from "@/lib/api"

interface AuthContextValue {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!getSession())
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(username, password)
      saveSession(response.token)
      setIsAuthenticated(true)
      return true
    } catch {
      return false
    }
  }

  const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.register(username, password)
      saveSession(response.token)
      setIsAuthenticated(true)
      return { success: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Registration failed"
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // Ignore logout errors, clear session anyway
    }
    clearSession()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
