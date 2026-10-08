import assert from 'node:assert/strict'
import test from 'node:test'
import {
  hrOrganizationTreeField,
  toHrOrganizationTreeOptions,
  withoutHrOrganizationBranch
} from '../../src/views/shared/hr-organization-tree-field'

const organizations: Api.SystemManage.OrganizationScopeFilterItem[] = [
  {
    id: 'company',
    parentId: null,
    organizationName: '物流公司',
    organizationCode: 'COMP',
    organizationType: 'department',
    status: '1',
    sort: 0
  },
  {
    id: 'finance',
    parentId: 'company',
    organizationName: '财务部',
    organizationCode: 'FIN',
    organizationType: 'department',
    status: '1',
    sort: 1
  },
  {
    id: 'payroll',
    parentId: 'finance',
    organizationName: '薪酬组',
    organizationCode: 'PAY',
    organizationType: 'department',
    status: '1',
    sort: 2
  },
  {
    id: 'transport',
    parentId: 'company',
    organizationName: '运输部',
    organizationCode: 'TRANS',
    organizationType: 'department',
    status: '1',
    sort: 3
  }
]

test('HR 组织选项保留可搜索的层级与明确的选值', () => {
  const options = toHrOrganizationTreeOptions([
    {
      ...organizations[0],
      children: [{ ...organizations[1], children: [organizations[2]] }, organizations[3]]
    }
  ])
  assert.equal(options.length, 1)
  assert.equal(options[0].value, 'company')
  assert.deepEqual(
    options[0].children?.map((child) => child.label),
    ['财务部 · FIN', '运输部 · TRANS']
  )
  assert.equal(options[0].children?.[0].children?.[0].value, 'payroll')
  const field = hrOrganizationTreeField({ key: 'organizationId', label: '招聘组织', options })
  assert.equal(field.type, 'treeSelect')
  assert.equal(field.props?.checkStrictly, true)
  assert.equal(field.props?.defaultExpandAll, true)
})

test('调整上级时目标组织及其后代不再可选', () => {
  const options = toHrOrganizationTreeOptions([
    {
      ...organizations[0],
      children: [{ ...organizations[1], children: [organizations[2]] }, organizations[3]]
    }
  ])
  const validParents = withoutHrOrganizationBranch(options, 'finance')
  assert.deepEqual(
    validParents[0].children?.map((child) => child.value),
    ['transport']
  )
  assert.equal(options[0].children?.[0].children?.length, 1)
})

test('已停用组织保留层级回显但不能作为新选择', () => {
  const options = toHrOrganizationTreeOptions([
    { ...organizations[0], status: '2', children: [organizations[1]] }
  ])
  assert.equal(options[0].disabled, true)
  assert.equal(options[0].label, '物流公司 · COMP（已停用）')
  assert.equal(options[0].children?.[0].disabled, false)
})
