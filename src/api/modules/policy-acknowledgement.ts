import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchPolicyAcknowledgementOverview(
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.PolicyAcknowledgementOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_policy_acknowledgement_overview_secure', {
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchPolicyAcknowledgementRecords<
  TRecord extends Api.Hr.PolicyAcknowledgementRecord
>(
  entity: Api.Hr.PolicyAcknowledgementEntity,
  params: Api.Hr.PolicyAcknowledgementSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const response = await responseHandle<Api.Hr.PolicyAcknowledgementListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_policy_acknowledgement_records_secure', {
          p_kind: entity,
          p_from: from,
          p_to: Math.max(params.to ?? from + 19, from),
          p_keyword: params.keyword?.trim() || null,
          p_status: params.status || null,
          p_policy_id: params.policyId || null,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
  return {
    data: response.data?.records ?? [],
    total: response.data?.total ?? 0,
    evidenceAccess: response.data?.evidenceAccess ?? false,
    error: response.error
  }
}

export async function fetchPolicyAcknowledgementOptions(
  kind: 'organization' | 'policy',
  tenantId?: string
) {
  return await responseHandle<Api.Hr.PolicyAcknowledgementReference[]>(
    () =>
      supabase.rpc('hr_list_policy_acknowledgement_options_secure', {
        p_kind: kind,
        p_tenant_id: tenantId || null
      }),
    { showErrorMessage: true }
  )
}

export async function savePolicyDocument(record: Api.Hr.HrPolicyDocument) {
  const payload = keysToSnakeDeep(
    omit(record, [
      'audienceOrganizationName',
      'supersedesPolicyTitle',
      'publishedAt',
      'publishedBy',
      'receiptCount',
      'acknowledgedCount',
      'waivedCount',
      'overdueCount',
      'createTime',
      'updateTime'
    ])
  )
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_policy_document_secure', {
        p_id: record.id || null,
        p_payload: payload
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: record.id ? '政策草稿已更新' : '政策草稿已创建'
    }
  )
}

export async function transitionPolicyAcknowledgement(
  kind: Api.Hr.PolicyAcknowledgementEntity,
  id: string,
  action: string,
  comment?: string,
  evidenceReference?: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_policy_acknowledgement_secure', {
        p_kind: kind,
        p_id: id,
        p_action: action,
        p_comment: comment?.trim() || null,
        p_evidence_reference: evidenceReference?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: '政策签收状态已更新' }
  )
}

export async function deletePolicyDocument(id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_policy_document_secure', { p_id: id }),
    { showMessage: true, breakReturn: true, message: '政策草稿已删除' }
  )
}
