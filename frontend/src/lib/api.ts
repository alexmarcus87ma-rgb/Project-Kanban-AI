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
  // Auth
  login: (username: string, password: string) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string) =>
    apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    apiFetch("/api/auth/logout", { method: "POST" }),

  getMe: () => apiFetch("/api/auth/me"),

  // Boards
  getBoards: () => apiFetch("/api/boards"),

  getBoard: (id: number) => apiFetch(`/api/boards/${id}`),

  createBoard: (name: string) =>
    apiFetch("/api/boards", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateBoard: (id: number, name: string) =>
    apiFetch(`/api/boards/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  deleteBoard: (id: number) =>
    apiFetch(`/api/boards/${id}`, { method: "DELETE" }),

  // Cards
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

  // Columns
  createColumn: (boardId: number, name: string) =>
    apiFetch(`/api/boards/${boardId}/columns`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateColumn: (id: number, data: object) =>
    apiFetch(`/api/columns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteColumn: (id: number) =>
    apiFetch(`/api/columns/${id}`, { method: "DELETE" }),

  // Labels
  getLabels: (boardId: number) =>
    apiFetch(`/api/boards/${boardId}/labels`),

  createLabel: (boardId: number, data: { name: string; color?: string }) =>
    apiFetch(`/api/boards/${boardId}/labels`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateLabel: (boardId: number, labelId: number, data: { name?: string; color?: string }) =>
    apiFetch(`/api/boards/${boardId}/labels/${labelId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteLabel: (boardId: number, labelId: number) =>
    apiFetch(`/api/boards/${boardId}/labels/${labelId}`, { method: "DELETE" }),

  // AI
  chat: (boardId: number, message: string) =>
    apiFetch("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ board_id: boardId, message }),
    }),

  clearChatHistory: (boardId: number) =>
    apiFetch(`/api/ai/chat/${boardId}/history`, { method: "DELETE" }),
}
