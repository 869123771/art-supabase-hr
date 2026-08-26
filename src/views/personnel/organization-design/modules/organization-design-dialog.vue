<template>
  <ArtDialog ref="dialogRef" size="lg">
    <div class="org-design-dialog">
      <section class="org-design-dialog__context" role="note">
        <span aria-hidden="true"
          ><ArtSvgIcon :icon="entity === 'scenario' ? 'ri:git-branch-line' : 'ri:node-tree'"
        /></span>
        <div>
          <small>{{
            entity === 'scenario' ? 'CHANGE SCENARIO' : 'PROPOSED ORGANIZATION DELTA'
          }}</small>
          <strong>{{ entity === 'scenario' ? '组织变革情景方案' : '组织结构变更项' }}</strong>
          <p>{{
            entity === 'scenario'
              ? '定义变革目标、生效窗口和责任人，方案评审前不会影响当前组织。'
              : '仅记录拟议变化；提交评审时才固化关联员工、岗位、招聘、权限和政策范围影响。'
          }}</p>
        </div>
        <span class="org-design-dialog__boundary"
          ><ArtSvgIcon icon="ri:shield-check-line" />不直接改主数据</span
        >
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
  import {
    fetchOrganizationDesignOptions,
    saveOrganizationDesignChange,
    saveOrganizationDesignScenario
  } from '@hr/api'
  import type { DialogType } from '@/types'

  type Entity = Api.Hr.OrganizationDesignEntity
  type RecordItem = Api.Hr.OrganizationDesignRecord

  interface OpenPayload {
    entity: Entity
    type: DialogType
    editData?: RecordItem
    scenario?: Api.Hr.OrganizationDesignScenario
  }

  interface FormModel {
    id?: string
    tenantId?: string
    scenarioCode: string
    scenarioName: string
    objective: string
    effectiveDate: string
    ownerEmployeeId?: string
    version: number
    scenarioId?: string
    changeType: Api.Hr.OrganizationChangeType
    organizationId?: string
    proposedParentId?: string
    proposedCode?: string
    proposedName?: string
    proposedType?: string
    rationale: string
    sequence: number
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean | void>
    clearValidate: () => void
  }

  const emit = defineEmits<{ success: [entity: Entity, type: DialogType] }>()
  const userStore = useUserStore()
  const { getUserInfo, isPlatformSuper } = storeToRefs(userStore)
  const dialogRef = ref<ArtDialogExpose>()
  const formRef = ref<ArtFormExpose>()
  const entity = ref<Entity>('scenario')
  const dialogType = ref<DialogType>('add')
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const references = reactive({
    organizations: [] as Api.Hr.OrganizationDesignReference[],
    employees: [] as Api.Hr.OrganizationDesignReference[],
    scenarios: [] as Api.Hr.OrganizationDesignReference[]
  })

  const createInitialModel = (): FormModel => ({
    id: undefined,
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    scenarioCode: '',
    scenarioName: '',
    objective: '',
    effectiveDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    ownerEmployeeId: undefined,
    version: 1,
    scenarioId: undefined,
    changeType: 'create',
    organizationId: undefined,
    proposedParentId: undefined,
    proposedCode: undefined,
    proposedName: undefined,
    proposedType: 'department',
    rationale: '',
    sequence: 10
  })
  const formModel = reactive<FormModel>(createInitialModel())
  const toOptions = (items: Api.Hr.OrganizationDesignReference[]) =>
    items.map((item) => ({
      label: `${item.name}${item.code ? `（${item.code}）` : ''}`,
      value: item.id
    }))
  const tenantItems = computed<FormItem[]>(() =>
    isPlatformSuper.value
      ? [
          {
            label: '所属租户',
            key: 'tenantId',
            type: 'select',
            span: 24,
            options: tenantOptions.value,
            props: { filterable: true }
          }
        ]
      : []
  )

  const scenarioItems = computed<FormItem[]>(() => [
    ...tenantItems.value,
    { label: '方案定义', key: 'scenarioDefinition', type: 'divider', span: 24 },
    { label: '方案编码', key: 'scenarioCode', type: 'input', props: { maxlength: 40 } },
    { label: '方案名称', key: 'scenarioName', type: 'input', props: { maxlength: 160 } },
    { label: '计划生效日', key: 'effectiveDate', type: 'date', props: { class: '!w-full' } },
    {
      label: '方案负责人',
      key: 'ownerEmployeeId',
      type: 'select',
      options: toOptions(references.employees),
      props: { clearable: true, filterable: true }
    },
    {
      label: '变革目标与业务理由',
      key: 'objective',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 4, maxlength: 1000, showWordLimit: true }
    }
  ])

  const changeItems = computed<FormItem[]>(() => [
    ...tenantItems.value,
    { label: '方案与动作', key: 'changeDefinition', type: 'divider', span: 24 },
    {
      label: '所属方案',
      key: 'scenarioId',
      type: 'select',
      options: toOptions(references.scenarios),
      props: { filterable: true, disabled: Boolean(formModel.id) }
    },
    {
      label: '变更类型',
      key: 'changeType',
      type: 'select',
      options: [
        { label: '新增组织', value: 'create' },
        { label: '组织更名', value: 'rename' },
        { label: '调整上级', value: 'reparent' },
        { label: '停用组织', value: 'inactivate' }
      ]
    },
    ...(formModel.changeType !== 'create'
      ? [
          {
            label: '目标组织',
            key: 'organizationId',
            type: 'select' as const,
            options: toOptions(references.organizations),
            props: { filterable: true, disabled: Boolean(formModel.id) }
          }
        ]
      : []),
    ...(['create', 'reparent'].includes(formModel.changeType)
      ? [
          {
            label: '拟上级组织',
            key: 'proposedParentId',
            type: 'select' as const,
            options: toOptions(references.organizations),
            props: { clearable: formModel.changeType === 'create', filterable: true }
          }
        ]
      : []),
    ...(formModel.changeType === 'create'
      ? [
          {
            label: '拟组织编码',
            key: 'proposedCode',
            type: 'input' as const,
            props: { maxlength: 50 }
          },
          {
            label: '拟组织名称',
            key: 'proposedName',
            type: 'input' as const,
            props: { maxlength: 160 }
          },
          {
            label: '拟组织类型',
            key: 'proposedType',
            type: 'select' as const,
            options: [
              { label: '公司', value: 'company' },
              { label: '事业部', value: 'division' },
              { label: '部门', value: 'department' },
              { label: '团队', value: 'team' }
            ]
          }
        ]
      : []),
    ...(formModel.changeType === 'rename'
      ? [
          {
            label: '拟组织名称',
            key: 'proposedName',
            type: 'input' as const,
            props: { maxlength: 160 }
          }
        ]
      : []),
    { label: '变更说明', key: 'changeRationale', type: 'divider', span: 24 },
    {
      label: '执行顺序',
      key: 'sequence',
      type: 'number',
      props: { min: 0, max: 9999, precision: 0, class: '!w-full' }
    },
    {
      label: '业务理由与预期结果',
      key: 'rationale',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 4, maxlength: 1000, showWordLimit: true }
    }
  ])

  const formRules = computed<FormRules<FormModel>>(() => ({
    tenantId: isPlatformSuper.value
      ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
      : [],
    scenarioCode:
      entity.value === 'scenario' ? [{ required: true, message: '请输入方案编码' }] : [],
    scenarioName:
      entity.value === 'scenario' ? [{ required: true, message: '请输入方案名称' }] : [],
    objective: entity.value === 'scenario' ? [{ required: true, message: '请输入变革目标' }] : [],
    effectiveDate:
      entity.value === 'scenario' ? [{ required: true, message: '请选择计划生效日' }] : [],
    scenarioId: entity.value === 'change' ? [{ required: true, message: '请选择所属方案' }] : [],
    changeType: entity.value === 'change' ? [{ required: true, message: '请选择变更类型' }] : [],
    organizationId:
      entity.value === 'change' && formModel.changeType !== 'create'
        ? [{ required: true, message: '请选择目标组织' }]
        : [],
    proposedParentId:
      entity.value === 'change' && formModel.changeType === 'reparent'
        ? [{ required: true, message: '请选择拟上级组织' }]
        : [],
    proposedCode:
      entity.value === 'change' && formModel.changeType === 'create'
        ? [{ required: true, message: '请输入拟组织编码' }]
        : [],
    proposedName:
      entity.value === 'change' && ['create', 'rename'].includes(formModel.changeType)
        ? [{ required: true, message: '请输入拟组织名称' }]
        : [],
    proposedType:
      entity.value === 'change' && formModel.changeType === 'create'
        ? [{ required: true, message: '请选择拟组织类型' }]
        : [],
    rationale: entity.value === 'change' ? [{ required: true, message: '请输入业务理由' }] : []
  }))
  const form = reactive<{
    model: FormModel
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<FormModel>>
  }>({
    model: formModel,
    items: computed(() => (entity.value === 'scenario' ? scenarioItems.value : changeItems.value)),
    rules: formRules
  })

  const loadReferences = async (): Promise<void> => {
    if (!formModel.tenantId && isPlatformSuper.value) return
    const kinds =
      entity.value === 'scenario'
        ? (['employee'] as const)
        : (['organization', 'scenario'] as const)
    const responses = await Promise.all(
      kinds.map((kind) => fetchOrganizationDesignOptions(kind, formModel.tenantId))
    )
    kinds.forEach((kind, index) => {
      references[`${kind}s` as keyof typeof references] = responses[index]?.data ?? []
    })
  }
  const submit = async (): Promise<boolean> => {
    try {
      await formRef.value?.validate()
      if (
        entity.value === 'change' &&
        formModel.changeType === 'reparent' &&
        formModel.organizationId === formModel.proposedParentId
      ) {
        ElMessage.warning('目标组织不能成为自己的上级')
        return false
      }
      if (entity.value === 'scenario')
        await saveOrganizationDesignScenario({
          id: formModel.id,
          tenantId: formModel.tenantId,
          scenarioCode: formModel.scenarioCode.trim(),
          scenarioName: formModel.scenarioName.trim(),
          objective: formModel.objective.trim(),
          effectiveDate: formModel.effectiveDate,
          ownerEmployeeId: formModel.ownerEmployeeId || null,
          status: 'draft',
          riskLevel: 'unassessed',
          version: formModel.version
        })
      else
        await saveOrganizationDesignChange({
          id: formModel.id,
          tenantId: formModel.tenantId,
          scenarioId: formModel.scenarioId!,
          changeType: formModel.changeType,
          organizationId: formModel.changeType === 'create' ? null : formModel.organizationId,
          proposedParentId: ['create', 'reparent'].includes(formModel.changeType)
            ? formModel.proposedParentId || null
            : null,
          proposedCode: formModel.changeType === 'create' ? formModel.proposedCode?.trim() : null,
          proposedName: ['create', 'rename'].includes(formModel.changeType)
            ? formModel.proposedName?.trim()
            : null,
          proposedType: formModel.changeType === 'create' ? formModel.proposedType : null,
          rationale: formModel.rationale.trim(),
          sequence: formModel.sequence
        })
      emit('success', entity.value, dialogType.value)
      return true
    } catch {
      return false
    }
  }
  const handleOpen = async (payload: OpenPayload): Promise<void> => {
    entity.value = payload.entity
    dialogType.value = payload.type
    Object.assign(formModel, createInitialModel(), payload.editData ?? {})
    if (payload.scenario) {
      formModel.scenarioId = payload.scenario.id
      formModel.tenantId = payload.scenario.tenantId
    }
    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title: `${payload.type === 'add' ? '新增' : '编辑'}${payload.entity === 'scenario' ? '组织变革方案' : '组织变更项'}`,
      subtitle: '方案、影响评审与组织主数据执行分层治理',
      confirmText: payload.type === 'add' ? '创建草稿' : '保存更改',
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
    async (tenantId, previous) => {
      if (!tenantId || tenantId === previous || dialogType.value !== 'add') return
      formModel.ownerEmployeeId = undefined
      formModel.scenarioId = undefined
      formModel.organizationId = undefined
      formModel.proposedParentId = undefined
      await loadReferences()
    }
  )
  watch(
    () => formModel.changeType,
    () => {
      if (dialogType.value === 'add') {
        formModel.organizationId = undefined
        formModel.proposedParentId = undefined
        formModel.proposedCode = undefined
        formModel.proposedName = undefined
      }
    }
  )
  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .org-design-dialog {
    display: grid;
    gap: 16px;
    min-width: 0;
  }

  .org-design-dialog__context {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 15px 16px;
    background: color-mix(in srgb, var(--theme-color) 6%, var(--art-main-bg-color));
    border: 1px solid color-mix(in srgb, var(--theme-color) 17%, var(--art-card-border));
    border-radius: 12px;
  }

  .org-design-dialog__context > span:first-child {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    font-size: 20px;
    color: var(--theme-color);
    background: color-mix(in srgb, var(--theme-color) 11%, transparent);
    border-radius: 11px;
  }

  .org-design-dialog__context div {
    display: grid;
    min-width: 0;
  }

  .org-design-dialog__context small {
    font-size: 10px;
    font-weight: 700;
    color: var(--theme-color);
    letter-spacing: 0.13em;
  }

  .org-design-dialog__context strong {
    margin-top: 2px;
    font-size: 16px;
    color: var(--art-text-gray-900);
  }

  .org-design-dialog__context p {
    margin: 3px 0 0;
    font-size: 12px;
    line-height: 1.55;
    color: var(--art-text-gray-600);
  }

  .org-design-dialog__boundary {
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

  @media only screen and (width <= 767px) {
    .org-design-dialog__context {
      grid-template-columns: 44px minmax(0, 1fr);
    }

    .org-design-dialog__boundary {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
</style>
