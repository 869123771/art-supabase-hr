import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchTimeAttendanceOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.TimeAttendanceOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_attendance_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchTimeAttendanceRecords<TRecord extends Api.Hr.TimeAttendanceRecord>(
  entity: Api.Hr.TimeAttendanceEntity,
  params: Api.Hr.TimeAttendanceSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.TimeAttendanceListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_attendance_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_period_month: params.periodMonth || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return { data: result.data?.records ?? [], total: result.data?.total ?? 0, error: result.error }
}

export async function fetchTimeAttendanceOptions(
  kind: Api.Hr.TimeAttendanceOptionKind,
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.TimeAttendanceReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_attendance_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (record: Api.Hr.TimeAttendanceRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'employee',
      'shift',
      'record',
      'usageCount',
      'pendingCorrection',
      'workMinutes',
      'overtimeMinutes',
      'scheduledMinutes',
      'lateMinutes',
      'earlyLeaveMinutes',
      'absenceMinutes',
      'payableMinutes',
      'exceptionStatus',
      'valuationNote',
      'lockedAt',
      'lockedBy',
      'correctionNo',
      'status',
      'submittedAt',
      'reviewedAt',
      'reviewedBy',
      'reviewComment',
      'originalSnapshot',
      'recordCount',
      'exceptionCount',
      'totalScheduledMinutes',
      'totalPayableMinutes',
      'totalOvertimeMinutes',
      'closedAt',
      'closedBy',
      'createTime',
      'updateTime'
    ])
  )

export async function saveTimeAttendanceRecord(
  entity: Api.Hr.TimeAttendanceEntity,
  record: Api.Hr.TimeAttendanceRecord
) {
  const labels: Record<Api.Hr.TimeAttendanceEntity, string> = {
    record: '日考勤记录',
    assignment: '员工排班',
    correction: '考勤修正单',
    period: '考勤期间',
    shift: '班次规则'
  }
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_attendance_record_secure', {
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

export async function transitionTimeAttendanceCorrection(
  id: string,
  action: Api.Hr.TimeAttendanceCorrectionAction,
  comment?: string
) {
  const messages: Record<Api.Hr.TimeAttendanceCorrectionAction, string> = {
    submit: '考勤修正单已提交审核',
    approve: '修正已批准，日考勤已重新核算',
    reject: '考勤修正单已驳回',
    cancel: '考勤修正单已取消'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_attendance_correction_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function transitionTimeAttendanceDailyRecord(
  id: string,
  action: Api.Hr.TimeAttendanceRecordAction,
  comment?: string
) {
  const messages: Record<Api.Hr.TimeAttendanceRecordAction, string> = {
    evaluate: '日考勤已按班次规则重新核算',
    waive: '考勤异常已豁免并保留原因',
    reopen: '考勤异常已重新打开'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_attendance_record_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function transitionTimeAttendancePeriod(
  id: string,
  action: Api.Hr.TimeAttendancePeriodAction,
  comment?: string
) {
  const messages: Record<Api.Hr.TimeAttendancePeriodAction, string> = {
    review: '考勤期间已进入核对阶段',
    close: '考勤期间已封账并锁定日考勤',
    reopen: '考勤期间已重新开放'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_attendance_period_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function deleteTimeAttendanceRecord(
  entity: Exclude<Api.Hr.TimeAttendanceEntity, 'record'>,
  id: string
) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_attendance_record_secure', { p_kind: entity, p_id: id }),
    { showMessage: true, breakReturn: true, message: '考勤工时记录已删除' }
  )
}
