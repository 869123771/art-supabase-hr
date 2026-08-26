<template>
  <ArtDialog ref="dialogRef" size="lg">
    <div class="employee-relation-record-dialog">
      <div class="employee-relation-record-dialog__context" role="note">
        <span aria-hidden="true"><ArtSvgIcon :icon="contextMeta.icon" /></span>
        <div>
          <small>{{ contextMeta.eyebrow }}</small>
          <strong>{{ contextMeta.title }}</strong>
          <p>{{ contextMeta.description }}</p>
        </div>
        <span class="employee-relation-record-dialog__boundary">
          <ArtSvgIcon icon="ri:shield-keyhole-line" />{{ contextMeta.boundary }}
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
        <template #subjectEmployeeId>
          <ArtEmployeeSelect
            v-model="form.model.subjectEmployeeId"
            v-model:selected-data="subjectSelection"
            :tenant-id="form.model.tenantId"
            title="选择案件涉及员工"
            subtitle="案件涉及员工用于权限可见性与调查对象识别"
            placeholder="请选择涉及员工"
          />
        </template>
        <template #reporterEmployeeId>
          <ArtEmployeeSelect
            v-model="form.model.reporterEmployeeId"
            v-model:selected-data="reporterSelection"
            :tenant-id="form.model.tenantId"
            title="选择报告员工"
            subtitle="匿名报告不保存报告人引用"
            placeholder="请选择报告员工"
          />
        </template>
        <template #ownerEmployeeId>
          <ArtEmployeeSelect
            v-model="form.model.ownerEmployeeId"
            v-model:selected-data="ownerSelection"
            :tenant-id="form.model.tenantId"
            title="选择处置行动负责人"
            subtitle="负责人承担行动执行、证据留存和结果反馈"
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
  import { fetchEmployeeRelationCaseDetail, saveEmployeeRelationRecord } from '@hr/api'
  import type { DialogType } from '@/types'

  type Entity = Api.Hr.EmployeeRelationEntity
  type RecordItem = Api.Hr.EmployeeRelationRecord

  interface OpenPayload {
    entity: Entity
    type: DialogType
    editData?: RecordItem
    presetCase?: Api.Hr.EmployeeRelationCase
  }

  interface FormModel {
    id?: string
    tenantId?: string
    caseNo: string
    caseType: string
    title: string
    subjectEmployeeId?: string
    reporterEmployeeId?: string
    anonymousReport: boolean
    source: string
    severity: string
    confidentialityLevel: string
    allegationSummary: string
    attachmentText: string
    externalReference?: string
    remark?: string
    caseId?: string
    actionType: string
    ownerEmployeeId?: string
    dueDate: string
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean | void>
    clearValidate: () => void
  }

  const emit = defineEmits<{ success: [entity: Entity, type: DialogType] }>()
  const userStore = useUserStore()
  const { getDictMap, getUserInfo, isPlatformSuper } = storeToRefs(userStore)
  const dialogRef = ref<ArtDialogExpose>()
  const formRef = ref<ArtFormExpose>()
  const entity = ref<Entity>('case')
  const dialogType = ref<DialogType>('add')
  const presetCase = shallowRef<Api.Hr.EmployeeRelationCase>()
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const subjectSelection = ref<EmployeeIntegrationItem[]>([])
  const reporterSelection = ref<EmployeeIntegrationItem[]>([])
  const ownerSelection = ref<EmployeeIntegrationItem[]>([])

  const createInitialModel = (): FormModel => ({
    id: undefined,
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    caseNo: 'AUTO',
    caseType: 'workplace_conflict',
    title: '',
    subjectEmployeeId: undefined,
    reporterEmployeeId: undefined,
    anonymousReport: false,
    source: 'hr',
    severity: 'medium',
    confidentialityLevel: 'restricted',
    allegationSummary: '',
    attachmentText: '',
    externalReference: undefined,
    remark: undefined,
    caseId: undefined,
    actionType: 'mediation',
    ownerEmployeeId: undefined,
    dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD')
  })

  const formModel = reactive<FormModel>(createInitialModel())
  const dictOptions = (code: string) => getDictMap.value[code] ?? []
  const caseItems = computed<FormItem[]>(() => {
    const items: FormItem[] = []
    if (isPlatformSuper.value) {
      items.push({
        label: '所属租户',
        key: 'tenantId',
        type: 'select',
        options: tenantOptions.value,
        span: 24,
        props: { filterable: true, placeholder: '请选择所属租户' }
      })
    }
    items.push(
      { label: '案件识别', key: 'identity', type: 'divider', span: 24 },
      {
        label: '案件编号',
        key: 'caseNo',
        type: 'input',
        props: { disabled: true },
        help: '保存时由系统生成唯一案件编号'
      },
      {
        label: '案件类型',
        key: 'caseType',
        type: 'select',
        options: dictOptions('hrEmployeeRelationCaseType')
      },
      {
        label: '案件标题',
        key: 'title',
        type: 'input',
        span: 24,
        props: { maxlength: 160, showWordLimit: true, placeholder: '用中性、可检索的语言概括案件' }
      },
      { label: '涉及员工', key: 'subjectEmployeeId', type: 'input' },
      {
        label: '匿名报告',
        key: 'anonymousReport',
        type: 'switch',
        props: { activeText: '匿名', inactiveText: '实名' }
      },
      {
        label: '报告员工',
        key: 'reporterEmployeeId',
        type: 'input',
        hidden: () => formModel.anonymousReport
      },
      {
        label: '报告来源',
        key: 'source',
        type: 'select',
        options: dictOptions('hrEmployeeRelationSource')
      },
      { label: '风险与保密', key: 'risk', type: 'divider', span: 24 },
      {
        label: '严重程度',
        key: 'severity',
        type: 'select',
        options: dictOptions('hrEmployeeRelationSeverity')
      },
      {
        label: '保密等级',
        key: 'confidentialityLevel',
        type: 'select',
        options: dictOptions('hrEmployeeRelationConfidentiality')
      },
      {
        label: '报告事实',
        key: 'allegationSummary',
        type: 'input',
        span: 24,
        props: {
          type: 'textarea',
          rows: 5,
          maxlength: 2000,
          showWordLimit: true,
          placeholder: '记录已知事实、时间、地点和影响；避免未经核实的结论性措辞'
        }
      },
      {
        label: '附件地址',
        key: 'attachmentText',
        type: 'input',
        span: 24,
        props: {
          type: 'textarea',
          rows: 2,
          placeholder: '可选：每行一个受控附件地址'
        }
      },
      { label: '外部参考号', key: 'externalReference', type: 'input' },
      { label: '内部备注', key: 'remark', type: 'input', span: 24 }
    )
    return items
  })

  const actionItems = computed<FormItem[]>(() => [
    {
      label: '行动类型',
      key: 'actionType',
      type: 'select',
      options: dictOptions('hrEmployeeRelationActionType')
    },
    { label: '行动负责人', key: 'ownerEmployeeId', type: 'input' },
    {
      label: '行动名称',
      key: 'title',
      type: 'input',
      span: 24,
      props: { maxlength: 160, showWordLimit: true, placeholder: '明确可执行、可验收的处置行动' }
    },
    { label: '完成期限', key: 'dueDate', type: 'date', props: { class: '!w-full' } },
    {
      label: '行动说明',
      key: 'remark',
      type: 'input',
      span: 24,
      props: {
        type: 'textarea',
        rows: 4,
        maxlength: 800,
        showWordLimit: true,
        placeholder: '说明负责人需完成的事项、证据和验收标准'
      }
    }
  ])

  const form = reactive<{
    model: FormModel
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<FormModel>>
  }>({
    model: formModel,
    items: computed(() => (entity.value === 'case' ? caseItems.value : actionItems.value)),
    rules: computed(() => ({
      tenantId: isPlatformSuper.value
        ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
        : [],
      caseType:
        entity.value === 'case'
          ? [{ required: true, message: '请选择案件类型', trigger: 'change' }]
          : [],
      title: [{ required: true, message: '请输入名称或标题', trigger: 'blur' }],
      subjectEmployeeId:
        entity.value === 'case'
          ? [{ required: true, message: '请选择涉及员工', trigger: 'change' }]
          : [],
      source:
        entity.value === 'case'
          ? [{ required: true, message: '请选择报告来源', trigger: 'change' }]
          : [],
      severity:
        entity.value === 'case'
          ? [{ required: true, message: '请选择严重程度', trigger: 'change' }]
          : [],
      confidentialityLevel:
        entity.value === 'case'
          ? [{ required: true, message: '请选择保密等级', trigger: 'change' }]
          : [],
      allegationSummary:
        entity.value === 'case'
          ? [{ required: true, message: '请记录报告事实', trigger: 'blur' }]
          : [],
      actionType:
        entity.value === 'action'
          ? [{ required: true, message: '请选择行动类型', trigger: 'change' }]
          : [],
      ownerEmployeeId:
        entity.value === 'action'
          ? [{ required: true, message: '请选择行动负责人', trigger: 'change' }]
          : [],
      dueDate:
        entity.value === 'action'
          ? [{ required: true, message: '请选择完成期限', trigger: 'change' }]
          : []
    }))
  })

  const contextMeta = computed(() =>
    entity.value === 'case'
      ? {
          eyebrow: 'CONFIDENTIAL INTAKE',
          title: '保密受理与事实建档',
          description: '这里只记录权威事实和来源；调查结论、纠正行动与结案由后续受控动作维护。',
          boundary: '敏感字段独立授权',
          icon: 'ri:shield-user-line'
        }
      : {
          eyebrow: 'CORRECTIVE ACTION',
          title: presetCase.value?.caseNo || '案件处置行动',
          description: '处置行动记录建议、责任人与期限，不直接改变员工任职状态或替代正式审批。',
          boundary: '不直接变更人事状态',
          icon: 'ri:route-line'
        }
  )

  const toSelection = (
    reference?: Api.Hr.EmployeeRelationReference | null,
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
    if ('attachmentUrls' in record) {
      formModel.attachmentText = (record.attachmentUrls ?? []).join('\n')
      subjectSelection.value = toSelection(record.subjectEmployee, record.tenantId)
      reporterSelection.value = toSelection(record.reporterEmployee, record.tenantId)
    } else {
      ownerSelection.value = toSelection(record.ownerEmployee, record.tenantId)
    }
  }

  const toRecord = (): RecordItem => {
    if (entity.value === 'case') {
      return {
        id: formModel.id,
        tenantId: formModel.tenantId,
        caseNo: formModel.caseNo || 'AUTO',
        caseType: formModel.caseType,
        title: formModel.title.trim(),
        subjectEmployeeId: formModel.subjectEmployeeId!,
        reporterEmployeeId: formModel.anonymousReport ? null : formModel.reporterEmployeeId || null,
        anonymousReport: formModel.anonymousReport,
        source: formModel.source,
        severity: formModel.severity,
        confidentialityLevel: formModel.confidentialityLevel,
        status: 'draft',
        allegationSummary: formModel.allegationSummary.trim(),
        attachmentUrls: formModel.attachmentText
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean),
        externalReference: formModel.externalReference?.trim() || null,
        remark: formModel.remark?.trim() || null
      }
    }
    return {
      id: formModel.id,
      tenantId: formModel.tenantId,
      caseId: formModel.caseId!,
      actionType: formModel.actionType,
      title: formModel.title.trim(),
      ownerEmployeeId: formModel.ownerEmployeeId!,
      dueDate: formModel.dueDate,
      status: 'planned',
      remark: formModel.remark?.trim() || null
    }
  }

  const submit = async (): Promise<boolean> => {
    try {
      await formRef.value?.validate()
      if (entity.value === 'case' && !formModel.anonymousReport && !formModel.reporterEmployeeId) {
        ElMessage.warning('实名报告需要选择报告员工')
        return false
      }
      if (entity.value === 'action' && dayjs(formModel.dueDate).isBefore(dayjs(), 'day')) {
        ElMessage.warning('处置行动期限不能早于今天')
        return false
      }
      await saveEmployeeRelationRecord(entity.value, toRecord())
      emit('success', entity.value, dialogType.value)
      return true
    } catch (error) {
      if (error instanceof Error && error.message) ElMessage.warning(error.message)
      return false
    }
  }

  const handleOpen = async (payload: OpenPayload): Promise<void> => {
    entity.value = payload.entity
    dialogType.value = payload.type
    presetCase.value = payload.presetCase
    Object.assign(formModel, createInitialModel())
    subjectSelection.value = []
    reporterSelection.value = []
    ownerSelection.value = []
    if (payload.editData) setFromRecord(payload.editData)
    if (payload.presetCase) {
      Object.assign(formModel, {
        tenantId: payload.presetCase.tenantId,
        caseId: payload.presetCase.id
      })
    }
    if (formModel.anonymousReport) {
      formModel.reporterEmployeeId = undefined
      reporterSelection.value = []
    }
    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title:
        payload.entity === 'case'
          ? `${payload.type === 'add' ? '新建' : '编辑'}员工关系案件`
          : `${payload.type === 'add' ? '新增' : '编辑'}处置行动`,
      subtitle: '案件资料按租户隔离，敏感内容由独立权限控制',
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
          if (payload.entity === 'case' && payload.type === 'edit' && payload.editData?.id) {
            const response = await fetchEmployeeRelationCaseDetail(payload.editData.id)
            if (response.data) setFromRecord(response.data)
          }
        } finally {
          api.setLoading(false)
        }
      },
      onConfirm: submit
    })
  }

  watch(
    () => formModel.anonymousReport,
    (anonymous) => {
      if (!anonymous) return
      formModel.reporterEmployeeId = undefined
      reporterSelection.value = []
    }
  )

  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .employee-relation-record-dialog {
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
      color: var(--el-color-warning-dark-2);
      white-space: nowrap;
      background: var(--el-color-warning-light-9);
      border-radius: 999px;
    }
  }

  @media only screen and (width <= 767px) {
    .employee-relation-record-dialog__context {
      grid-template-columns: 42px minmax(0, 1fr);

      .employee-relation-record-dialog__boundary {
        grid-column: 2;
        justify-self: start;
      }
    }
  }
</style>
