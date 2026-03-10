import duckdb from "duckdb"
import path from "node:path"
import os from "node:os"
import fs from "node:fs"
import { SCHEMA_SQL } from "./schema"

const DATA_DIR = path.join(os.homedir(), ".talentclaw")
const DB_PATH = path.join(DATA_DIR, "data.db")

let _db: duckdb.Database | null = null
let _initialized = false

function getDatabase(): duckdb.Database {
  if (!_db) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    _db = new duckdb.Database(DB_PATH)
  }
  return _db
}

async function ensureSchema(): Promise<void> {
  if (_initialized) return
  const db = getDatabase()
  return new Promise((resolve, reject) => {
    db.exec(SCHEMA_SQL, (err) => {
      if (err) reject(err)
      else {
        _initialized = true
        resolve()
      }
    })
  })
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  await ensureSchema()
  const db = getDatabase()
  const conn = db.connect()
  return new Promise<T[]>((resolve, reject) => {
    const stmt = conn.prepare(sql)
    stmt.all(...params, (err: Error | null, rows: duckdb.TableData) => {
      if (err) reject(err)
      else resolve((rows as T[]) ?? [])
    })
    stmt.finalize()
  })
}

export async function run(
  sql: string,
  ...params: unknown[]
): Promise<void> {
  await ensureSchema()
  const db = getDatabase()
  const conn = db.connect()
  return new Promise<void>((resolve, reject) => {
    const stmt = conn.prepare(sql)
    stmt.run(...params, (err: Error | null) => {
      if (err) reject(err)
      else resolve()
    })
    stmt.finalize()
  })
}

export { DB_PATH, DATA_DIR }
