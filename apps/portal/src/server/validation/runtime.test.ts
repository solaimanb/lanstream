/**
 * Unit tests — runtime validation schemas (claim, heartbeat, release).
 */
import { describe, expect, it } from 'vitest'
import { claimSchema, heartbeatSchema, releaseSchema } from './runtime'

const validDeviceInfo = {
  hostname: 'DESKTOP-TEST',
  platform: 'win32/x64',
  version: '0.1.0',
  localIp: '192.168.1.100',
  port: 4780,
}

const validUUID = '123e4567-e89b-42d3-a456-426614174001'

describe('claimSchema', () => {
  it('accepts valid claim input', () => {
    const result = claimSchema.safeParse({
      serverId: validUUID,
      hostDeviceInfo: validDeviceInfo,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid serverId UUID', () => {
    const result = claimSchema.safeParse({
      serverId: 'not-a-uuid',
      hostDeviceInfo: validDeviceInfo,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty hostname', () => {
    const result = claimSchema.safeParse({
      serverId: validUUID,
      hostDeviceInfo: { ...validDeviceInfo, hostname: '' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects port out of range', () => {
    const result = claimSchema.safeParse({
      serverId: validUUID,
      hostDeviceInfo: { ...validDeviceInfo, port: 0 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects port exceeding 65535', () => {
    const result = claimSchema.safeParse({
      serverId: validUUID,
      hostDeviceInfo: { ...validDeviceInfo, port: 70000 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing hostDeviceInfo', () => {
    const result = claimSchema.safeParse({
      serverId: validUUID,
    })
    expect(result.success).toBe(false)
  })
})

describe('heartbeatSchema', () => {
  it('accepts valid heartbeat input', () => {
    const result = heartbeatSchema.safeParse({
      serverId: validUUID,
      hostDeviceId: validUUID,
      status: 'online',
    })
    expect(result.success).toBe(true)
  })

  it('accepts heartbeat with optional hostDeviceInfo', () => {
    const result = heartbeatSchema.safeParse({
      serverId: validUUID,
      hostDeviceId: validUUID,
      status: 'online',
      hostDeviceInfo: validDeviceInfo,
    })
    expect(result.success).toBe(true)
  })

  it('accepts all valid status values', () => {
    for (const status of ['online', 'offline', 'starting', 'stopping']) {
      const result = heartbeatSchema.safeParse({
        serverId: validUUID,
        hostDeviceId: validUUID,
        status,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    const result = heartbeatSchema.safeParse({
      serverId: validUUID,
      hostDeviceId: validUUID,
      status: 'unknown',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing hostDeviceId', () => {
    const result = heartbeatSchema.safeParse({
      serverId: validUUID,
      status: 'online',
    })
    expect(result.success).toBe(false)
  })
})

describe('releaseSchema', () => {
  it('accepts valid release input', () => {
    const result = releaseSchema.safeParse({
      serverId: validUUID,
      hostDeviceId: validUUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid serverId', () => {
    const result = releaseSchema.safeParse({
      serverId: 'not-a-uuid',
      hostDeviceId: validUUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hostDeviceId', () => {
    const result = releaseSchema.safeParse({
      serverId: validUUID,
      hostDeviceId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = releaseSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
