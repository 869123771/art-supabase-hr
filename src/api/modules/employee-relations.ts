import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchEmployeeRelationsOverview(
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.EmployeeRelationOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_employee_relations_overview_secure', {
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchEmployeeRelationsRecords<TRecord extends Api.Hr.EmployeeRelationRecord>(
  entity: Api.Hr.EmployeeRelationEntity,
  params: Api.Hr.EmployeeRelationSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.EmployeeRelationListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_employee_relations_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_case_type: params.caseType || null,
          p_severity: params.severity || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return { data: result.data?.records ?? [], total: result.data?.total ?? 0, error: result.error }
}

export async function fetchEmployeeRelationCaseDetail(id: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.EmployeeRelationCase>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_get_employee_relation_case_detail_secure', { p_id: id }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizeRecordPayload = (record: Api.Hr.EmployeeRelationRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'subjectEmployee',
      'reporterEmployee',
      'ownerEmployee',
      'relationCase',
      'actions',
      'events',
      'sensitiveRestricted',
      'dueStatus',
      'openActionCount',
      'createTime',
      'updateTime'
    ])
  )

export async function saveEmployeeRelationRecord(
  entity: Api.Hr.EmployeeRelationEntity,
  record: Api.Hr.EmployeeRelationRecord
) {
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_employee_relations_record_secure', {
        p_kind: entity,
        p_payload: normalizeRecordPayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id
        ? entity === 'case'
          ? '案件资料已更新'
          : '处置行动已更新'
        : entity === 'case'
          ? '员工关系案件已创建'
          : '处置行动已创建'
    }
  )
}

export async function transitionEmployeeRelationCase(
  id: string,
  action: Api.Hr.EmployeeRelationCaseAction,
  payload: Api.Hr.EmployeeRelationCaseActionPayload = {}
) {
  const messages: Record<Api.Hr.EmployeeRelationCaseAction, string> = {
    submit: '案件报告已提交',
    triage: '案件分派与分级已更新',
    start_investigation: '案件调查已启动',
    require_action: '案件已进入处置阶段',
    resolve: '案件解决结论已提交',
    close: '员工关系案件已结案',
    reopen: '案件已重新进入调查',
    cancel: '员工关系案件已取消',
    comment: '案件说明已添加'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_employee_relation_case_secure', {
        p_id: id,
        p_action: action,
        p_payload: keysToSnakeDeep(payload)
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function transitionEmployeeRelationAction(
  id: string,
  action: Api.Hr.EmployeeRelationActionAction,
  comment?: string
) {
  const messages: Record<Api.Hr.EmployeeRelationActionAction, string> = {
    start: '处置行动已启动',
    complete: '处置行动已完成',
    cancel: '处置行动已取消'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_employee_relation_action_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function deleteEmployeeRelationRecord(
  entity: Api.Hr.EmployeeRelationEntity,
  id: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_delete_employee_relations_record_secure', {
        p_kind: entity,
        p_id: id
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: entity === 'case' ? '案件草稿已删除' : '处置行动已删除'
    }
  )
}
