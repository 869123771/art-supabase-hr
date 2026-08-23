import dayjs from 'dayjs'
import { useSupabase } from '@/hooks'

const LOOKAHEAD_DAYS = 60

interface WorkforceRiskSource {
  activeEmployeeCount?: number
  probationEmployees?: Pick<
    Api.Hr.Employee,
    'id' | 'employeeNo' | 'employeeName' | 'probationEndDate'
  >[]
  contracts?: Api.Hr.WorkspaceRecord[]
  qualifications?: Api.Hr.WorkspaceRecord[]
  headcounts?: Api.Hr.WorkspaceRecord[]
}

const { supabase, responseHandle } = useSupabase()

const daysUntil = (value?: string | null): number | null =>
  value ? dayjs(value).startOf('day').diff(dayjs().startOf('day'), 'day') : null

const isDueWithin = (days: number | null, limit = LOOKAHEAD_DAYS): days is number =>
  days !== null && days <= limit

const riskLevel = (days: number | null): Api.Hr.WorkforceRiskLevel => {
  if (days === null || days > 30) return 'attention'
  return days <= 7 ? 'critical' : 'warning'
}

export async function fetchWorkforceRiskOverview(): Promise<Api.Hr.WorkforceRiskOverview> {
  const result = await responseHandle<WorkforceRiskSource>(
    () => supabase.rpc('hr_get_workforce_risk_secure'),
    { showErrorMessage: true }
  )
  if (result.error) throw result.error

  const source = result.data ?? {}
  const contracts = source.contracts ?? []
  const qualifications = source.qualifications ?? []
  const headcounts = source.headcounts ?? []
  const probationEmployees = source.probationEmployees ?? []

  const contractItems: Api.Hr.WorkforceRiskItem[] = contracts.flatMap((record) => {
    const days = daysUntil(record.endDate)
    if (!isDueWithin(days)) return []
    return [
      {
        id: `contract-${record.id}`,
        kind: 'contract',
        level: riskLevel(days),
        title: days < 0 ? '劳动合同已到期' : '劳动合同临近到期',
        subject: record.employee?.employeeName || record.contractNo || '未命名员工',
        dueDate: record.endDate,
        daysRemaining: days,
        description: `${record.contractNo || '合同'} · ${days < 0 ? `已超期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}`,
        routePath: '/hr/personnel/compliance?tab=contracts'
      }
    ]
  })

  const qualificationItems: Api.Hr.WorkforceRiskItem[] = qualifications.flatMap((record) => {
    const days = daysUntil(record.expiryDate)
    if (!isDueWithin(days)) return []
    return [
      {
        id: `qualification-${record.id}`,
        kind: 'qualification',
        level: riskLevel(days),
        title: days < 0 ? '员工资质已失效' : '员工资质临近失效',
        subject: record.employee?.employeeName || '未命名员工',
        dueDate: record.expiryDate,
        daysRemaining: days,
        description: `${record.qualificationName || '资质证照'} · ${days < 0 ? `已超期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}`,
        routePath: '/hr/personnel/compliance?tab=qualifications'
      }
    ]
  })

  const headcountItems: Api.Hr.WorkforceRiskItem[] = headcounts.flatMap((record) => {
    const vacancy = Number(record.vacancyCount ?? 0)
    if (!record.enabled || vacancy <= 0) return []
    return [
      {
        id: `headcount-${record.id}`,
        kind: 'headcount',
        level: vacancy >= 3 ? 'warning' : 'attention',
        title: '岗位存在编制缺口',
        subject: `${record.organization?.organizationName || '未分配组织'} · ${record.position?.positionName || '未分配岗位'}`,
        daysRemaining: null,
        description: `核定 ${record.approvedCount ?? 0} 人，在岗 ${record.occupiedCount ?? 0} 人，缺编 ${vacancy} 人`,
        routePath: '/hr/operations/headcount'
      }
    ]
  })

  const probationItems: Api.Hr.WorkforceRiskItem[] = probationEmployees.flatMap((employee) => {
    const days = daysUntil(employee.probationEndDate)
    if (!isDueWithin(days, 30)) return []
    return [
      {
        id: `probation-${employee.id}`,
        kind: 'probation',
        level: riskLevel(days),
        title: days < 0 ? '试用期已超期' : '试用期即将结束',
        subject: employee.employeeName,
        dueDate: employee.probationEndDate,
        daysRemaining: days,
        description: `${employee.employeeNo} · ${days < 0 ? `已超期 ${Math.abs(days)} 天` : `剩余 ${days} 天`}`,
        routePath: '/hr/personnel/employee-roster'
      }
    ]
  })

  const items = [
    ...contractItems,
    ...qualificationItems,
    ...probationItems,
    ...headcountItems
  ].sort((left, right) => {
    const levelWeight = { critical: 0, warning: 1, attention: 2 }
    return (
      levelWeight[left.level] - levelWeight[right.level] ||
      (left.daysRemaining ?? Number.MAX_SAFE_INTEGER) -
        (right.daysRemaining ?? Number.MAX_SAFE_INTEGER)
    )
  })

  return {
    generatedAt: new Date().toISOString(),
    activeEmployeeCount: source.activeEmployeeCount ?? 0,
    criticalCount: items.filter((item) => item.level === 'critical').length,
    expiringContractCount: contractItems.length,
    expiringQualificationCount: qualificationItems.length,
    vacancyCount: headcountItems.reduce((sum, item) => {
      const match = item.description.match(/缺编 (\d+) 人/)
      return sum + Number(match?.[1] ?? 0)
    }, 0),
    probationDueCount: probationItems.length,
    items
  }
}
