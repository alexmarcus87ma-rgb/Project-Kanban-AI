const BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("pm_token")
}

async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  })

  if (res.status === 204) return null

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? res.statusText)
  }

  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    apiFetch("/api/auth/logout", { method: "POST" }),

  getBoards: () => apiFetch("/api/boards"),

  getBoard: (id: number) => apiFetch(`/api/boards/${id}`),

  createCard: (boardId: number, data: object) =>
    apiFetch(`/api/boards/${boardId}/cards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCard: (id: number, data: object) =>
    apiFetch(`/api/cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCard: (id: number) =>
    apiFetch(`/api/cards/${id}`, { method: "DELETE" }),

  updateColumn: (id: number, data: object) =>
    apiFetch(`/api/columns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  chat: (boardId: number, message: string) =>
    apiFetch("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ board_id: boardId, message }),
    }),
}
