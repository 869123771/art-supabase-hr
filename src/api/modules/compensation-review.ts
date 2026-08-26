import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchCompensationReviewOverview(
  cycleId?: string,
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.CompensationReviewOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_compensation_review_overview_secure', {
          p_cycle_id: cycleId || null,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchCompensationReviewRecords<
  TRecord extends Api.Hr.CompensationReviewRecord
>(
  entity: Api.Hr.CompensationReviewEntity,
  params: Api.Hr.CompensationReviewSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.CompensationReviewListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_compensation_review_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_cycle_id: params.cycleId || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return {
    data: result.data?.records ?? [],
    total: result.data?.total ?? 0,
    amountAccess: result.data?.amountAccess ?? false,
    error: result.error
  }
}

export async function fetchCompensationReviewOptions(
  kind: 'cycle' | 'organization',
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.CompensationReviewReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_compensation_review_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (record: Api.Hr.CompensationReviewRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'scopeOrganizationName',
      'cycleName',
      'cycleStatus',
      'employeeNo',
      'employeeName',
      'organizationName',
      'gradeName',
      'increaseAmount',
      'increasePercent',
      'outOfGuideline',
      'usedAmount',
      'remainingAmount',
      'utilizationPercent',
      'employeeCount',
      'pendingCount',
      'proposedIncreaseAmount',
      'recommendedBy',
      'recommendedAt',
      'calibratedBy',
      'calibratedAt',
      'newCompensationId',
      'createTime',
      'updateTime'
    ])
  )

export async function saveCompensationReviewRecord(
  entity: Api.Hr.CompensationReviewEntity,
  record: Api.Hr.CompensationReviewRecord
) {
  const labels: Record<Api.Hr.CompensationReviewEntity, string> = {
    cycle: '调薪周期',
    item: '员工调薪建议',
    budget: '组织预算'
  }
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_compensation_review_record_secure', {
        p_kind: entity,
        p_id: record.id ?? null,
        p_payload: normalizePayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? `${labels[entity]}已更新` : `${labels[entity]}已创建`
    }
  )
}

export async function transitionCompensationReviewCycle(
  id: string,
  action: Api.Hr.CompensationReviewCycleAction,
  comment?: string
) {
  const messages: Record<Api.Hr.CompensationReviewCycleAction, string> = {
    open: '调薪周期已开放，员工薪酬与组织预算快照已生成',
    calibrate: '调薪周期已进入组织校准',
    approve: '调薪结果已批准',
    effect: '调薪结果已写入员工生效薪酬',
    cancel: '调薪周期已取消'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_compensation_review_cycle_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function deleteCompensationReviewRecord(
  entity: Extract<Api.Hr.CompensationReviewEntity, 'cycle' | 'budget'>,
  id: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_delete_compensation_review_record_secure', {
        p_kind: entity,
        p_id: id
      }),
    { showMessage: true, breakReturn: true, message: '调薪复核记录已删除' }
  )
}
