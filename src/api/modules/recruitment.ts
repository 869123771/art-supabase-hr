import { omit } from 'lodash-es'
import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, keysToSnakeDeep, responseHandle } = useSupabase()

export async function fetchRecruitmentOverview(tenantId?: string, options?: ApiRequestOptions) {
  return await responseHandle<Api.Hr.RecruitmentOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_recruitment_overview_secure', { p_tenant_id: tenantId || null }),
        options
      ),
    { showErrorMessage: true }
  )
}

export async function fetchRecruitmentRecords<TRecord extends Api.Hr.RecruitmentRecord>(
  entity: Api.Hr.RecruitmentEntity,
  params: Api.Hr.RecruitmentSearchParams,
  options?: ApiRequestOptions
) {
  const from = Math.max(params.from ?? 0, 0)
  const result = await responseHandle<Api.Hr.RecruitmentListResult<TRecord>>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_recruitment_records_secure', {
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
    sensitiveAccess: result.data?.sensitiveAccess ?? false,
    error: result.error
  }
}

export async function fetchRecruitmentOptions(
  kind: 'requisition' | 'candidate' | 'accepted_offer' | 'handoff',
  tenantId?: string,
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.RecruitmentReference[]>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_list_recruitment_options_secure', {
          p_kind: kind,
          p_tenant_id: tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}

const normalizePayload = (record: Api.Hr.RecruitmentRecord) =>
  keysToSnakeDeep(
    omit(record, [
      'id',
      'organization',
      'position',
      'requisition',
      'candidate',
      'interviewer',
      'offer',
      'handoff',
      'owner',
      'buddy',
      'onboardEmployee',
      'candidateCount',
      'interviewCount',
      'offerCount',
      'latestOfferStatus',
      'stageChangedAt',
      'taskCount',
      'completedTaskCount',
      'overdueTaskCount',
      'createBy',
      'createTime',
      'updateBy',
      'updateTime'
    ])
  )

export async function saveRecruitmentRecord(
  entity: Api.Hr.RecruitmentEntity,
  record: Api.Hr.RecruitmentRecord
) {
  const id = record.id
  return await responseHandle<string>(
    () =>
      supabase.rpc('hr_save_recruitment_record_secure', {
        p_kind: entity,
        p_id: id ?? null,
        p_payload: normalizePayload(record)
      }),
    {
      showMessage: true,
      breakReturn: true,
      message: id ? '招聘记录已更新' : '招聘记录已创建'
    }
  )
}

export async function transitionCandidateStage(
  candidateId: string,
  toStage: 'screening' | 'rejected' | 'withdrawn',
  reason?: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_candidate_stage_secure', {
        p_candidate_id: candidateId,
        p_to_stage: toStage,
        p_reason: reason?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: '候选人阶段已更新' }
  )
}

export async function completeRecruitmentInterview(
  interviewId: string,
  score: number,
  recommendation: string,
  feedback: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_complete_recruitment_interview_secure', {
        p_interview_id: interviewId,
        p_score: score,
        p_recommendation: recommendation,
        p_feedback: feedback.trim()
      }),
    { showMessage: true, breakReturn: true, message: '面试评价已提交' }
  )
}

export async function cancelRecruitmentInterview(
  interviewId: string,
  noShow: boolean,
  reason: string
) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_cancel_recruitment_interview_secure', {
        p_interview_id: interviewId,
        p_no_show: noShow,
        p_reason: reason.trim()
      }),
    { showMessage: true, breakReturn: true, message: noShow ? '已记录候选人未到场' : '面试已取消' }
  )
}

export type RecruitmentOfferAction =
  'submit' | 'approve' | 'reject' | 'send' | 'accept' | 'decline' | 'expire' | 'withdraw'

export async function transitionRecruitmentOffer(
  offerId: string,
  action: RecruitmentOfferAction,
  comment?: string
) {
  const messages: Record<RecruitmentOfferAction, string> = {
    submit: 'Offer 已提交审批',
    approve: 'Offer 已批准',
    reject: 'Offer 已驳回',
    send: 'Offer 已发送',
    accept: '已登记候选人接受 Offer',
    decline: '已登记候选人拒绝 Offer',
    expire: 'Offer 已标记过期',
    withdraw: 'Offer 已撤回'
  }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_recruitment_offer_secure', {
        p_offer_id: offerId,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function transitionRecruitmentHandoff(
  handoffId: string,
  action: 'ready' | 'complete' | 'cancel',
  comment?: string
) {
  const messages = { ready: '入职准备已就绪', complete: '入职交接已完成', cancel: '入职交接已取消' }
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_transition_recruitment_handoff_secure', {
        p_handoff_id: handoffId,
        p_action: action,
        p_comment: comment?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: messages[action] }
  )
}

export async function completeRecruitmentTask(taskId: string, skip = false, note?: string) {
  return await responseHandle<boolean>(
    () =>
      supabase.rpc('hr_complete_recruitment_task_secure', {
        p_task_id: taskId,
        p_skip: skip,
        p_note: note?.trim() || null
      }),
    { showMessage: true, breakReturn: true, message: skip ? '入职任务已跳过' : '入职任务已完成' }
  )
}

export async function deleteRecruitmentRecord(entity: 'requisition' | 'candidate', id: string) {
  return await responseHandle<boolean>(
    () => supabase.rpc('hr_delete_recruitment_record_secure', { p_kind: entity, p_id: id }),
    { showMessage: true, breakReturn: true, message: '招聘记录已删除' }
  )
}
