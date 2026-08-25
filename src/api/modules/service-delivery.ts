import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchServiceDeliveryOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.ServiceDeliveryOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_service_delivery_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchServiceDeliveryRecords<TRecord extends Api.Hr.ServiceDeliveryRecord>(
  entity: Api.Hr.ServiceDeliveryEntity,
  params: Api.Hr.ServiceDeliverySearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.ServiceDeliveryListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_service_delivery_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_category: params.category || null,
          p_scope: params.scope || 'mine',
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return { data: result.data?.records ?? [], total: result.data?.total ?? 0, error: result.error }
}

export async function fetchServiceRequestDetail(id: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.ServiceRequest>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_get_service_request_detail_secure', { p_id: id }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizeCatalogPayload = (record: Api.Hr.ServiceCatalog) =>
  keysToSnakeDeep(omit(record, ['id', 'requestCount', 'createTime', 'updateTime']))

const normalizeRequestPayload = (record: Api.Hr.ServiceRequest) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'requestType',
      'status',
      'assignedEmployeeId',
      'firstResponseDueAt',
      'resolutionDueAt',
      'firstRespondedAt',
      'resolvedAt',
      'closedAt',
      'waitingStartedAt',
      'waitingReason',
      'resolution',
      'reopenCount',
      'lastActivityAt',
      'slaStatus',
      'service',
      'requester',
      'assignee',
      'events',
      'createTime',
      'updateTime'
    ])
  )

export async function saveServiceCatalog(record: Api.Hr.ServiceCatalog) {
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_service_catalog_secure', {
        p_id: record.id ?? null,
        p_payload: normalizeCatalogPayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '服务目录已更新' : '服务目录已创建'
    }
  )
}

export async function saveServiceRequest(record: Api.Hr.ServiceRequest) {
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_service_request_secure', {
        p_id: record.id ?? null,
        p_payload: normalizeRequestPayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '服务工单已更新' : '服务工单草稿已创建'
    }
  )
}

export async function transitionServiceRequest(
  id: string,
  action: Api.Hr.ServiceRequestAction,
  assigneeEmployeeId?: string,
  comment?: string
) {
  const messages: Record<Api.Hr.ServiceRequestAction, string> = {
    submit: '服务工单已提交',
    assign: '服务工单已分派',
    start: '服务工单已开始处理',
    wait: '已通知员工补充信息',
    resume: '服务工单已恢复处理',
    resolve: '服务工单已标记为解决',
    close: '服务工单已关闭',
    reopen: '服务工单已重新打开',
    cancel: '服务工单已取消',
    comment: '沟通记录已添加'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_service_request_secure', {
        p_id: id,
        p_action: action,
        p_assignee_employee_id: assigneeEmployeeId || null,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function deleteServiceRequest(id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_service_request_secure', { p_id: id }),
    { showMessage: true, breakReturn: true, message: '服务工单草稿已删除' }
  )
}
