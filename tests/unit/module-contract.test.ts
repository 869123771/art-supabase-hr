import assert from 'node:assert/strict'
import test from 'node:test'
import { HR_MODULE } from '../../src'
import { hrWorkspaceDefinitions } from '../../src/views/shared/workspace-config'

test('HR module exposes its standalone application contract', () => {
  assert.deepEqual(HR_MODULE, {
    code: 'hr',
    name: 'HR 人力资源',
    routePrefix: '/hr',
    viewsRoot: 'src/views'
  })
})

test('HR workspace employee fields use the shared user selector contract', () => {
  const employeeFields = Object.values(hrWorkspaceDefinitions).flatMap((workspace) =>
    workspace.tabs.flatMap((tab) => tab.fields.filter((field) => field.key === 'employeeId'))
  )

  assert.ok(employeeFields.length > 0)
  employeeFields.forEach((field) => assert.equal(field.type, 'userSelect'))
})
