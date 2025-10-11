// Server-side helper for Courier (e.g., Leopards) auth + requests
// Caches bearer token in-memory with expiry to avoid frequent logins.

let cachedToken: string | null = null
let tokenExpiresAt = 0 // epoch ms

async function loginAndGetToken(): Promise<{ token: string; expiresInSec: number }> {
  const base = process.env.COURIER_API_BASE_URL
  const username = process.env.COURIER_API_USERNAME
  const password = process.env.COURIER_API_PASSWORD

  if (!base || !username || !password) {
    const missing = [!base && "COURIER_API_BASE_URL", !username && "COURIER_API_USERNAME", !password && "COURIER_API_PASSWORD"].filter(Boolean)
    throw new Error(`Missing env vars: ${missing.join(", ")}`)
  }

  // NOTE: Adjust this endpoint/payload to match the courier provider
  const res = await fetch(`${base}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  })

  const text = await res.text()
  if (!res.ok) {
    let body: any
    try { body = JSON.parse(text) } catch { body = { raw: text } }
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(body)}`)
  }

  let data: any
  try { data = JSON.parse(text) } catch { data = {} }

  // Try common token fields
  const token: string | undefined = data?.token || data?.access_token || data?.data?.token
  const expiresInSec: number = Number(data?.expires_in || data?.expiresIn || 3600)

  if (!token) throw new Error("Login response missing token field")

  return { token, expiresInSec }
}

export async function getCourierToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiresAt - now > 60_000) {
    // still valid (>= 60s left)
    return cachedToken
  }

  const { token, expiresInSec } = await loginAndGetToken()
  cachedToken = token
  tokenExpiresAt = now + expiresInSec * 1000
  return token
}

export async function courierGet(path: string): Promise<Response> {
  const base = process.env.COURIER_API_BASE_URL
  if (!base) throw new Error("Missing COURIER_API_BASE_URL")
  const token = await getCourierToken()
  return fetch(`${base}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
}
