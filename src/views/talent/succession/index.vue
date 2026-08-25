<template>
  <div
    v-auth="'Hr:Succession:View'"
    class="succession-page business-workspace-page art-full-height"
  >
    <BusinessWorkspaceHeader
      eyebrow="SUCCESSION & CAREER"
      title="继任与发展"
      description="围绕关键岗位管理继任覆盖、候选人准备度和发展行动，把人才盘点结论转化为可复盘的组织能力计划。"
      icon="ri:git-merge-line"
      :tags="workspaceTags"
      :metrics="workspaceMetrics"
    >
      <template #actions><BusinessTableWorkspaceActions :table="tableQueryRef" /></template>
    </BusinessWorkspaceHeader>

    <section class="succession-page__control-deck" aria-labelledby="succession-control-title">
      <header class="succession-page__control-heading">
        <div>
          <span class="succession-page__section-icon" aria-hidden="true">
            <ArtSvgIcon icon="ri:flow-chart" />
          </span>
          <span>
            <strong id="succession-control-title">关键岗位继任闭环</strong>
            <small>从岗位风险识别，到候选梯队建设，再到发展行动验收</small>
          </span>
        </div>
        <span class="succession-page__governance-badge">
          <ArtSvgIcon icon="ri:shield-keyhole-line" />
          HR 授权数据
        </span>
      </header>

      <div class="succession-page__journey" aria-label="继任管理业务流程">
        <template v-for="(stage, index) in journeyStages" :key="stage.title">
          <article :class="`is-${stage.tone}`">
            <span class="succession-page__journey-index">0{{ index + 1 }}</span>
            <span class="succession-page__journey-icon">
              <ArtSvgIcon :icon="stage.icon" />
            </span>
            <div>
              <span class="succession-page__journey-title">
                <strong>{{ stage.title }}</strong>
                <em>{{ stage.signal }}</em>
              </span>
              <small>{{ stage.description }}</small>
            </div>
          </article>
          <span
            v-if="index < journeyStages.length - 1"
            class="succession-page__connector"
            aria-hidden="true"
          >
            <ArtSvgIcon icon="ri:arrow-right-line" />
          </span>
        </template>
      </div>

      <HrEntityNavigation
        v-model="activeEntity"
        :items="navigationItems"
        navigation-label="继任管理分类"
        compact
        @change="handleTabChange"
      />

      <div class="succession-page__view-context" aria-live="polite">
        <div class="succession-page__view-intro">
          <span class="succession-page__view-icon" aria-hidden="true">
            <ArtSvgIcon :icon="activeTab.icon" />
          </span>
          <span>
            <small>当前工作视图</small>
            <strong>{{ activeTab.label }}</strong>
            <em>{{ activeTab.description }}</em>
          </span>
        </div>
        <dl>
          <div>
            <dt>当前结果</dt>
            <dd>{{ tableTotal }}</dd>
          </div>
          <div :class="`is-${activeAttention.tone}`">
            <dt>{{ activeAttention.label }}</dt>
            <dd>{{ activeAttention.value }}</dd>
          </div>
        </dl>
      </div>

      <footer class="succession-page__control-note">
        <ArtSvgIcon icon="ri:information-line" />
        继任数据仅授权 HR
        管理者；现任任职者不能被提名为同岗位继任人，所有评审与退出动作均保留审计记录。
      </footer>
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
      :search-bar-props="{ span: 6, labelWidth: 72, showExpand: false }"
      :table-props="{
        rowKey: 'id',
        tableLayout: 'fixed',
        emptyText: `暂无${activeTab.label}`,
        emptyDescription: activeTab.emptyDescription
      }"
      :on-success="handleTableSuccess"
      focusable
    />

    <SuccessionDialog ref="dialogRef" @success="handleSaveSuccess" />
  </div>
</template>

<script setup lang="tsx">
  import dayjs from 'dayjs'
  import { ElButton, ElProgress, ElTag } from 'element-plus'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import type {
    ArtTableQueryExpose,
    ArtTableQueryHeaderAction,
    ArtTableQueryProps
  } from '@/components/core/tables/art-table-query/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric,
    type BusinessWorkspaceTag
  } from '@/components/business/business-workspace-header/index.vue'
  import BusinessTableWorkspaceActions from '@/components/business/business-table-workspace-actions/index.vue'
  import { useArtFeedback } from '@/hooks/core/useArtFeedback'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useUserStore } from '@/store/modules/user'
  import { pageInfoHandler } from '@/utils/table/tableUtils'
  import type { ColumnOption, DialogType } from '@/types'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import {
    deleteSuccessionRecord,
    fetchSuccessionOverview,
    fetchSuccessionRecords,
    reviewSuccessionCandidate
  } from '@hr/api'
  import HrEntityNavigation, {
    type HrEntityNavigationItem
  } from '@hr/views/shared/hr-entity-navigation.vue'
  import SuccessionDialog from './modules/succession-dialog.vue'

  defineOptions({ name: 'HrSuccession' })
  type Entity = Api.Hr.SuccessionEntity
  type RecordItem = Api.Hr.SuccessionRecord
  type TableParams = Api.Hr.SuccessionSearchParams &
    Pick<Api.Common.PaginationParams, 'current' | 'size'>
  interface Tab {
    entity: Entity
    label: string
    description: string
    emptyDescription: string
    icon: string
  }
  interface DialogExpose {
    handleOpen: (entity: Entity, row?: RecordItem) => Promise<void>
  }
  type SignalTone = 'primary' | 'success' | 'warning' | 'danger' | 'info'

  const tabs: Tab[] = [
    {
      entity: 'plan',
      label: '关键岗位计划',
      description: '覆盖目标与定期复盘',
      emptyDescription: '先识别关键岗位，并建立继任覆盖目标与复盘周期。',
      icon: 'ri:briefcase-4-line'
    },
    {
      entity: 'candidate',
      label: '继任候选人',
      description: '准备度与人才风险',
      emptyDescription: '从人才盘点中提名候选人，并完成准备度与发展差距评审。',
      icon: 'ri:user-star-line'
    },
    {
      entity: 'action',
      label: '发展行动',
      description: '培养任务与成果',
      emptyDescription: '为继任候选人制定导师、轮岗、学习或挑战性任务。',
      icon: 'ri:route-line'
    }
  ]
  const navigationItems: HrEntityNavigationItem[] = tabs.map((tab) => ({
    value: tab.entity,
    label: tab.label,
    description: tab.description,
    icon: tab.icon
  }))
  const userStore = useUserStore()
  const { getDictMap, isPlatformSuper } = storeToRefs(userStore)
  const { hasAuth } = useAuth()
  const { confirmAction, promptText } = useArtFeedback()
  const activeEntity = ref<Entity>('plan')
  const activeTab = computed(() => tabs.find((tab) => tab.entity === activeEntity.value) ?? tabs[0])
  const tableQueryRef = ref<ArtTableQueryExpose>()
  const dialogRef = ref<DialogExpose>()
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const tableState = reactive<{ searchQuery: Api.Hr.SuccessionSearchParams }>({
    searchQuery: { tenantId: '', status: '', keyword: '' }
  })
  const overview = reactive<Api.Hr.SuccessionOverview>({
    activePlanCount: 0,
    criticalPositionCount: 0,
    readyNowCount: 0,
    uncoveredPlanCount: 0,
    overdueActionCount: 0,
    dueReviewCount: 0
  })
  const tableTotal = ref(0)

  const workspaceTags: BusinessWorkspaceTag[] = [
    { label: '关键岗位覆盖', type: 'primary', effect: 'plain' },
    { label: '人才风险受控', type: 'warning', effect: 'light' },
    { label: '发展行动闭环', type: 'success', effect: 'light' }
  ]
  const workspaceMetrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      label: '执行中计划',
      value: overview.activePlanCount,
      description: `${overview.criticalPositionCount} 个核心关键岗位`,
      icon: 'ri:briefcase-4-line',
      tone: 'primary'
    },
    {
      label: '可立即继任',
      value: overview.readyNowCount,
      description: '已评审的就绪候选人',
      icon: 'ri:verified-badge-line',
      tone: 'success'
    },
    {
      label: '继任未覆盖',
      value: overview.uncoveredPlanCount,
      description: '执行中但无有效候选人',
      icon: 'ri:alarm-warning-line',
      tone: overview.uncoveredPlanCount ? 'warning' : 'info'
    },
    {
      label: '逾期发展行动',
      value: overview.overdueActionCount,
      description: `${overview.dueReviewCount} 个计划 30 天内复盘`,
      icon: 'ri:timer-flash-line',
      tone: overview.overdueActionCount ? 'danger' : 'info'
    }
  ])
  const journeyStages = computed<
    Array<{
      title: string
      description: string
      signal: string
      icon: string
      tone: SignalTone
    }>
  >(() => [
    {
      title: '识别关键岗位',
      description: '关键度 · 空缺风险 · 业务影响',
      signal: `${overview.criticalPositionCount} 个岗位`,
      icon: 'ri:briefcase-4-line',
      tone: overview.criticalPositionCount ? 'primary' : 'info'
    },
    {
      title: '建立继任梯队',
      description: '准备度 · 潜力 · 留任风险',
      signal: overview.uncoveredPlanCount
        ? `${overview.uncoveredPlanCount} 个未覆盖`
        : `${overview.readyNowCount} 人就绪`,
      icon: 'ri:user-star-line',
      tone: overview.uncoveredPlanCount ? 'warning' : overview.readyNowCount ? 'success' : 'info'
    },
    {
      title: '推动发展行动',
      description: '负责人 · 时限 · 成果复盘',
      signal: overview.overdueActionCount ? `${overview.overdueActionCount} 项逾期` : '进度正常',
      icon: 'ri:route-line',
      tone: overview.overdueActionCount ? 'danger' : 'success'
    }
  ])
  const activeAttention = computed<{ label: string; value: number; tone: SignalTone }>(() =>
    activeEntity.value === 'plan'
      ? { label: '待补覆盖', value: overview.uncoveredPlanCount, tone: 'warning' }
      : activeEntity.value === 'candidate'
        ? { label: '立即就绪', value: overview.readyNowCount, tone: 'success' }
        : { label: '逾期行动', value: overview.overdueActionCount, tone: 'danger' }
  )
  const statusDictionary = computed(() =>
    activeEntity.value === 'plan'
      ? 'hrSuccessionPlanStatus'
      : activeEntity.value === 'candidate'
        ? 'hrSuccessionCandidateStatus'
        : 'hrSuccessionActionStatus'
  )
  const searchItems = computed<SearchFormItem[]>(() => {
    const items: SearchFormItem[] = []
    if (isPlatformSuper.value)
      items.push({
        label: '租户',
        key: 'tenantId',
        type: 'select',
        options: tenantOptions.value,
        props: { clearable: true, filterable: true, placeholder: '全部租户' }
      })
    items.push(
      {
        label: '状态',
        key: 'status',
        type: 'select',
        options: getDictMap.value[statusDictionary.value] ?? [],
        props: { clearable: true, placeholder: '全部状态' }
      },
      {
        label: '关键字',
        key: 'keyword',
        type: 'input',
        props: {
          clearable: true,
          placeholder:
            activeEntity.value === 'plan'
              ? '计划、岗位或组织'
              : activeEntity.value === 'candidate'
                ? '候选人、岗位或计划'
                : '行动、候选人或计划'
        }
      }
    )
    return items
  })
  const dictLabel = (code: string, value?: string | null) =>
    getDictMap.value[code]?.find((item) => item.value === value)?.label ?? value ?? '--'
  const riskType = (value?: string | null): 'success' | 'warning' | 'danger' | 'info' =>
    value === 'high' || value === 'critical'
      ? 'danger'
      : value === 'medium' || value === 'development_needed'
        ? 'warning'
        : value === 'low' || value === 'ready_now'
          ? 'success'
          : 'info'
  const statusType = (
    value?: string | null
  ): 'success' | 'warning' | 'danger' | 'info' | 'primary' =>
    ['active', 'completed'].includes(value ?? '')
      ? 'success'
      : ['nominated', 'in_progress'].includes(value ?? '')
        ? 'warning'
        : ['closed', 'withdrawn', 'cancelled'].includes(value ?? '')
          ? 'info'
          : value === 'placed'
            ? 'primary'
            : 'info'

  const actionColumn = (): ColumnOption<RecordItem> => ({
    prop: 'action',
    label: '操作',
    width: 210,
    fixed: 'right',
    formatter: (row) => {
      const status = String('status' in row ? row.status : '')
      return (
        <div class="succession-page__actions">
          {activeEntity.value === 'candidate' &&
          status === 'nominated' &&
          hasAuth('Hr:Succession:Candidate:Review') ? (
            <ElButton
              link
              type="success"
              onClick={() => handleReview(row as Api.Hr.SuccessionCandidate, 'activate')}
            >
              纳入梯队
            </ElButton>
          ) : null}
          {activeEntity.value === 'candidate' &&
          status === 'active' &&
          hasAuth('Hr:Succession:Candidate:Review') ? (
            <ElButton
              link
              type="primary"
              onClick={() => handleReview(row as Api.Hr.SuccessionCandidate, 'place')}
            >
              标记继任
            </ElButton>
          ) : null}
          {activeEntity.value === 'candidate' &&
          ['nominated', 'active'].includes(status) &&
          hasAuth('Hr:Succession:Candidate:Review') ? (
            <ElButton
              link
              type="warning"
              onClick={() => handleReview(row as Api.Hr.SuccessionCandidate, 'withdraw')}
            >
              退出
            </ElButton>
          ) : null}
          <ArtButtonTable
            type="edit"
            permission={permissionFor('Edit')}
            onClick={() => openDialog(activeEntity.value, row)}
          />
          {canDelete(status) ? (
            <ArtButtonTable
              type="delete"
              permission={permissionFor('Delete')}
              onClick={() => handleDelete(row)}
            />
          ) : null}
        </div>
      )
    }
  })

  const columnsFactory = (): ColumnOption<RecordItem>[] => {
    if (activeEntity.value === 'plan')
      return [
        {
          prop: 'planName',
          label: '关键岗位计划',
          minWidth: 220,
          fixed: 'left',
          formatter: (row) => (
            <div class="succession-page__identity">
              <strong>{(row as Api.Hr.SuccessionPlan).planName}</strong>
              <small>{(row as Api.Hr.SuccessionPlan).planCode}</small>
            </div>
          )
        },
        {
          prop: 'position',
          label: '岗位 / 组织',
          minWidth: 190,
          formatter: (row) => (
            <div class="succession-page__identity">
              <strong>{(row as Api.Hr.SuccessionPlan).position?.name ?? '--'}</strong>
              <small>
                {(row as Api.Hr.SuccessionPlan).position?.organizationName ?? '未分配组织'}
              </small>
            </div>
          )
        },
        {
          prop: 'criticality',
          label: '关键度',
          width: 115,
          formatter: (row) => (
            <ElTag type={riskType((row as Api.Hr.SuccessionPlan).criticality)} effect="light" round>
              {dictLabel('hrSuccessionCriticality', (row as Api.Hr.SuccessionPlan).criticality)}
            </ElTag>
          )
        },
        {
          prop: 'risk',
          label: '空缺风险 / 影响',
          minWidth: 165,
          formatter: (row) => (
            <div class="succession-page__tag-stack">
              <ElTag type={riskType((row as Api.Hr.SuccessionPlan).vacancyRisk)} effect="plain">
                {dictLabel('hrSuccessionVacancyRisk', (row as Api.Hr.SuccessionPlan).vacancyRisk)}
              </ElTag>
              <span>
                影响：
                {dictLabel(
                  'hrSuccessionCriticality',
                  (row as Api.Hr.SuccessionPlan).businessImpact
                )}
              </span>
            </div>
          )
        },
        {
          prop: 'coverage',
          label: '继任覆盖',
          minWidth: 180,
          formatter: (row) => {
            const plan = row as Api.Hr.SuccessionPlan
            const percent = Math.min(
              100,
              Math.round(
                ((plan.activeCandidateCount ?? 0) / Math.max(plan.targetSuccessors, 1)) * 100
              )
            )
            return (
              <div class="succession-page__coverage">
                <span>
                  <strong>{plan.activeCandidateCount ?? 0}</strong> / {plan.targetSuccessors} 人 ·
                  可立即 {plan.readyNowCount ?? 0}
                </span>
                <ElProgress
                  percentage={percent}
                  stroke-width={7}
                  show-text={false}
                  status={percent >= 100 ? 'success' : undefined}
                />
              </div>
            )
          }
        },
        {
          prop: 'nextReviewDate',
          label: '下次复盘',
          width: 126,
          formatter: (row) => (
            <span
              class={
                dayjs((row as Api.Hr.SuccessionPlan).nextReviewDate).isBefore(dayjs(), 'day')
                  ? 'succession-page__overdue'
                  : ''
              }
            >
              {(row as Api.Hr.SuccessionPlan).nextReviewDate}
            </span>
          )
        },
        {
          prop: 'status',
          label: '状态',
          width: 105,
          formatter: (row) => (
            <ElTag type={statusType((row as Api.Hr.SuccessionPlan).status)} effect="light">
              {dictLabel('hrSuccessionPlanStatus', (row as Api.Hr.SuccessionPlan).status)}
            </ElTag>
          )
        },
        actionColumn()
      ]
    if (activeEntity.value === 'candidate')
      return [
        {
          prop: 'employee',
          label: '候选人',
          minWidth: 200,
          fixed: 'left',
          formatter: (row) => (
            <div class="succession-page__identity">
              <strong>{(row as Api.Hr.SuccessionCandidate).employee?.name ?? '--'}</strong>
              <small>
                {(row as Api.Hr.SuccessionCandidate).employee?.code} ·{' '}
                {(row as Api.Hr.SuccessionCandidate).employee?.jobTitle ?? '未维护职务'}
              </small>
            </div>
          )
        },
        {
          prop: 'plan',
          label: '目标岗位',
          minWidth: 190,
          formatter: (row) => (
            <div class="succession-page__identity">
              <strong>{(row as Api.Hr.SuccessionCandidate).plan?.positionName ?? '--'}</strong>
              <small>{(row as Api.Hr.SuccessionCandidate).plan?.name}</small>
            </div>
          )
        },
        {
          prop: 'readiness',
          label: '准备度',
          width: 135,
          formatter: (row) => (
            <ElTag
              type={riskType((row as Api.Hr.SuccessionCandidate).readiness)}
              effect="light"
              round
            >
              {dictLabel('hrSuccessionReadiness', (row as Api.Hr.SuccessionCandidate).readiness)}
            </ElTag>
          )
        },
        {
          prop: 'potentialLevel',
          label: '潜力',
          width: 110,
          formatter: (row) =>
            dictLabel('hrSuccessionPotential', (row as Api.Hr.SuccessionCandidate).potentialLevel)
        },
        {
          prop: 'retentionRisk',
          label: '留任风险',
          width: 115,
          formatter: (row) => (
            <ElTag
              type={riskType((row as Api.Hr.SuccessionCandidate).retentionRisk)}
              effect="plain"
            >
              {dictLabel(
                'hrSuccessionRetentionRisk',
                (row as Api.Hr.SuccessionCandidate).retentionRisk
              )}
            </ElTag>
          )
        },
        {
          prop: 'aspirationConfirmed',
          label: '意愿确认',
          width: 100,
          formatter: (row) =>
            (row as Api.Hr.SuccessionCandidate).aspirationConfirmed ? '已确认' : '待确认'
        },
        {
          prop: 'openActionCount',
          label: '开放行动',
          width: 100,
          formatter: (row) => `${(row as Api.Hr.SuccessionCandidate).openActionCount ?? 0} 项`
        },
        {
          prop: 'status',
          label: '状态',
          width: 110,
          formatter: (row) => (
            <ElTag type={statusType((row as Api.Hr.SuccessionCandidate).status)} effect="light">
              {dictLabel('hrSuccessionCandidateStatus', (row as Api.Hr.SuccessionCandidate).status)}
            </ElTag>
          )
        },
        actionColumn()
      ]
    return [
      {
        prop: 'actionTitle',
        label: '发展行动',
        minWidth: 220,
        fixed: 'left',
        formatter: (row) => (
          <div class="succession-page__identity">
            <strong>{(row as Api.Hr.SuccessionDevelopmentAction).actionTitle}</strong>
            <small>
              {dictLabel(
                'hrSuccessionActionType',
                (row as Api.Hr.SuccessionDevelopmentAction).actionType
              )}
            </small>
          </div>
        )
      },
      {
        prop: 'candidate',
        label: '候选人 / 目标岗位',
        minWidth: 210,
        formatter: (row) => (
          <div class="succession-page__identity">
            <strong>
              {(row as Api.Hr.SuccessionDevelopmentAction).candidate?.employeeName ?? '--'}
            </strong>
            <small>
              {(row as Api.Hr.SuccessionDevelopmentAction).candidate?.positionName ?? '--'}
            </small>
          </div>
        )
      },
      {
        prop: 'owner',
        label: '负责人',
        minWidth: 145,
        formatter: (row) => (row as Api.Hr.SuccessionDevelopmentAction).owner?.name ?? '未指定'
      },
      {
        prop: 'period',
        label: '计划周期',
        minWidth: 190,
        formatter: (row) =>
          `${(row as Api.Hr.SuccessionDevelopmentAction).startDate} → ${(row as Api.Hr.SuccessionDevelopmentAction).dueDate}`
      },
      {
        prop: 'dueDate',
        label: '到期信号',
        width: 115,
        formatter: (row) => {
          const action = row as Api.Hr.SuccessionDevelopmentAction
          const overdue =
            ['planned', 'in_progress'].includes(action.status) &&
            dayjs(action.dueDate).isBefore(dayjs(), 'day')
          return (
            <span class={overdue ? 'succession-page__overdue' : ''}>
              {overdue ? '已逾期' : action.dueDate}
            </span>
          )
        }
      },
      {
        prop: 'status',
        label: '状态',
        width: 105,
        formatter: (row) => (
          <ElTag
            type={statusType((row as Api.Hr.SuccessionDevelopmentAction).status)}
            effect="light"
          >
            {dictLabel(
              'hrSuccessionActionStatus',
              (row as Api.Hr.SuccessionDevelopmentAction).status
            )}
          </ElTag>
        )
      },
      actionColumn()
    ]
  }

  const permissionFor = (action: 'Add' | 'Edit' | 'Delete') =>
    `Hr:Succession:${activeEntity.value === 'plan' ? 'Plan' : activeEntity.value === 'candidate' ? 'Candidate' : 'Action'}:${action}`
  const canDelete = (status: string) =>
    activeEntity.value === 'plan'
      ? status === 'draft'
      : activeEntity.value === 'candidate'
        ? status === 'nominated'
        : status === 'planned'
  const headerActions = computed<ArtTableQueryHeaderAction[]>(() => [
    {
      type: 'add',
      label:
        activeEntity.value === 'plan'
          ? '新增继任计划'
          : activeEntity.value === 'candidate'
            ? '提名候选人'
            : '新增发展行动',
      permission: permissionFor('Add'),
      onClick: () => openDialog(activeEntity.value)
    }
  ])
  const fetchTableData = (params: TableParams) => {
    const { from, to } = pageInfoHandler({ current: params.current, size: params.size })
    return fetchSuccessionRecords(activeEntity.value, { ...params, from, to })
  }
  const handleTableSuccess: NonNullable<ArtTableQueryProps['onSuccess']> = (_rows, response) => {
    tableTotal.value = response.total ?? 0
  }
  const refreshOverview = async () => {
    const response = await fetchSuccessionOverview(tableState.searchQuery.tenantId)
    if (response.data) Object.assign(overview, response.data)
  }
  const openDialog = (entity: Entity, row?: RecordItem) =>
    void dialogRef.value?.handleOpen(entity, row)
  const handleSaveSuccess = (type: DialogType) => {
    void (type === 'add'
      ? tableQueryRef.value?.refreshCreate()
      : tableQueryRef.value?.refreshUpdate())
    void refreshOverview()
  }
  const handleDelete = async (row: RecordItem) => {
    if (!row.id) return
    try {
      await confirmAction(`确定删除这条${activeTab.value.label}记录吗？`, '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      })
      await deleteSuccessionRecord(activeEntity.value, row.id)
      await tableQueryRef.value?.refreshRemove()
      await refreshOverview()
    } catch {
      /* 用户取消或记录不满足删除状态时保持列表。 */
    }
  }
  const handleReview = async (
    row: Api.Hr.SuccessionCandidate,
    action: 'activate' | 'withdraw' | 'place'
  ) => {
    if (!row.id) return
    try {
      const comment =
        action === 'withdraw'
          ? await promptText('请输入退出继任池的原因。', '退出候选人', {
              minLength: 2,
              maxLength: 300,
              placeholder: '请输入具体原因',
              type: 'warning'
            })
          : undefined
      if (action !== 'withdraw')
        await confirmAction(
          action === 'activate'
            ? '确认候选人评审完成并纳入正式继任梯队？'
            : '确认该候选人已完成目标岗位继任？',
          action === 'activate' ? '纳入继任梯队' : '标记完成继任',
          { confirmButtonText: '确认', cancelButtonText: '返回', type: 'info' }
        )
      await reviewSuccessionCandidate(row.id, action, comment)
      await tableQueryRef.value?.refreshUpdate()
      await refreshOverview()
    } catch {
      /* 用户取消或服务端状态校验失败。 */
    }
  }
  const handleTabChange = () => {
    Object.assign(tableState.searchQuery, { keyword: '', status: '' })
    tableTotal.value = 0
  }
  onMounted(async () => {
    await Promise.all(
      [
        'hrSuccessionPlanStatus',
        'hrSuccessionCriticality',
        'hrSuccessionVacancyRisk',
        'hrSuccessionReadiness',
        'hrSuccessionPotential',
        'hrSuccessionRetentionRisk',
        'hrSuccessionCandidateStatus',
        'hrSuccessionActionType',
        'hrSuccessionActionStatus'
      ].map((code) => userStore.ensureDictLoaded(code))
    )
    if (isPlatformSuper.value) {
      const response = await fetchGetEnableTenantList()
      tenantOptions.value = (response.data ?? []).map((tenant) => ({
        label: `${tenant.tenantName}（${tenant.tenantCode}）`,
        value: tenant.id!
      }))
    }
    await refreshOverview()
  })
</script>

<style scoped lang="scss">
  .succession-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;

    &__control-deck {
      position: relative;
      padding: 18px;
      overflow: hidden;
      background:
        radial-gradient(
          circle at 96% 8%,
          color-mix(in srgb, var(--theme-color) 9%, transparent),
          transparent 30%
        ),
        var(--art-main-bg-color);
      border: 1px solid color-mix(in srgb, var(--theme-color) 10%, var(--art-card-border));
      border-radius: calc(var(--el-border-radius-base) + 6px);
      box-shadow: 0 10px 30px color-mix(in srgb, var(--art-gray-900) 4%, transparent);
    }

    &__control-heading {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      > div {
        display: flex;
        gap: 11px;
        align-items: center;
        min-width: 0;
      }

      > div > span:last-child {
        display: grid;
        min-width: 0;
      }

      strong {
        font-size: 15px;
        color: var(--art-text-gray-900);
      }

      small {
        margin-top: 3px;
        font-size: 12px;
        color: var(--art-text-gray-600);
      }
    }

    &__section-icon,
    &__journey-icon {
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--theme-color) 13%, transparent);
    }

    &__section-icon {
      width: 38px;
      height: 38px;
      border-radius: 11px;

      :deep(.art-svg-icon) {
        font-size: 19px;
      }
    }

    &__governance-badge {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-color-success-dark-2);
      white-space: nowrap;
      background: var(--el-color-success-light-9);
      border: 1px solid var(--el-color-success-light-7);
      border-radius: 999px;
    }

    &__journey {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr) 30px minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      padding: 14px;
      background: color-mix(in srgb, var(--theme-color) 2.5%, var(--art-main-bg-color));
      border: 1px solid var(--art-card-border);
      border-radius: calc(var(--el-border-radius-base) + 3px);

      article {
        position: relative;
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr);
        gap: 11px;
        align-items: center;
        min-width: 0;
        min-height: 58px;
        padding: 7px 10px 7px 8px;
        background: color-mix(in srgb, var(--art-main-bg-color) 94%, transparent);
        border: 1px solid transparent;
        border-radius: 10px;

        &.is-warning {
          background: color-mix(in srgb, var(--el-color-warning) 6%, var(--art-main-bg-color));
          border-color: color-mix(in srgb, var(--el-color-warning) 18%, transparent);
        }

        &.is-danger {
          background: color-mix(in srgb, var(--el-color-danger) 5%, var(--art-main-bg-color));
          border-color: color-mix(in srgb, var(--el-color-danger) 16%, transparent);
        }

        &.is-success {
          background: color-mix(in srgb, var(--el-color-success) 5%, var(--art-main-bg-color));
          border-color: color-mix(in srgb, var(--el-color-success) 16%, transparent);
        }
      }

      article > div {
        display: grid;
        min-width: 0;
      }

      strong,
      small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      strong {
        font-size: 13px;
        color: var(--art-text-gray-900);
      }

      small {
        margin-top: 4px;
        font-size: 11px;
        color: var(--art-text-gray-600);
      }
    }

    &__journey-title {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      min-width: 0;

      em {
        flex: 0 0 auto;
        padding: 2px 7px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 10px;
        font-style: normal;
        font-weight: 650;
        color: var(--theme-color);
        white-space: nowrap;
        background: color-mix(in srgb, var(--theme-color) 9%, var(--art-main-bg-color));
        border-radius: 999px;
      }
    }

    &__journey-index {
      position: absolute;
      top: -7px;
      left: 29px;
      z-index: 1;
      font-size: 9px;
      font-weight: 800;
      color: var(--theme-color);
      letter-spacing: 0.05em;
    }

    &__journey-icon {
      width: 38px;
      height: 38px;
      border-radius: 50%;

      :deep(.art-svg-icon) {
        font-size: 18px;
      }
    }

    &__connector {
      display: grid;
      place-items: center;
      color: color-mix(in srgb, var(--theme-color) 55%, var(--art-text-gray-500));

      :deep(.art-svg-icon) {
        font-size: 18px;
      }
    }

    :deep(.hr-entity-navigation) {
      margin-top: 12px;
    }

    &__view-context {
      display: flex;
      gap: 18px;
      align-items: center;
      justify-content: space-between;
      min-width: 0;
      padding: 11px 13px;
      margin-top: 10px;
      background: color-mix(in srgb, var(--theme-color) 3.5%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 12%, var(--art-card-border));
      border-radius: 10px;

      dl {
        display: flex;
        flex: 0 0 auto;
        gap: 8px;
        margin: 0;
      }

      dl > div {
        display: grid;
        grid-template-columns: auto auto;
        gap: 7px;
        align-items: baseline;
        min-width: 104px;
        padding: 7px 10px;
        background: var(--art-main-bg-color);
        border: 1px solid var(--art-card-border);
        border-radius: 8px;

        &.is-warning dd {
          color: var(--el-color-warning-dark-2);
        }

        &.is-success dd {
          color: var(--el-color-success-dark-2);
        }

        &.is-danger dd {
          color: var(--el-color-danger);
        }
      }

      dt {
        font-size: 11px;
        color: var(--art-text-gray-600);
      }

      dd {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: var(--art-text-gray-900);
      }
    }

    &__view-intro {
      display: flex;
      gap: 10px;
      align-items: center;
      min-width: 0;

      > span:last-child {
        display: flex;
        gap: 8px;
        align-items: baseline;
        min-width: 0;
      }

      small {
        flex: 0 0 auto;
        font-size: 10px;
        font-weight: 700;
        color: var(--theme-color);
        letter-spacing: 0.06em;
      }

      strong {
        flex: 0 0 auto;
        font-size: 13px;
        color: var(--art-text-gray-900);
      }

      em {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        font-style: normal;
        color: var(--art-text-gray-600);
        white-space: nowrap;
      }
    }

    &__view-icon {
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      width: 32px;
      height: 32px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, transparent);
      border-radius: 9px;

      :deep(.art-svg-icon) {
        font-size: 16px;
      }
    }

    &__control-note {
      display: flex;
      gap: 7px;
      align-items: flex-start;
      padding-top: 11px;
      margin-top: 12px;
      font-size: 11px;
      line-height: 1.55;
      color: var(--art-text-gray-600);
      border-top: 1px dashed var(--art-card-border);

      :deep(.art-svg-icon) {
        flex: 0 0 auto;
        margin-top: 1px;
        font-size: 14px;
        color: var(--theme-color);
      }
    }

    &__identity {
      display: grid;
      min-width: 0;

      strong,
      small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      small {
        margin-top: 4px;
        color: var(--art-text-gray-600);
      }
    }

    &__tag-stack {
      display: flex;
      gap: 7px;
      align-items: center;

      span {
        font-size: 12px;
        color: var(--art-text-gray-600);
      }
    }

    &__coverage {
      display: grid;
      gap: 7px;
      min-width: 150px;

      span {
        font-size: 12px;
        color: var(--art-text-gray-600);
      }

      strong {
        color: var(--art-text-gray-900);
      }
    }

    &__actions {
      display: flex;
      gap: 2px;
      align-items: center;
      white-space: nowrap;
    }

    &__overdue {
      font-weight: 600;
      color: var(--el-color-danger);
    }
  }

  @media only screen and (width <= 900px) {
    .succession-page {
      &__control-heading {
        align-items: flex-start;
      }

      &__journey {
        grid-template-columns: 1fr;

        .succession-page__connector {
          display: none;
        }

        article:not(:first-child) {
          padding-top: 10px;
          border-top: 1px solid var(--art-card-border);
        }
      }

      &__view-context {
        align-items: flex-start;
      }

      &__view-intro > span:last-child {
        display: grid;
        gap: 2px;
      }
    }
  }

  @media only screen and (width <= 767px) {
    .succession-page {
      &__control-deck {
        padding: 14px;
      }

      &__control-heading {
        flex-direction: column;
      }

      &__view-context {
        flex-direction: column;
        align-items: stretch;

        dl {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        dl > div {
          min-width: 0;
        }
      }
    }
  }
</style>
