import test from 'node:test'
import assert from 'node:assert/strict'

import { sanitizeLogMessage } from './log-sanitizer'

const projectRoot = 'C:\\Files\\Study\\Codes\\SAFE-Agent'
const workspaceRoot =
  'C:\\Files\\Study\\Codes\\SAFE-Agent\\backend\\MTAtlas\\data\\workspaces\\f71ca99b-9acc-4af0-964a-2d5828dabd5a\\mtatlas'
const userHome = 'C:\\Users\\quan'

test('sanitizeLogMessage redacts workspace paths inside execution logs', () => {
  const message =
    'Executing: python -m mtatlas --mode static-pure --input C:\\Files\\Study\\Codes\\SAFE-Agent\\backend\\MTAtlas\\data\\workspaces\\f71ca99b-9acc-4af0-964a-2d5828dabd5a\\mtatlas\\input\\tools.json --framework scan_f71ca99b --artifact-root C:\\Files\\Study\\Codes\\SAFE-Agent\\backend\\MTAtlas\\data\\workspaces\\f71ca99b-9acc-4af0-964a-2d5828dabd5a\\mtatlas\\artifacts'

  const sanitized = sanitizeLogMessage(message, { projectRoot, workspaceRoot, userHome })

  assert.equal(sanitized.includes(projectRoot), false)
  assert.equal(sanitized.includes(userHome), false)
  assert.match(sanitized, /--input <workspace>\\input\\tools\.json/)
  assert.match(sanitized, /--artifact-root <workspace>\\artifacts/)
})

test('sanitizeLogMessage redacts escaped paths inside json log messages', () => {
  const message =
    '{ "input_path": "C:\\\\Files\\\\Study\\\\Codes\\\\SAFE-Agent\\\\backend\\\\MTAtlas\\\\data\\\\workspaces\\\\f71ca99b-9acc-4af0-964a-2d5828dabd5a\\\\mtatlas\\\\input\\\\tools.json", "cache_dir": "C:\\\\Users\\\\quan\\\\AppData\\\\Local\\\\Temp" }'

  const sanitized = sanitizeLogMessage(message, { projectRoot, workspaceRoot, userHome })

  assert.equal(sanitized.includes('C:\\\\Files\\\\Study\\\\Codes\\\\SAFE-Agent'), false)
  assert.equal(sanitized.includes('C:\\\\Users\\\\quan'), false)
  assert.match(sanitized, /"input_path": "<workspace>\\\\input\\\\tools\.json"/)
  assert.match(sanitized, /"cache_dir": "<user-home>\\\\AppData\\\\Local\\\\Temp"/)
})
