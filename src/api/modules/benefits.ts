import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchBenefitsOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.BenefitOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_benefits_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchBenefitRecords<TRecord extends Api.Hr.BenefitRecord>(
  entity: Api.Hr.BenefitEntity,
  params: Api.Hr.BenefitSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.BenefitListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_benefit_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_plan_type: params.planType || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return { data: result.data?.records ?? [], total: result.data?.total ?? 0, error: result.error }
}

export async function fetchBenefitPlanOptions(
  planId?: string,
  tenantId?: string,
  activeOnly = true,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.BenefitOption[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_benefit_plan_options_secure', {
          p_plan_id: planId || null,
          p_tenant_id: tenantId || null,
          p_active_only: activeOnly
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchBenefitDetail(
  entity: Api.Hr.BenefitEntity,
  id: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.BenefitRecord>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_get_benefit_detail_secure', { p_kind: entity, p_id: id }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizeRecordPayload = (record: Api.Hr.BenefitRecord | Api.Hr.BenefitOption) =>
  keysToSnakeDeep(
    omit(record, [
      'employee',
      'plan',
      'option',
      'lifeEvent',
      'options',
      'events',
      'enrollments',
      'amountVisible',
      'evidenceRestricted',
      'dueStatus',
      'optionCount',
      'activeEnrollmentCount',
      'createTime',
      'updateTime'
    ])
  )

export async function saveBenefitRecord(
  kind: Api.Hr.BenefitRecordKind,
  record: Api.Hr.BenefitRecord | Api.Hr.BenefitOption
) {
  const labels: Record<Api.Hr.BenefitRecordKind, string> = {
    plan: '福利计划',
    option: '覆盖方案',
    enrollment: '员工参保',
    event: '福利人生事件'
  }
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_benefit_record_secure', {
        p_kind: kind,
        p_payload: normalizeRecordPayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: `${labels[kind]}已${record.id ? '更新' : '创建'}`
    }
  )
}

export async function transitionBenefitRecord(
  entity: Api.Hr.BenefitEntity,
  id: string,
  action: Api.Hr.BenefitTransitionAction,
  comment?: string
) {
  const messages: Record<Api.Hr.BenefitTransitionAction, string> = {
    activate: '福利计划已生效',
    deactivate: '福利计划已停用',
    reactivate: '福利计划已重新生效',
    submit: '参保记录已提交审核',
    approve: '参保记录已审核生效',
    reject: '参保记录已驳回草稿',
    end: '员工福利保障已终止',
    process: '福利人生事件已处理',
    cancel: '记录已取消'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_benefit_record_secure', {
        p_kind: entity,
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function fetchBenefitPayrollInputs(
  payrollMonth: string,
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.BenefitPayrollInput[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_benefit_payroll_inputs_secure', {
          p_payroll_month: payrollMonth,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}
