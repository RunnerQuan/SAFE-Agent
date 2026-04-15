import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, mock, test } from 'node:test'

import * as agentraft from './agentraft-service'
import * as mtatlas from './mtatlas-service'
import { __internal as scanInternal } from './scan-service'

afterEach(() => {
  mock.restoreAll()
  agentraft.__internal.invalidateStateCache()
  mtatlas.__internal.invalidateStateCache()
})

test('agentraft loadState caches state reads within TTL and invalidates on demand', async () => {
  let stateReadCount = 0

  mock.method(fs, 'mkdir', async () => undefined)
  mock.method(fs, 'readdir', async () => [])
  mock.method(fs, 'readFile', async (filePath: unknown) => {
    const resolved = String(filePath)
    if (resolved.endsWith('agentraft-state.json')) {
      stateReadCount += 1
      return JSON.stringify({
        agents: [],
        scans: [],
        reportDetails: [],
        logs: {},
      })
    }

    return '[]'
  })

  agentraft.__internal.invalidateStateCache()

  await agentraft.listScans()
  await agentraft.listScans()
  assert.equal(stateReadCount, 1)

  agentraft.__internal.invalidateStateCache()
  await agentraft.listScans()
  assert.equal(stateReadCount, 2)
})

test('mtatlas loadState caches state reads within TTL and invalidates on demand', async () => {
  let stateReadCount = 0

  mock.method(fs, 'mkdir', async () => undefined)
  mock.method(fs, 'readFile', async (filePath: unknown) => {
    const resolved = String(filePath)
    if (resolved.endsWith('mtatlas-state.json')) {
      stateReadCount += 1
      return JSON.stringify({
        agents: [],
        scans: [],
        reportDetails: [],
        logs: {},
      })
    }

    if (resolved.endsWith(`${path.sep}demo_tools.json`)) {
      return '[]'
    }

    if (resolved.endsWith(`${path.sep}sink_tools.json`)) {
      return JSON.stringify({ sink_tools: [] })
    }

    return '{}'
  })

  mtatlas.__internal.invalidateStateCache()

  await mtatlas.listScans()
  await mtatlas.listScans()
  assert.equal(stateReadCount, 1)

  mtatlas.__internal.invalidateStateCache()
  await mtatlas.listScans()
  assert.equal(stateReadCount, 2)
})

test('scan child data hydration no longer touches scan logs during list/detail assembly', async () => {
  const readers = {
    exposure: {
      getScan: async () =>
        ({
          id: 'scan-exposure-1',
          agentId: 'agent-1',
          types: ['exposure'],
          status: 'succeeded',
          createdAt: '2026-04-15T00:00:00.000Z',
          reportId: 'report-exposure-1',
        }) as const,
      getReportDetail: async () =>
        ({
          id: 'report-exposure-1',
          agentId: 'agent-1',
          scanId: 'scan-exposure-1',
          createdAt: '2026-04-15T00:00:00.000Z',
          types: ['exposure'],
          risk: 'medium',
          summary: {
            totalFindings: 1,
          },
        }) as const,
      getScanLogs: async () => {
        throw new Error('getScanLogs should not be called while hydrating child data')
      },
    },
    fuzzing: {
      getScan: async () => null,
      getReportDetail: async () => null,
      getScanLogs: async () => {
        throw new Error('getScanLogs should not be called while hydrating child data')
      },
    },
  }

  const result = await scanInternal.getChildData('exposure', 'scan-exposure-1', readers as never)

  assert.equal(result.scan?.id, 'scan-exposure-1')
  assert.equal(result.report?.id, 'report-exposure-1')
})
