import type { FormItem, FormItemOption } from '@/components/core/forms/art-form/index.vue'
import TreeUtils from '@/utils/tree'

type Organization = Api.SystemManage.OrganizationScopeFilterItem

interface OrganizationOption extends FormItemOption {
  id: string
  parentId?: string | null
  label: string
  value: string
  children?: OrganizationOption[]
}

interface OrganizationFieldConfig {
  key: string
  label: string
  options: OrganizationOption[]
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  onChange?: (value?: string) => void | Promise<void>
}

const organizationTreeUtils = new TreeUtils({
  idKey: 'id',
  parentKey: 'parentId',
  childrenKey: 'children'
})

export function toHrOrganizationTreeOptions(tree: Organization[]): OrganizationOption[] {
  const options = organizationTreeUtils
    .treeToList(tree)
    .filter((organization): organization is Organization & { id: string } =>
      Boolean(organization.id)
    )
    .map((organization) => ({
      id: organization.id,
      parentId: organization.parentId,
      value: organization.id,
      disabled: organization.status !== '1',
      label:
        (organization.organizationCode
          ? `${organization.organizationName} · ${organization.organizationCode}`
          : organization.organizationName) + (organization.status !== '1' ? '（已停用）' : '')
    }))
  return organizationTreeUtils.listToTree(options)
}

export function withoutHrOrganizationBranch(
  options: OrganizationOption[],
  excludedId?: string
): OrganizationOption[] {
  return excludedId
    ? organizationTreeUtils.removeNodesByCondition(options, (node) => node.id === excludedId).tree
    : options
}

export function hrOrganizationTreeField(config: OrganizationFieldConfig): FormItem {
  return {
    key: config.key,
    label: config.label,
    type: 'treeSelect',
    options: config.options,
    props: {
      checkStrictly: true,
      renderAfterExpand: false,
      defaultExpandAll: true,
      filterable: true,
      clearable: config.clearable ?? true,
      disabled: config.disabled,
      placeholder: config.placeholder ?? `请选择${config.label}`,
      onChange: config.onChange
    }
  }
}
