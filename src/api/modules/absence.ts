import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

type AbsenceEntity = Api.Hr.AbsenceEntity
type AbsenceRecord = Api.Hr.AbsenceRecord
type AbsenceSearchParams = Api.Hr.AbsenceSearchParams

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchAbsenceOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.AbsenceOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_absence_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchAbsenceRecords<TRecord extends AbsenceRecord>(
  entity: AbsenceEntity,
  params: AbsenceSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.AbsenceListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_absence_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_balance_year: params.balanceYear ?? null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return {
    data: result.data?.records ?? [],
    total: result.data?.total ?? 0,
    reasonAccess: result.data?.reasonAccess ?? false,
    error: result.error
  }
}

export async function fetchAbsenceOptions(
  kind: 'employee' | 'leave_type' | 'organization' | 'grade' | 'policy',
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.AbsenceReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_absence_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (record: AbsenceRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'tenant',
      'employee',
      'organization',
      'leaveType',
      'policy',
      'scope',
      'balance',
      'request',
      'availableAmount',
      'policyCount',
      'reviewedAt',
      'reviewedBy',
      'reviewComment',
      'submittedAt',
      'createBy',
      'createTime',
      'updateBy',
      'updateTime'
    ])
  )

export async function saveAbsenceRecord(entity: AbsenceEntity, record: AbsenceRecord) {
  if (entity === 'balance' || entity === 'ledger') {
    throw new Error('余额与台账不能通过通用保存接口写入')
  }
  const id = record.id
  const payload = normalizePayload(record)
  const query =
    entity === 'request'
      ? supabase.rpc('hr_save_leave_request_secure', {
          p_id: id ?? null,
          p_payload: payload
        })
      : supabase.rpc('hr_save_absence_master_secure', {
          p_kind: entity,
          p_id: id ?? null,
          p_payload: payload
        })
  return await responseHandle<string>(() => query, {
    showMessage: true,
    breakReturn: true,
    message: id ? '假勤记录已更新' : '假勤记录已创建'
  })
}

export async function adjustLeaveBalance(payload: {
  employeeId: string
  leaveTypeId: string
  balanceYear: number
  delta: number
  reason: string
  tenantId?: string
}) {
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_adjust_leave_balance_secure', {
        p_employee_id: payload.employeeId,
        p_leave_type_id: payload.leaveTypeId,
        p_balance_year: payload.balanceYear,
        p_delta: payload.delta,
        p_reason: payload.reason,
        p_tenant_id: payload.tenantId || null
      }),
    { showMessage: true, breakReturn: true, message: '休假余额已调整并写入台账' }
  )
}

export async function actLeaveRequest(
  requestId: string,
  action: 'submit' | 'approve' | 'reject' | 'cancel',
  comment?: string
) {
  const messageMap = {
    submit: '休假申请已提交',
    approve: '休假申请已批准',
    reject: '休假申请已驳回',
    cancel: '休假申请已撤销'
  } as const
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_act_leave_request_secure', {
        p_request_id: requestId,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messageMap[action] }
  )
}

export async function deleteAbsenceRecord(
  entity: Extract<AbsenceEntity, 'type' | 'policy' | 'request'>,
  id: string
) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_absence_record_secure', { p_kind: entity, p_id: id }),
    { showMessage: true, breakReturn: true, message: '假勤记录已删除' }
  )
}
