import assert from 'node:assert/strict'
import test from 'node:test'
import { HR_MODULE } from '../../src'

test('HR module exposes its standalone application contract', () => {
  assert.deepEqual(HR_MODULE, {
    code: 'hr',
    name: 'HR 人力资源',
    routePrefix: '/hr',
    viewsRoot: 'src/views'
  })
})
