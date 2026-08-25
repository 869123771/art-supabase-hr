import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchSuccessionOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.SuccessionOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_succession_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchSuccessionRecords<TRecord extends Api.Hr.SuccessionRecord>(
  entity: Api.Hr.SuccessionEntity,
  params: Api.Hr.SuccessionSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.SuccessionListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_succession_records_secure', {
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

export async function fetchSuccessionOptions(
  kind: 'position' | 'employee' | 'plan' | 'candidate',
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.SuccessionReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_succession_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (record: Api.Hr.SuccessionRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'tenant',
      'position',
      'employee',
      'plan',
      'candidate',
      'owner',
      'activeCandidateCount',
      'readyNowCount',
      'openActionCount',
      'createBy',
      'createTime',
      'updateBy',
      'updateTime'
    ])
  )

export async function saveSuccessionRecord(
  entity: Api.Hr.SuccessionEntity,
  record: Api.Hr.SuccessionRecord
) {
  const id = record.id
  const payload = normalizePayload(record)
  const query =
    entity === 'plan'
      ? supabase.rpc('hr_save_succession_plan_secure', { p_id: id ?? null, p_payload: payload })
      : entity === 'candidate'
        ? supabase.rpc('hr_save_succession_candidate_secure', {
            p_id: id ?? null,
            p_payload: payload
          })
        : supabase.rpc('hr_save_succession_action_secure', {
            p_id: id ?? null,
            p_payload: payload
          })
  return await responseHandle<string>(() => query, {
    showMessage: true,
    breakReturn: true,
    message: id ? '继任记录已更新' : '继任记录已创建'
  })
}

export async function reviewSuccessionCandidate(
  id: string,
  action: 'activate' | 'withdraw' | 'place',
  comment?: string
) {
  const messages = {
    activate: '候选人已纳入继任池',
    withdraw: '候选人已退出',
    place: '候选人已标记继任'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_review_succession_candidate_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function deleteSuccessionRecord(entity: Api.Hr.SuccessionEntity, id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_succession_record_secure', { p_kind: entity, p_id: id }),
    { showMessage: true, breakReturn: true, message: '继任记录已删除' }
  )
}
