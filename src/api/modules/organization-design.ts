import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchOrganizationDesignOverview(
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.OrganizationDesignOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_organization_design_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchOrganizationDesignRecords<
  TRecord extends Api.Hr.OrganizationDesignRecord
>(
  entity: Api.Hr.OrganizationDesignEntity,
  params: Api.Hr.OrganizationDesignSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const response = await responseHandle<Api.Hr.OrganizationDesignListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_organization_design_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_scenario_id: params.scenarioId || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return {
    data: response.data?.records ?? [],
    total: response.data?.total ?? 0,
    error: response.error
  }
}

export async function fetchOrganizationDesignOptions(
  kind: 'organization' | 'employee' | 'scenario',
  tenantId?: string
) {
  return await responseHandle<Api.Hr.OrganizationDesignReference[]>(
    () =>
      supabase.rpc('hr_list_organization_design_options_secure', {
        p_kind: kind,
        p_tenant_id: tenantId || null
      }),
    { showErrorMessage: true }
  )
}

export async function saveOrganizationDesignScenario(record: Api.Hr.OrganizationDesignScenario) {
  const payload = keysToSnakeDeep(
    omit(record, [
      'ownerEmployeeName',
      'ownerEmployeeNo',
      'status',
      'riskLevel',
      'submissionNote',
      'decisionNote',
      'baselineCapturedAt',
      'submittedAt',
      'submittedBy',
      'decidedAt',
      'decidedBy',
      'handedOffAt',
      'handedOffBy',
      'changeCount',
      'impactedEmployeeCount',
      'impactedPositionCount',
      'impactedSecurityUserCount',
      'impactedScopeCount',
      'createTime',
      'updateTime'
    ])
  )
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_organization_design_scenario_secure', {
        p_id: record.id || null,
        p_payload: payload
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '组织变革草稿已更新' : '组织变革方案已创建'
    }
  )
}

export async function saveOrganizationDesignChange(record: Api.Hr.OrganizationDesignChange) {
  const payload = keysToSnakeDeep(
    omit(record, [
      'scenarioCode',
      'scenarioName',
      'scenarioStatus',
      'currentParentId',
      'currentCode',
      'currentName',
      'currentType',
      'proposedParentName',
      'impactedEmployeeCount',
      'impactedPositionCount',
      'impactedRequisitionCount',
      'impactedSecurityUserCount',
      'impactedScopeCount',
      'impactCapturedAt',
      'createTime',
      'updateTime'
    ])
  )
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_organization_design_change_secure', {
        p_id: record.id || null,
        p_payload: payload
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '组织变更项已更新' : '组织变更项已添加'
    }
  )
}

export async function transitionOrganizationDesign(id: string, action: string, comment?: string) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_organization_design_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: '组织变革方案状态已更新' }
  )
}

export async function deleteOrganizationDesignRecord(
  kind: Api.Hr.OrganizationDesignEntity,
  id: string
) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_organization_design_record_secure', { p_kind: kind, p_id: id }),
    { showMessage: true, breakReturn: true, message: '组织变革草稿记录已删除' }
  )
}
