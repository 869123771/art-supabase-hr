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

    <ElAlert v-if="errorMessage" type="error" show-icon :closable="false" :title="errorMessage">
      <template #default
        ><ElButton type="primary" link @click="loadOverview">重新加载</ElButton></template
      >
    </ElAlert>
    <ElSkeleton v-else-if="loading && !overview" :rows="8" animated />
    <template v-else-if="overview">
      <ElAlert
        v-if="overview.truncated"
        type="warning"
        show-icon
        :closable="false"
        :title="`员工数量较大，当前分析 ${overview.returnedRecords} / ${overview.totalRecords} 人`"
        description="可结合组织范围继续拆分技能盘点。"
      />

      <section class="skill-matrix-page__gaps art-card-xs">
        <header>
          <div>
            <ArtSectionTitle :show-line="false">组织能力缺口</ArtSectionTitle>
            <p>按未达岗位要求人数排序，更新时间 {{ generatedAt }}</p>
          </div>
          <ElTag type="info" effect="plain" round>
            {{ overview.competencies.length }} 项岗位能力
          </ElTag>
        </header>
        <ElEmpty v-if="!overview.competencies.length" description="岗位尚未配置能力要求" />
        <div v-else class="skill-matrix-page__competencies">
          <article v-for="item in overview.competencies.slice(0, 12)" :key="item.id">
            <div class="skill-matrix-page__competency-head">
              <div>
                <strong>{{ item.competencyName }}</strong>
                <span>{{ item.category }} · {{ item.competencyCode }}</span>
              </div>
              <ElTag :type="item.gapEmployees ? 'warning' : 'success'" effect="light" round>
                {{ item.gapEmployees ? `${item.gapEmployees} 人缺口` : '全部达标' }}
              </ElTag>
            </div>
            <div class="skill-matrix-page__competency-rate">
              <span>达标率</span>
              <strong>{{ item.readinessRate == null ? '--' : `${item.readinessRate}%` }}</strong>
            </div>
            <ElProgress
              :percentage="item.readinessRate ?? 0"
              :status="competencyStatus(item)"
              :stroke-width="7"
              :show-text="false"
            />
            <p>
              已评估 {{ item.assessedEmployees }} / {{ item.requiredEmployees }} 人
              <span v-if="item.unassessedEmployees">
                · {{ item.unassessedEmployees }} 人待评估</span
              >
            </p>
          </article>
        </div>
      </section>

      <section class="skill-matrix-page__employees art-card-xs">
        <header>
          <div>
            <ArtSectionTitle :show-line="false">员工岗位准备度</ArtSectionTitle>
            <p>能力缺口包含尚未评估和评估等级低于岗位要求两种情况。</p>
          </div>
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
        </header>

        <ElEmpty v-if="!filteredRecords.length" description="当前筛选范围暂无员工" />
        <div v-else class="skill-matrix-page__employee-grid">
          <article v-for="employee in pagedRecords" :key="employee.id">
            <header>
              <div>
                <BusinessRecordLink
                  :label="employee.employeeName"
                  :description="employee.employeeNo"
                  :title="`查看员工 ${employee.employeeName} 档案`"
                  :to="canViewEmployee ? `/hr/personnel/employee-detail/${employee.id}` : undefined"
                  compact
                />
              </div>
              <ElTag :type="employeeTone(employee)" effect="light" round>
                {{ employeeState(employee) }}
              </ElTag>
            </header>
            <p>{{ employee.organizationName || '未分配组织' }}</p>
            <p>{{ employee.positionName || employee.jobTitle || '未分配岗位' }}</p>
            <div class="skill-matrix-page__readiness">
              <span>岗位准备度</span>
              <strong>{{
                employee.readinessRate == null ? '--' : `${employee.readinessRate}%`
              }}</strong>
            </div>
            <ElProgress
              :percentage="employee.readinessRate ?? 0"
              :status="employeeProgressStatus(employee)"
              :stroke-width="8"
              :show-text="false"
            />
            <dl>
              <div
                ><dt>岗位要求</dt><dd>{{ employee.requiredCount }}</dd></div
              >
              <div
                ><dt>已评估</dt><dd>{{ employee.assessedCount }}</dd></div
              >
              <div
                ><dt>已达标</dt><dd>{{ employee.metCount }}</dd></div
              >
              <div
                ><dt>能力缺口</dt><dd>{{ employee.gapCount }}</dd></div
              >
            </dl>
          </article>
        </div>

        <ElPagination
          v-if="filteredRecords.length > pageSize"
          v-model:current-page="currentPage"
          class="skill-matrix-page__pagination"
          background
          layout="total, prev, pager, next"
          :page-size="pageSize"
          :total="filteredRecords.length"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import BusinessRecordLink from '@/components/business/business-record-link/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric
  } from '@/components/business/business-workspace-header/index.vue'
  import ArtSectionTitle from '@/components/core/forms/art-section-title/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useAuth } from '@/hooks/core/useAuth'
  import { formatWithDayjs } from '@/utils/time'
  import { fetchSkillMatrix } from '@hr/api'

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

  const generatedAt = computed(() =>
    overview.value ? formatWithDayjs(overview.value.generatedAt) : '--'
  )
  const assessmentCoverage = computed(() => {
    const modelled = overview.value?.modelledEmployeeCount ?? 0
    return modelled
      ? Math.round(((overview.value?.assessedEmployeeCount ?? 0) * 1000) / modelled) / 10
      : undefined
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

    &__gaps,
    &__employees {
      min-width: 0;
      padding: 18px;

      > header {
        display: flex;
        gap: 16px;
        align-items: flex-end;
        justify-content: space-between;
        margin-bottom: 16px;

        p {
          margin: 5px 0 0;
          font-size: 12px;
          color: var(--art-gray-500);
        }
      }
    }

    &__competencies {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;

      article {
        min-width: 0;
        padding: 14px;
        background: var(--art-main-bg-color);
        border: 1px solid var(--art-border-color);
        border-radius: var(--el-border-radius-base);

        > p {
          margin: 8px 0 0;
          font-size: 12px;
          color: var(--art-gray-500);
        }
      }
    }

    &__competency-head,
    &__competency-rate {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      justify-content: space-between;
    }

    &__competency-head {
      > div {
        min-width: 0;

        strong,
        span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        span {
          margin-top: 4px;
          font-size: 12px;
          color: var(--art-gray-500);
        }
      }
    }

    &__competency-rate {
      align-items: center;
      margin: 14px 0 8px;

      span {
        font-size: 12px;
        color: var(--art-gray-500);
      }
    }

    &__filters {
      display: flex;
      gap: 10px;
      align-items: center;

      .el-input {
        width: 210px;
      }
    }

    &__employee-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;

      article {
        min-width: 0;
        padding: 15px;
        background: var(--art-main-bg-color);
        border: 1px solid var(--art-border-color);
        border-radius: var(--el-border-radius-base);

        > header {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          justify-content: space-between;

          > div {
            min-width: 0;

            strong,
            span {
              display: block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            span {
              margin-top: 4px;
              font-size: 12px;
              color: var(--art-gray-500);
            }
          }
        }

        > p {
          margin: 8px 0 0;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12px;
          color: var(--art-gray-600);
          white-space: nowrap;
        }
      }
    }

    &__readiness {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      margin: 15px 0 8px;

      span {
        font-size: 12px;
        color: var(--art-gray-500);
      }
    }

    dl {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      margin: 14px 0 0;

      div {
        text-align: center;
      }

      dt {
        font-size: 11px;
        color: var(--art-gray-500);
      }

      dd {
        margin: 4px 0 0;
        font-weight: 600;
        color: var(--art-text-gray-800);
      }
    }

    &__pagination {
      justify-content: flex-end;
      margin-top: 16px;
    }
  }

  @media only screen and (width <= 1280px) {
    .skill-matrix-page {
      &__competencies {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      &__employee-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  }

  @media only screen and (width <= 960px) {
    .skill-matrix-page {
      &__gaps > header,
      &__employees > header,
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

      &__employee-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }

  @media only screen and (width <= 620px) {
    .skill-matrix-page {
      &__competencies,
      &__employee-grid {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
