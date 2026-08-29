<template>
  <ArtPermissionGuard permission="Hr:Headcount:View">
    <div class="workforce-page business-workspace-page art-full-height">
      <BusinessWorkspaceHeader
        eyebrow="WORKFORCE CAPACITY"
        title="人力规划与编制"
        description="把年度人力规划、岗位增减员、预算预测与实时岗位容量连接为可审批、可执行、可追溯的管理闭环。"
        icon="ri:organization-chart"
        :tags="workspaceTags"
        :metrics="workspaceMetrics"
      >
        <template #actions>
          <BusinessTableWorkspaceActions :table="tableQueryRef" />
        </template>
      </BusinessWorkspaceHeader>

      <section class="workforce-page__capacity-deck" aria-labelledby="capacity-bridge-title">
        <header class="workforce-page__capacity-heading">
          <span class="workforce-page__capacity-icon" aria-hidden="true">
            <ArtSvgIcon icon="ri:scales-3-line" />
          </span>
          <span>
            <strong id="capacity-bridge-title">编制容量桥</strong>
            <small>规划建议先审批，启用后才成为岗位实时容量权威</small>
          </span>
          <span class="workforce-page__authority-badge">
            <ArtSvgIcon icon="ri:shield-check-line" /> 分层数据权威
          </span>
        </header>

        <div v-if="featuredPlan" class="workforce-page__bridge" aria-label="当前重点规划容量变化">
          <div class="workforce-page__bridge-identity">
            <span>{{ featuredPlan.planNo }}</span>
            <strong>{{ featuredPlan.planName }}</strong>
            <ArtDictDisplay
              dict-code="hrWorkforcePlanStatus"
              :value="featuredPlan.status"
              display="auto"
            />
          </div>
          <div class="workforce-page__bridge-flow">
            <article
              ><small>基线人数</small><strong>{{ featuredPlan.baselineCount }}</strong
              ><span>当前快照</span></article
            >
            <span class="workforce-page__bridge-operator is-positive">+</span>
            <article class="is-positive"
              ><small>计划增员</small><strong>{{ featuredPlan.plannedHires }}</strong
              ><span>招聘与补充</span></article
            >
            <span class="workforce-page__bridge-operator is-negative">−</span>
            <article class="is-negative"
              ><small>计划减员</small><strong>{{ featuredPlan.plannedExits }}</strong
              ><span>流失与优化</span></article
            >
            <span class="workforce-page__bridge-operator">=</span>
            <article class="is-target"
              ><small>目标编制</small><strong>{{ featuredPlan.targetCount }}</strong
              ><span>批准后待启用</span></article
            >
          </div>
          <div class="workforce-page__budget-signal">
            <small>年度成本预测</small>
            <strong>{{
              formatMoney(featuredPlan.plannedPayroll, featuredPlan.currencyCode)
            }}</strong>
            <span :class="{ 'is-over': Number(featuredPlan.budgetVariance ?? 0) < 0 }">{{
              budgetVarianceText
            }}</span>
          </div>
        </div>
        <div v-else class="workforce-page__bridge-empty">
          <ArtSvgIcon icon="ri:route-line" />
          <span
            ><strong>尚未建立人力规划</strong
            ><small>先创建规划周期，再按岗位维护增减员和成本假设。</small></span
          >
        </div>

        <HrEntityNavigation
          :model-value="activeEntity"
          :items="navigationItems"
          navigation-label="人力规划分类"
          compact
          @update:model-value="selectEntity"
        />
      </section>

      <ArtTableQuery
        :key="activeEntity"
        ref="tableQueryRef"
        v-model="tableState.searchQuery"
        :search-items="searchItems"
        :api-fn="fetchTableData"
        :columns-factory="columnsFactory"
        :header-actions="headerActions"
        header-actions-placement="workspace"
        :search-bar-props="{ span: 6, labelWidth: 80, showExpand: false }"
        :table-props="{
          rowKey: 'id',
          tableLayout: 'fixed',
          emptyText: `暂无${activeTab.label}`,
          emptyDescription: activeTab.emptyDescription
        }"
        :on-success="handleTableSuccess"
        focusable
      />

      <WorkforcePlanningDialog ref="dialogRef" @success="handleSaveSuccess" />
    </div>
  </ArtPermissionGuard>
</template>

<script setup lang="tsx">
  import dayjs from 'dayjs'
  import { ElProgress, ElTag } from 'element-plus'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import type {
    ArtTableQueryExpose,
    ArtTableQueryHeaderAction,
    ArtTableQueryProps
  } from '@/components/core/tables/art-table-query/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import HrTableIdentityCell from '@hr/views/shared/hr-table-identity-cell.vue'
  import HrTableActions from '@hr/views/shared/hr-table-actions.vue'
  import ArtDictDisplay from '@/components/core/base/art-dict-display/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric,
    type BusinessWorkspaceTag
  } from '@/components/business/business-workspace-header/index.vue'
  import BusinessTableWorkspaceActions from '@/components/business/business-table-workspace-actions/index.vue'
  import HrEntityNavigation, {
    type HrEntityNavigationItem
  } from '../../shared/hr-entity-navigation.vue'
  import { useArtFeedback } from '@/hooks/core/useArtFeedback'
  import { useUserStore } from '@/store/modules/user'
  import { pageInfoHandler } from '@/utils/table/tableUtils'
  import type { ColumnOption, DialogType } from '@/types'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import {
    deleteWorkforcePlanningRecord,
    fetchWorkforcePlanningOptions,
    fetchWorkforcePlanningOverview,
    fetchWorkforcePlanningRecords,
    transitionWorkforcePlan
  } from '@hr/api'
  import WorkforcePlanningDialog from './modules/workforce-planning-dialog.vue'

  defineOptions({ name: 'HrHeadcount' })

  type Entity = Api.Hr.WorkforcePlanningEntity
  type RecordItem = Api.Hr.WorkforcePlanningRecord
  type TableParams = Api.Hr.WorkforcePlanningSearchParams &
    Pick<Api.Common.PaginationParams, 'current' | 'size'>

  interface WorkforceTab {
    entity: Entity
    label: string
    description: string
    emptyDescription: string
    icon: string
    statusDict?: string
  }
  interface DialogExpose {
    handleOpen: (entity: Entity, row?: RecordItem) => Promise<void>
  }

  const tabs: WorkforceTab[] = [
    {
      entity: 'cycle',
      label: '规划周期',
      description: '场景、预算与审批生命周期',
      emptyDescription: '创建年度或专项规划周期，再按岗位维护目标编制。',
      icon: 'ri:calendar-schedule-line',
      statusDict: 'hrWorkforcePlanStatus'
    },
    {
      entity: 'line',
      label: '岗位需求',
      description: '基线、增减员、目标与成本预测',
      emptyDescription: '在草稿规划中添加岗位需求，系统会自动快照当前在岗人数。',
      icon: 'ri:git-merge-line',
      statusDict: 'hrWorkforcePlanPriority'
    },
    {
      entity: 'effective',
      label: '有效编制',
      description: '岗位实时容量与在岗缺口',
      emptyDescription: '启用已批准规划，或手工核定未来生效的岗位编制。',
      icon: 'ri:shield-check-line'
    }
  ]

  const userStore = useUserStore()
  const { getDictMap, isPlatformSuper } = storeToRefs(userStore)
  const { confirmAction, promptReason } = useArtFeedback()
  const activeEntity = ref<Entity>('cycle')
  const activeTab = computed(() => tabs.find((tab) => tab.entity === activeEntity.value) ?? tabs[0])
  const navigationItems = computed<HrEntityNavigationItem[]>(() =>
    tabs.map((tab) => ({ ...tab, value: tab.entity }))
  )
  const tableQueryRef = ref<ArtTableQueryExpose>()
  const dialogRef = ref<DialogExpose>()
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const planFilterOptions = shallowRef<Api.Hr.WorkforcePlanningReference[]>([])
  const tableState = reactive<{ searchQuery: Api.Hr.WorkforcePlanningSearchParams }>({
    searchQuery: { tenantId: '', status: '', keyword: '', planId: '' }
  })
  const overview = reactive<Api.Hr.WorkforcePlanningOverview>({
    activePlanCount: 0,
    pendingApprovalCount: 0,
    operationalCapacity: 0,
    currentIncumbentCount: 0,
    vacancyCount: 0,
    overCapacityCount: 0,
    featuredPlan: null
  })
  const tableOverview = reactive({ total: 0 })

  const featuredPlan = computed(() => overview.featuredPlan ?? null)
  const formatMoney = (value?: number | null, currency = 'CNY'): string =>
    value == null
      ? '--'
      : new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency,
          maximumFractionDigits: 0
        }).format(value)
  const budgetVarianceText = computed(() => {
    if (featuredPlan.value?.budgetAmount == null) return '未设置预算上限'
    const variance = Number(featuredPlan.value.budgetVariance ?? 0)
    return variance >= 0
      ? `预算余量 ${formatMoney(variance, featuredPlan.value.currencyCode)}`
      : `超预算 ${formatMoney(Math.abs(variance), featuredPlan.value.currencyCode)}`
  })
  const workspaceTags: BusinessWorkspaceTag[] = [
    { label: '基线与场景规划', type: 'primary', effect: 'plain' },
    { label: '审批后启用', type: 'warning', effect: 'light' },
    { label: '岗位容量联动', type: 'success', effect: 'light' }
  ]
  const workspaceMetrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      label: '当前在岗',
      value: overview.currentIncumbentCount,
      description: `岗位容量 ${overview.operationalCapacity} 人`,
      icon: 'ri:team-line'
    },
    {
      label: '可用缺口',
      value: overview.vacancyCount,
      description: overview.overCapacityCount
        ? `${overview.overCapacityCount} 人超编需处理`
        : '按实时岗位容量计算',
      icon: 'ri:user-add-line',
      tone: overview.overCapacityCount ? 'danger' : 'success'
    },
    {
      label: '待审批规划',
      value: overview.pendingApprovalCount,
      description: `${overview.activePlanCount} 个规划执行中`,
      icon: 'ri:task-line',
      tone: overview.pendingApprovalCount ? 'warning' : 'info'
    },
    {
      label: '当前视图',
      value: tableOverview.total,
      description: activeTab.value.label,
      icon: activeTab.value.icon,
      tone: 'info'
    }
  ])

  const effectiveStatusOptions = [
    { label: '有空缺', value: 'vacant' },
    { label: '已满编', value: 'full' },
    { label: '已超编', value: 'over' }
  ]
  const searchItems = computed<SearchFormItem[]>(() => {
    const items: SearchFormItem[] = [
      {
        label: '所属租户',
        key: 'tenantId',
        type: 'select',
        hidden: !isPlatformSuper.value,
        props: {
          options: tenantOptions.value,
          clearable: true,
          filterable: true,
          onChange: handleTenantSearchChange
        }
      }
    ]
    if (activeEntity.value === 'line')
      items.push({
        label: '规划周期',
        key: 'planId',
        type: 'select',
        props: {
          options: planFilterOptions.value.map((option) => ({
            label: `${option.name ?? '--'}${option.code ? ` · ${option.code}` : ''}`,
            value: option.id
          })),
          clearable: true,
          filterable: true
        }
      })
    items.push({
      label: activeEntity.value === 'line' ? '优先级' : '状态',
      key: 'status',
      type: 'select',
      props: {
        options:
          activeEntity.value === 'effective'
            ? effectiveStatusOptions
            : (getDictMap.value[activeTab.value.statusDict ?? ''] ?? []),
        clearable: true
      }
    })
    items.push({
      label: '关键字',
      key: 'keyword',
      type: 'input',
      props: {
        clearable: true,
        placeholder:
          activeEntity.value === 'cycle' ? '规划编号、名称或负责人' : '组织、岗位编码或名称'
      }
    })
    return items
  })

  const identity = (title?: string | null, subtitle?: string | null) => (
    <HrTableIdentityCell primary={title} secondary={subtitle} />
  )
  const capacityCell = (baseline: number, hires: number, exits: number, target: number) => (
    <div class="workforce-page__capacity-cell">
      <span>{baseline}</span>
      <small>+</small>
      <span class="is-positive">{hires}</span>
      <small>−</small>
      <span class="is-negative">{exits}</span>
      <small>=</small>
      <strong>{target}</strong>
    </div>
  )
  const cycleAction = (row: Api.Hr.WorkforcePlanCycle) => {
    if (row.status === 'draft')
      return (
        <>
          <ArtButtonTable
            type="edit"
            permission="Hr:Headcount:Edit"
            onClick={() => openDialog(row)}
          />
          <ArtButtonTable
            type="sign"
            icon="ri:send-plane-line"
            label="提交审批"
            permission="Hr:Headcount:Submit"
            onClick={() => actCycle(row, 'submit')}
          />
          <ArtButtonTable
            type="delete"
            permission="Hr:Headcount:Delete"
            onClick={() => handleDelete(row)}
          />
        </>
      )
    if (row.status === 'submitted')
      return (
        <>
          <ArtButtonTable
            type="sign"
            icon="ri:check-double-line"
            label="批准规划"
            permission="Hr:Headcount:Approve"
            onClick={() => actCycle(row, 'approve')}
          />
          <ArtButtonTable
            type="more"
            icon="ri:arrow-go-back-line"
            label="退回修订"
            permission="Hr:Headcount:Approve"
            onClick={() => actCycle(row, 'return')}
          />
          <ArtButtonTable
            type="delete"
            icon="ri:close-circle-line"
            label="取消规划"
            permission="Hr:Headcount:Submit"
            onClick={() => actCycle(row, 'cancel')}
          />
        </>
      )
    if (row.status === 'approved')
      return (
        <ArtButtonTable
          type="sign"
          icon="ri:play-circle-line"
          label="启用规划"
          permission="Hr:Headcount:Activate"
          onClick={() => actCycle(row, 'activate')}
        />
      )
    if (row.status === 'active')
      return (
        <ArtButtonTable
          type="sign"
          icon="ri:stop-circle-line"
          label="关闭规划"
          permission="Hr:Headcount:Close"
          onClick={() => actCycle(row, 'close')}
        />
      )
    return null
  }
  const actionColumn = (): ColumnOption<RecordItem> => ({
    prop: 'operation',
    label: '操作',
    width: activeEntity.value === 'cycle' ? 150 : 115,
    fixed: 'right',
    formatter: (row) => {
      if (activeEntity.value === 'cycle')
        return <HrTableActions>{cycleAction(row as Api.Hr.WorkforcePlanCycle)}</HrTableActions>
      if (activeEntity.value === 'line') {
        const line = row as Api.Hr.WorkforcePlanLine
        return line.planStatus === 'draft' ? (
          <HrTableActions>
            <ArtButtonTable
              type="edit"
              permission="Hr:Headcount:Edit"
              onClick={() => openDialog(row)}
            />
            <ArtButtonTable
              type="delete"
              permission="Hr:Headcount:Delete"
              onClick={() => handleDelete(row)}
            />
          </HrTableActions>
        ) : null
      }
      const item = row as Api.Hr.WorkforceEffectiveHeadcount
      if (item.sourcePlanLineId)
        return (
          <ElTag type="success" effect="plain">
            规划同步
          </ElTag>
        )
      return (
        <HrTableActions>
          <ArtButtonTable
            type={item.effectiveFrom ? 'edit' : 'add'}
            label={item.effectiveFrom ? '编辑有效编制' : '核定有效编制'}
            permission={item.effectiveFrom ? 'Hr:Headcount:Edit' : 'Hr:Headcount:Add'}
            onClick={() => openEffective(item)}
          />
          {item.id && item.effectiveFrom && dayjs(item.effectiveFrom).isAfter(dayjs(), 'day') ? (
            <ArtButtonTable
              type="delete"
              permission="Hr:Headcount:Delete"
              onClick={() => handleDelete(row)}
            />
          ) : null}
        </HrTableActions>
      )
    }
  })

  const cycleColumns = (): ColumnOption<RecordItem>[] => [
    {
      prop: 'planName',
      label: '规划周期',
      minWidth: 240,
      fixed: 'left',
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanCycle
        return identity(item.planName, `${item.planNo} · ${item.periodStart} → ${item.periodEnd}`)
      }
    },
    {
      prop: 'scenario',
      label: '规划场景',
      width: 115,
      dict: { code: 'hrWorkforcePlanScenario', display: 'auto' }
    },
    {
      prop: 'capacity',
      label: '基线 + 增员 − 减员 = 目标',
      minWidth: 245,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanCycle
        return capacityCell(
          item.baselineCount ?? 0,
          item.plannedHires ?? 0,
          item.plannedExits ?? 0,
          item.targetCount ?? 0
        )
      }
    },
    {
      prop: 'budgetAmount',
      label: '预算 / 预测',
      minWidth: 185,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanCycle
        return identity(
          formatMoney(item.budgetAmount, item.currencyCode),
          `预测 ${formatMoney(item.plannedPayroll, item.currencyCode)}`
        )
      }
    },
    {
      prop: 'owner',
      label: '负责人 / 岗位数',
      minWidth: 175,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanCycle
        return identity(item.owner?.name ?? '未指定负责人', `${item.lineCount ?? 0} 个岗位需求`)
      }
    },
    {
      prop: 'status',
      label: '状态',
      width: 105,
      dict: { code: 'hrWorkforcePlanStatus', display: 'auto' }
    },
    actionColumn()
  ]
  const lineColumns = (): ColumnOption<RecordItem>[] => [
    {
      prop: 'position',
      label: '组织 / 岗位',
      minWidth: 230,
      fixed: 'left',
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanLine
        return identity(
          item.position?.name,
          `${item.organization?.name ?? '--'} · ${item.position?.code ?? '--'}`
        )
      }
    },
    {
      prop: 'plan',
      label: '所属规划',
      minWidth: 190,
      formatter: (row) =>
        identity(
          (row as Api.Hr.WorkforcePlanLine).plan?.name,
          (row as Api.Hr.WorkforcePlanLine).plan?.code
        )
    },
    {
      prop: 'targetCount',
      label: '容量变化',
      minWidth: 225,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanLine
        return capacityCell(
          item.baselineCount,
          item.plannedHires,
          item.plannedExits,
          item.targetCount
        )
      }
    },
    {
      prop: 'forecastGap',
      label: '实际 / 预测缺口',
      width: 145,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanLine
        const gap = Number(item.forecastGap ?? 0)
        return identity(
          `${item.currentCount ?? 0} / ${item.targetCount} 人`,
          gap > 0 ? `缺口 ${gap} 人` : gap < 0 ? `超目标 ${Math.abs(gap)} 人` : '目标已覆盖'
        )
      }
    },
    {
      prop: 'recruitingCount',
      label: '招聘联动',
      width: 135,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforcePlanLine
        return identity(
          `${item.recruitingCount ?? 0} 人在招`,
          `${item.requisitionCount ?? 0} 个有效需求`
        )
      }
    },
    {
      prop: 'priority',
      label: '优先级',
      width: 95,
      dict: { code: 'hrWorkforcePlanPriority', display: 'auto' }
    },
    {
      prop: 'demandDate',
      label: '到位日期',
      width: 115,
      formatter: (row) => (row as Api.Hr.WorkforcePlanLine).demandDate ?? '--'
    },
    actionColumn()
  ]
  const effectiveColumns = (): ColumnOption<RecordItem>[] => [
    {
      prop: 'position',
      label: '组织 / 岗位',
      minWidth: 240,
      fixed: 'left',
      formatter: (row) => {
        const item = row as Api.Hr.WorkforceEffectiveHeadcount
        return identity(
          item.position?.name,
          `${item.organization?.name ?? '--'} · ${item.position?.code ?? '--'}`
        )
      }
    },
    {
      prop: 'occupancy',
      label: '在岗容量',
      minWidth: 230,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforceEffectiveHeadcount
        const current = Number(item.currentCount ?? 0)
        const approved = Math.max(Number(item.approvedCount ?? 0), 1)
        return (
          <div class="workforce-page__occupancy">
            <span>
              <strong>{current}</strong> / {item.approvedCount} 人
            </span>
            <ElProgress
              percentage={Math.min(100, Math.round((current / approved) * 100))}
              stroke-width={6}
              show-text={false}
              status={current > Number(item.approvedCount) ? 'exception' : undefined}
            />
          </div>
        )
      }
    },
    {
      prop: 'vacancyCount',
      label: '可用缺口',
      width: 115,
      formatter: (row) => {
        const gap = Number((row as Api.Hr.WorkforceEffectiveHeadcount).vacancyCount ?? 0)
        return (
          <ElTag type={gap < 0 ? 'danger' : gap > 0 ? 'success' : 'info'} effect="light">
            {gap < 0 ? `超编 ${Math.abs(gap)}` : gap > 0 ? `空缺 ${gap}` : '已满编'}
          </ElTag>
        )
      }
    },
    {
      prop: 'effectiveFrom',
      label: '有效期间',
      minWidth: 190,
      formatter: (row) => {
        const item = row as Api.Hr.WorkforceEffectiveHeadcount
        return item.effectiveFrom
          ? `${item.effectiveFrom} → ${item.effectiveTo ?? '持续有效'}`
          : '岗位当前硬上限'
      }
    },
    {
      prop: 'sourcePlanLineId',
      label: '数据来源',
      width: 125,
      formatter: (row) =>
        (row as Api.Hr.WorkforceEffectiveHeadcount).sourcePlanLineId
          ? '规划启用同步'
          : (row as Api.Hr.WorkforceEffectiveHeadcount).effectiveFrom
            ? '手工核定'
            : '岗位容量基线'
    },
    actionColumn()
  ]
  const columnsFactory = (): ColumnOption<RecordItem>[] =>
    activeEntity.value === 'cycle'
      ? cycleColumns()
      : activeEntity.value === 'line'
        ? lineColumns()
        : effectiveColumns()

  const headerActions = computed<ArtTableQueryHeaderAction[]>(() => [
    {
      type: 'add',
      label:
        activeEntity.value === 'cycle'
          ? '新增规划周期'
          : activeEntity.value === 'line'
            ? '新增岗位需求'
            : '核定有效编制',
      permission: 'Hr:Headcount:Add',
      onClick: () => openDialog()
    }
  ])
  const fetchTableData = async (params: TableParams) => {
    const page = pageInfoHandler(params)
    return await fetchWorkforcePlanningRecords(activeEntity.value, {
      ...tableState.searchQuery,
      from: page.from,
      to: page.to
    })
  }
  const handleTableSuccess: NonNullable<ArtTableQueryProps['onSuccess']> = (_data, response) => {
    tableOverview.total = Number(response.total ?? 0)
  }
  const loadOverview = async (): Promise<void> => {
    const result = await fetchWorkforcePlanningOverview(tableState.searchQuery.tenantId)
    if (result.data) Object.assign(overview, result.data)
  }
  const loadPlanFilters = async (): Promise<void> => {
    const result = await fetchWorkforcePlanningOptions('plan', tableState.searchQuery.tenantId)
    planFilterOptions.value = result.data ?? []
  }
  const handleTenantSearchChange = (): void => {
    tableState.searchQuery.planId = ''
    void Promise.all([loadOverview(), loadPlanFilters()])
  }
  const selectEntity = (value: string): void => {
    activeEntity.value = value as Entity
    Object.assign(tableState.searchQuery, { status: '', keyword: '', planId: '' })
  }
  const openDialog = (row?: RecordItem): void => {
    void dialogRef.value?.handleOpen(activeEntity.value, row)
  }
  const openEffective = (row: Api.Hr.WorkforceEffectiveHeadcount): void => {
    const editable = row.effectiveFrom
      ? row
      : { ...row, id: undefined, effectiveFrom: dayjs().format('YYYY-MM-DD') }
    void dialogRef.value?.handleOpen('effective', editable)
  }
  const handleSaveSuccess = (type: DialogType): void => {
    void Promise.all([
      type === 'add' ? tableQueryRef.value?.refreshCreate() : tableQueryRef.value?.refreshUpdate(),
      loadOverview(),
      loadPlanFilters()
    ])
  }
  const handleDelete = async (row: RecordItem): Promise<void> => {
    if (!row.id) return
    try {
      await confirmAction(`确定删除这条${activeTab.value.label}记录吗？`, '删除确认', {
        confirmButtonText: '删除',
        confirmButtonType: 'danger'
      })
      await deleteWorkforcePlanningRecord(activeEntity.value, row.id)
      await Promise.all([tableQueryRef.value?.refreshRemove(), loadOverview(), loadPlanFilters()])
    } catch {
      /* 用户取消 */
    }
  }
  const actCycle = async (
    row: Api.Hr.WorkforcePlanCycle,
    action: Api.Hr.WorkforcePlanAction
  ): Promise<void> => {
    if (!row.id) return
    try {
      let comment: string | undefined
      if (['return', 'cancel', 'close'].includes(action))
        comment = await promptReason(
          '请填写本次状态变更原因，内容将保留在规划审计记录中。',
          action === 'return' ? '退回修订' : action === 'cancel' ? '取消规划' : '关闭规划',
          { confirmButtonText: action === 'close' ? '关闭规划' : '提交原因', maxLength: 200 }
        )
      else {
        const copyMap: Partial<Record<Api.Hr.WorkforcePlanAction, string>> = {
          submit: '提交后岗位需求将锁定，等待具备审批权限的人员审核。',
          approve: '批准只确认规划建议，不会立即改变岗位容量。',
          activate: '启用会生成有效编制并同步岗位硬上限；低于当前在岗人数的目标将被阻止。'
        }
        const copy = copyMap[action]
        await confirmAction(copy ?? '确认执行该操作？', '状态确认', {
          confirmButtonText:
            action === 'activate' ? '启用并同步' : action === 'approve' ? '批准规划' : '提交审批'
        })
      }
      await transitionWorkforcePlan(row.id, action, comment)
      await Promise.all([tableQueryRef.value?.refreshUpdate(), loadOverview(), loadPlanFilters()])
    } catch {
      /* 用户取消或业务层已提示 */
    }
  }

  onMounted(async () => {
    if (isPlatformSuper.value) {
      const result = await fetchGetEnableTenantList()
      tenantOptions.value = (result.data ?? []).map((tenant) => ({
        label: `${tenant.tenantName}（${tenant.tenantCode}）`,
        value: tenant.id!
      }))
    }
    await Promise.all([loadOverview(), loadPlanFilters()])
  })
</script>

<style scoped lang="scss">
  .workforce-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;

    &__capacity-deck {
      display: grid;
      grid-template-columns: minmax(300px, 0.72fr) minmax(0, 2fr);
      gap: 14px;
      padding: 16px 18px 12px;
      background: var(--default-box-color);
      border: 1px solid var(--art-card-border);
      border-radius: var(--art-surface-radius);
      box-shadow: var(--art-card-shadow);

      :deep(.hr-entity-navigation) {
        grid-column: 1 / -1;
      }
    }

    &__capacity-heading {
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 11px;
      align-items: center;
      min-width: 0;

      > span:nth-child(2) {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      strong {
        color: var(--art-text-gray-900);
      }

      small {
        color: var(--art-text-gray-600);
      }
    }

    &__capacity-icon {
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      width: 38px;
      height: 38px;
      font-size: 19px;
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
      border-radius: var(--el-border-radius-base);
    }

    &__authority-badge {
      display: inline-flex !important;
      flex: 0 0 auto;
      grid-column: 2;
      gap: 5px !important;
      align-items: center;
      justify-self: start;
      padding: 5px 9px;
      margin-top: -4px;
      font-size: 12px;
      color: var(--el-color-success);
      background: color-mix(in srgb, var(--el-color-success) 9%, transparent);
      border-radius: 999px;
    }

    &__bridge {
      display: grid;
      grid-template-columns: minmax(170px, 0.72fr) minmax(500px, 2fr) minmax(170px, 0.72fr);
      gap: 18px;
      align-items: stretch;
      min-width: 0;
      padding: 14px 16px;
      background: color-mix(in srgb, var(--el-color-primary) 4%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--el-color-primary) 13%, var(--art-card-border));
      border-radius: var(--el-border-radius-base);
    }

    &__bridge-identity,
    &__budget-signal {
      display: flex;
      flex-direction: column;
      gap: 5px;
      justify-content: center;
      min-width: 0;

      > span:first-child,
      > small {
        font-size: 12px;
        color: var(--art-text-gray-600);
      }

      > strong {
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--art-text-gray-900);
        white-space: nowrap;
      }
    }

    &__bridge-flow {
      display: grid;
      grid-template-columns: repeat(7, auto);
      gap: 10px;
      align-items: center;
      justify-content: center;
      min-width: 0;

      article {
        display: grid;
        gap: 2px;
        min-width: 76px;
        text-align: center;
      }

      small,
      span {
        font-size: 12px;
        color: var(--art-text-gray-600);
      }

      strong {
        font-size: 24px;
        font-variant-numeric: tabular-nums;
        line-height: 1.05;
        color: var(--art-text-gray-900);
      }

      .is-positive strong {
        color: var(--el-color-success);
      }

      .is-negative strong {
        color: var(--el-color-warning);
      }

      .is-target strong {
        color: var(--el-color-primary);
      }
    }

    &__bridge-operator {
      font-size: 18px !important;
      font-weight: 700;
      color: var(--art-text-gray-500) !important;
    }

    &__budget-signal {
      padding-left: 18px;
      border-left: 1px solid var(--art-card-border);

      > span:last-child {
        font-size: 12px;
        color: var(--el-color-success);

        &.is-over {
          color: var(--el-color-danger);
        }
      }
    }

    &__bridge-empty {
      display: flex;
      gap: 12px;
      align-items: center;
      min-height: 76px;
      padding: 12px 16px;
      color: var(--art-text-gray-600);
      background: var(--art-gray-100);
      border-radius: var(--el-border-radius-base);

      > :deep(.art-svg-icon) {
        font-size: 22px;
        color: var(--el-color-primary);
      }

      span {
        display: grid;
        gap: 3px;
      }

      strong {
        color: var(--art-text-gray-800);
      }
    }

    &__identity {
      display: grid;
      gap: 3px;
      min-width: 0;

      strong {
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--art-text-gray-900);
        white-space: nowrap;
      }

      span {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        color: var(--art-text-gray-600);
        white-space: nowrap;
      }
    }

    &__capacity-cell {
      display: flex;
      gap: 7px;
      align-items: baseline;
      font-variant-numeric: tabular-nums;

      span {
        color: var(--art-text-gray-700);
      }

      small {
        color: var(--art-text-gray-500);
      }

      strong {
        font-size: 16px;
        color: var(--el-color-primary);
      }

      .is-positive {
        color: var(--el-color-success);
      }

      .is-negative {
        color: var(--el-color-warning);
      }
    }

    &__occupancy {
      display: grid;
      gap: 7px;
      max-width: 190px;

      span {
        font-size: 12px;
        color: var(--art-text-gray-700);
      }

      strong {
        font-variant-numeric: tabular-nums;
        color: var(--art-text-gray-900);
      }
    }

    &__actions {
      display: flex;
      align-items: center;
      min-height: 32px;
    }

    @media (width <= 1440px) {
      &__bridge {
        grid-template-columns: minmax(150px, 0.6fr) minmax(430px, 1.7fr);
      }

      &__budget-signal {
        flex-direction: row;
        grid-column: 1 / -1;
        align-items: baseline;
        padding: 10px 0 0;
        border-top: 1px solid var(--art-card-border);
        border-left: 0;
      }
    }

    @media (width <= 980px) {
      &__capacity-deck {
        grid-template-columns: 1fr;
      }

      &__bridge {
        grid-template-columns: 1fr;
      }

      &__bridge-flow {
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 4px;
        justify-content: start;

        article {
          min-width: 0;
        }

        strong {
          font-size: 20px;
        }
      }

      &__budget-signal {
        grid-column: auto;
      }

      &__authority-badge {
        display: none !important;
      }
    }
  }
</style>
