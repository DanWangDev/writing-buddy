import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from '../services/logger.js'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  it('writes info messages to stdout', () => {
    logger.info('test message')
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining('INFO: test message')
    )
  })

  it('writes error messages to stderr', () => {
    logger.error('error message')
    expect(process.stderr.write).toHaveBeenCalledWith(
      expect.stringContaining('ERROR: error message')
    )
  })

  it('includes data in log output', () => {
    logger.info('with data', { key: 'value' })
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining('"key":"value"')
    )
  })

  it('writes warn messages to stderr', () => {
    logger.warn('warning message')
    expect(process.stderr.write).toHaveBeenCalledWith(
      expect.stringContaining('WARN: warning message')
    )
  })
})
