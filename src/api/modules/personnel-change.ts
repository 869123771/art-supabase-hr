import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

interface PersonnelChangeEmployeePayload {
  records: Api.Hr.PersonnelChangeEmployeeOption[]
  total: number
}

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchPersonnelChangeEmployees(
  params: { from?: number; to?: number; keyword?: string },
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<PersonnelChangeEmployeePayload>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_personnel_change_employees_secure', {
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null
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

export async function fetchAssignmentPositionOptions(
  organizationId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.PositionOption[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_assignment_position_options_secure', {
          p_organization_id: organizationId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function savePersonnelChange(record: Api.Hr.WorkspaceRecord) {
  const payload = keysToSnakeDeep(
    omit(record, [
      'employee',
      'organization',
      'fromOrganization',
      'toOrganization',
      'position',
      'fromPosition',
      'toPosition',
      'beforeAssignmentSnapshot',
      'afterAssignmentSnapshot',
      'baseAssignmentId',
      'baseAssignmentUpdatedAt',
      'tenantId',
      'status',
      'createBy',
      'createTime',
      'updateBy',
      'updateTime'
    ])
  )
  return await responseHandle<string>(
    () => supabase.rpc('hr_save_personnel_change_secure', { p_payload: payload }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '异动单已更新' : '异动单已创建'
    }
  )
}
