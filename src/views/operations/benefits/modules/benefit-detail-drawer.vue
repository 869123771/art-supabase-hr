<template>
  <ArtDrawer ref="drawerRef">
    <div v-if="record" class="benefit-detail">
      <section class="benefit-detail__hero" aria-labelledby="benefit-detail-title">
        <div class="benefit-detail__identity">
          <span aria-hidden="true"><ArtSvgIcon :icon="hero.icon" /></span>
          <div>
            <small>{{ hero.eyebrow }}</small>
            <h3 id="benefit-detail-title">{{ hero.title }}</h3>
            <p>{{ hero.subtitle }}</p>
          </div>
        </div>
        <ElTag type="primary" effect="plain" round>{{ hero.status }}</ElTag>
      </section>

      <div v-if="restrictedMessage" class="benefit-detail__restricted" role="status">
        <ArtSvgIcon icon="ri:lock-2-line" />
        <div
          ><strong>敏感福利信息已隐藏</strong><p>{{ restrictedMessage }}</p></div
        >
      </div>

      <section class="benefit-detail__summary" aria-label="福利记录摘要">
        <dl>
          <div v-for="item in summaryItems" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
            <small>{{ item.hint }}</small>
          </div>
        </dl>
      </section>

      <section v-if="isPlan" class="benefit-detail__section">
        <header>
          <ArtSvgIcon icon="ri:stack-line" />
          <div
            ><strong>覆盖方案与缴费规则</strong
            ><small>员工参保时复制当前规则形成历史快照</small></div
          >
          <ArtButtonTable
            v-auth="'Hr:Benefits:Amount:Edit'"
            type="add"
            button-text="新增方案"
            permission="Hr:Benefits:Plan:Manage"
            @click="emitAddOption"
          />
        </header>
        <div v-if="planRecord.options?.length" class="benefit-detail__options">
          <article v-for="option in planRecord.options" :key="option.id">
            <span><ArtSvgIcon icon="ri:shield-check-line" /></span>
            <div>
              <div
                ><strong>{{ option.optionName }}</strong
                ><ElTag size="small" effect="plain">{{ option.optionCode }}</ElTag></div
              >
              <p
                >{{ dictLabel('hrBenefitCoverageLevel', option.coverageLevel) }} ·
                {{ contributionText(option) }}</p
              >
              <small>{{ option.description || '未填写方案说明' }}</small>
            </div>
            <ArtButtonTable
              v-auth="'Hr:Benefits:Amount:Edit'"
              type="edit"
              permission="Hr:Benefits:Plan:Manage"
              @click="$emit('edit-option', planRecord, option)"
            />
          </article>
        </div>
        <div v-else class="benefit-detail__empty">尚未配置覆盖方案，计划不能生效</div>
      </section>

      <section v-if="isEnrollment" class="benefit-detail__section">
        <header>
          <ArtSvgIcon icon="ri:money-cny-circle-line" />
          <div
            ><strong>参保与薪资边界</strong><small>审核后的缴费快照仅作为薪资受控输入</small></div
          >
        </header>
        <dl class="benefit-detail__narrative">
          <div
            ><dt>保障方案</dt><dd>{{ enrollmentRecord.option?.optionName || '--' }}</dd></div
          >
          <div
            ><dt>人生事件</dt><dd>{{ lifeEventText }}</dd></div
          >
          <div
            ><dt>薪资同步</dt
            ><dd>{{
              dictLabel('hrBenefitPayrollSyncStatus', enrollmentRecord.payrollSyncStatus)
            }}</dd></div
          >
          <div
            ><dt>审核信息</dt
            ><dd
              >{{ enrollmentRecord.approvedBy || '尚未审核' }} ·
              {{ formatDateTime(enrollmentRecord.approvedAt) }}</dd
            ></div
          >
        </dl>
      </section>

      <section v-if="isLifeEvent" class="benefit-detail__section">
        <header>
          <ArtSvgIcon icon="ri:file-shield-2-line" />
          <div
            ><strong>证明材料与关联参保</strong
            ><small>材料查看独立授权，避免普通福利经办权限扩大</small></div
          >
        </header>
        <div v-if="lifeEventRecord.evidenceUrls?.length" class="benefit-detail__attachments">
          <a
            v-for="(url, index) in lifeEventRecord.evidenceUrls"
            :key="url"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            ><ArtSvgIcon icon="ri:attachment-2" />证明材料 {{ index + 1
            }}<ArtSvgIcon icon="ri:external-link-line"
          /></a>
        </div>
        <div v-else class="benefit-detail__empty">
          {{ lifeEventRecord.evidenceRestricted ? '当前权限不可查看证明材料' : '未上传证明材料' }}
        </div>
        <div v-if="lifeEventRecord.enrollments?.length" class="benefit-detail__linked">
          <article v-for="item in lifeEventRecord.enrollments" :key="item.id">
            <strong>{{ item.planName }}</strong
            ><span>{{ item.optionName }}</span>
            <ElTag size="small" effect="plain">{{
              dictLabel('hrBenefitEnrollmentStatus', item.status)
            }}</ElTag>
          </article>
        </div>
      </section>

      <section class="benefit-detail__section">
        <header>
          <ArtSvgIcon icon="ri:history-line" />
          <div
            ><strong>不可变福利轨迹</strong
            ><small>计划、参保与人生事件的关键动作均保留审计记录</small></div
          >
        </header>
        <ElTimeline v-if="auditEvents.length" class="benefit-detail__timeline">
          <ElTimelineItem
            v-for="event in auditEvents"
            :key="event.id"
            :type="eventTone(event.eventType)"
            :timestamp="formatDateTime(event.createTime)"
            placement="top"
          >
            <article>
              <div
                ><strong>{{ event.summary }}</strong
                ><span>{{ event.actorName || '系统自动处理' }}</span></div
              >
              <small v-if="event.fromStatus || event.toStatus">
                {{ event.fromStatus || '初始状态' }}<ArtSvgIcon icon="ri:arrow-right-line" />{{
                  event.toStatus || '状态未变更'
                }}
              </small>
            </article>
          </ElTimelineItem>
        </ElTimeline>
        <div v-else class="benefit-detail__empty">暂无审计记录</div>
      </section>
    </div>
  </ArtDrawer>
</template>

<script setup lang="ts">
  import type { TimelineItemProps } from 'element-plus'
  import ArtDrawer from '@/components/core/drawers/art-drawer/index.vue'
  import type { ArtDrawerExpose } from '@/components/core/drawers/art-drawer/types'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { formatWithDayjs } from '@/utils/time'
  import { useUserStore } from '@/store/modules/user'
  import { fetchBenefitDetail } from '@hr/api'

  interface DisplayItem {
    label: string
    value: string
    hint: string
  }

  const emit = defineEmits<{
    'add-option': [plan: Api.Hr.BenefitPlan]
    'edit-option': [plan: Api.Hr.BenefitPlan, option: Api.Hr.BenefitOption]
  }>()
  const drawerRef = ref<ArtDrawerExpose>()
  const record = shallowRef<Api.Hr.BenefitRecord>()
  const activeEntity = ref<Api.Hr.BenefitEntity>('plan')
  const activeId = ref('')
  const userStore = useUserStore()
  const { getDictMap } = storeToRefs(userStore)

  const isPlan = computed(() => activeEntity.value === 'plan')
  const isEnrollment = computed(() => activeEntity.value === 'enrollment')
  const isLifeEvent = computed(() => activeEntity.value === 'event')
  const planRecord = computed(() => record.value as Api.Hr.BenefitPlan)
  const enrollmentRecord = computed(() => record.value as Api.Hr.BenefitEnrollment)
  const lifeEventRecord = computed(() => record.value as Api.Hr.BenefitLifeEvent)
  const auditEvents = computed(() => record.value?.events ?? [])
  const dictLabel = (code: string, value?: string | null): string =>
    getDictMap.value[code]?.find((item) => item.value === value)?.label ?? value ?? '--'
  const formatDate = (value?: string | null): string =>
    value ? (formatWithDayjs(value, 'YYYY-MM-DD') ?? '--') : '--'
  const formatDateTime = (value?: string | null): string =>
    value ? (formatWithDayjs(value) ?? '--') : '--'
  const money = (value?: number | null, currency = 'CNY'): string =>
    value == null
      ? '权限受限'
      : `${currency} ${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`

  const hero = computed(() => {
    if (isPlan.value)
      return {
        icon: 'ri:heart-pulse-line',
        eyebrow: planRecord.value.planCode,
        title: planRecord.value.planName,
        subtitle: planRecord.value.providerName || '未维护服务机构',
        status: dictLabel('hrBenefitPlanStatus', planRecord.value.status)
      }
    if (isEnrollment.value)
      return {
        icon: 'ri:user-heart-line',
        eyebrow: enrollmentRecord.value.enrollmentNo,
        title: enrollmentRecord.value.employee?.employeeName || '员工参保',
        subtitle: `${enrollmentRecord.value.plan?.planName || '--'} · ${enrollmentRecord.value.option?.optionName || '--'}`,
        status: dictLabel('hrBenefitEnrollmentStatus', enrollmentRecord.value.status)
      }
    return {
      icon: 'ri:calendar-event-line',
      eyebrow: formatDate(lifeEventRecord.value.eventDate),
      title: dictLabel('hrBenefitLifeEventType', lifeEventRecord.value.eventType),
      subtitle: `${lifeEventRecord.value.employee?.employeeName || '--'} · 窗口截至 ${formatDate(lifeEventRecord.value.enrollmentWindowEnd)}`,
      status: dictLabel('hrBenefitLifeEventStatus', lifeEventRecord.value.status)
    }
  })

  const restrictedMessage = computed(() => {
    if (
      (isPlan.value || isEnrollment.value) &&
      record.value &&
      'amountVisible' in record.value &&
      !record.value.amountVisible
    ) {
      return '当前权限可查看保障状态，但员工与雇主缴费金额已由服务端隐藏。'
    }
    if (isLifeEvent.value && lifeEventRecord.value.evidenceRestricted) {
      return '当前权限可查看事件与窗口，但证明材料地址已由服务端隐藏。'
    }
    return ''
  })

  const summaryItems = computed<DisplayItem[]>(() => {
    if (isPlan.value)
      return [
        {
          label: '计划类型',
          value: dictLabel('hrBenefitPlanType', planRecord.value.planType),
          hint: dictLabel('hrBenefitEnrollmentMethod', planRecord.value.enrollmentMethod)
        },
        {
          label: '有效期',
          value: formatDate(planRecord.value.effectiveFrom),
          hint: `至 ${formatDate(planRecord.value.effectiveTo)}`
        },
        {
          label: '覆盖方案',
          value: `${planRecord.value.options?.length ?? 0} 项`,
          hint: '至少一项后可生效'
        },
        {
          label: '在保员工',
          value: `${planRecord.value.activeEnrollmentCount ?? 0} 人`,
          hint: '当前生效参保'
        }
      ]
    if (isEnrollment.value)
      return [
        {
          label: '员工',
          value: enrollmentRecord.value.employee?.employeeName || '--',
          hint: enrollmentRecord.value.employee?.employeeNo || '--'
        },
        {
          label: '保障期',
          value: formatDate(enrollmentRecord.value.coverageFrom),
          hint: `至 ${formatDate(enrollmentRecord.value.coverageTo)}`
        },
        {
          label: '员工缴费',
          value: money(
            enrollmentRecord.value.employeeContribution,
            enrollmentRecord.value.currencyCode
          ),
          hint: '月度缴费快照'
        },
        {
          label: '雇主缴费',
          value: money(
            enrollmentRecord.value.employerContribution,
            enrollmentRecord.value.currencyCode
          ),
          hint: '月度雇主成本'
        }
      ]
    return [
      {
        label: '员工',
        value: lifeEventRecord.value.employee?.employeeName || '--',
        hint: lifeEventRecord.value.employee?.employeeNo || '--'
      },
      {
        label: '事件日期',
        value: formatDate(lifeEventRecord.value.eventDate),
        hint: dictLabel('hrBenefitLifeEventType', lifeEventRecord.value.eventType)
      },
      {
        label: '窗口截止',
        value: formatDate(lifeEventRecord.value.enrollmentWindowEnd),
        hint: lifeEventRecord.value.dueStatus === 'expired' ? '窗口已过期' : '可办理参保变更'
      },
      {
        label: '关联参保',
        value: `${lifeEventRecord.value.enrollments?.length ?? 0} 项`,
        hint: '由本事件触发'
      }
    ]
  })
  const lifeEventText = computed(() =>
    enrollmentRecord.value.lifeEvent
      ? `${dictLabel('hrBenefitLifeEventType', enrollmentRecord.value.lifeEvent.eventType)} · ${formatDate(enrollmentRecord.value.lifeEvent.eventDate)}`
      : '未关联人生事件'
  )
  const contributionText = (option: Api.Hr.BenefitOption): string => {
    if (!planRecord.value.amountVisible) return '缴费金额权限受限'
    if (option.contributionType === 'salary_rate') {
      return `员工 ${(Number(option.employeeRate || 0) * 100).toFixed(2)}% · 雇主 ${(Number(option.employerRate || 0) * 100).toFixed(2)}%`
    }
    return `员工 ${money(option.employeeContribution, planRecord.value.currencyCode)} · 雇主 ${money(option.employerContribution, planRecord.value.currencyCode)}`
  }
  const eventTone = (type: string): TimelineItemProps['type'] =>
    ['activated', 'approved', 'processed'].includes(type)
      ? 'success'
      : ['cancelled', 'deactivated', 'ended'].includes(type)
        ? 'warning'
        : 'primary'

  const emitAddOption = (): void => emit('add-option', planRecord.value)
  const loadDetail = async (): Promise<void> => {
    const response = await fetchBenefitDetail(activeEntity.value, activeId.value)
    record.value = response.data ?? undefined
  }
  const refresh = async (): Promise<void> => {
    if (!activeId.value) return
    await loadDetail()
  }
  const handleOpen = async (entity: Api.Hr.BenefitEntity, id: string): Promise<void> => {
    activeEntity.value = entity
    activeId.value = id
    record.value = undefined
    await drawerRef.value?.handleOpen(undefined, {
      title: '福利与参保详情',
      subtitle: '查看计划、员工保障、人生事件与审计轨迹',
      size: 'lg',
      showFooter: false,
      contentHeight: 'calc(100vh - 116px)',
      onOpen: async (_data, api) => {
        api.setLoading(true)
        try {
          await loadDetail()
        } finally {
          api.setLoading(false)
        }
      }
    })
  }

  defineExpose({ handleOpen, refresh })
</script>

<style scoped lang="scss">
  .benefit-detail {
    display: grid;
    gap: 16px;
    min-width: 0;
    padding-bottom: 4px;

    &__hero {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      justify-content: space-between;
      padding: 18px;
      background: color-mix(in srgb, var(--theme-color) 5%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 16%, var(--art-card-border));
      border-radius: calc(var(--el-border-radius-base) + 5px);
    }

    &__identity {
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr);
      gap: 13px;
      align-items: center;
      min-width: 0;

      > span {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        color: var(--theme-color);
        background: color-mix(in srgb, var(--theme-color) 12%, transparent);
        border-radius: var(--el-border-radius-base);
      }

      div {
        min-width: 0;
      }

      small {
        font-size: 11px;
        font-weight: 700;
        color: var(--theme-color);
      }

      h3 {
        margin: 3px 0 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 18px;
        color: var(--art-text-gray-900);
        white-space: nowrap;
      }

      p {
        margin: 5px 0 0;
        font-size: 12px;
        color: var(--art-text-gray-600);
      }
    }

    &__restricted {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr);
      gap: 11px;
      padding: 13px 15px;
      color: var(--el-color-warning-dark-2);
      background: var(--el-color-warning-light-9);
      border: 1px solid var(--el-color-warning-light-7);
      border-radius: var(--el-border-radius-base);

      p {
        margin: 4px 0 0;
        font-size: 12px;
        line-height: 1.55;
      }
    }

    &__summary dl {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1px;
      margin: 0;
      overflow: hidden;
      background: var(--art-card-border);
      border: 1px solid var(--art-card-border);
      border-radius: var(--el-border-radius-base);

      div {
        min-width: 0;
        padding: 13px;
        background: var(--art-main-bg-color);
      }

      dt,
      small {
        font-size: 11px;
        color: var(--art-text-gray-600);
      }

      dd {
        margin: 5px 0 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 700;
        color: var(--art-text-gray-900);
        white-space: nowrap;
      }
    }

    &__section {
      padding: 16px;
      background: var(--art-main-bg-color);
      border: 1px solid var(--art-card-border);
      border-radius: calc(var(--el-border-radius-base) + 3px);

      > header {
        display: flex;
        gap: 9px;
        align-items: flex-start;
        margin-bottom: 14px;

        > :deep(.art-svg-icon) {
          margin-top: 1px;
          font-size: 18px;
          color: var(--theme-color);
        }

        > div {
          display: grid;
          min-width: 0;
          margin-right: auto;
        }

        strong {
          color: var(--art-text-gray-900);
        }

        small {
          margin-top: 2px;
          font-size: 11px;
          color: var(--art-text-gray-600);
        }
      }
    }

    &__options {
      display: grid;
      gap: 8px;

      article {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        padding: 12px;
        background: var(--art-gray-100);
        border-radius: var(--el-border-radius-base);

        > span {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          color: var(--theme-color);
          background: color-mix(in srgb, var(--theme-color) 10%, transparent);
          border-radius: var(--el-border-radius-small);
        }

        > div > div {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        p {
          margin: 4px 0;
          font-size: 12px;
          color: var(--art-text-gray-700);
        }

        small {
          font-size: 11px;
          color: var(--art-text-gray-600);
        }
      }
    }

    &__narrative {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 0;

      div {
        min-width: 0;
        padding: 12px;
        background: var(--art-gray-100);
        border-radius: var(--el-border-radius-base);
      }

      dt {
        font-size: 11px;
        color: var(--art-text-gray-600);
      }

      dd {
        margin: 6px 0 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--art-text-gray-900);
      }
    }

    &__attachments,
    &__linked {
      display: grid;
      gap: 8px;
    }

    &__attachments a,
    &__linked article {
      display: flex;
      gap: 8px;
      align-items: center;
      min-height: 38px;
      padding: 0 11px;
      color: var(--art-text-gray-800);
      text-decoration: none;
      background: var(--art-gray-100);
      border-radius: var(--el-border-radius-small);
    }

    &__linked {
      margin-top: 10px;
    }

    &__linked article span {
      flex: 1;
      color: var(--art-text-gray-600);
    }

    &__timeline article > div {
      display: flex;
      gap: 10px;
      justify-content: space-between;
    }

    &__timeline article span,
    &__timeline article small {
      font-size: 11px;
      color: var(--art-text-gray-600);
    }

    &__empty {
      padding: 22px;
      font-size: 12px;
      color: var(--art-text-gray-600);
      text-align: center;
      background: var(--art-gray-100);
      border-radius: var(--el-border-radius-base);
    }
  }

  @media only screen and (width <= 767px) {
    .benefit-detail {
      &__hero {
        flex-direction: column;
      }

      &__summary dl,
      &__narrative {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      &__options article {
        grid-template-columns: 34px minmax(0, 1fr);
      }

      &__options article > :last-child {
        grid-column: 2;
        justify-self: start;
      }
    }
  }
</style>
