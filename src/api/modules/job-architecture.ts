import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

type JobArchitectureEntity = Api.Hr.JobArchitectureEntity
type JobArchitectureSearchParams = Api.Hr.JobArchitectureSearchParams
type JobArchitectureRecord = Api.Hr.JobFamily | Api.Hr.Grade | Api.Hr.JobProfile

interface JobArchitectureListPayload<TRecord> {
  records: TRecord[]
  total: number
}

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

const listRpcMap = {
  family: 'hr_list_job_families_secure',
  grade: 'hr_list_grades_secure',
  profile: 'hr_list_job_profiles_secure'
} as const

const saveRpcMap = {
  family: 'hr_save_job_family_secure',
  grade: 'hr_save_grade_secure',
  profile: 'hr_save_job_profile_secure'
} as const

export async function fetchJobArchitectureList<TRecord extends JobArchitectureRecord>(
  entity: JobArchitectureEntity,
  params: JobArchitectureSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<JobArchitectureListPayload<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc(listRpcMap[entity], {
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_enabled: params.enabled ?? null,
          p_tenant_id: params.tenantId || null
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

export async function fetchJobArchitectureOptions(
  kind: JobArchitectureEntity,
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.JobArchitectureOption[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_job_architecture_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function saveJobArchitectureRecord(
  entity: JobArchitectureEntity,
  record: JobArchitectureRecord
) {
  const id = record.id
  const payload = keysToSnakeDeep(
    omit(record, [
      'id',
      'tenant',
      'family',
      'defaultGrade',
      'jobProfileCount',
      'positionCount',
      'createBy',
      'createTime',
      'updateBy',
      'updateTime'
    ])
  )
  return await responseHandle<string>(
    () => supabase.rpc(saveRpcMap[entity], { p_id: id ?? null, p_payload: payload }),
    {
      showMessage: true,
      breakReturn: true,
      message: id ? '记录已更新' : '记录已创建'
    }
  )
}

export async function deleteJobArchitectureRecord(entity: JobArchitectureEntity, id: string) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_delete_job_architecture_record_secure', {
        p_kind: entity,
        p_id: id
      }),
    { showMessage: true, breakReturn: true, message: '记录已删除' }
  )
}
