import{z as e}from"./user-DEKvlqCu.js";import"./supabase-CgfrMu55.js";var{supabase:t,responseHandle:n}=e(),r=`
  *,
  definition:wf_definition!wf_instance_definition_id_fkey(id, code, name, business_type),
  version:wf_version!wf_instance_version_id_fkey(id, version_no, config),
  tasks:wf_task(*),
  actions:wf_action(
    *,
    actor:sys_user!wf_action_actor_user_id_fkey(id, user_name, nick_name, user_email, avatar)
  )
`;async function i(e){return await n(()=>t.from(`wf_instance`).select(r).eq(`business_type`,e.businessType).eq(`business_id`,e.businessId).order(`started_at`,{ascending:!1}),{showErrorMessage:!1,breakReturn:!0,errorMessage:`审批历程加载失败，请稍后重试`})}async function a(e){return await n(()=>t.rpc(`start_workflow`,{p_business_type:e.businessType,p_business_id:e.businessId,p_business_title:e.businessTitle,p_context:e.context??{},p_idempotency_key:crypto.randomUUID()}),{showMessage:!0,breakReturn:!0,message:`已提交审批`})}async function o(e){return await n(()=>t.rpc(`act_workflow_by_business`,{p_business_type:e.businessType,p_business_id:e.businessId,p_action:e.action,p_comment:e.comment||null,p_idempotency_key:crypto.randomUUID()}),{showMessage:!0,breakReturn:!0})}export{i as n,a as r,o as t};