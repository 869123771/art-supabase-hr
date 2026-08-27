import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'
import TreeUtils from '@/utils/tree'

type Position = Api.Hr.Position
type PositionSearchParams = Api.Hr.PositionSearchParams
type PositionOption = Api.Hr.PositionOption
type OrganizationScopeFilterItem = Api.SystemManage.OrganizationScopeFilterItem

interface PositionListPayload {
  records: Position[]
  total: number
}

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()
const organizationTreeUtils = new TreeUtils({
  idKey: 'id',
  parentKey: 'parentId',
  childrenKey: 'children'
})

const pickPositionPayload = (position: Position): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    organizationId: position.organizationId ?? null,
    jobProfileId: position.jobProfileId,
    gradeId: position.gradeId ?? null,
    positionCode: position.positionCode,
    positionName: position.positionName,
    headcountLimit: position.headcountLimit,
    multipleIncumbentsAllowed: position.multipleIncumbentsAllowed,
    enabled: position.enabled,
    sort: position.sort,
    description: position.description ?? null
  }
  if (position.tenantId) payload.tenantId = position.tenantId
  return keysToSnakeDeep(payload)
}

export async function fetchPositionList(params: PositionSearchParams, options?: ApiRequestOptions) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<PositionListPayload>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_positions_secure', {
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: String(params.keyword ?? '').trim() || null,
          p_enabled: params.enabled ?? null,
          p_tenant_id: params.tenantId || null,
          p_organization_ids: params.organizationIds?.length ? params.organizationIds : null
        }),
        options
      ),
    { showErrorMessage: true }
  )

  return {
    data: result.data?.records ?? [],
    total: result.data?.total ?? 0,
    error: result.error
  }
}

export async function fetchPositionOrganizationTree(params: { tenantId?: string } = {}) {
  const response = await responseHandle<OrganizationScopeFilterItem[]>(
    () =>
      supabase.rpc('hr_list_position_organization_scope_secure', {
        p_tenant_id: params.tenantId || null
      }),
    { showErrorMessage: true }
  )

  return {
    ...response,
    data: organizationTreeUtils.listToTree(response.data ?? [], (a, b) => {
      const tenantDiff = (a.tenant?.tenantName ?? '').localeCompare(
        b.tenant?.tenantName ?? '',
        'zh-CN'
      )
      const sortDiff = (a.sort ?? 0) - (b.sort ?? 0)
      return tenantDiff || sortDiff || a.organizationName.localeCompare(b.organizationName, 'zh-CN')
    })
  }
}

export async function fetchPositionOptions(
  params: { tenantId?: string; includeDisabled?: boolean },
  options?: ApiRequestOptions
) {
  return await responseHandle<PositionOption[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_position_options_secure', {
          p_tenant_id: params.tenantId || null,
          p_include_disabled: params.includeDisabled ?? false
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function addPosition(position: Position) {
  return await responseHandle<string>(
    () => supabase.rpc('hr_create_position_secure', { p_payload: pickPositionPayload(position) }),
    { showMessage: true, message: '岗位已创建', breakReturn: true }
  )
}

export async function editPosition(position: Position) {
  if (!position.id) throw new Error('未找到需要编辑的岗位')
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_update_position_secure', {
        p_id: position.id,
        p_payload: pickPositionPayload(position)
      }),
    { showMessage: true, message: '岗位已更新', breakReturn: true }
  )
}

export async function deletePosition(id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_position_secure', { p_id: id }),
    { showMessage: true, message: '岗位已删除', breakReturn: true }
  )
}
