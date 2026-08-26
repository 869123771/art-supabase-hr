import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchInternalMobilityOverview(
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.InternalMobilityOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_internal_mobility_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchInternalMobilityRecords<TRecord extends Api.Hr.InternalMobilityRecord>(
  entity: Api.Hr.InternalMobilityEntity,
  params: Api.Hr.InternalMobilitySearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const response = await responseHandle<Api.Hr.InternalMobilityListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_internal_mobility_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_opportunity_id: params.opportunityId || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return {
    data: response.data?.records ?? [],
    total: response.data?.total ?? 0,
    manageAccess: response.data?.manageAccess ?? false,
    myEmployeeId: response.data?.myEmployeeId ?? null,
    error: response.error
  }
}

export async function fetchInternalMobilityOptions(
  kind: 'organization' | 'position' | 'employee' | 'opportunity',
  tenantId?: string
) {
  return await responseHandle<Api.Hr.InternalMobilityReference[]>(
    () =>
      supabase.rpc('hr_list_internal_mobility_options_secure', {
        p_kind: kind,
        p_tenant_id: tenantId || null
      }),
    { showErrorMessage: true }
  )
}

export async function saveInternalMobilityOpportunity(record: Api.Hr.InternalMobilityOpportunity) {
  const payload = keysToSnakeDeep(
    omit(record, [
      'organizationName',
      'positionName',
      'hiringManagerName',
      'status',
      'publishedAt',
      'publishedBy',
      'decisionNote',
      'applicationCount',
      'shortlistedCount',
      'acceptedCount',
      'myApplicationId',
      'myApplicationStatus',
      'createTime',
      'updateTime'
    ])
  )
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_internal_opportunity_secure', {
        p_id: record.id || null,
        p_payload: payload
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '内部机会草稿已更新' : '内部机会草稿已创建'
    }
  )
}

export async function saveInternalMobilityApplication(record: Api.Hr.InternalMobilityApplication) {
  const payload = keysToSnakeDeep(
    omit(record, [
      'opportunityCode',
      'opportunityTitle',
      'opportunityType',
      'opportunityStatus',
      'targetOrganizationName',
      'targetPositionName',
      'employeeNo',
      'employeeName',
      'currentOrganizationId',
      'currentOrganizationName',
      'currentPositionId',
      'currentPositionName',
      'currentJobTitle',
      'status',
      'submittedAt',
      'reviewedAt',
      'reviewedBy',
      'assessmentScore',
      'assessmentNote',
      'decisionAt',
      'decisionBy',
      'decisionNote',
      'acceptedAt',
      'acceptedBy',
      'personnelChangeId',
      'createTime',
      'updateTime'
    ])
  )
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_internal_mobility_application_secure', {
        p_id: record.id || null,
        p_payload: payload
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '内部申请草稿已更新' : '内部申请草稿已创建'
    }
  )
}

export async function transitionInternalMobility(
  kind: Api.Hr.InternalMobilityEntity,
  id: string,
  action: string,
  comment?: string,
  score?: number
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_internal_mobility_secure', {
        p_kind: kind,
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null,
        p_score: score ?? null
      }),
    { showMessage: true, breakReturn: true, message: '内部人才市场状态已更新' }
  )
}

export async function deleteInternalMobilityRecord(
  kind: Api.Hr.InternalMobilityEntity,
  id: string
) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_internal_mobility_record_secure', { p_kind: kind, p_id: id }),
    { showMessage: true, breakReturn: true, message: '草稿记录已删除' }
  )
}
