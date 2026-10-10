import { useSupabase } from '@/hooks/core/useSupabase'
import TreeUtils from '@/utils/tree'

export type HrOrganizationFeature =
  | 'absence'
  | 'performance'
  | 'headcount'
  | 'lifecycle'
  | 'experience'
  | 'compensationReview'
  | 'contingentWorkforce'
  | 'policyAcknowledgement'
  | 'organizationDesign'
  | 'internalMobility'
  | 'personnelChange'
  | 'recruitment'
  | 'talent'
const { supabase, responseHandle } = useSupabase()
const treeUtils = new TreeUtils({ idKey: 'id', parentKey: 'parentId', childrenKey: 'children' })

export async function fetchHrOrganizationTree(
  feature: HrOrganizationFeature,
  params: { tenantId?: string } = {}
) {
  const response = await responseHandle<Api.SystemManage.OrganizationScopeFilterItem[]>(
    () =>
      supabase.rpc('hr_list_business_organization_options_secure', {
        p_feature: feature,
        p_tenant_id: params.tenantId || null
      }),
    { showErrorMessage: true }
  )
  return {
    ...response,
    data: treeUtils.listToTree(
      response.data ?? [],
      (a, b) =>
        (a.sort ?? 0) - (b.sort ?? 0) ||
        a.organizationName.localeCompare(b.organizationName, 'zh-CN')
    )
  }
}
