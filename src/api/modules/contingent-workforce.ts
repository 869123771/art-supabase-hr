import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchContingentWorkforceOverview(
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.ContingentWorkforceOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_contingent_workforce_overview_secure', {
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchContingentWorkforceRecords<
  TRecord extends Api.Hr.ContingentWorkforceRecord
>(
  entity: Api.Hr.ContingentWorkforceEntity,
  params: Api.Hr.ContingentWorkforceSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.ContingentWorkforceListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_contingent_workforce_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_engagement_id: params.engagementId || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return {
    data: result.data?.records ?? [],
    total: result.data?.total ?? 0,
    piiAccess: result.data?.piiAccess ?? false,
    costAccess: result.data?.costAccess ?? false,
    error: result.error
  }
}

export async function fetchContingentWorkforceOptions(
  kind: 'vendor' | 'worker' | 'organization' | 'position' | 'sponsor' | 'engagement',
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.ContingentWorkforceReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_contingent_workforce_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (
  entity: Api.Hr.ContingentWorkforceEntity,
  record: Api.Hr.ContingentWorkforceRecord
) => {
  const derivedFields: Record<Api.Hr.ContingentWorkforceEntity, string[]> = {
    vendor: ['workerCount', 'activeEngagementCount'],
    worker: ['vendorName', 'activeEngagementCount', 'nextEndDate'],
    engagement: [
      'workerNo',
      'workerName',
      'workerType',
      'vendorName',
      'organizationName',
      'positionName',
      'sponsorEmployeeName',
      'pendingControlCount',
      'controlCount'
    ],
    control: ['engagementNo', 'engagementStatus', 'workerName', 'completedAt', 'completedBy']
  }
  return keysToSnakeDeep(omit(record, [...derivedFields[entity], 'createTime', 'updateTime']))
}

export async function saveContingentWorkforceRecord(
  entity: Api.Hr.ContingentWorkforceEntity,
  record: Api.Hr.ContingentWorkforceRecord
) {
  const labels: Record<Api.Hr.ContingentWorkforceEntity, string> = {
    engagement: '用工任务',
    worker: '外部人员',
    vendor: '用工供应商',
    control: '准入控制项'
  }
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_contingent_workforce_record_secure', {
        p_kind: entity,
        p_id: record.id || null,
        p_payload: normalizePayload(entity, record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? `${labels[entity]}已更新` : `${labels[entity]}已创建`
    }
  )
}

export async function transitionContingentWorkforceRecord(
  kind: Api.Hr.ContingentTransitionKind,
  id: string,
  action: string,
  comment?: string,
  effectiveDate?: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_contingent_workforce_record_secure', {
        p_kind: kind,
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null,
        p_effective_date: effectiveDate || null
      }),
    { showMessage: true, breakReturn: true, message: '外部用工状态已更新' }
  )
}

export async function deleteContingentWorkforceRecord(
  entity: Api.Hr.ContingentWorkforceEntity,
  id: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_delete_contingent_workforce_record_secure', {
        p_kind: entity,
        p_id: id
      }),
    { showMessage: true, breakReturn: true, message: '外部用工记录已删除' }
  )
}
