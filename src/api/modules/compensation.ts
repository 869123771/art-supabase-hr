import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

type CompensationEntity = Api.Hr.CompensationEntity
type CompensationRecord = Api.Hr.CompensationRecord
type CompensationSearchParams = Api.Hr.CompensationSearchParams

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchCompensationOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.CompensationOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_compensation_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchCompensationRecords<TRecord extends CompensationRecord>(
  entity: CompensationEntity,
  params: CompensationSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.CompensationListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_compensation_records_secure', {
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
  return {
    data: result.data?.records ?? [],
    total: result.data?.total ?? 0,
    amountAccess: result.data?.amountAccess ?? false,
    error: result.error
  }
}

export async function fetchCompensationOptions(
  kind: 'employee' | 'plan' | 'component' | 'grade',
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.CompensationReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_compensation_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizeRecordPayload = (record: CompensationRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'tenant',
      'employee',
      'organization',
      'plan',
      'grade',
      'componentCount',
      'employeeCount',
      'planCount',
      'lifecycleStatus',
      'rangeStatus',
      'bandMinimum',
      'bandMaximum',
      'approvedBy',
      'approvedAt',
      'createBy',
      'createTime',
      'updateBy',
      'updateTime'
    ])
  )

export async function saveCompensationRecord(
  entity: CompensationEntity,
  record: CompensationRecord
) {
  const id = record.id
  const payload = normalizeRecordPayload(record)
  const query =
    entity === 'employee'
      ? supabase.rpc('hr_save_employee_compensation_secure', {
          p_id: id ?? null,
          p_payload: payload
        })
      : supabase.rpc('hr_save_compensation_master_secure', {
          p_kind: entity,
          p_id: id ?? null,
          p_payload: payload
        })
  return await responseHandle<string>(() => query, {
    showMessage: true,
    breakReturn: true,
    message: id ? '薪酬记录已更新' : '薪酬记录已创建'
  })
}

export async function deleteCompensationRecord(entity: CompensationEntity, id: string) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_delete_compensation_record_secure', {
        p_kind: entity,
        p_id: id
      }),
    { showMessage: true, breakReturn: true, message: '薪酬记录已删除' }
  )
}

export async function actCompensationRecord(
  entity: Extract<CompensationEntity, 'employee' | 'band'>,
  id: string,
  action: 'approve' | 'cancel' | 'end',
  effectiveTo?: string
) {
  const messageMap = {
    approve: '薪酬记录已批准',
    cancel: '薪酬记录已取消',
    end: '薪酬记录已终止'
  } as const
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_act_compensation_record_secure', {
        p_kind: entity,
        p_id: id,
        p_action: action,
        p_effective_to: effectiveTo || null
      }),
    { showMessage: true, breakReturn: true, message: messageMap[action] }
  )
}

export async function fetchCompensationPayrollInputs(
  payrollMonth: string,
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Record<string, unknown>[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_compensation_payroll_inputs_secure', {
          p_payroll_month: payrollMonth,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}
