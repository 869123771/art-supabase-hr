<template>
  <ArtDialog ref="dialogRef" size="lg">
    <div class="policy-dialog">
      <section class="policy-dialog__context" role="note">
        <span aria-hidden="true"><ArtSvgIcon icon="ri:file-shield-2-line" /></span>
        <div>
          <small>CONTROLLED POLICY VERSION</small>
          <strong>政策版本与适用人群</strong>
          <p>发布时固化适用员工清单；已发布版本不可覆盖修改，后续调整必须新建版本。</p>
        </div>
        <span class="policy-dialog__boundary"> <ArtSvgIcon icon="ri:lock-line" />发布后只读 </span>
      </section>

      <section class="policy-dialog__notice">
        <ArtSvgIcon icon="ri:information-line" />
        <span>
          文档引用用于关联制度正文或受控文档库地址。政策摘要不能代替正式文件，发布前请复核版本、范围、生效日与签收时限。
        </span>
      </section>

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
  import { fetchPolicyAcknowledgementOptions, savePolicyDocument } from '@hr/api'
  import type { DialogType } from '@/types'

  interface OpenPayload {
    type: DialogType
    editData?: Api.Hr.HrPolicyDocument
  }

  interface FormModel {
    id?: string
    tenantId?: string
    policyCode: string
    policyTitle: string
    category: string
    versionNo: number
    effectiveDate: string
    acknowledgementDueDays: number
    audienceType: Api.Hr.HrPolicyDocument['audienceType']
    audienceOrganizationId?: string
    audienceEmploymentType?: string
    documentReference: string
    contentSummary: string
    supersedesPolicyId?: string
    decisionNote?: string
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean | void>
    clearValidate: () => void
  }

  const emit = defineEmits<{ success: [type: DialogType] }>()
  const userStore = useUserStore()
  const { getUserInfo, isPlatformSuper } = storeToRefs(userStore)
  const dialogRef = ref<ArtDialogExpose>()
  const formRef = ref<ArtFormExpose>()
  const dialogType = ref<DialogType>('add')
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const organizationOptions = ref<Array<{ label: string; value: string }>>([])
  const policyOptions = ref<Array<{ label: string; value: string }>>([])

  const createInitialModel = (): FormModel => ({
    id: undefined,
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    policyCode: '',
    policyTitle: '',
    category: '',
    versionNo: 1,
    effectiveDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    acknowledgementDueDays: 7,
    audienceType: 'all',
    audienceOrganizationId: undefined,
    audienceEmploymentType: undefined,
    documentReference: '',
    contentSummary: '',
    supersedesPolicyId: undefined,
    decisionNote: undefined
  })
  const formModel = reactive<FormModel>(createInitialModel())

  const tenantItems = computed<FormItem[]>(() =>
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
  )

  const formItems = computed<FormItem[]>(() => [
    ...tenantItems.value,
    { label: '版本身份', key: 'versionIdentity', type: 'divider', span: 24 },
    { label: '政策编码', key: 'policyCode', type: 'input', props: { maxlength: 40 } },
    { label: '政策名称', key: 'policyTitle', type: 'input', props: { maxlength: 160 } },
    {
      label: '政策分类',
      key: 'category',
      type: 'select',
      options: ['人事管理', '行为准则', '信息安全', '健康安全', '合规治理', '薪酬福利'].map(
        (value) => ({ label: value, value })
      ),
      props: { filterable: true, allowCreate: true, defaultFirstOption: true }
    },
    {
      label: '版本号',
      key: 'versionNo',
      type: 'number',
      props: { min: 1, max: 999, precision: 0, class: '!w-full' }
    },
    { label: '生效与签收', key: 'deliveryTiming', type: 'divider', span: 24 },
    { label: '生效日期', key: 'effectiveDate', type: 'date', props: { class: '!w-full' } },
    {
      label: '签收时限（天）',
      key: 'acknowledgementDueDays',
      type: 'number',
      props: { min: 0, max: 365, precision: 0, class: '!w-full' }
    },
    {
      label: '适用人群',
      key: 'audienceType',
      type: 'select',
      options: [
        { label: '全部在册员工', value: 'all' },
        { label: '指定组织及下级组织', value: 'organization' },
        { label: '指定用工类型', value: 'employment_type' }
      ]
    },
    ...(formModel.audienceType === 'organization'
      ? [
          {
            label: '适用组织',
            key: 'audienceOrganizationId',
            type: 'select' as const,
            options: organizationOptions.value,
            props: { filterable: true, placeholder: '请选择组织（含下级组织）' }
          }
        ]
      : []),
    ...(formModel.audienceType === 'employment_type'
      ? [
          {
            label: '用工类型',
            key: 'audienceEmploymentType',
            type: 'select' as const,
            options: [
              { label: '全职', value: 'full_time' },
              { label: '兼职', value: 'part_time' },
              { label: '实习', value: 'intern' },
              { label: '合同制', value: 'contractor' }
            ]
          }
        ]
      : []),
    { label: '受控内容', key: 'controlledContent', type: 'divider', span: 24 },
    {
      label: '文档引用',
      key: 'documentReference',
      type: 'input',
      span: 24,
      props: { maxlength: 500, placeholder: '文档库编号、受控文件路径或 HTTPS 地址' }
    },
    {
      label: '政策摘要',
      key: 'contentSummary',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 4, maxlength: 1200, showWordLimit: true }
    },
    {
      label: '替代既有版本',
      key: 'supersedesPolicyId',
      type: 'select',
      options: policyOptions.value,
      props: { clearable: true, filterable: true, placeholder: '可选；编码必须与新版本一致' }
    },
    {
      label: '版本说明',
      key: 'decisionNote',
      type: 'input',
      props: { maxlength: 600, placeholder: '说明本次制定或修订原因' }
    }
  ])

  const formRules = computed<FormRules<FormModel>>(() => ({
    tenantId: isPlatformSuper.value
      ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
      : [],
    policyCode: [{ required: true, message: '请输入政策编码', trigger: 'blur' }],
    policyTitle: [{ required: true, message: '请输入政策名称', trigger: 'blur' }],
    category: [{ required: true, message: '请选择或输入政策分类', trigger: 'change' }],
    versionNo: [{ required: true, message: '请输入版本号', trigger: 'change' }],
    effectiveDate: [{ required: true, message: '请选择生效日期', trigger: 'change' }],
    acknowledgementDueDays: [{ required: true, message: '请输入签收时限', trigger: 'change' }],
    audienceType: [{ required: true, message: '请选择适用人群', trigger: 'change' }],
    audienceOrganizationId:
      formModel.audienceType === 'organization'
        ? [{ required: true, message: '请选择适用组织', trigger: 'change' }]
        : [],
    audienceEmploymentType:
      formModel.audienceType === 'employment_type'
        ? [{ required: true, message: '请选择用工类型', trigger: 'change' }]
        : [],
    documentReference: [{ required: true, message: '请输入文档引用', trigger: 'blur' }],
    contentSummary: [{ required: true, message: '请输入政策摘要', trigger: 'blur' }]
  }))

  const form = reactive<{
    model: FormModel
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<FormModel>>
  }>({ model: formModel, items: formItems, rules: formRules })

  const loadReferences = async (): Promise<void> => {
    if (!formModel.tenantId && isPlatformSuper.value) return
    const [organizationResponse, policyResponse] = await Promise.all([
      fetchPolicyAcknowledgementOptions('organization', formModel.tenantId),
      fetchPolicyAcknowledgementOptions('policy', formModel.tenantId)
    ])
    organizationOptions.value = (organizationResponse.data ?? []).map((item) => ({
      label: `${item.name}${item.code ? `（${item.code}）` : ''}`,
      value: item.id
    }))
    policyOptions.value = (policyResponse.data ?? [])
      .filter((item) => item.id !== formModel.id)
      .map((item) => ({
        label: `${item.name}${item.code ? ` · ${item.code}` : ''}`,
        value: item.id
      }))
  }

  const validateBusinessRules = (): boolean => {
    if (formModel.audienceType === 'organization' && !formModel.audienceOrganizationId) {
      ElMessage.warning('请选择适用组织')
      return false
    }
    if (formModel.audienceType === 'employment_type' && !formModel.audienceEmploymentType) {
      ElMessage.warning('请选择适用用工类型')
      return false
    }
    return true
  }

  const toRecord = (): Api.Hr.HrPolicyDocument => ({
    id: formModel.id,
    tenantId: formModel.tenantId,
    policyCode: formModel.policyCode.trim(),
    policyTitle: formModel.policyTitle.trim(),
    category: formModel.category.trim(),
    versionNo: formModel.versionNo,
    effectiveDate: formModel.effectiveDate,
    acknowledgementDueDays: formModel.acknowledgementDueDays,
    audienceType: formModel.audienceType,
    audienceOrganizationId:
      formModel.audienceType === 'organization' ? formModel.audienceOrganizationId : null,
    audienceEmploymentType:
      formModel.audienceType === 'employment_type' ? formModel.audienceEmploymentType : null,
    documentReference: formModel.documentReference.trim(),
    contentSummary: formModel.contentSummary.trim(),
    status: 'draft',
    supersedesPolicyId: formModel.supersedesPolicyId || null,
    decisionNote: formModel.decisionNote?.trim() || null
  })

  const submit = async (): Promise<boolean> => {
    try {
      await formRef.value?.validate()
      if (!validateBusinessRules()) return false
      await savePolicyDocument(toRecord())
      emit('success', dialogType.value)
      return true
    } catch {
      return false
    }
  }

  const handleOpen = async (payload: OpenPayload): Promise<void> => {
    dialogType.value = payload.type
    Object.assign(formModel, createInitialModel(), payload.editData ?? {})
    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title: payload.type === 'add' ? '新建政策版本' : '编辑政策草稿',
      subtitle: '政策编码、版本、适用范围和送达规则共同构成受控发布基线',
      confirmText: payload.type === 'add' ? '创建草稿' : '保存草稿',
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
          await loadReferences()
        } finally {
          api.setLoading(false)
        }
      },
      onConfirm: submit
    })
  }

  watch(
    () => formModel.tenantId,
    async (tenantId, previousTenantId) => {
      if (!tenantId || tenantId === previousTenantId || dialogType.value !== 'add') return
      formModel.audienceOrganizationId = undefined
      formModel.supersedesPolicyId = undefined
      await loadReferences()
    }
  )
  watch(
    () => formModel.audienceType,
    (audienceType) => {
      if (audienceType !== 'organization') formModel.audienceOrganizationId = undefined
      if (audienceType !== 'employment_type') formModel.audienceEmploymentType = undefined
    }
  )

  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .policy-dialog {
    display: grid;
    gap: 16px;
    min-width: 0;

    &__context {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      padding: 15px 16px;
      background: color-mix(in srgb, var(--theme-color) 6%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 17%, var(--art-card-border));
      border-radius: 12px;

      > span:first-child {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        font-size: 20px;
        color: var(--theme-color);
        background: color-mix(in srgb, var(--theme-color) 11%, transparent);
        border-radius: 11px;
      }

      div {
        display: grid;
        min-width: 0;
      }

      small {
        font-size: 10px;
        font-weight: 700;
        color: var(--theme-color);
        letter-spacing: 0.13em;
      }

      strong {
        margin-top: 2px;
        font-size: 16px;
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

    &__notice {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.55;
      color: var(--art-text-gray-650);
      background: var(--art-main-bg-color);
      border: 1px dashed var(--art-card-border);
      border-radius: 10px;

      svg {
        flex: 0 0 auto;
        margin-top: 2px;
        color: var(--theme-color);
      }
    }
  }

  @media only screen and (width <= 767px) {
    .policy-dialog__context {
      grid-template-columns: 44px minmax(0, 1fr);
    }

    .policy-dialog__boundary {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
</style>
