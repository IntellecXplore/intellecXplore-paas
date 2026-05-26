import { describe, expect, it } from 'bun:test'
import { ConvertTimeToSecond, FormatTime, GetNowTime } from '@/shared/time'

describe('ConvertTimeToSecond', () => {
  it('should convert days to seconds', () => {
    expect(ConvertTimeToSecond('1d')).toBe(86400)
    expect(ConvertTimeToSecond('2d')).toBe(172800)
  })

  it('should convert hours to seconds', () => {
    expect(ConvertTimeToSecond('1h')).toBe(3600)
    expect(ConvertTimeToSecond('24h')).toBe(86400)
  })

  it('should convert minutes to seconds', () => {
    expect(ConvertTimeToSecond('1m')).toBe(60)
    expect(ConvertTimeToSecond('60m')).toBe(3600)
  })

  it('should convert seconds', () => {
    expect(ConvertTimeToSecond('30s')).toBe(30)
    expect(ConvertTimeToSecond('90s')).toBe(90)
  })

  it('should handle compound time strings', () => {
    expect(ConvertTimeToSecond('1d 2h 30m 15s')).toBe(
      86400 + 7200 + 1800 + 15,
    )
  })

  it('should handle empty string', () => {
    expect(ConvertTimeToSecond('')).toBe(0)
  })

  it('should handle string with no time units', () => {
    expect(ConvertTimeToSecond('hello')).toBe(0)
  })

  it('should handle zero values', () => {
    expect(ConvertTimeToSecond('0d 0h 0m 0s')).toBe(0)
  })

  it('should handle mixed order', () => {
    expect(ConvertTimeToSecond('90s 2m')).toBe(90 + 120)
  })
})

describe('FormatTime', () => {
  it('should format Date object to default format', () => {
    const date = new Date('2024-01-15T08:30:00')
    const result = FormatTime(date)
    expect(result).toBe('2024-01-15 08:30:00')
  })

  it('should format timestamp number', () => {
    const result = FormatTime(1705305000000)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should format ISO string', () => {
    const result = FormatTime('2024-06-01T12:00:00Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should support custom format', () => {
    const date = new Date('2024-01-15')
    expect(FormatTime(date, 'YYYY/MM/DD')).toBe('2024/01/15')
    expect(FormatTime(date, 'MM-DD-YYYY')).toBe('01-15-2024')
  })

  it('should return empty string for falsy input', () => {
    expect(FormatTime('')).toBe('')
    expect(FormatTime(0 as any)).toBe('')
  })
})

describe('GetNowTime', () => {
  it('should return a string in YYYY-MM-DD HH:mm:ss format', () => {
    const result = GetNowTime()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should return current time (within 5 seconds of now)', () => {
    const before = Date.now()
    const result = GetNowTime()
    const after = Date.now()
    const parsed = new Date(result).getTime()
    // Allow 5 seconds tolerance
    expect(parsed).toBeGreaterThanOrEqual(before - 5000)
    expect(parsed).toBeLessThanOrEqual(after + 5000)
  })
})
