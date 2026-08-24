<template>
  <div
    v-auth="'Hr:SkillMatrix:View'"
    class="skill-matrix-page business-workspace-page art-full-height"
  >
    <BusinessWorkspaceHeader
      eyebrow="WORKFORCE SKILL MATRIX"
      title="技能矩阵"
      description="按岗位能力要求检查员工评估覆盖和达标情况，识别组织级能力缺口与重点培养对象。"
      icon="ri:grid-line"
      :tags="[
        { label: '岗位能力模型', type: 'primary' },
        { label: '评估覆盖', type: 'success' },
        { label: '培养优先级', type: 'warning' }
      ]"
      :metrics="metrics"
      refreshable
      refresh-label="刷新技能矩阵"
      :refresh-loading="loading"
      @metric-click="handleMetricClick"
      @refresh="loadOverview"
    />

    <ArtSectionCard
      class="skill-matrix-page__analysis"
      title="组织能力风险排行"
      :subtitle="`优先处理缺口人数多、评估覆盖不足的能力项，更新时间 ${generatedAt}`"
      :loading="loading && !overview"
      :error="errorMessage"
      :empty="Boolean(overview) && !overview?.competencies.length"
      empty-title="暂无能力风险数据"
      empty-description="尚未形成能力风险排行，请先在“培训与能力”中配置岗位能力要求。"
      :empty-visual-size="120"
      :min-height="360"
      @retry="loadOverview"
    >
      <template #actions>
        <ElTag v-if="overview" type="info" effect="plain" round>
          {{ overview.competencies.length }} 项岗位能力
        </ElTag>
      </template>

      <template v-if="overview">
        <ElAlert
          v-if="overview.truncated"
          class="skill-matrix-page__capacity-alert"
          type="warning"
          show-icon
          :closable="false"
          :title="`员工数量较大，当前分析 ${overview.returnedRecords} / ${overview.totalRecords} 人`"
          description="可结合组织范围继续拆分技能盘点。"
        />

        <div class="skill-matrix-page__analysis-grid">
          <div class="skill-matrix-page__priority">
            <ol class="skill-matrix-page__competency-list">
              <li v-for="(item, index) in overview.competencies.slice(0, 8)" :key="item.id">
                <span class="skill-matrix-page__rank">{{ index + 1 }}</span>
                <div class="skill-matrix-page__competency-main">
                  <strong>{{ item.competencyName }}</strong>
                  <span>{{ item.category }} · {{ item.competencyCode }}</span>
                </div>
                <div class="skill-matrix-page__competency-progress">
                  <span
                    >达标率 {{ item.readinessRate == null ? '--' : `${item.readinessRate}%` }}</span
                  >
                  <ElProgress
                    :percentage="item.readinessRate ?? 0"
                    :status="competencyStatus(item)"
                    :stroke-width="6"
                    :show-text="false"
                  />
                </div>
                <div class="skill-matrix-page__competency-result">
                  <strong>{{ item.gapEmployees }}</strong>
                  <span>人有缺口</span>
                </div>
                <div class="skill-matrix-page__competency-result is-muted">
                  <strong>{{ item.unassessedEmployees }}</strong>
                  <span>人待评估</span>
                </div>
              </li>
            </ol>
          </div>

          <aside class="skill-matrix-page__coverage" aria-label="能力评估覆盖概览">
            <header>
              <div>
                <ArtSectionTitle :show-line="false">评估覆盖</ArtSectionTitle>
                <p>以已配置岗位能力模型的员工为口径</p>
              </div>
            </header>
            <ElProgress
              class="skill-matrix-page__coverage-progress"
              type="dashboard"
              :width="126"
              :stroke-width="9"
              :percentage="assessmentCoverage ?? 0"
              :status="coverageStatus"
            />
            <strong class="skill-matrix-page__coverage-label">
              {{ assessmentCoverage == null ? '暂无覆盖口径' : '能力评估覆盖率' }}
            </strong>
            <dl>
              <div>
                <dt>已建模员工</dt>
                <dd>{{ overview.modelledEmployeeCount }}</dd>
              </div>
              <div>
                <dt>已完成评估</dt>
                <dd>{{ overview.assessedEmployeeCount }}</dd>
              </div>
              <div>
                <dt>岗位待评估</dt>
                <dd>{{ overview.unassessedEmployeeCount }}</dd>
              </div>
            </dl>
            <p class="skill-matrix-page__coverage-note">
              <ArtSvgIcon icon="ri:information-line" />
              未建模员工不会计入覆盖率，应先补齐岗位能力标准。
            </p>
          </aside>
        </div>
      </template>
    </ArtSectionCard>

    <ArtSectionCard
      v-if="overview"
      class="skill-matrix-page__employees"
      title="员工岗位准备度"
      subtitle="集中查看岗位建模、评估覆盖与实际达标情况，能力缺口同时包含未评估项。"
      :empty="!filteredRecords.length"
      empty-title="暂无准备度员工"
      empty-description="当前筛选范围暂无匹配员工，可调整关键词或准备度范围。"
      :min-height="320"
    >
      <template #actions>
        <div class="skill-matrix-page__filters">
          <ElInput
            v-model="keyword"
            clearable
            placeholder="员工、工号或岗位"
            aria-label="检索员工技能矩阵"
          >
            <template #prefix><ArtSvgIcon icon="ri:search-line" /></template>
          </ElInput>
          <ElRadioGroup v-model="activeScope" size="small" aria-label="技能矩阵范围">
            <ElRadioButton value="all">全部</ElRadioButton>
            <ElRadioButton value="gap">有缺口</ElRadioButton>
            <ElRadioButton value="ready">已就绪</ElRadioButton>
            <ElRadioButton value="unassessed">待评估</ElRadioButton>
            <ElRadioButton value="unmodelled">未建模</ElRadioButton>
          </ElRadioGroup>
        </div>
      </template>

      <ArtTable
        :data="pagedRecords"
        :columns="tableColumns"
        :loading="loading"
        :pagination="false"
        :show-table-header="false"
        row-key="id"
        table-layout="fixed"
        empty-height="220px"
        empty-text="暂无准备度员工"
        empty-description="当前筛选范围暂无匹配员工，可调整关键词或准备度范围。"
      >
        <template #employeeIdentity="{ row: employee }">
          <HrEmployeeIdentityCell
            :employee-name="employee.employeeName"
            :employee-no="employee.employeeNo"
            :to="canViewEmployee ? `/hr/personnel/employee-detail/${employee.id}` : undefined"
          />
        </template>
        <template #positionState="{ row: employee }">
          <ElTag :type="employeeTone(employee)" effect="light" round>
            {{ employeeState(employee) }}
          </ElTag>
        </template>
        <template #readiness="{ row: employee }">
          <div class="skill-matrix-page__readiness">
            <div>
              <strong>{{
                employee.readinessRate == null ? '--' : `${employee.readinessRate}%`
              }}</strong>
              <span>
                {{
                  employee.requiredCount
                    ? `${employee.metCount} / ${employee.requiredCount} 项达标`
                    : '未建立准备度口径'
                }}
              </span>
            </div>
            <ElProgress
              v-if="employee.requiredCount"
              :percentage="employee.readinessRate ?? 0"
              :status="employeeProgressStatus(employee)"
              :stroke-width="7"
              :show-text="false"
            />
          </div>
        </template>
        <template #assessmentCoverage="{ row: employee }">
          <div class="skill-matrix-page__stacked-cell">
            <strong>{{ employee.assessedCount }} / {{ employee.requiredCount }}</strong>
            <small v-if="employee.unassessedCount">
              {{ employee.unassessedCount }} 项尚未评估
            </small>
            <small v-else-if="employee.requiredCount">评估已覆盖岗位要求</small>
            <small v-else>需先配置岗位能力要求</small>
          </div>
        </template>
        <template #abilityResult="{ row: employee }">
          <span
            class="skill-matrix-page__gap-result"
            :class="{
              'has-gap': employee.requiredCount > 0 && employee.gapCount > 0,
              'is-unmodelled': employee.requiredCount === 0
            }"
          >
            <ArtSvgIcon
              :icon="
                !employee.requiredCount
                  ? 'ri:node-tree'
                  : employee.gapCount
                    ? 'ri:alarm-warning-line'
                    : 'ri:shield-check-line'
              "
            />
            {{
              !employee.requiredCount
                ? '待建模'
                : employee.gapCount
                  ? `${employee.gapCount} 项缺口`
                  : '全部达标'
            }}
          </span>
        </template>
      </ArtTable>

      <ElPagination
        v-if="filteredRecords.length > pageSize"
        v-model:current-page="currentPage"
        class="skill-matrix-page__pagination"
        background
        layout="total, prev, pager, next"
        :page-size="pageSize"
        :total="filteredRecords.length"
      />
    </ArtSectionCard>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { ColumnOption } from '@/types'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric
  } from '@/components/business/business-workspace-header/index.vue'
  import ArtSectionCard from '@/components/core/surfaces/art-section-card/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtSectionTitle from '@/components/core/surfaces/art-section-title/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { formatWithDayjs } from '@/utils/time'
  import { fetchSkillMatrix } from '@hr/api'
  import HrEmployeeIdentityCell from '@hr/views/shared/hr-employee-identity-cell.vue'

  defineOptions({ name: 'HrSkillMatrix' })

  type Scope = 'all' | 'gap' | 'ready' | 'unassessed' | 'unmodelled'
  type Employee = Api.Hr.SkillMatrixEmployee
  type Competency = Api.Hr.SkillMatrixCompetency

  const { hasAuth } = useAuth()
  const loading = ref(false)
  const errorMessage = ref('')
  const activeScope = ref<Scope>('all')
  const keyword = ref('')
  const currentPage = ref(1)
  const pageSize = 20
  const overview = ref<Api.Hr.SkillMatrixOverview | null>(null)
  const canViewEmployee = computed(() => hasAuth('Hr:Employee:View'))
  const tableColumns: ColumnOption<Employee>[] = [
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
      formatter: (employee) => employee.organizationName || '未分配组织'
    },
    {
      prop: 'positionName',
      label: '工作岗位',
      minWidth: 145,
      showOverflowTooltip: true,
      formatter: (employee) => employee.positionName || employee.jobTitle || '未分配岗位'
    },
    { prop: 'positionState', label: '岗位状态', width: 128, useSlot: true },
    { prop: 'readiness', label: '岗位准备度', minWidth: 210, useSlot: true },
    { prop: 'assessmentCoverage', label: '评估覆盖', minWidth: 175, useSlot: true },
    { prop: 'abilityResult', label: '能力结果', minWidth: 130, useSlot: true }
  ]

  const generatedAt = computed(() =>
    overview.value ? formatWithDayjs(overview.value.generatedAt) : '--'
  )
  const assessmentCoverage = computed(() => {
    const modelled = overview.value?.modelledEmployeeCount ?? 0
    return modelled
      ? Math.round(((overview.value?.assessedEmployeeCount ?? 0) * 1000) / modelled) / 10
      : undefined
  })
  const coverageStatus = computed<'success' | 'warning' | 'exception' | undefined>(() => {
    if (assessmentCoverage.value == null) return undefined
    if (assessmentCoverage.value >= 90) return 'success'
    if (assessmentCoverage.value >= 60) return 'warning'
    return 'exception'
  })
  const filteredRecords = computed(() => {
    const normalizedKeyword = keyword.value.trim().toLocaleLowerCase()
    return (overview.value?.records ?? []).filter((record) => {
      const scopeMatched =
        activeScope.value === 'all' ||
        (activeScope.value === 'gap' && record.gapCount > 0) ||
        (activeScope.value === 'ready' && record.requiredCount > 0 && record.gapCount === 0) ||
        (activeScope.value === 'unassessed' &&
          record.requiredCount > 0 &&
          record.assessedCount === 0) ||
        (activeScope.value === 'unmodelled' && record.requiredCount === 0)
      if (!scopeMatched || !normalizedKeyword) return scopeMatched
      return [record.employeeName, record.employeeNo, record.positionName, record.jobTitle]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalizedKeyword))
    })
  })
  const pagedRecords = computed(() => {
    const from = (currentPage.value - 1) * pageSize
    return filteredRecords.value.slice(from, from + pageSize)
  })
  const metrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      key: 'all',
      label: '在盘员工',
      value: overview.value?.employeeCount ?? 0,
      description: `${overview.value?.modelledEmployeeCount ?? 0} 人已配置岗位模型`,
      icon: 'ri:team-line',
      tone: 'primary',
      interactive: true,
      selected: activeScope.value === 'all',
      loading: loading.value
    },
    {
      key: 'gap',
      label: '存在能力缺口',
      value: overview.value?.gapEmployeeCount ?? 0,
      description: '至少一项未达到岗位要求',
      icon: 'ri:gap-line',
      tone: 'warning',
      interactive: true,
      selected: activeScope.value === 'gap',
      loading: loading.value
    },
    {
      key: 'ready',
      label: '岗位已就绪',
      value: overview.value?.readyEmployeeCount ?? 0,
      description: '已配置能力均达到要求',
      icon: 'ri:verified-badge-line',
      tone: 'success',
      interactive: true,
      selected: activeScope.value === 'ready',
      loading: loading.value
    },
    {
      key: 'unassessed',
      label: '评估覆盖率',
      value: assessmentCoverage.value == null ? '--' : `${assessmentCoverage.value}%`,
      description: `${overview.value?.unassessedEmployeeCount ?? 0} 人岗位能力待评估`,
      icon: 'ri:survey-line',
      tone: 'info',
      interactive: true,
      selected: activeScope.value === 'unassessed',
      loading: loading.value
    }
  ])

  function handleMetricClick(metric: BusinessWorkspaceMetric): void {
    if (['all', 'gap', 'ready', 'unassessed'].includes(metric.key ?? '')) {
      activeScope.value = metric.key as Scope
    }
  }
  function competencyStatus(item: Competency): 'success' | 'warning' | 'exception' | undefined {
    if ((item.readinessRate ?? 0) >= 90) return 'success'
    if ((item.readinessRate ?? 0) >= 60) return 'warning'
    if (item.requiredEmployees > 0) return 'exception'
    return undefined
  }
  function employeeTone(employee: Employee): 'success' | 'warning' | 'danger' | 'info' {
    if (!employee.requiredCount) return 'info'
    if (!employee.assessedCount) return 'danger'
    if (!employee.gapCount) return 'success'
    return 'warning'
  }
  function employeeState(employee: Employee): string {
    if (!employee.requiredCount) return '岗位未建模'
    if (!employee.assessedCount) return '待评估'
    if (!employee.gapCount) return '已就绪'
    return `${employee.gapCount} 项缺口`
  }
  function employeeProgressStatus(
    employee: Employee
  ): 'success' | 'warning' | 'exception' | undefined {
    if (!employee.requiredCount) return undefined
    if (!employee.assessedCount) return 'exception'
    if (!employee.gapCount) return 'success'
    return 'warning'
  }
  async function loadOverview(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    try {
      overview.value = await fetchSkillMatrix()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : '技能矩阵数据加载失败，请稍后重试'
      ElMessage.error(errorMessage.value)
    } finally {
      loading.value = false
    }
  }

  watch([activeScope, keyword], () => {
    currentPage.value = 1
  })
  onMounted(() => void loadOverview())
</script>

<style scoped lang="scss">
  .skill-matrix-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;

    &__analysis,
    &__employees {
      min-width: 0;
    }

    &__analysis-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 18px;
    }

    &__capacity-alert {
      margin-bottom: var(--art-space-4);
    }

    &__priority {
      min-width: 0;
      padding-right: 18px;
      border-right: 1px solid var(--art-border-color);

      > header {
        display: flex;
        gap: 16px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        p {
          margin: 5px 0 0;
          font-size: 12px;
          color: var(--art-gray-600);
        }
      }
    }

    &__competency-list {
      padding: 0;
      margin: 0;
      list-style: none;

      li {
        display: grid;
        grid-template-columns: 28px minmax(150px, 1.1fr) minmax(150px, 0.9fr) 72px 72px;
        gap: 12px;
        align-items: center;
        min-width: 0;
        padding: 11px 4px;
        border-bottom: 1px solid var(--art-border-color);

        &:last-child {
          border-bottom: 0;
        }
      }
    }

    &__rank {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      font-size: 12px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, transparent);
      border-radius: 50%;
    }

    &__competency-main {
      min-width: 0;

      strong,
      span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      strong {
        color: var(--art-gray-900);
      }

      span {
        margin-top: 4px;
        font-size: 12px;
        color: var(--art-gray-600);
      }
    }

    &__competency-progress {
      min-width: 0;

      > span {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        color: var(--art-gray-700);
      }
    }

    &__competency-result {
      text-align: right;

      strong,
      span {
        display: block;
      }

      strong {
        font-size: 16px;
        font-variant-numeric: tabular-nums;
        color: var(--el-color-warning-dark-2);
      }

      span {
        margin-top: 2px;
        font-size: 11px;
        color: var(--art-gray-600);
      }

      &.is-muted strong {
        color: var(--art-gray-800);
      }
    }

    &__coverage {
      min-width: 0;
      text-align: center;

      > header {
        text-align: left;

        p {
          margin: 5px 0 0;
          font-size: 12px;
          color: var(--art-gray-600);
        }
      }

      dl {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 18px 0 0;
        background: var(--art-gray-100);
        border-radius: var(--el-border-radius-base);

        div {
          padding: 11px 6px;

          + div {
            border-left: 1px solid var(--art-border-color);
          }
        }

        dt {
          font-size: 12px;
          color: var(--art-gray-600);
        }

        dd {
          margin: 5px 0 0;
          font-size: 17px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: var(--art-gray-900);
        }
      }
    }

    &__coverage-progress {
      margin-top: 12px;
    }

    &__coverage-label {
      display: block;
      margin-top: -12px;
      font-size: 13px;
      color: var(--art-gray-800);
    }

    &__coverage-note {
      display: flex;
      gap: 6px;
      align-items: flex-start;
      margin: 14px 0 0;
      font-size: 12px;
      line-height: 1.5;
      color: var(--art-gray-600);
      text-align: left;

      svg {
        flex: 0 0 auto;
        width: 15px;
        height: 15px;
        margin-top: 1px;
      }
    }

    &__filters {
      display: flex;
      gap: 10px;
      align-items: center;
      min-width: 0;

      .el-input {
        width: 220px;
      }
    }

    &__stacked-cell {
      display: grid;
      gap: 5px;
      min-width: 0;

      small {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--art-gray-600);
        white-space: nowrap;
      }
    }

    &__readiness {
      min-width: 210px;

      > div {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 7px;

        span {
          font-size: 11px;
          color: var(--art-gray-600);
        }
      }
    }

    &__gap-result {
      display: inline-flex !important;
      flex-direction: row;
      gap: 6px;
      align-items: center;
      width: fit-content;
      min-height: 26px;
      padding-inline: 9px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-color-success-dark-2);
      background: var(--el-color-success-light-9);
      border-radius: 999px;

      svg {
        width: 14px;
        height: 14px;
      }

      &.has-gap {
        color: var(--el-color-warning-dark-2);
        background: var(--el-color-warning-light-9);
      }

      &.is-unmodelled {
        color: var(--art-gray-700);
        background: var(--art-gray-200);
      }
    }

    &__pagination {
      justify-content: flex-end;
      margin-top: 16px;
    }
  }

  @media only screen and (width <= 1180px) {
    .skill-matrix-page {
      &__analysis-grid {
        grid-template-columns: 1fr 280px;
      }

      &__competency-list li {
        grid-template-columns: 28px minmax(140px, 1fr) minmax(120px, 0.8fr) 68px;
      }

      &__competency-result.is-muted {
        display: none;
      }
    }
  }

  @media only screen and (width <= 900px) {
    .skill-matrix-page {
      &__analysis-grid {
        grid-template-columns: 1fr;
      }

      &__priority {
        padding-right: 0;
        padding-bottom: 18px;
        border-right: 0;
        border-bottom: 1px solid var(--art-border-color);
      }

      &__coverage {
        display: grid;
        grid-template-columns: minmax(180px, 1fr) auto minmax(240px, 1fr);
        gap: 14px;
        align-items: center;
        text-align: left;

        > header,
        &-note {
          grid-column: 1;
        }

        dl {
          grid-row: 1 / span 2;
          grid-column: 3;
          margin-top: 0;
        }
      }

      &__coverage-progress {
        grid-row: 1 / span 2;
        grid-column: 2;
        margin-top: 0;
      }

      &__coverage-label {
        display: none;
      }
    }
  }

  @media only screen and (width <= 767px) {
    .skill-matrix-page {
      &__priority > header,
      &__filters {
        flex-direction: column;
        align-items: stretch;
      }

      &__filters .el-input {
        width: 100%;
      }

      &__filters :deep(.el-radio-group) {
        display: flex;
        flex-wrap: wrap;
      }

      &__coverage {
        display: block;
        text-align: center;

        > header,
        &-note {
          text-align: left;
        }

        dl {
          margin-top: 16px;
        }
      }

      &__coverage-progress {
        margin-top: 12px;
      }

      &__coverage-label {
        display: block;
      }

      &__competency-list li {
        grid-template-columns: 28px minmax(120px, 1fr) 68px;
      }

      &__competency-progress {
        display: none;
      }
    }
  }

  @media only screen and (width <= 480px) {
    .skill-matrix-page {
      &__coverage dl {
        grid-template-columns: 1fr;

        div + div {
          border-top: 1px solid var(--art-border-color);
          border-left: 0;
        }
      }
    }
  }
</style>
