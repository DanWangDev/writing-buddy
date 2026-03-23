import { describe, it, expect, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../index.js'
import { closeDatabase } from '../config/database.js'

afterAll(() => {
  closeDatabase()
})

describe('GET /api/writing/health', () => {
  it('returns healthy status with database connection', async () => {
    const response = await request(app).get('/api/writing/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe('healthy')
    expect(response.body.data.database).toBe('connected')
    expect(typeof response.body.data.uptime).toBe('number')
    expect(response.body.data.version).toBeDefined()
  })
})
