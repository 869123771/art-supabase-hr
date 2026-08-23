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

    <section class="talent-inventory-page__workspace art-card-xs">
      <header class="talent-inventory-page__toolbar">
        <div>
          <ArtSectionTitle :show-line="false">盘点矩阵</ArtSectionTitle>
          <p>最近绩效周期与当前岗位胜任力，更新时间 {{ generatedAt }}</p>
        </div>
        <ElRadioGroup v-model="activeScope" size="small">
          <ElRadioButton value="all">全部</ElRadioButton>
          <ElRadioButton value="gap">存在缺口</ElRadioButton>
          <ElRadioButton value="high">高绩效</ElRadioButton>
          <ElRadioButton value="unassessed">待评估</ElRadioButton>
        </ElRadioGroup>
      </header>

      <ElAlert
        v-if="overview?.truncated"
        class="talent-inventory-page__capacity-alert"
        type="warning"
        show-icon
        :closable="false"
        :title="`员工数量较大，当前展示 ${overview.returnedRecords} / ${overview.totalRecords} 人`"
        description="本页统计基于当前返回的数据集；请结合组织范围进一步分析。"
      />
      <ElAlert v-if="errorMessage" type="error" show-icon :closable="false" :title="errorMessage">
        <template #default>
          <ElButton type="primary" link @click="loadInventory">重新加载</ElButton>
        </template>
      </ElAlert>
      <ElSkeleton v-else-if="loading && !overview" :rows="7" animated />
      <ElEmpty v-else-if="!filteredRecords.length" description="当前范围暂无人才盘点记录" />

      <ElScrollbar v-else class="talent-inventory-page__table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">员工</th>
              <th scope="col">组织 / 岗位</th>
              <th scope="col">最近绩效</th>
              <th scope="col">岗位准备度</th>
              <th scope="col">能力缺口</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredRecords" :key="record.id">
              <td>
                <BusinessRecordLink
                  :label="record.employeeName"
                  :description="record.employeeNo"
                  :title="`查看员工 ${record.employeeName} 档案`"
                  :to="canViewEmployee ? `/hr/personnel/employee-detail/${record.id}` : undefined"
                  compact
                />
              </td>
              <td>
                <span>{{ record.organizationName || '未分配组织' }}</span>
                <small>{{ record.positionName || record.jobTitle || '未分配岗位' }}</small>
              </td>
              <td>
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
              </td>
              <td class="talent-inventory-page__readiness">
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
              </td>
              <td>
                <ElTag
                  :type="record.competencyGapCount ? 'warning' : 'success'"
                  effect="plain"
                  round
                >
                  {{
                    record.competencyGapCount ? `${record.competencyGapCount} 项待提升` : '已达标'
                  }}
                </ElTag>
                <small>{{ record.competencyMet }} / {{ record.competencyTotal }} 项达标</small>
              </td>
            </tr>
          </tbody>
        </table>
      </ElScrollbar>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import BusinessRecordLink from '@/components/business/business-record-link/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric
  } from '@/components/business/business-workspace-header/index.vue'
  import ArtSectionTitle from '@/components/core/forms/art-section-title/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { formatWithDayjs } from '@/utils/time'
  import { fetchTalentInventory } from '@hr/api'

  defineOptions({ name: 'HrTalentInventory' })

  type Scope = 'all' | 'gap' | 'high' | 'unassessed'

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const errorMessage = ref('')
  const overview = ref<Api.Hr.TalentInventoryOverview | null>(null)
  const activeScope = ref<Scope>('all')
  const canViewEmployee = computed(() => hasAuth('Hr:Employee:View'))

  const generatedAt = computed(() =>
    overview.value ? formatWithDayjs(overview.value.generatedAt) : '--'
  )
  const filteredRecords = computed(() =>
    (overview.value?.records ?? []).filter((record) => {
      if (activeScope.value === 'gap') return record.competencyGapCount > 0
      if (activeScope.value === 'high') return ['S', 'A'].includes(record.performanceLevel ?? '')
      if (activeScope.value === 'unassessed') return record.competencyTotal === 0
      return true
    })
  )
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
      padding: 18px;
    }

    &__toolbar {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    &__toolbar p {
      margin: 5px 0 0;
      font-size: 12px;
      color: var(--art-gray-500);
    }

    &__table-wrap {
      min-width: 0;
    }

    &__capacity-alert {
      margin-bottom: 16px;
    }

    table {
      width: 100%;
      min-width: 900px;
      border-spacing: 0;
      border-collapse: separate;
    }

    th,
    td {
      padding: 13px 14px;
      text-align: left;
      border-bottom: 1px solid var(--art-border-color);
    }

    th {
      font-size: 12px;
      font-weight: 600;
      color: var(--art-gray-500);
      background: var(--art-main-bg-color);
    }

    td {
      color: var(--art-text-gray-800);
    }

    td strong,
    td small {
      display: block;
    }

    td small {
      margin-top: 5px;
      color: var(--art-gray-500);
    }

    &__readiness {
      min-width: 180px;
    }

    &__readiness strong {
      margin-bottom: 7px;
    }

    &__muted {
      font-size: 13px;
      color: var(--art-gray-500);
    }
  }

  @media only screen and (width <= 767px) {
    .talent-inventory-page {
      &__toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      &__toolbar :deep(.el-radio-group) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }
</style>
