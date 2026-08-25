import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchComplianceOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.ComplianceOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_compliance_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchComplianceRecords<TRecord extends Api.Hr.ComplianceRecord>(
  entity: Api.Hr.ComplianceEntity,
  params: Api.Hr.ComplianceSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.ComplianceListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_compliance_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_risk_status: params.riskStatus || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return { data: result.data?.records ?? [], total: result.data?.total ?? 0, error: result.error }
}

export async function fetchComplianceDetail(
  entity: Api.Hr.ComplianceRecordEntity,
  id: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.ComplianceContract | Api.Hr.ComplianceQualification>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_get_compliance_detail_secure', { p_kind: entity, p_id: id }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizeRecordPayload = (
  record: Api.Hr.ComplianceContract | Api.Hr.ComplianceQualification
) =>
  keysToSnakeDeep(
    omit(record, [
      'riskStatus',
      'daysRemaining',
      'previousContractNo',
      'employee',
      'renewalOwner',
      'responsibleEmployee',
      'verifiedByEmployee',
      'events',
      'createTime',
      'updateTime'
    ])
  )

export async function saveComplianceRecord(
  entity: Api.Hr.ComplianceRecordEntity,
  record: Api.Hr.ComplianceContract | Api.Hr.ComplianceQualification
) {
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_compliance_record_secure', {
        p_kind: entity,
        p_payload: normalizeRecordPayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '合规资料已更新' : '合规资料已创建'
    }
  )
}

export async function transitionComplianceRecord(
  entity: Api.Hr.ComplianceRecordEntity,
  id: string,
  action: Api.Hr.ComplianceAction,
  payload: Api.Hr.ComplianceActionPayload = {}
) {
  const messages: Record<Api.Hr.ComplianceAction, string> = {
    activate: '劳动合同已生效',
    start_renewal: '合同续签已启动',
    renew: '合同续签已完成',
    terminate: '劳动合同已终止',
    verify: '员工资质核验通过',
    reject: '员工资质核验已驳回',
    revoke: '员工资质已撤销',
    comment: '合规说明已添加'
  }
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_transition_compliance_record_secure', {
        p_kind: entity,
        p_id: id,
        p_action: action,
        p_payload: keysToSnakeDeep(payload)
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function deleteComplianceRecord(entity: Api.Hr.ComplianceRecordEntity, id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_compliance_record_secure', { p_kind: entity, p_id: id }),
    { showMessage: true, breakReturn: true, message: '合规草稿记录已删除' }
  )
}
