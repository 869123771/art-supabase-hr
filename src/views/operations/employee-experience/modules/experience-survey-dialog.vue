<template>
  <ArtDialog ref="dialogRef" size="lg">
    <div class="experience-survey-dialog">
      <div class="experience-survey-dialog__context" role="note">
        <span aria-hidden="true"><ArtSvgIcon icon="ri:survey-line" /></span>
        <div>
          <small>TRUSTED SURVEY DESIGN</small>
          <strong>调查边界先于题目发布</strong>
          <p>先定义受众、周期与匿名阈值；发布后系统固化参与名单，调查设置不再允许修改。</p>
        </div>
        <span class="experience-survey-dialog__boundary">
          <ArtSvgIcon icon="ri:shield-check-line" />最低 5 人成组
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
      />
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
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import { useUserStore } from '@/store/modules/user'
  import { fetchEmployeeOrganizationOptions, saveEmployeeExperienceRecord } from '@hr/api'
  import type { DialogType } from '@/types'

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
  const organizationOptions = ref<Array<{ label: string; value: string }>>([])

  const createInitialModel = (): Api.Hr.EmployeeExperienceSurvey => ({
    id: undefined,
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    surveyCode: '',
    surveyName: '',
    surveyType: 'pulse',
    cadence: 'one_time',
    audienceType: 'all_active',
    audienceOrganizationId: null,
    minimumGroupSize: 5,
    startDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
    status: 'draft',
    description: ''
  })
  const formModel = reactive<Api.Hr.EmployeeExperienceSurvey>(createInitialModel())
  const dictOptions = (code: string) => getDictMap.value[code] ?? []

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
          placeholder: '请选择调查所属租户',
          onChange: async () => {
            formModel.audienceOrganizationId = null
            await loadOrganizations()
          }
        }
      })
    }
    items.push(
      { label: '调查识别', key: 'identity', type: 'divider', span: 24 },
      {
        label: '调查编码',
        key: 'surveyCode',
        type: 'input',
        props: {
          maxlength: 40,
          placeholder: '例如 ENGAGEMENT-2027-Q1',
          disabled: dialogType.value === 'edit'
        },
        help: '编码用于跨周期追踪，同一租户内不可重复'
      },
      {
        label: '调查名称',
        key: 'surveyName',
        type: 'input',
        props: { maxlength: 120, showWordLimit: true, placeholder: '输入员工可理解的调查名称' }
      },
      {
        label: '调查类型',
        key: 'surveyType',
        type: 'select',
        options: dictOptions('hrExperienceSurveyType')
      },
      {
        label: '开展频率',
        key: 'cadence',
        type: 'select',
        options: dictOptions('hrExperienceCadence')
      },
      { label: '覆盖与匿名保护', key: 'audience', type: 'divider', span: 24 },
      {
        label: '覆盖方式',
        key: 'audienceType',
        type: 'select',
        options: dictOptions('hrExperienceAudienceType'),
        props: {
          onChange: (value: string) => {
            if (value === 'all_active') formModel.audienceOrganizationId = null
          }
        },
        help: '发布时按当日有效任职快照固化参与人员'
      },
      {
        label: '目标组织',
        key: 'audienceOrganizationId',
        type: 'select',
        options: organizationOptions.value,
        hidden: () => formModel.audienceType !== 'organization',
        props: { filterable: true, placeholder: '请选择目标组织' }
      },
      {
        label: '最小匿名阈值',
        key: 'minimumGroupSize',
        type: 'number',
        props: { min: 5, max: 50, controlsPosition: 'right', class: '!w-full' },
        help: '任何主题或组织样本低于此人数时均不返回结果'
      },
      { label: '开放周期', key: 'period', type: 'divider', span: 24 },
      {
        label: '开始日期',
        key: 'startDate',
        type: 'date',
        props: { class: '!w-full', valueFormat: 'YYYY-MM-DD' }
      },
      {
        label: '结束日期',
        key: 'endDate',
        type: 'date',
        props: { class: '!w-full', valueFormat: 'YYYY-MM-DD' }
      },
      {
        label: '调查说明',
        key: 'description',
        type: 'input',
        span: 24,
        props: {
          type: 'textarea',
          rows: 4,
          maxlength: 1000,
          showWordLimit: true,
          placeholder: '向员工说明调查目的、预计用时与匿名保护方式'
        }
      }
    )
    return items
  })

  const form = reactive<{
    model: Api.Hr.EmployeeExperienceSurvey
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<Api.Hr.EmployeeExperienceSurvey>>
  }>({
    model: formModel,
    items: formItems,
    rules: computed(() => ({
      tenantId: isPlatformSuper.value
        ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
        : [],
      surveyCode: [{ required: true, message: '请输入调查编码', trigger: 'blur' }],
      surveyName: [{ required: true, message: '请输入调查名称', trigger: 'blur' }],
      surveyType: [{ required: true, message: '请选择调查类型', trigger: 'change' }],
      cadence: [{ required: true, message: '请选择开展频率', trigger: 'change' }],
      audienceType: [{ required: true, message: '请选择覆盖方式', trigger: 'change' }],
      audienceOrganizationId:
        formModel.audienceType === 'organization'
          ? [{ required: true, message: '请选择目标组织', trigger: 'change' }]
          : [],
      minimumGroupSize: [{ required: true, message: '请输入匿名阈值', trigger: 'change' }],
      startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
      endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
    }))
  })

  const loadTenants = async (): Promise<void> => {
    if (!isPlatformSuper.value || tenantOptions.value.length) return
    const response = await fetchGetEnableTenantList()
    tenantOptions.value = (response.data ?? []).map((tenant) => ({
      label: `${tenant.tenantName}（${tenant.tenantCode}）`,
      value: tenant.id!
    }))
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
      if (formModel.audienceType === 'organization' && !formModel.audienceOrganizationId) {
        ElMessage.warning('组织定向调查需要选择目标组织')
        return false
      }
      if (dayjs(formModel.endDate).isBefore(dayjs(formModel.startDate), 'day')) {
        ElMessage.warning('结束日期不能早于开始日期')
        return false
      }
      await saveEmployeeExperienceRecord('survey', {
        ...formModel,
        surveyCode: formModel.surveyCode.trim().toUpperCase(),
        surveyName: formModel.surveyName.trim(),
        audienceOrganizationId:
          formModel.audienceType === 'organization' ? formModel.audienceOrganizationId : null,
        description: formModel.description?.trim() || null
      })
      emit('success', dialogType.value)
      return true
    } catch (error) {
      if (error instanceof Error && error.message) ElMessage.warning(error.message)
      return false
    }
  }

  const handleOpen = async (
    type: DialogType,
    editData?: Api.Hr.EmployeeExperienceSurvey
  ): Promise<void> => {
    dialogType.value = type
    Object.assign(formModel, createInitialModel(), editData ?? {})
    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title: `${type === 'add' ? '新建' : '编辑'}员工体验调查`,
      subtitle: '调查发布前可维护配置与题目，发布后设置与受众快照冻结',
      confirmText: type === 'add' ? '创建草稿' : '保存设置',
      contentMaxHeight: 'calc(100vh - 184px)',
      onOpen: async (_data, api) => {
        api.setLoading(true)
        try {
          await Promise.all([loadTenants(), loadOrganizations()])
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

  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .experience-survey-dialog {
    display: grid;
    gap: 18px;

    &__context {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto;
      gap: 13px;
      align-items: center;
      padding: 15px 16px;
      background: color-mix(in srgb, var(--theme-color) 5%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 15%, var(--art-card-border));
      border-radius: calc(var(--el-border-radius-base) + 4px);

      > span:first-child {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        color: var(--theme-color);
        background: color-mix(in srgb, var(--theme-color) 11%, transparent);
        border-radius: var(--el-border-radius-base);
      }

      div {
        display: grid;
        min-width: 0;
      }

      small {
        font-size: 9px;
        font-weight: 750;
        color: var(--theme-color);
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
    .experience-survey-dialog__context {
      grid-template-columns: 40px minmax(0, 1fr);

      > span:first-child {
        width: 40px;
        height: 40px;
      }
    }

    .experience-survey-dialog__boundary {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
</style>
