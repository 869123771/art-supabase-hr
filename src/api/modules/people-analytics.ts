import { useSupabase } from '@/hooks'
import { withRequestOptions } from '@/api/providers/supabase/query'
import type { ApiRequestOptions } from '@/types/api/request'

const { supabase, responseHandle } = useSupabase()

export async function fetchPeopleAnalyticsOverview(
  params: {
    asOfDate?: string
    periodMonths?: number
    tenantId?: string
  } = {},
  options?: ApiRequestOptions
) {
  return await responseHandle<Api.Hr.PeopleAnalyticsOverview>(
    () =>
      withRequestOptions(
        supabase.rpc('hr_people_analytics_overview_secure', {
          p_as_of_date: params.asOfDate || null,
          p_period_months: params.periodMonths ?? 12,
          p_tenant_id: params.tenantId || null
        }),
        options
      ),
    { showErrorMessage: true }
  )
}
