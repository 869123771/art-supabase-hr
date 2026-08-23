import { useSupabase } from '@/hooks'

const { supabase, responseHandle } = useSupabase()

interface TalentInventorySource {
  generatedAt?: string
  records?: Api.Hr.TalentInventoryRecord[]
  totalRecords?: number
  returnedRecords?: number
  truncated?: boolean
}

export async function fetchTalentInventory(): Promise<Api.Hr.TalentInventoryOverview> {
  const result = await responseHandle<TalentInventorySource>(
    () => supabase.rpc('hr_get_talent_inventory_secure'),
    { showErrorMessage: true }
  )
  if (result.error) throw result.error

  const records = result.data?.records ?? []
  const assessed = records.filter((record) => record.competencyTotal > 0)
  const performanceRated = records.filter((record) => record.performanceLevel)
  return {
    generatedAt: result.data?.generatedAt ?? new Date().toISOString(),
    totalRecords: result.data?.totalRecords ?? records.length,
    returnedRecords: result.data?.returnedRecords ?? records.length,
    truncated: result.data?.truncated === true,
    employeeCount: records.length,
    assessedCount: assessed.length,
    highPerformerCount: performanceRated.filter((record) =>
      ['S', 'A'].includes(record.performanceLevel ?? '')
    ).length,
    gapEmployeeCount: records.filter((record) => record.competencyGapCount > 0).length,
    averageReadinessRate: assessed.length
      ? Math.round(
          (assessed.reduce((sum, record) => sum + (record.readinessRate ?? 0), 0) /
            assessed.length) *
            10
        ) / 10
      : undefined,
    records
  }
}
