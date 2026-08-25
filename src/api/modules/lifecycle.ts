import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchLifecycleOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.LifecycleOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_lifecycle_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchLifecycleRecords<TRecord extends Api.Hr.LifecycleRecord>(
  entity: Api.Hr.LifecycleEntity,
  params: Api.Hr.LifecycleSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.LifecycleListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_lifecycle_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_case_id: params.caseId || null,
          p_template_id: params.templateId || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return { data: result.data?.records ?? [], total: result.data?.total ?? 0, error: result.error }
}

export async function fetchLifecycleOptions(
  kind: Api.Hr.LifecycleOptionKind,
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.LifecycleReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_lifecycle_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (record: Api.Hr.LifecycleRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'employee',
      'organization',
      'position',
      'template',
      'owner',
      'buddy',
      'case',
      'taskCount',
      'closedTaskCount',
      'openBlockingTaskCount',
      'overdueTaskCount',
      'usageCount',
      'createTime',
      'updateTime',
      'actualEffectiveDate',
      'startedAt',
      'readyAt',
      'completedAt',
      'cancelledAt',
      'cancellationReason',
      'sourceType',
      'sourceId'
    ])
  )

export async function saveLifecycleRecord(
  entity: Api.Hr.LifecycleEntity,
  record: Api.Hr.LifecycleRecord
) {
  const labels: Record<Api.Hr.LifecycleEntity, string> = {
    case: '生命周期事项',
    task: '执行任务',
    template: '标准任务包',
    template_task: '模板任务'
  }
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_lifecycle_record_secure', {
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

export async function transitionLifecycleCase(
  id: string,
  action: Api.Hr.LifecycleCaseAction,
  comment?: string,
  effectiveDate?: string
) {
  const messages: Record<Api.Hr.LifecycleCaseAction, string> = {
    start: '生命周期事项已启动',
    ready: '阻断任务已通过，事项已就绪',
    complete: '生命周期事项已办结并生效',
    cancel: '生命周期事项已取消'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_lifecycle_case_secure', {
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null,
        p_effective_date: effectiveDate || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function transitionLifecycleTask(
  id: string,
  action: Api.Hr.LifecycleTaskAction,
  note?: string,
  evidenceUrl?: string
) {
  const messages: Record<Api.Hr.LifecycleTaskAction, string> = {
    start: '任务已开始处理',
    complete: '任务已完成',
    waive: '任务已豁免并保留原因',
    reopen: '任务已重新打开'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_lifecycle_task_secure', {
        p_id: id,
        p_action: action,
        p_note: note?.trim() || null,
        p_evidence_url: evidenceUrl?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function transitionLifecycleTemplate(
  id: string,
  action: Api.Hr.LifecycleTemplateAction
) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_transition_lifecycle_template_secure', { p_id: id, p_action: action }),
    {
      showMessage: true,
      breakReturn: true,
      message: action === 'activate' ? '标准任务包已启用' : '标准任务包已停用'
    }
  )
}

export async function deleteLifecycleRecord(entity: Api.Hr.LifecycleEntity, id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_lifecycle_record_secure', { p_kind: entity, p_id: id }),
    { showMessage: true, breakReturn: true, message: '生命周期记录已删除' }
  )
}
