<template>
  <div
    v-auth="'Hr:TalentInventory:View'"
    class="talent-inventory-page business-workspace-page art-full-height"
  >
    <BusinessWorkspaceHeader
      eyebrow="TALENT INVENTORY"
      title="人才盘点"
      description="把最近绩效结果与岗位胜任力要求放在同一视图，识别高绩效人才、能力缺口与尚未完成评估的员工。"
      icon="ri:team-line"
      :tags="[
        { label: '绩效 × 胜任力', type: 'primary' },
        { label: '岗位准备度', type: 'success' },
        { label: '租户安全视图', type: 'info' }
      ]"
      :metrics="metrics"
      refreshable
      refresh-label="刷新人才盘点"
      :refresh-loading="loading"
      @metric-click="handleMetricClick"
      @refresh="loadInventory"
    />

    <ArtSectionCard
      class="talent-inventory-page__workspace"
      title="人才决策清单"
      :subtitle="`聚焦高绩效、有能力缺口或尚未完成评估的员工，更新时间 ${generatedAt}`"
      :loading="loading && !overview"
      :error="errorMessage"
      :empty="Boolean(overview) && !filteredRecords.length"
      empty-title="暂无盘点员工"
      empty-description="当前筛选范围暂无匹配员工，可调整关键词或盘点范围。"
      :min-height="360"
      @retry="loadInventory"
    >
      <template #actions>
        <div class="talent-inventory-page__filters">
          <ElInput
            v-model="keyword"
            clearable
            placeholder="员工、工号、组织或岗位"
            aria-label="检索人才盘点员工"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" /></template>
          </ElInput>
          <ElRadioGroup v-model="activeScope" size="small" aria-label="人才盘点范围">
            <ElRadioButton value="all">全部</ElRadioButton>
            <ElRadioButton value="gap">存在缺口</ElRadioButton>
            <ElRadioButton value="high">高绩效</ElRadioButton>
            <ElRadioButton value="unassessed">待评估</ElRadioButton>
          </ElRadioGroup>
        </div>
      </template>

      <div class="talent-inventory-page__decision-strip" aria-label="人才盘点决策摘要">
        <div>
          <span class="talent-inventory-page__signal-icon is-primary">
            <ArtSvgIcon icon="ri:seedling-line" />
          </span>
          <span
            ><strong>{{ decisionSummary.development }}</strong
            ><small>重点培养</small></span
          >
          <p>高绩效且仍有能力提升空间</p>
        </div>
        <div>
          <span class="talent-inventory-page__signal-icon is-warning">
            <ArtSvgIcon icon="ri:questionnaire-line" />
          </span>
          <span
            ><strong>{{ decisionSummary.performancePending }}</strong
            ><small>绩效待确认</small></span
          >
          <p>缺少最近绩效结果，暂不宜做人才判断</p>
        </div>
        <div>
          <span class="talent-inventory-page__signal-icon is-info">
            <ArtSvgIcon icon="ri:node-tree" />
          </span>
          <span
            ><strong>{{ decisionSummary.unmodelled }}</strong
            ><small>岗位未建模</small></span
          >
          <p>应先配置岗位能力要求再开展评估</p>
        </div>
      </div>

      <ElAlert
        v-if="overview?.truncated"
        class="talent-inventory-page__capacity-alert"
        type="warning"
        show-icon
        :closable="false"
        :title="`员工数量较大，当前展示 ${overview.returnedRecords} / ${overview.totalRecords} 人`"
        description="本页统计基于当前返回的数据集；请结合组织范围进一步分析。"
      />
      <ArtTable
        :data="filteredRecords"
        :columns="tableColumns"
        :loading="loading"
        :pagination="false"
        :show-table-header="false"
        row-key="id"
        table-layout="fixed"
        empty-height="220px"
        empty-text="暂无盘点员工"
        empty-description="当前筛选范围暂无匹配员工，可调整关键词或盘点范围。"
      >
        <template #employeeIdentity="{ row: record }">
          <HrEmployeeIdentityCell
            :employee-name="record.employeeName"
            :employee-no="record.employeeNo"
            :to="canViewEmployee ? `/hr/personnel/employee-detail/${record.id}` : undefined"
          />
        </template>
        <template #performance="{ row: record }">
          <div class="talent-inventory-page__stacked-cell">
            <ElTag
              v-if="record.performanceLevel"
              :type="performanceType(record.performanceLevel)"
              effect="light"
              round
            >
              {{ record.performanceLevel
              }}{{ record.totalScore != null ? ` · ${record.totalScore}` : '' }}
            </ElTag>
            <span v-else class="talent-inventory-page__muted">待绩效确认</span>
            <small>{{ record.cycleName || '暂无绩效周期' }}</small>
          </div>
        </template>
        <template #readiness="{ row: record }">
          <div class="talent-inventory-page__readiness">
            <template v-if="record.readinessRate != null">
              <strong>{{ record.readinessRate }}%</strong>
              <ElProgress
                :percentage="record.readinessRate"
                :stroke-width="7"
                :show-text="false"
                :status="record.readinessRate >= 80 ? 'success' : undefined"
              />
            </template>
            <span v-else class="talent-inventory-page__muted">岗位尚未配置能力模型</span>
          </div>
        </template>
        <template #competencyGap="{ row: record }">
          <div class="talent-inventory-page__stacked-cell">
            <ElTag
              :type="
                record.competencyTotal
                  ? record.competencyGapCount
                    ? 'warning'
                    : 'success'
                  : 'info'
              "
              effect="plain"
              round
            >
              {{
                record.competencyTotal
                  ? record.competencyGapCount
                    ? `${record.competencyGapCount} 项待提升`
                    : '已达标'
                  : '待建模'
              }}
            </ElTag>
            <small>
              {{
                record.competencyTotal
                  ? `${record.competencyMet} / ${record.competencyTotal} 项达标`
                  : '尚无岗位能力评估口径'
              }}
            </small>
          </div>
        </template>
        <template #talentSignal="{ row: record }">
          <div class="talent-inventory-page__stacked-cell">
            <span class="talent-inventory-page__signal" :class="talentSignal(record).tone">
              <ArtSvgIcon :icon="talentSignal(record).icon" />
              {{ talentSignal(record).label }}
            </span>
            <small>{{ talentSignal(record).description }}</small>
          </div>
        </template>
      </ArtTable>
    </ArtSectionCard>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { ColumnOption } from '@/types'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric
  } from '@/components/business/business-workspace-header/index.vue'
  import ArtSectionCard from '@/components/core/surfaces/art-section-card/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { formatWithDayjs } from '@/utils/time'
  import { fetchTalentInventory } from '@hr/api'
  import HrEmployeeIdentityCell from '@hr/views/shared/hr-employee-identity-cell.vue'

  defineOptions({ name: 'HrTalentInventory' })

  type Scope = 'all' | 'gap' | 'high' | 'unassessed'
  type TalentRecord = Api.Hr.TalentInventoryRecord

  interface TalentSignal {
    label: string
    description: string
    icon: string
    tone: 'is-primary' | 'is-success' | 'is-warning' | 'is-info'
  }

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const errorMessage = ref('')
  const overview = ref<Api.Hr.TalentInventoryOverview | null>(null)
  const activeScope = ref<Scope>('all')
  const keyword = ref('')
  const canViewEmployee = computed(() => hasAuth('Hr:Employee:View'))
  const tableColumns: ColumnOption<TalentRecord>[] = [
    {
      prop: 'employeeIdentity',
      label: '员工身份',
      minWidth: 210,
      fixed: 'left',
      useSlot: true
    },
    {
      prop: 'organizationName',
      label: '所属组织',
      minWidth: 160,
      showOverflowTooltip: true,
      formatter: (record) => record.organizationName || '未分配组织'
    },
    {
      prop: 'positionName',
      label: '工作岗位',
      minWidth: 145,
      showOverflowTooltip: true,
      formatter: (record) => record.positionName || record.jobTitle || '未分配岗位'
    },
    { prop: 'performance', label: '最近绩效', minWidth: 155, useSlot: true },
    { prop: 'readiness', label: '岗位准备度', minWidth: 190, useSlot: true },
    { prop: 'competencyGap', label: '能力缺口', minWidth: 175, useSlot: true },
    { prop: 'talentSignal', label: '盘点信号', minWidth: 230, useSlot: true }
  ]

  const generatedAt = computed(() =>
    overview.value ? formatWithDayjs(overview.value.generatedAt) : '--'
  )
  const filteredRecords = computed(() => {
    const normalizedKeyword = keyword.value.trim().toLocaleLowerCase()
    return (overview.value?.records ?? []).filter((record) => {
      const scopeMatched =
        activeScope.value === 'all' ||
        (activeScope.value === 'gap' && record.competencyGapCount > 0) ||
        (activeScope.value === 'high' && ['S', 'A'].includes(record.performanceLevel ?? '')) ||
        (activeScope.value === 'unassessed' && record.competencyTotal === 0)
      if (!scopeMatched || !normalizedKeyword) return scopeMatched
      return [
        record.employeeName,
        record.employeeNo,
        record.organizationName,
        record.positionName,
        record.jobTitle
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalizedKeyword))
    })
  })
  const decisionSummary = computed(() => {
    const records = overview.value?.records ?? []
    return {
      development: records.filter(
        (record) =>
          ['S', 'A'].includes(record.performanceLevel ?? '') && record.competencyGapCount > 0
      ).length,
      performancePending: records.filter((record) => !record.performanceLevel).length,
      unmodelled: records.filter((record) => record.competencyTotal === 0).length
    }
  })
  const metrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      key: 'all',
      label: '在盘员工',
      value: overview.value?.employeeCount ?? 0,
      description: `${overview.value?.assessedCount ?? 0} 人已完成能力评估`,
      icon: 'ri:user-search-line',
      tone: 'primary',
      interactive: true,
      selected: activeScope.value === 'all',
      loading: loading.value
    },
    {
      key: 'high',
      label: '高绩效人才',
      value: overview.value?.highPerformerCount ?? 0,
      description: '最近绩效为 S / A',
      icon: 'ri:award-line',
      tone: 'success',
      interactive: true,
      selected: activeScope.value === 'high',
      loading: loading.value
    },
    {
      key: 'gap',
      label: '存在能力缺口',
      value: overview.value?.gapEmployeeCount ?? 0,
      description: '至少一项低于岗位要求',
      icon: 'ri:gap-line',
      tone: 'warning',
      interactive: true,
      selected: activeScope.value === 'gap',
      loading: loading.value
    },
    {
      key: 'readiness',
      label: '平均准备度',
      value:
        overview.value?.averageReadinessRate == null
          ? '--'
          : `${overview.value.averageReadinessRate}%`,
      description: '已配置岗位能力模型',
      icon: 'ri:dashboard-3-line',
      tone: 'info',
      loading: loading.value
    }
  ])

  function performanceType(level: string): 'success' | 'primary' | 'warning' | 'danger' | 'info' {
    if (level === 'S') return 'success'
    if (level === 'A') return 'primary'
    if (level === 'C') return 'warning'
    if (level === 'D') return 'danger'
    return 'info'
  }
  function talentSignal(record: TalentRecord): TalentSignal {
    if (['S', 'A'].includes(record.performanceLevel ?? '') && record.competencyGapCount > 0) {
      return {
        label: '重点培养',
        description: '高绩效人才，建议制定定向发展计划',
        icon: 'ri:seedling-line',
        tone: 'is-primary'
      }
    }
    if (!record.performanceLevel) {
      return {
        label: '补齐绩效',
        description: '确认绩效结果后再进入盘点决策',
        icon: 'ri:questionnaire-line',
        tone: 'is-warning'
      }
    }
    if (!record.competencyTotal) {
      return {
        label: '岗位建模',
        description: '岗位能力标准尚未配置',
        icon: 'ri:node-tree',
        tone: 'is-info'
      }
    }
    if (!record.competencyGapCount) {
      return {
        label: '稳定胜任',
        description: '当前能力已达到岗位要求',
        icon: 'ri:shield-check-line',
        tone: 'is-success'
      }
    }
    return {
      label: '能力提升',
      description: '存在未达岗位要求的能力项',
      icon: 'ri:line-chart-line',
      tone: 'is-warning'
    }
  }
  function handleMetricClick(metric: BusinessWorkspaceMetric): void {
    if (['all', 'gap', 'high'].includes(metric.key ?? '')) activeScope.value = metric.key as Scope
  }
  async function loadInventory(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    try {
      overview.value = await fetchTalentInventory()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '人才盘点数据加载失败'
      ElMessage.error(errorMessage.value)
    } finally {
      loading.value = false
    }
  }
  onMounted(() => void loadInventory())
</script>

<style scoped lang="scss">
  .talent-inventory-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;

    &__workspace {
      min-width: 0;
    }

    &__toolbar {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      > div:first-child {
        min-width: 240px;
      }
    }

    &__toolbar p {
      margin: 5px 0 0;
      font-size: 12px;
      color: var(--art-gray-600);
    }

    &__filters {
      display: flex;
      gap: 10px;
      align-items: center;
      min-width: 0;

      .el-input {
        width: 240px;
      }
    }

    &__decision-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-bottom: 16px;
      background: var(--art-gray-100);
      border-radius: var(--el-border-radius-base);

      > div {
        display: grid;
        grid-template-columns: 36px auto minmax(120px, 1fr);
        gap: 10px;
        align-items: center;
        min-width: 0;
        padding: 12px 14px;

        + div {
          border-left: 1px solid var(--art-border-color);
        }

        > span:nth-child(2) {
          display: flex;
          flex-direction: column;

          strong {
            font-size: 18px;
            font-variant-numeric: tabular-nums;
            line-height: 1.1;
            color: var(--art-gray-900);
          }

          small {
            margin-top: 3px;
            font-size: 11px;
            color: var(--art-gray-600);
          }
        }

        > p {
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12px;
          color: var(--art-gray-600);
          white-space: nowrap;
        }
      }
    }

    &__signal-icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: var(--el-border-radius-base);

      svg {
        width: 18px;
        height: 18px;
      }
    }

    &__capacity-alert {
      margin-bottom: 16px;
    }

    &__stacked-cell {
      display: grid;
      gap: 5px;
      align-items: start;
      min-width: 0;
    }

    &__stacked-cell small {
      display: block;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--art-gray-600);
      white-space: nowrap;
    }

    &__readiness {
      min-width: 180px;
    }

    &__readiness strong {
      display: block;
      margin-bottom: 7px;
    }

    &__muted {
      font-size: 13px;
      color: var(--art-gray-600);
    }

    &__signal {
      display: inline-flex;
      gap: 5px;
      align-items: center;
      min-height: 26px;
      padding-inline: 9px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 999px;

      svg {
        width: 14px;
        height: 14px;
      }
    }

    .is-primary {
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, transparent);
    }

    .is-success {
      color: var(--el-color-success-dark-2);
      background: var(--el-color-success-light-9);
    }

    .is-warning {
      color: var(--el-color-warning-dark-2);
      background: var(--el-color-warning-light-9);
    }

    .is-info {
      color: var(--art-gray-700);
      background: var(--art-gray-200);
    }
  }

  @media only screen and (width <= 1180px) {
    .talent-inventory-page {
      &__toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      &__filters {
        justify-content: space-between;
      }

      &__decision-strip {
        > div {
          grid-template-columns: 36px 1fr;

          > p {
            display: none;
          }
        }
      }
    }
  }

  @media only screen and (width <= 767px) {
    .talent-inventory-page {
      &__filters {
        flex-direction: column;
        align-items: stretch;

        .el-input {
          width: 100%;
        }
      }

      &__filters :deep(.el-radio-group) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      &__decision-strip {
        grid-template-columns: 1fr;

        > div + div {
          border-top: 1px solid var(--art-border-color);
          border-left: 0;
        }
      }
    }
  }
</style>
