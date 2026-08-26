<template>
  <ArtDialog ref="dialogRef" size="lg">
    <div class="benefit-record-dialog">
      <div class="benefit-record-dialog__context" role="note">
        <span aria-hidden="true"><ArtSvgIcon :icon="contextMeta.icon" /></span>
        <div>
          <small>{{ contextMeta.eyebrow }}</small>
          <strong>{{ contextMeta.title }}</strong>
          <p>{{ contextMeta.description }}</p>
        </div>
        <span class="benefit-record-dialog__boundary">
          <ArtSvgIcon icon="ri:shield-check-line" />{{ contextMeta.boundary }}
        </span>
      </div>

      <ArtForm
        ref="formRef"
        v-model="form.model"
        :items="form.items"
        :rules="form.rules"
        :span="12"
        :gutter="22"
        label-position="top"
        :show-reset="false"
        :show-submit="false"
      >
        <template #employeeId>
          <ArtEmployeeSelect
            v-model="form.model.employeeId"
            v-model:selected-data="employeeSelection"
            :tenant-id="form.model.tenantId"
            title="选择福利涉及员工"
            subtitle="员工身份用于校验人生事件、参保资格与租户边界"
            placeholder="请选择员工"
          />
        </template>
      </ArtForm>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import { uniqBy } from 'lodash-es'
  import { ElMessage, type FormRules } from 'element-plus'
  import ArtDialog from '@/components/core/dialogs/art-dialog/index.vue'
  import type { ArtDialogExpose } from '@/components/core/dialogs/art-dialog/types'
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtEmployeeSelect from '@/components/business/art-employee-select/index.vue'
  import type { EmployeeIntegrationItem } from '@/api/integration/employees'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useUserStore } from '@/store/modules/user'
  import {
    fetchBenefitDetail,
    fetchBenefitPlanOptions,
    fetchBenefitRecords,
    saveBenefitRecord
  } from '@hr/api'
  import type { DialogType } from '@/types'

  type Entity = Api.Hr.BenefitEntity
  type RecordItem = Api.Hr.BenefitRecord

  interface OpenPayload {
    entity: Entity
    type: DialogType
    editData?: RecordItem
  }

  interface FormModel {
    id?: string
    tenantId?: string
    planCode: string
    planName: string
    planType: string
    providerName?: string
    enrollmentMethod: 'automatic' | 'election'
    coverageScope: 'employee' | 'employee_family'
    currencyCode: string
    effectiveFrom: string
    effectiveTo?: string
    description?: string
    employeeId?: string
    planId?: string
    optionId?: string
    lifeEventId?: string
    enrollmentNo: string
    coverageFrom: string
    coverageTo?: string
    employeeContribution?: number
    employerContribution?: number
    waiverReason?: string
    remark?: string
    eventType: string
    eventDate: string
    enrollmentWindowEnd: string
    evidenceText: string
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean | void>
    clearValidate: () => void
  }

  const emit = defineEmits<{ success: [entity: Entity, type: DialogType] }>()
  const userStore = useUserStore()
  const { getDictMap, getUserInfo, isPlatformSuper } = storeToRefs(userStore)
  const { hasAuth } = useAuth()
  const dialogRef = ref<ArtDialogExpose>()
  const formRef = ref<ArtFormExpose>()
  const entity = ref<Entity>('plan')
  const dialogType = ref<DialogType>('add')
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const benefitOptions = ref<Api.Hr.BenefitOption[]>([])
  const lifeEvents = ref<Api.Hr.BenefitLifeEvent[]>([])
  const employeeSelection = ref<EmployeeIntegrationItem[]>([])

  const createInitialModel = (): FormModel => ({
    id: undefined,
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    planCode: '',
    planName: '',
    planType: 'commercial_insurance',
    providerName: undefined,
    enrollmentMethod: 'election',
    coverageScope: 'employee',
    currencyCode: 'CNY',
    effectiveFrom: dayjs().format('YYYY-MM-DD'),
    effectiveTo: undefined,
    description: undefined,
    employeeId: undefined,
    planId: undefined,
    optionId: undefined,
    lifeEventId: undefined,
    enrollmentNo: 'AUTO',
    coverageFrom: dayjs().format('YYYY-MM-DD'),
    coverageTo: undefined,
    employeeContribution: undefined,
    employerContribution: undefined,
    waiverReason: undefined,
    remark: undefined,
    eventType: 'annual_enrollment',
    eventDate: dayjs().format('YYYY-MM-DD'),
    enrollmentWindowEnd: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    evidenceText: ''
  })

  const formModel = reactive<FormModel>(createInitialModel())
  const dictOptions = (code: string) => getDictMap.value[code] ?? []
  const planSelectOptions = computed(() =>
    uniqBy(
      benefitOptions.value
        .filter((item) => item.plan?.id)
        .map((item) => ({
          label: `${item.plan!.planName}（${item.plan!.planCode}）`,
          value: item.plan!.id
        })),
      'value'
    )
  )
  const optionSelectOptions = computed(() =>
    benefitOptions.value
      .filter((item) => item.planId === formModel.planId)
      .map((item) => ({
        label: `${item.optionName} · ${dictLabel('hrBenefitCoverageLevel', item.coverageLevel)}`,
        value: item.id!
      }))
  )
  const eventSelectOptions = computed(() =>
    lifeEvents.value
      .filter((item) => item.employeeId === formModel.employeeId)
      .map((item) => ({
        label: `${dictLabel('hrBenefitLifeEventType', item.eventType)} · ${item.eventDate}`,
        value: item.id!
      }))
  )
  const dictLabel = (code: string, value?: string | null): string =>
    getDictMap.value[code]?.find((item) => item.value === value)?.label ?? value ?? '--'

  const commonTenantItems = (): FormItem[] =>
    isPlatformSuper.value
      ? [
          {
            label: '所属租户',
            key: 'tenantId',
            type: 'select',
            span: 24,
            options: tenantOptions.value,
            props: { filterable: true, placeholder: '请选择所属租户' }
          }
        ]
      : []

  const planItems = computed<FormItem[]>(() => [
    ...commonTenantItems(),
    { label: '计划识别', key: 'identity', type: 'divider', span: 24 },
    {
      label: '计划编码',
      key: 'planCode',
      type: 'input',
      props: { maxlength: 40, placeholder: '例如 MEDICAL-2027' }
    },
    {
      label: '计划名称',
      key: 'planName',
      type: 'input',
      props: { maxlength: 120, placeholder: '请输入对员工可识别的福利计划名称' }
    },
    {
      label: '计划类型',
      key: 'planType',
      type: 'select',
      options: dictOptions('hrBenefitPlanType')
    },
    { label: '服务机构', key: 'providerName', type: 'input', props: { maxlength: 120 } },
    { label: '参保与覆盖', key: 'coverage', type: 'divider', span: 24 },
    {
      label: '参保方式',
      key: 'enrollmentMethod',
      type: 'select',
      options: dictOptions('hrBenefitEnrollmentMethod')
    },
    {
      label: '覆盖范围',
      key: 'coverageScope',
      type: 'select',
      options: dictOptions('hrBenefitCoverageScope')
    },
    { label: '币种', key: 'currencyCode', type: 'input', props: { maxlength: 3 } },
    { label: '生效日期', key: 'effectiveFrom', type: 'date', props: { class: '!w-full' } },
    { label: '失效日期', key: 'effectiveTo', type: 'date', props: { class: '!w-full' } },
    {
      label: '计划说明',
      key: 'description',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 4, maxlength: 1000, showWordLimit: true }
    }
  ])

  const enrollmentItems = computed<FormItem[]>(() => [
    ...commonTenantItems(),
    { label: '员工与资格', key: 'employeeSection', type: 'divider', span: 24 },
    { label: '员工', key: 'employeeId', type: 'input' },
    {
      label: '参保编号',
      key: 'enrollmentNo',
      type: 'input',
      props: { disabled: true },
      help: '保存时由系统生成唯一参保编号'
    },
    {
      label: '福利计划',
      key: 'planId',
      type: 'select',
      options: planSelectOptions.value,
      props: { filterable: true, placeholder: '请选择生效中的福利计划' }
    },
    {
      label: '覆盖方案',
      key: 'optionId',
      type: 'select',
      options: optionSelectOptions.value,
      props: { disabled: !formModel.planId, placeholder: '请先选择福利计划' }
    },
    {
      label: '关联人生事件',
      key: 'lifeEventId',
      type: 'select',
      options: eventSelectOptions.value,
      span: 24,
      props: {
        clearable: true,
        disabled: !formModel.employeeId,
        placeholder: eventSelectOptions.value.length
          ? '可选：关联开放中的人生事件'
          : '该员工暂无开放人生事件'
      }
    },
    { label: '保障与缴费', key: 'coverageSection', type: 'divider', span: 24 },
    { label: '保障开始日', key: 'coverageFrom', type: 'date', props: { class: '!w-full' } },
    { label: '保障结束日', key: 'coverageTo', type: 'date', props: { class: '!w-full' } },
    {
      label: '员工月缴费',
      key: 'employeeContribution',
      type: 'number',
      hidden: () => !hasAuth('Hr:Benefits:Amount:Edit'),
      props: { min: 0, precision: 2, class: '!w-full' }
    },
    {
      label: '雇主月缴费',
      key: 'employerContribution',
      type: 'number',
      hidden: () => !hasAuth('Hr:Benefits:Amount:Edit'),
      props: { min: 0, precision: 2, class: '!w-full' }
    },
    {
      label: '内部备注',
      key: 'remark',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 3, maxlength: 600, showWordLimit: true }
    }
  ])

  const eventItems = computed<FormItem[]>(() => [
    ...commonTenantItems(),
    { label: '事件与员工', key: 'eventSection', type: 'divider', span: 24 },
    { label: '员工', key: 'employeeId', type: 'input' },
    {
      label: '人生事件类型',
      key: 'eventType',
      type: 'select',
      options: dictOptions('hrBenefitLifeEventType')
    },
    { label: '事件日期', key: 'eventDate', type: 'date', props: { class: '!w-full' } },
    {
      label: '参保窗口截止日',
      key: 'enrollmentWindowEnd',
      type: 'date',
      props: { class: '!w-full' }
    },
    { label: '证明与备注', key: 'evidenceSection', type: 'divider', span: 24 },
    {
      label: '证明材料地址',
      key: 'evidenceText',
      type: 'input',
      span: 24,
      props: {
        type: 'textarea',
        rows: 3,
        placeholder: '可选：每行一个受控材料地址；查看需要独立附件权限'
      }
    },
    {
      label: '事件说明',
      key: 'remark',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 3, maxlength: 600, showWordLimit: true }
    }
  ])

  const form = reactive<{
    model: FormModel
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<FormModel>>
  }>({
    model: formModel,
    items: computed(() =>
      entity.value === 'plan'
        ? planItems.value
        : entity.value === 'enrollment'
          ? enrollmentItems.value
          : eventItems.value
    ),
    rules: computed(() => ({
      tenantId: isPlatformSuper.value
        ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
        : [],
      planCode:
        entity.value === 'plan'
          ? [{ required: true, message: '请输入计划编码', trigger: 'blur' }]
          : [],
      planName:
        entity.value === 'plan'
          ? [{ required: true, message: '请输入计划名称', trigger: 'blur' }]
          : [],
      planType:
        entity.value === 'plan'
          ? [{ required: true, message: '请选择计划类型', trigger: 'change' }]
          : [],
      effectiveFrom:
        entity.value === 'plan'
          ? [{ required: true, message: '请选择生效日期', trigger: 'change' }]
          : [],
      employeeId:
        entity.value !== 'plan'
          ? [{ required: true, message: '请选择员工', trigger: 'change' }]
          : [],
      planId:
        entity.value === 'enrollment'
          ? [{ required: true, message: '请选择福利计划', trigger: 'change' }]
          : [],
      optionId:
        entity.value === 'enrollment'
          ? [{ required: true, message: '请选择覆盖方案', trigger: 'change' }]
          : [],
      coverageFrom:
        entity.value === 'enrollment'
          ? [{ required: true, message: '请选择保障开始日', trigger: 'change' }]
          : [],
      eventType:
        entity.value === 'event'
          ? [{ required: true, message: '请选择人生事件类型', trigger: 'change' }]
          : [],
      eventDate:
        entity.value === 'event'
          ? [{ required: true, message: '请选择事件日期', trigger: 'change' }]
          : [],
      enrollmentWindowEnd:
        entity.value === 'event'
          ? [{ required: true, message: '请选择参保窗口截止日', trigger: 'change' }]
          : []
    }))
  })

  const contextMeta = computed(() => {
    if (entity.value === 'plan') {
      return {
        eyebrow: 'BENEFIT POLICY',
        title: '福利计划与资格边界',
        description: '定义计划类型、参保方式、覆盖对象与有效期；具体缴费规则在覆盖方案中维护。',
        boundary: '计划生效前需配置方案',
        icon: 'ri:heart-pulse-line'
      }
    }
    if (entity.value === 'enrollment') {
      return {
        eyebrow: 'EMPLOYEE ELECTION',
        title: '员工参保与缴费快照',
        description: '记录员工选择、保障期与缴费快照；审核通过后才向薪资提供受控输入。',
        boundary: '审核后才进入薪资',
        icon: 'ri:user-heart-line'
      }
    }
    return {
      eyebrow: 'QUALIFYING LIFE EVENT',
      title: '人生事件与参保窗口',
      description: '用事件日期和窗口截止日控制员工何时可以新增或调整福利保障。',
      boundary: '证明材料独立授权',
      icon: 'ri:calendar-event-line'
    }
  })

  const toSelection = (
    reference?: Api.Hr.BenefitReference | null,
    tenantId?: string
  ): EmployeeIntegrationItem[] =>
    reference
      ? [
          {
            id: reference.id,
            tenantId: tenantId || '',
            employeeNo: reference.employeeNo || '',
            employeeName: reference.employeeName || '未命名员工',
            jobTitle: reference.jobTitle,
            employmentStatus: 'active'
          }
        ]
      : []

  const setFromRecord = (record: RecordItem): void => {
    Object.assign(formModel, createInitialModel(), record)
    if ('employeeId' in record)
      employeeSelection.value = toSelection(record.employee, record.tenantId)
    if ('evidenceUrls' in record) formModel.evidenceText = (record.evidenceUrls ?? []).join('\n')
  }

  const toRecord = (): RecordItem => {
    if (entity.value === 'plan') {
      return {
        id: formModel.id,
        tenantId: formModel.tenantId,
        planCode: formModel.planCode.trim(),
        planName: formModel.planName.trim(),
        planType: formModel.planType,
        providerName: formModel.providerName?.trim() || null,
        enrollmentMethod: formModel.enrollmentMethod,
        coverageScope: formModel.coverageScope,
        currencyCode: formModel.currencyCode.trim().toUpperCase(),
        effectiveFrom: formModel.effectiveFrom,
        effectiveTo: formModel.effectiveTo || null,
        status: 'draft',
        description: formModel.description?.trim() || null
      }
    }
    if (entity.value === 'enrollment') {
      return {
        id: formModel.id,
        tenantId: formModel.tenantId,
        employeeId: formModel.employeeId!,
        planId: formModel.planId!,
        optionId: formModel.optionId!,
        lifeEventId: formModel.lifeEventId || null,
        enrollmentNo: formModel.enrollmentNo || 'AUTO',
        coverageFrom: formModel.coverageFrom,
        coverageTo: formModel.coverageTo || null,
        status: 'draft',
        employeeContribution: formModel.employeeContribution,
        employerContribution: formModel.employerContribution,
        currencyCode: formModel.currencyCode || 'CNY',
        payrollSyncStatus: 'not_ready',
        remark: formModel.remark?.trim() || null
      }
    }
    return {
      id: formModel.id,
      tenantId: formModel.tenantId,
      employeeId: formModel.employeeId!,
      eventType: formModel.eventType,
      eventDate: formModel.eventDate,
      enrollmentWindowEnd: formModel.enrollmentWindowEnd,
      status: 'open',
      evidenceUrls: formModel.evidenceText
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean),
      remark: formModel.remark?.trim() || null
    }
  }

  const validateDates = (): boolean => {
    if (
      entity.value === 'plan' &&
      formModel.effectiveTo &&
      dayjs(formModel.effectiveTo).isBefore(formModel.effectiveFrom, 'day')
    ) {
      ElMessage.warning('计划失效日期不能早于生效日期')
      return false
    }
    if (
      entity.value === 'enrollment' &&
      formModel.coverageTo &&
      dayjs(formModel.coverageTo).isBefore(formModel.coverageFrom, 'day')
    ) {
      ElMessage.warning('保障结束日不能早于开始日')
      return false
    }
    if (
      entity.value === 'event' &&
      dayjs(formModel.enrollmentWindowEnd).isBefore(formModel.eventDate, 'day')
    ) {
      ElMessage.warning('参保窗口截止日不能早于事件日期')
      return false
    }
    return true
  }

  const submit = async (): Promise<boolean> => {
    try {
      await formRef.value?.validate()
      if (!validateDates()) return false
      await saveBenefitRecord(entity.value, toRecord())
      emit('success', entity.value, dialogType.value)
      return true
    } catch {
      return false
    }
  }

  const loadOptions = async (): Promise<void> => {
    if (entity.value !== 'enrollment') return
    const [optionResponse, eventResponse] = await Promise.all([
      fetchBenefitPlanOptions(undefined, formModel.tenantId, true),
      fetchBenefitRecords<Api.Hr.BenefitLifeEvent>('event', {
        tenantId: formModel.tenantId,
        status: 'open',
        from: 0,
        to: 199
      })
    ])
    benefitOptions.value = optionResponse.data ?? []
    lifeEvents.value = eventResponse.data ?? []
  }

  const handleOpen = async (payload: OpenPayload): Promise<void> => {
    entity.value = payload.entity
    dialogType.value = payload.type
    Object.assign(formModel, createInitialModel())
    employeeSelection.value = []
    benefitOptions.value = []
    lifeEvents.value = []
    if (payload.editData) setFromRecord(payload.editData)
    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title: `${payload.type === 'add' ? '新增' : '编辑'}${contextMeta.value.title}`,
      subtitle: '福利计划、员工选择和缴费结果按租户隔离并全程审计',
      confirmText: payload.type === 'add' ? '创建记录' : '保存更改',
      contentMaxHeight: 'calc(100vh - 184px)',
      onOpen: async (_data, api) => {
        api.setLoading(true)
        try {
          if (isPlatformSuper.value && !tenantOptions.value.length) {
            const response = await fetchGetEnableTenantList()
            tenantOptions.value = (response.data ?? []).map((tenant) => ({
              label: `${tenant.tenantName}（${tenant.tenantCode}）`,
              value: tenant.id!
            }))
          }
          if (payload.type === 'edit' && payload.editData?.id) {
            const response = await fetchBenefitDetail(payload.entity, payload.editData.id)
            if (response.data) setFromRecord(response.data)
          }
          await loadOptions()
        } finally {
          api.setLoading(false)
        }
      },
      onConfirm: submit
    })
  }

  watch(
    () => formModel.planId,
    (planId, previousPlanId) => {
      if (planId === previousPlanId) return
      formModel.optionId = undefined
      const plan = benefitOptions.value.find((item) => item.planId === planId)?.plan
      if (plan?.currencyCode) formModel.currencyCode = plan.currencyCode
    }
  )
  watch(
    () => formModel.optionId,
    (optionId) => {
      const option = benefitOptions.value.find((item) => item.id === optionId)
      if (!option) return
      if (option.employeeContribution != null)
        formModel.employeeContribution = option.employeeContribution
      if (option.employerContribution != null)
        formModel.employerContribution = option.employerContribution
    }
  )
  watch(
    () => formModel.tenantId,
    () => {
      if (dialogType.value !== 'add') return
      formModel.employeeId = undefined
      employeeSelection.value = []
    }
  )

  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .benefit-record-dialog {
    display: grid;
    gap: 18px;
    min-width: 0;

    &__context {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr) auto;
      gap: 13px;
      align-items: center;
      padding: 14px 16px;
      background: color-mix(in srgb, var(--theme-color) 6%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 16%, var(--art-card-border));
      border-radius: calc(var(--el-border-radius-base) + 4px);

      > span:first-child {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        color: var(--theme-color);
        background: color-mix(in srgb, var(--theme-color) 11%, transparent);
        border-radius: var(--el-border-radius-base);
      }

      div {
        display: grid;
        min-width: 0;
      }

      small {
        font-size: 10px;
        font-weight: 700;
        color: var(--theme-color);
        letter-spacing: 0.08em;
      }

      strong {
        margin-top: 2px;
        color: var(--art-text-gray-900);
      }

      p {
        margin: 4px 0 0;
        font-size: 12px;
        line-height: 1.55;
        color: var(--art-text-gray-600);
      }
    }

    &__boundary {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 600;
      color: var(--el-color-success-dark-2);
      white-space: nowrap;
      background: var(--el-color-success-light-9);
      border-radius: 999px;
    }
  }

  @media only screen and (width <= 767px) {
    .benefit-record-dialog {
      &__context {
        grid-template-columns: 40px minmax(0, 1fr);
      }

      &__boundary {
        grid-column: 1 / -1;
        justify-self: start;
      }
    }
  }
</style>
