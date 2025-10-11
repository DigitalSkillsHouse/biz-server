import { MongoClient } from "mongodb"

declare global {
  // eslint-disable-next-line no-var
  var __mongoProfileClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_PROFILE_URI
if (!uri) {
  console.warn("[profiles] MONGODB_PROFILE_URI is not set. Profile lookup will be disabled.")
}

const client = uri
  ? new MongoClient(uri, {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL || '10'),
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL || '1'),
      serverSelectionTimeoutMS: 7000,
      appName: "Biz.com-profiles",
      family: 4,
    })
  : null

function createClientPromise(): Promise<MongoClient> {
  if (!client) throw new Error("MONGODB_PROFILE_URI not configured")
  let lastErr: any
  const maxAttempts = 3
  const delayMs = 800
  const attemptConnect = async (attempt: number): Promise<MongoClient> => {
    try {
      const c = await client.connect()
      await c.db().command({ ping: 1 })
      if (attempt > 1) {
        console.log(`[MongoDB:profiles] Connected after retry #${attempt - 1}`)
      } else {
        console.log("[MongoDB:profiles] Connected successfully")
      }
      return c
    } catch (err: any) {
      lastErr = err
      console.error(`[MongoDB:profiles] Connect attempt ${attempt} failed:`, err?.message || err)
      if (attempt < maxAttempts) {
        await new Promise(res => setTimeout(res, delayMs * attempt))
        return attemptConnect(attempt + 1)
      }
      throw lastErr
    }
  }
  return attemptConnect(1)
}

const clientPromise: Promise<MongoClient> | undefined = uri
  ? (global.__mongoProfileClientPromise || createClientPromise())
  : undefined

// @ts-ignore cache it for HMR
if (uri) global.__mongoProfileClientPromise = clientPromise

export async function getProfileDb() {
  if (!clientPromise) throw new Error("Profiles DB not configured. Missing MONGODB_PROFILE_URI")
  const c = await clientPromise
  const dbName = process.env.MONGODB_PROFILE_DB || undefined
  return c.db(dbName)
}
