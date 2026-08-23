import { useSupabase } from '@/hooks'

const { supabase, responseHandle } = useSupabase()

type SkillMatrixSource = Partial<Api.Hr.SkillMatrixOverview>

export async function fetchSkillMatrix(): Promise<Api.Hr.SkillMatrixOverview> {
  const result = await responseHandle<SkillMatrixSource>(
    () => supabase.rpc('hr_get_skill_matrix_secure'),
    { showErrorMessage: true }
  )
  if (result.error) throw result.error

  const source = result.data
  return {
    generatedAt: source?.generatedAt ?? new Date().toISOString(),
    totalRecords: source?.totalRecords ?? 0,
    returnedRecords: source?.returnedRecords ?? 0,
    truncated: source?.truncated === true,
    employeeCount: source?.employeeCount ?? 0,
    modelledEmployeeCount: source?.modelledEmployeeCount ?? 0,
    assessedEmployeeCount: source?.assessedEmployeeCount ?? 0,
    readyEmployeeCount: source?.readyEmployeeCount ?? 0,
    gapEmployeeCount: source?.gapEmployeeCount ?? 0,
    unassessedEmployeeCount: source?.unassessedEmployeeCount ?? 0,
    records: source?.records ?? [],
    competencies: source?.competencies ?? []
  }
}
