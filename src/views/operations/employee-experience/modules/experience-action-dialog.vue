<template>
  <ArtDialog ref="dialogRef" size="lg">
    <div class="experience-action-dialog">
      <div class="experience-action-dialog__context" role="note">
        <span aria-hidden="true"><ArtSvgIcon icon="ri:route-line" /></span>
        <div>
          <small>AGGREGATE INSIGHT TO ACTION</small>
          <strong>把主题洞察转成可验收的组织行动</strong>
          <p>行动只关联达到匿名阈值的聚合主题，不建立与个人答案的任何引用。</p>
        </div>
        <span class="experience-action-dialog__boundary">
          <ArtSvgIcon icon="ri:user-follow-line" />负责人 + 期限 + 成功标准
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
        <template #ownerEmployeeId>
          <ArtEmployeeSelect
            v-model="form.model.ownerEmployeeId"
            v-model:selected-data="ownerSelection"
            :tenant-id="form.model.tenantId"
            title="选择改善行动负责人"
            subtitle="负责人承担执行、进度维护与成果验收"
            placeholder="请选择行动负责人"
          />
        </template>
      </ArtForm>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import { ElMessage, type FormRules } from 'element-plus'
  import ArtDialog from '@/components/core/dialogs/art-dialog/index.vue'
  import type { ArtDialogExpose } from '@/components/core/dialogs/art-dialog/types'
  import ArtForm, { type FormItem } from '@/components/core/forms/art-form/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtEmployeeSelect from '@/components/business/art-employee-select/index.vue'
  import type { EmployeeIntegrationItem } from '@/api/integration/employees'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import { useUserStore } from '@/store/modules/user'
  import {
    fetchEmployeeExperienceRecords,
    fetchEmployeeOrganizationOptions,
    saveEmployeeExperienceRecord
  } from '@hr/api'
  import type { DialogType } from '@/types'

  interface OpenPayload {
    type: DialogType
    editData?: Api.Hr.EmployeeExperienceAction
    presetSurvey?: Api.Hr.EmployeeExperienceReference
    presetDimension?: string
  }
  interface ArtFormExpose {
    validate: () => Promise<boolean | void>
    clearValidate: () => void
  }

  const emit = defineEmits<{ success: [type: DialogType] }>()
  const userStore = useUserStore()
  const { getDictMap, getUserInfo, isPlatformSuper } = storeToRefs(userStore)
  const dialogRef = ref<ArtDialogExpose>()
  const formRef = ref<ArtFormExpose>()
  const dialogType = ref<DialogType>('add')
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const surveys = ref<Api.Hr.EmployeeExperienceSurvey[]>([])
  const organizationOptions = ref<Array<{ label: string; value: string }>>([])
  const ownerSelection = ref<EmployeeIntegrationItem[]>([])

  const createInitialModel = (): Api.Hr.EmployeeExperienceAction => ({
    id: undefined,
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    surveyId: '',
    organizationId: null,
    dimension: 'engagement',
    title: '',
    ownerEmployeeId: '',
    dueDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    status: 'planned',
    successMeasure: '',
    progressNote: ''
  })
  const formModel = reactive<Api.Hr.EmployeeExperienceAction>(createInitialModel())
  const dictOptions = (code: string) => getDictMap.value[code] ?? []
  const surveyOptions = computed(() =>
    surveys.value
      .filter((survey) => !formModel.tenantId || survey.tenantId === formModel.tenantId)
      .map((survey) => ({
        label: `${survey.surveyName}（${survey.surveyCode}）`,
        value: survey.id!
      }))
  )
  const selectedSurvey = computed(() =>
    surveys.value.find((survey) => survey.id === formModel.surveyId)
  )
  const formItems = computed<FormItem[]>(() => {
    const items: FormItem[] = []
    if (isPlatformSuper.value) {
      items.push({
        label: '所属租户',
        key: 'tenantId',
        type: 'select',
        span: 24,
        options: tenantOptions.value,
        props: {
          filterable: true,
          disabled: Boolean(formModel.id),
          placeholder: '请选择行动所属租户',
          onChange: async () => {
            formModel.surveyId = ''
            formModel.organizationId = null
            formModel.ownerEmployeeId = ''
            ownerSelection.value = []
            await loadOrganizations()
          }
        }
      })
    }
    items.push(
      { label: '洞察来源', key: 'source', type: 'divider', span: 24 },
      {
        label: '关联调查',
        key: 'surveyId',
        type: 'select',
        span: 24,
        options: surveyOptions.value,
        props: {
          filterable: true,
          disabled: Boolean(formModel.id),
          placeholder: '请选择收集中或已关闭的调查',
          onChange: (value: string) => {
            const survey = surveys.value.find((item) => item.id === value)
            if (survey?.tenantId && survey.tenantId !== formModel.tenantId) {
              formModel.tenantId = survey.tenantId
              formModel.organizationId = null
              formModel.ownerEmployeeId = ''
              ownerSelection.value = []
              void loadOrganizations()
            }
          }
        },
        help: selectedSurvey.value
          ? `${selectedSurvey.value.status === 'open' ? '正在收集' : '已关闭'} · 匿名阈值 ${selectedSurvey.value.minimumGroupSize} 人`
          : '行动必须关联收集中或已关闭的员工体验调查'
      },
      {
        label: '改善主题',
        key: 'dimension',
        type: 'select',
        options: dictOptions('hrExperienceDimension')
      },
      {
        label: '行动组织',
        key: 'organizationId',
        type: 'select',
        options: organizationOptions.value,
        props: { clearable: true, filterable: true, placeholder: '可选：不选表示全组织行动' }
      },
      { label: '责任与期限', key: 'accountability', type: 'divider', span: 24 },
      { label: '行动负责人', key: 'ownerEmployeeId', type: 'input' },
      {
        label: '计划完成日',
        key: 'dueDate',
        type: 'date',
        props: { class: '!w-full', valueFormat: 'YYYY-MM-DD' }
      },
      {
        label: '行动名称',
        key: 'title',
        type: 'input',
        span: 24,
        props: {
          maxlength: 160,
          showWordLimit: true,
          placeholder: '用动词开头，明确要改变的组织实践'
        }
      },
      {
        label: '成功标准',
        key: 'successMeasure',
        type: 'input',
        span: 24,
        props: {
          type: 'textarea',
          rows: 4,
          maxlength: 1000,
          showWordLimit: true,
          placeholder: '定义可以验收的结果、覆盖范围或下一轮调查目标'
        }
      },
      {
        label: '当前进展',
        key: 'progressNote',
        type: 'input',
        span: 24,
        props: {
          type: 'textarea',
          rows: 3,
          maxlength: 1000,
          showWordLimit: true,
          placeholder: '可选：记录当前计划、依赖和阶段性进展'
        }
      }
    )
    return items
  })
  const form = reactive<{
    model: Api.Hr.EmployeeExperienceAction
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<Api.Hr.EmployeeExperienceAction>>
  }>({
    model: formModel,
    items: formItems,
    rules: computed(() => ({
      tenantId: isPlatformSuper.value
        ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
        : [],
      surveyId: [{ required: true, message: '请选择关联调查', trigger: 'change' }],
      dimension: [{ required: true, message: '请选择改善主题', trigger: 'change' }],
      title: [{ required: true, message: '请输入行动名称', trigger: 'blur' }],
      ownerEmployeeId: [{ required: true, message: '请选择行动负责人', trigger: 'change' }],
      dueDate: [{ required: true, message: '请选择计划完成日', trigger: 'change' }],
      successMeasure: [{ required: true, message: '请输入成功标准', trigger: 'blur' }]
    }))
  })

  const toSelection = (
    reference?: Api.Hr.EmployeeExperienceReference | null,
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
  const loadTenants = async (): Promise<void> => {
    if (!isPlatformSuper.value || tenantOptions.value.length) return
    const response = await fetchGetEnableTenantList()
    tenantOptions.value = (response.data ?? []).map((tenant) => ({
      label: `${tenant.tenantName}（${tenant.tenantCode}）`,
      value: tenant.id!
    }))
  }
  const loadSurveys = async (): Promise<void> => {
    const response = await fetchEmployeeExperienceRecords<Api.Hr.EmployeeExperienceSurvey>(
      'survey',
      { tenantId: formModel.tenantId, from: 0, to: 199 }
    )
    surveys.value = (response.data ?? []).filter((survey) =>
      ['open', 'closed'].includes(survey.status)
    )
  }
  const loadOrganizations = async (): Promise<void> => {
    if (!formModel.tenantId) {
      organizationOptions.value = []
      return
    }
    const response = await fetchEmployeeOrganizationOptions({ tenantId: formModel.tenantId })
    organizationOptions.value = (response.data ?? []).map((organization) => ({
      label: `${organization.organizationName} · ${organization.organizationCode}`,
      value: organization.id!
    }))
  }
  const submit = async (): Promise<boolean> => {
    try {
      await formRef.value?.validate()
      if (dayjs(formModel.dueDate).isBefore(dayjs(), 'day')) {
        ElMessage.warning('计划完成日不能早于今天')
        return false
      }
      await saveEmployeeExperienceRecord('action', {
        ...formModel,
        title: formModel.title.trim(),
        successMeasure: formModel.successMeasure.trim(),
        progressNote: formModel.progressNote?.trim() || null
      })
      emit('success', dialogType.value)
      return true
    } catch (error) {
      if (error instanceof Error && error.message) ElMessage.warning(error.message)
      return false
    }
  }
  const handleOpen = async (payload: OpenPayload): Promise<void> => {
    dialogType.value = payload.type
    Object.assign(formModel, createInitialModel(), payload.editData ?? {})
    if (payload.presetSurvey) {
      formModel.tenantId = payload.presetSurvey.tenantId
      formModel.surveyId = payload.presetSurvey.id
    }
    if (payload.presetDimension) formModel.dimension = payload.presetDimension
    ownerSelection.value = toSelection(payload.editData?.ownerEmployee, formModel.tenantId)
    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title: `${payload.type === 'add' ? '新增' : '编辑'}员工体验改善行动`,
      subtitle: '行动从匿名聚合主题出发，不连接任何员工个人答卷',
      confirmText: payload.type === 'add' ? '创建行动' : '保存行动',
      contentMaxHeight: 'calc(100vh - 184px)',
      onOpen: async (_data, api) => {
        api.setLoading(true)
        try {
          await Promise.all([loadTenants(), loadSurveys(), loadOrganizations()])
          if (
            payload.presetSurvey &&
            !surveys.value.some((item) => item.id === payload.presetSurvey?.id)
          ) {
            surveys.value.unshift({
              ...createSurveyFallback(payload.presetSurvey),
              status: 'open'
            })
          }
        } finally {
          api.setLoading(false)
        }
      },
      onConfirm: async (_data, api) => {
        api.setLoading(true)
        try {
          return await submit()
        } finally {
          api.setLoading(false)
        }
      }
    })
  }

  const createSurveyFallback = (
    reference: Api.Hr.EmployeeExperienceReference
  ): Api.Hr.EmployeeExperienceSurvey => ({
    id: reference.id,
    tenantId: reference.tenantId,
    surveyCode: reference.surveyCode || '',
    surveyName: reference.surveyName || '员工体验调查',
    surveyType: reference.surveyType || 'ad_hoc',
    cadence: 'one_time',
    audienceType: 'all_active',
    minimumGroupSize: 5,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    status: 'open'
  })

  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .experience-action-dialog {
    display: grid;
    gap: 18px;

    &__context {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto;
      gap: 13px;
      align-items: center;
      padding: 15px 16px;
      background: color-mix(in srgb, var(--el-color-success) 5%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--el-color-success) 16%, var(--art-card-border));
      border-radius: calc(var(--el-border-radius-base) + 4px);

      > span:first-child {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        color: var(--el-color-success-dark-2);
        background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
        border-radius: var(--el-border-radius-base);
      }

      div {
        display: grid;
        min-width: 0;
      }

      small {
        font-size: 9px;
        font-weight: 750;
        color: var(--el-color-success-dark-2);
        letter-spacing: 0.1em;
      }

      strong {
        margin-top: 2px;
        font-size: 15px;
        color: var(--art-text-gray-900);
      }

      p {
        margin: 3px 0 0;
        font-size: 12px;
        line-height: 1.55;
        color: var(--art-text-gray-600);
      }
    }

    &__boundary {
      display: inline-flex;
      gap: 5px;
      align-items: center;
      padding: 6px 9px;
      font-size: 11px;
      font-weight: 650;
      color: var(--el-color-success-dark-2);
      background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
      border-radius: 999px;
    }
  }

  @media only screen and (width <= 767px) {
    .experience-action-dialog__context {
      grid-template-columns: 40px minmax(0, 1fr);

      > span:first-child {
        width: 40px;
        height: 40px;
      }
    }

    .experience-action-dialog__boundary {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
</style>
