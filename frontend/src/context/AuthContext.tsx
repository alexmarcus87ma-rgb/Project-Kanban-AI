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
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Read session from localStorage on client mount only
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
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
