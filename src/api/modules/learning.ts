import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchLearningOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.LearningOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_learning_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchLearningRecords<TRecord extends Api.Hr.LearningRecord>(
  entity: Api.Hr.LearningEntity,
  params: Api.Hr.LearningSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.LearningListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_learning_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return { data: result.data?.records ?? [], total: result.data?.total ?? 0, error: result.error }
}

export async function fetchLearningOptions(
  kind: Api.Hr.LearningOptionKind,
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.LearningReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_learning_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (record: Api.Hr.LearningRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'owner',
      'employee',
      'session',
      'plan',
      'course',
      'nominator',
      'competency',
      'sessionCount',
      'learnerCount',
      'competencyCount',
      'enrollmentCount',
      'passedCount',
      'actualCost',
      'approvedBy',
      'approvedAt',
      'createBy',
      'createTime',
      'updateBy',
      'updateTime'
    ])
  )

export async function saveLearningRecord(
  entity: Api.Hr.LearningEntity,
  record: Api.Hr.LearningRecord
) {
  const label = {
    plan: '培训计划',
    course: '课程',
    course_competency: '课程能力映射',
    session: '培训班次',
    enrollment: '学习安排',
    certificate: '证书凭证'
  }[entity]
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_learning_record_secure', {
        p_kind: entity,
        p_id: record.id ?? null,
        p_payload: normalizePayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? `${label}已更新` : `${label}已创建`
    }
  )
}

export async function transitionLearningRecord(
  entity: Api.Hr.LearningEntity,
  id: string,
  action: string,
  payload: Record<string, unknown> = {}
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_learning_record_secure', {
        p_kind: entity,
        p_id: id,
        p_action: action,
        p_payload: keysToSnakeDeep(payload)
      }),
    { showMessage: true, breakReturn: true, message: '学习状态已更新' }
  )
}

export async function deleteLearningRecord(entity: Api.Hr.LearningEntity, id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_learning_record_secure', { p_kind: entity, p_id: id }),
    { showMessage: true, breakReturn: true, message: '学习记录已删除' }
  )
}
