<template>
  <div
    v-auth="'Hr:PeopleAnalytics:View'"
    class="people-analytics-page business-workspace-page art-full-height"
  >
    <BusinessWorkspaceHeader
      eyebrow="PEOPLE ANALYTICS"
      title="人力分析"
      description="以可信任职与员工主数据观察人员存量、流动和组织结构，支持周期性人力盘点与管理决策。"
      icon="ri:line-chart-line"
      :tags="[
        { label: '聚合分析', type: 'primary' },
        { label: `小于 ${privacyThreshold} 人自动保护`, type: 'success' },
        { label: '不返回个人明细', type: 'info' }
      ]"
      :metrics="headerMetrics"
      refreshable
      refresh-label="刷新人力分析"
      :refresh-loading="loading"
      @refresh="loadOverview"
    />

    <ArtSectionCard class="people-analytics-page__control" preserve-content-structure>
      <div class="people-analytics-page__control-copy">
        <span>分析口径</span>
        <strong>{{ periodCaption }}</strong>
        <small>期末人数按生效任职计算，流入流出按员工入离职日期计算</small>
      </div>
      <div class="people-analytics-page__filters" aria-label="人力分析筛选条件">
        <label>
          <span>观察周期</span>
          <ElSelect v-model="periodMonths" aria-label="观察周期" @change="loadOverview">
            <ElOption
              v-for="option in periodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </label>
        <label>
          <span>统计截止日</span>
          <ElDatePicker
            v-model="asOfDate"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            aria-label="统计截止日"
            :clearable="false"
            :disabled-date="disableFutureDate"
            @change="loadOverview"
          />
        </label>
      </div>
    </ArtSectionCard>

    <ElAlert
      v-if="errorMessage"
      class="people-analytics-page__alert"
      type="error"
      show-icon
      :closable="false"
      title="人力分析暂时无法加载"
    >
      <template #default>
        <span>{{ errorMessage }}</span>
        <ElButton type="primary" link @click="loadOverview">重新加载</ElButton>
      </template>
    </ElAlert>

    <template v-if="loading && !analytics">
      <ArtSectionCard class="people-analytics-page__skeleton" preserve-content-structure>
        <ElSkeleton :rows="8" animated />
      </ArtSectionCard>
    </template>

    <ArtSectionCard
      v-else-if="isEmpty"
      title="尚无可分析的人力存量"
      subtitle="员工建立生效任职后，系统会自动形成趋势、结构与数据质量分析。"
      empty
      empty-title="当前截止日没有生效任职"
      empty-description="请检查员工入职与主任职的生效日期，或调整统计截止日。"
      :empty-visual-size="104"
      :min-height="320"
    />

    <template v-else-if="analytics">
      <ArtSectionCard class="people-analytics-page__flow" preserve-content-structure>
        <template #header>
          <header class="people-analytics-page__section-heading">
            <div>
              <ArtSectionTitle :show-line="false">人员存量对账</ArtSectionTitle>
              <p>把期初存量、入离职流动与任职口径差异连接到期末人数</p>
            </div>
            <ElTag type="info" effect="plain" round>{{ periodCaption }}</ElTag>
          </header>
        </template>

        <div class="people-analytics-page__bridge" aria-label="人员存量变化对账">
          <template v-for="(item, index) in flowBridge" :key="item.key">
            <article :class="['people-analytics-page__bridge-node', `is-${item.tone}`]">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.description }}</small>
            </article>
            <span
              v-if="index < flowBridge.length - 1"
              class="people-analytics-page__bridge-connector"
              aria-hidden="true"
            >
              <ArtSvgIcon icon="ri:arrow-right-line" />
            </span>
          </template>
        </div>

        <div class="people-analytics-page__formula">
          <ArtSvgIcon icon="ri:information-line" />
          <span>
            “其他净变化”用于对账缺少入离职日期、历史任职切换等差异，不会被隐藏在入职或离职指标中。
          </span>
        </div>
      </ArtSectionCard>

      <div class="people-analytics-page__primary-grid">
        <ArtSectionCard
          class="people-analytics-page__trend-card"
          title="人员趋势"
          subtitle="月末生效人数与期间入离职流量"
          preserve-content-structure
        >
          <template #actions>
            <div class="people-analytics-page__legend" aria-label="图例">
              <span class="is-headcount">人数</span>
              <span class="is-hire">入职</span>
              <span class="is-exit">离职</span>
            </div>
          </template>
          <div class="people-analytics-page__trend-chart">
            <ArtLineChart
              height="100%"
              :data="trendSeries"
              :x-axis-data="trendLabels"
              :colors="['#5b6cf9', '#27b88d', '#ec6f76']"
              :show-area-color="true"
              :show-axis-line="false"
              :show-legend="false"
            />
          </div>
        </ArtSectionCard>

        <ArtSectionCard
          class="people-analytics-page__composition-card"
          title="用工结构"
          subtitle="低于隐私阈值的类别合并展示"
          preserve-content-structure
        >
          <div class="people-analytics-page__composition">
            <div class="people-analytics-page__composition-chart">
              <ArtRingChart
                height="100%"
                :data="employmentChartData"
                :colors="['#5b6cf9', '#27b88d', '#f2b35c', '#7d8ba6', '#b488e8']"
                :center-text="`${summary.endingHeadcount} 人`"
              />
            </div>
            <ul class="people-analytics-page__composition-list">
              <li v-for="item in employmentRows" :key="item.key">
                <span>{{ item.label }}</span>
                <strong>{{ item.headcount }} 人</strong>
                <small>{{ formatPercent(item.share) }}</small>
              </li>
            </ul>
          </div>
        </ArtSectionCard>
      </div>

      <div class="people-analytics-page__distribution-grid">
        <ArtSectionCard
          class="people-analytics-page__distribution-card"
          title="组织分布"
          :subtitle="`组织样本少于 ${privacyThreshold} 人时合并为受保护组织`"
          preserve-content-structure
        >
          <div class="people-analytics-page__bar-chart">
            <ArtHBarChart
              height="100%"
              :data="organizationValues"
              :x-axis-data="organizationLabels"
              :colors="['#5b6cf9']"
              :show-axis-line="false"
            />
          </div>
          <p v-if="hasProtectedOrganization" class="people-analytics-page__privacy-note">
            <ArtSvgIcon icon="ri:shield-check-line" />
            已合并低于 {{ privacyThreshold }} 人的组织，避免通过小样本反推个人。
          </p>
        </ArtSectionCard>

        <ArtSectionCard
          class="people-analytics-page__distribution-card"
          title="任期结构"
          subtitle="按统计截止日与已维护入职日期计算"
          preserve-content-structure
        >
          <div class="people-analytics-page__bar-chart">
            <ArtBarChart
              height="100%"
              :data="tenureValues"
              :x-axis-data="tenureLabels"
              :colors="['#27b88d']"
              :show-axis-line="false"
              :bar-width="22"
              :border-radius="6"
            />
          </div>
        </ArtSectionCard>
      </div>

      <div class="people-analytics-page__governance-grid">
        <ArtSectionCard
          class="people-analytics-page__quality-card"
          title="数据质量"
          subtitle="分析可信度取决于关键字段维护完整度"
          preserve-content-structure
        >
          <div class="people-analytics-page__quality-list">
            <article v-for="item in analytics.dataQuality" :key="item.key">
              <div>
                <span>{{ item.label }}</span>
                <small>{{ item.completeCount }} / {{ item.totalCount }} 人已维护</small>
              </div>
              <ElProgress
                :percentage="item.rate"
                :stroke-width="8"
                :show-text="false"
                :color="qualityColor(item.rate)"
              />
              <strong>{{ formatPercent(item.rate) }}</strong>
            </article>
          </div>
        </ArtSectionCard>

        <ArtSectionCard
          class="people-analytics-page__insight-card"
          title="管理解读"
          subtitle="从当前周期自动提炼需要关注的信号"
          preserve-content-structure
        >
          <ol class="people-analytics-page__insights">
            <li v-for="(insight, index) in managementInsights" :key="insight.title">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <strong>{{ insight.title }}</strong>
                <p>{{ insight.description }}</p>
              </div>
            </li>
          </ol>
        </ArtSectionCard>
      </div>

      <footer class="people-analytics-page__footnote">
        <ArtSvgIcon icon="ri:lock-2-line" />
        <span>
          本页仅返回租户内聚合结果；组织与用工类别的小样本会合并保护，接口不包含员工姓名、工号或任职标识。
        </span>
        <time>数据生成于 {{ generatedAt }}</time>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import { ElMessage } from 'element-plus'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric
  } from '@/components/business/business-workspace-header/index.vue'
  import ArtSectionCard from '@/components/core/surfaces/art-section-card/index.vue'
  import ArtSectionTitle from '@/components/core/surfaces/art-section-title/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtLineChart from '@/components/core/charts/art-line-chart/index.vue'
  import ArtRingChart from '@/components/core/charts/art-ring-chart/index.vue'
  import ArtHBarChart from '@/components/core/charts/art-h-bar-chart/index.vue'
  import ArtBarChart from '@/components/core/charts/art-bar-chart/index.vue'
  import { fetchPeopleAnalyticsOverview } from '@hr/api'

  defineOptions({ name: 'HrPeopleAnalytics' })

  const periodOptions = [
    { label: '近 6 个月', value: 6 },
    { label: '近 12 个月', value: 12 },
    { label: '近 24 个月', value: 24 },
    { label: '近 36 个月', value: 36 }
  ]
  const employmentLabels: Record<string, string> = {
    full_time: '全日制',
    part_time: '非全日制',
    intern: '实习',
    contractor: '外包 / 承揽',
    unknown: '未维护',
    protected: '其他受保护类型'
  }

  const loading = ref(false)
  const errorMessage = ref('')
  const analytics = ref<Api.Hr.PeopleAnalyticsOverview | null>(null)
  const periodMonths = ref(12)
  const asOfDate = ref(dayjs().format('YYYY-MM-DD'))

  const summary = computed<Api.Hr.PeopleAnalyticsSummary>(
    () =>
      analytics.value?.overview ?? {
        openingHeadcount: 0,
        endingHeadcount: 0,
        endingFte: 0,
        hires: 0,
        exits: 0,
        netChange: 0,
        turnoverRate: 0,
        averageTenureYears: 0,
        dataCompletenessRate: 0
      }
  )
  const privacyThreshold = computed(() => analytics.value?.privacyThreshold ?? 5)
  const isEmpty = computed(() => Boolean(analytics.value && summary.value.endingHeadcount === 0))
  const periodCaption = computed(() =>
    analytics.value
      ? `${analytics.value.periodStartDate} 至 ${analytics.value.asOfDate}`
      : `${periodMonths.value} 个月滚动窗口`
  )
  const generatedAt = computed(() =>
    analytics.value ? dayjs(analytics.value.generatedAt).format('YYYY-MM-DD HH:mm') : '--'
  )
  const reconciliationChange = computed(
    () =>
      summary.value.endingHeadcount -
      summary.value.openingHeadcount -
      summary.value.hires +
      summary.value.exits
  )

  const headerMetrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      label: '期末人数',
      value: summary.value.endingHeadcount,
      description: `${formatNumber(summary.value.endingFte)} FTE`,
      icon: 'ri:team-line',
      tone: 'primary',
      loading: loading.value
    },
    {
      label: '净变化',
      value: formatSigned(summary.value.netChange),
      description: `期初 ${summary.value.openingHeadcount} 人`,
      icon: summary.value.netChange >= 0 ? 'ri:arrow-up-line' : 'ri:arrow-down-line',
      tone: summary.value.netChange >= 0 ? 'success' : 'warning',
      loading: loading.value
    },
    {
      label: '期间流动',
      value: `${summary.value.hires} / ${summary.value.exits}`,
      description: '入职 / 离职人数',
      icon: 'ri:user-follow-line',
      tone: 'info',
      loading: loading.value
    },
    {
      label: '数据完整度',
      value: formatPercent(summary.value.dataCompletenessRate),
      description: `平均任期 ${formatNumber(summary.value.averageTenureYears)} 年`,
      icon: 'ri:database-2-line',
      tone: summary.value.dataCompletenessRate >= 90 ? 'success' : 'warning',
      loading: loading.value
    }
  ])

  const flowBridge = computed(() => [
    {
      key: 'opening',
      label: '期初存量',
      value: `${summary.value.openingHeadcount} 人`,
      description: analytics.value?.periodStartDate ?? '--',
      tone: 'neutral'
    },
    {
      key: 'hires',
      label: '入职流入',
      value: `+${summary.value.hires}`,
      description: '已维护入职日期',
      tone: 'positive'
    },
    {
      key: 'exits',
      label: '离职流出',
      value: `−${summary.value.exits}`,
      description: `离职率 ${formatPercent(summary.value.turnoverRate)}`,
      tone: 'negative'
    },
    {
      key: 'reconciliation',
      label: '其他净变化',
      value: formatSigned(reconciliationChange.value),
      description: '任职切换 / 日期缺失',
      tone: reconciliationChange.value === 0 ? 'neutral' : 'attention'
    },
    {
      key: 'ending',
      label: '期末存量',
      value: `${summary.value.endingHeadcount} 人`,
      description: `${formatNumber(summary.value.endingFte)} FTE`,
      tone: 'primary'
    }
  ])

  const trendLabels = computed(() =>
    (analytics.value?.flowTrend ?? []).map((item) => item.month.slice(5))
  )
  const trendSeries = computed(() => [
    {
      name: '月末人数',
      data: (analytics.value?.flowTrend ?? []).map((item) => item.headcount),
      lineWidth: 3,
      showAreaColor: true,
      smooth: true
    },
    {
      name: '入职',
      data: (analytics.value?.flowTrend ?? []).map((item) => item.hires),
      lineWidth: 2,
      smooth: true
    },
    {
      name: '离职',
      data: (analytics.value?.flowTrend ?? []).map((item) => item.exits),
      lineWidth: 2,
      smooth: true
    }
  ])

  const employmentRows = computed(() =>
    (analytics.value?.employmentDistribution ?? []).map((item) => ({
      ...item,
      label: employmentLabels[item.key] ?? item.key
    }))
  )
  const employmentChartData = computed(() =>
    employmentRows.value.map((item) => ({ name: item.label, value: item.headcount }))
  )
  const organizationLabels = computed(() =>
    (analytics.value?.organizationDistribution ?? []).map((item) => item.name)
  )
  const organizationValues = computed(() =>
    (analytics.value?.organizationDistribution ?? []).map((item) => item.headcount)
  )
  const hasProtectedOrganization = computed(() =>
    (analytics.value?.organizationDistribution ?? []).some((item) => item.protected)
  )
  const tenureLabels = computed(() =>
    (analytics.value?.tenureDistribution ?? []).map((item) => item.label)
  )
  const tenureValues = computed(() =>
    (analytics.value?.tenureDistribution ?? []).map((item) => item.headcount)
  )

  const managementInsights = computed(() => {
    const worstQuality = [...(analytics.value?.dataQuality ?? [])].sort(
      (left, right) => left.rate - right.rate
    )[0]
    const largestOrganization = (analytics.value?.organizationDistribution ?? []).find(
      (item) => !item.protected
    )
    return [
      {
        title: summary.value.netChange >= 0 ? '人员规模保持增长' : '人员规模出现收缩',
        description: `本周期从 ${summary.value.openingHeadcount} 人变化至 ${summary.value.endingHeadcount} 人，净变化 ${formatSigned(summary.value.netChange)}。`
      },
      {
        title: `期间离职率 ${formatPercent(summary.value.turnoverRate)}`,
        description: `按期间离职 ${summary.value.exits} 人除以期初、期末平均人数计算，建议结合业务周期持续观察。`
      },
      largestOrganization
        ? {
            title: `${largestOrganization.name} 为最大可见组织`,
            description: `占期末人数 ${formatPercent(largestOrganization.share)}；小于 ${privacyThreshold.value} 人的组织已合并保护。`
          }
        : {
            title: '组织分布已启用小样本保护',
            description: `当前组织均未达到 ${privacyThreshold.value} 人展示阈值，仅提供合并后的安全统计。`
          },
      {
        title:
          worstQuality && worstQuality.rate < 100
            ? `${worstQuality.label}是首要数据治理项`
            : '关键字段维护完整',
        description:
          worstQuality && worstQuality.rate < 100
            ? `当前完整度 ${formatPercent(worstQuality.rate)}，缺失数据会进入对账差异而不会被系统猜测。`
            : '当前分析范围内的入职日期、组织、岗位和用工类型均已维护。'
      }
    ]
  })

  function formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }

  function formatPercent(value: number): string {
    return `${formatNumber(value)}%`
  }

  function formatSigned(value: number): string {
    if (value > 0) return `+${value}`
    return String(value)
  }

  function qualityColor(rate: number): string {
    if (rate >= 95) return '#27b88d'
    if (rate >= 80) return '#5b6cf9'
    return '#e6a23c'
  }

  function disableFutureDate(date: Date): boolean {
    return dayjs(date).isAfter(dayjs(), 'day')
  }

  async function loadOverview(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    try {
      const response = await fetchPeopleAnalyticsOverview({
        asOfDate: asOfDate.value,
        periodMonths: periodMonths.value
      })
      if (response.data) {
        analytics.value = response.data
      } else {
        analytics.value = null
        const responseError = response.error as { message?: string } | null
        errorMessage.value = responseError?.message || '人力分析数据加载失败'
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '人力分析数据加载失败'
      ElMessage.error(errorMessage.value)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => void loadOverview())
</script>

<style scoped lang="scss">
  .people-analytics-page {
    --analytics-primary: #5b6cf9;
    --analytics-success: #27b88d;
    --analytics-danger: #ec6f76;

    padding-bottom: 4px;

    &__control,
    &__control-copy,
    &__filters,
    &__filters label,
    &__section-heading,
    &__legend,
    &__formula,
    &__privacy-note,
    &__footnote {
      display: flex;
      min-width: 0;
    }

    &__control {
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
    }

    &__control-copy {
      flex-direction: column;
      gap: 2px;

      span {
        font-size: 11px;
        font-weight: 700;
        color: var(--el-color-primary);
        letter-spacing: 0.08em;
      }

      strong {
        font-size: 15px;
        color: var(--el-text-color-primary);
      }

      small {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    &__filters {
      flex: none;
      gap: 12px;
      align-items: flex-end;

      label {
        flex-direction: column;
        gap: 5px;

        > span {
          font-size: 11px;
          color: var(--el-text-color-secondary);
        }
      }

      :deep(.el-select) {
        width: 148px;
      }

      :deep(.el-date-editor) {
        width: 158px;
      }
    }

    &__alert :deep(.el-alert__content) {
      min-width: 0;
    }

    &__skeleton {
      min-height: 480px;
      padding: 24px;
    }

    &__flow,
    &__trend-card,
    &__composition-card,
    &__distribution-card,
    &__quality-card,
    &__insight-card {
      min-width: 0;
      padding: 18px;
    }

    &__section-heading {
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;

      p {
        margin: 5px 0 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    &__bridge {
      display: grid;
      grid-template-columns:
        minmax(120px, 1fr) 24px minmax(120px, 1fr) 24px minmax(120px, 1fr)
        24px minmax(120px, 1fr) 24px minmax(120px, 1fr);
      gap: 8px;
      align-items: stretch;
    }

    &__bridge-node {
      min-width: 0;
      padding: 15px 16px;
      background: color-mix(in srgb, var(--el-fill-color-light) 74%, transparent);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 10px;

      span,
      small {
        display: block;
      }

      span {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      strong {
        display: block;
        margin: 5px 0 4px;
        font-size: 24px;
        line-height: 1.15;
        color: var(--el-text-color-primary);
      }

      small {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11px;
        color: var(--el-text-color-placeholder);
        white-space: nowrap;
      }

      &.is-positive {
        background: color-mix(in srgb, var(--analytics-success) 7%, transparent);
        border-color: color-mix(in srgb, var(--analytics-success) 20%, var(--el-border-color));

        strong {
          color: var(--analytics-success);
        }
      }

      &.is-negative {
        background: color-mix(in srgb, var(--analytics-danger) 6%, transparent);

        strong {
          color: var(--analytics-danger);
        }
      }

      &.is-attention {
        background: var(--el-color-warning-light-9);

        strong {
          color: var(--el-color-warning-dark-2);
        }
      }

      &.is-primary {
        background: color-mix(in srgb, var(--analytics-primary) 9%, transparent);
        border-color: color-mix(in srgb, var(--analytics-primary) 28%, var(--el-border-color));

        strong {
          color: var(--analytics-primary);
        }
      }
    }

    &__bridge-connector {
      display: grid;
      place-items: center;
      color: var(--el-text-color-placeholder);
    }

    &__formula,
    &__privacy-note {
      gap: 7px;
      align-items: center;
      margin: 12px 0 0;
      font-size: 11px;
      line-height: 1.6;
      color: var(--el-text-color-secondary);
    }

    &__primary-grid,
    &__distribution-grid,
    &__governance-grid {
      display: grid;
      gap: 12px;
      min-width: 0;
    }

    &__primary-grid {
      grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr);
    }

    &__distribution-grid,
    &__governance-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__trend-card,
    &__composition-card,
    &__distribution-card {
      min-height: 340px;
    }

    &__legend {
      gap: 13px;
      align-items: center;

      span {
        position: relative;
        padding-left: 13px;
        font-size: 11px;
        color: var(--el-text-color-secondary);

        &::before {
          position: absolute;
          top: 50%;
          left: 0;
          width: 7px;
          height: 7px;
          content: '';
          border-radius: 50%;
          transform: translateY(-50%);
        }

        &.is-headcount::before {
          background: var(--analytics-primary);
        }

        &.is-hire::before {
          background: var(--analytics-success);
        }

        &.is-exit::before {
          background: var(--analytics-danger);
        }
      }
    }

    &__trend-chart {
      min-width: 0;
      height: 260px;
    }

    &__composition {
      display: grid;
      grid-template-columns: minmax(150px, 0.9fr) minmax(150px, 1.1fr);
      gap: 12px;
      align-items: center;
      min-width: 0;
      height: 260px;
    }

    &__composition-chart {
      min-width: 0;
      height: 190px;
    }

    &__composition-list {
      display: grid;
      gap: 8px;
      padding: 0;
      margin: 0;
      list-style: none;

      li {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 2px 10px;
        align-items: baseline;
        min-width: 0;

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          white-space: nowrap;
        }

        strong {
          font-size: 13px;
          color: var(--el-text-color-primary);
        }

        small {
          grid-column: 2;
          font-size: 11px;
          color: var(--el-text-color-placeholder);
        }
      }
    }

    &__bar-chart {
      min-width: 0;
      height: 240px;
    }

    &__quality-card,
    &__insight-card {
      min-height: 285px;
    }

    &__quality-list {
      display: grid;
      gap: 16px;

      article {
        display: grid;
        grid-template-columns: minmax(130px, 0.65fr) minmax(160px, 1fr) 52px;
        gap: 14px;
        align-items: center;
        min-width: 0;

        div {
          min-width: 0;
        }

        span,
        small {
          display: block;
        }

        span {
          font-size: 13px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        small {
          margin-top: 3px;
          font-size: 11px;
          color: var(--el-text-color-secondary);
        }

        strong {
          font-size: 13px;
          color: var(--el-text-color-primary);
          text-align: right;
        }
      }
    }

    &__insights {
      display: grid;
      gap: 12px;
      padding: 0;
      margin: 0;
      list-style: none;

      li {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr);
        gap: 10px;
        align-items: start;

        > span {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          font-size: 10px;
          font-weight: 700;
          color: var(--analytics-primary);
          background: color-mix(in srgb, var(--analytics-primary) 9%, transparent);
          border-radius: 50%;
        }

        strong {
          font-size: 13px;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 3px 0 0;
          font-size: 11px;
          line-height: 1.55;
          color: var(--el-text-color-secondary);
        }
      }
    }

    &__footnote {
      gap: 8px;
      align-items: center;
      padding: 2px 4px;
      font-size: 11px;
      color: var(--el-text-color-secondary);

      span {
        flex: 1;
        min-width: 0;
      }

      time {
        flex: none;
        color: var(--el-text-color-placeholder);
      }
    }

    @media (width <= 1280px) {
      &__bridge {
        grid-template-columns: repeat(5, minmax(116px, 1fr));
        overflow-x: auto;
      }

      &__bridge-connector {
        display: none;
      }

      &__primary-grid {
        grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr);
      }

      &__composition {
        grid-template-columns: 1fr;
        height: auto;
      }

      &__composition-chart {
        height: 150px;
      }
    }

    @media (width <= 980px) {
      &__control {
        align-items: flex-start;
      }

      &__primary-grid,
      &__distribution-grid,
      &__governance-grid {
        grid-template-columns: minmax(0, 1fr);
      }

      &__composition {
        grid-template-columns: minmax(180px, 0.8fr) minmax(180px, 1.2fr);
        height: 240px;
      }

      &__composition-chart {
        height: 190px;
      }
    }

    @media (width <= 720px) {
      &__control,
      &__section-heading,
      &__footnote {
        flex-direction: column;
        align-items: stretch;
      }

      &__filters {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: 100%;

        :deep(.el-select),
        :deep(.el-date-editor) {
          width: 100%;
        }
      }

      &__bridge {
        grid-template-columns:
          minmax(118px, 1fr) minmax(118px, 1fr) minmax(118px, 1fr) minmax(118px, 1fr)
          minmax(118px, 1fr);
      }

      &__composition {
        grid-template-columns: 1fr;
        height: auto;
      }

      &__quality-list article {
        grid-template-columns: minmax(0, 1fr) 52px;

        :deep(.el-progress) {
          grid-row: 2;
          grid-column: 1 / -1;
        }
      }

      &__footnote time {
        padding-left: 22px;
      }
    }

    @media (width <= 480px) {
      &__filters {
        grid-template-columns: 1fr;
      }

      &__trend-card,
      &__composition-card,
      &__distribution-card,
      &__quality-card,
      &__insight-card,
      &__flow {
        padding: 14px;
      }
    }
  }
</style>
