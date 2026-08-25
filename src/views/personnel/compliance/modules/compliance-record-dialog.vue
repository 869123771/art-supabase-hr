<template>
  <ArtDialog ref="dialogRef" size="lg">
    <div class="compliance-record-dialog">
      <div class="compliance-record-dialog__context" role="note">
        <ArtSvgIcon :icon="context.icon" />
        <div>
          <strong>{{ context.title }}</strong>
          <span>{{ context.description }}</span>
        </div>
        <ul aria-label="维护要求">
          <li v-for="signal in context.signals" :key="signal">
            <ArtSvgIcon icon="ri:check-line" />{{ signal }}
          </li>
        </ul>
      </div>

      <ArtForm
        ref="formRef"
        v-model="form.model"
        :items="form.items"
        :rules="form.rules"
        :span="12"
        :gutter="24"
        label-position="top"
        :show-reset="false"
        :show-submit="false"
      >
        <template #employeeId>
          <ArtEmployeeSelect
            v-model="form.model.employeeId"
            v-model:selected-data="employeeSelection"
            :tenant-id="form.model.tenantId"
            title="选择员工"
            subtitle="合同与资质只能关联当前租户内的有效员工"
            placeholder="请选择员工"
          />
        </template>
        <template #renewalOwnerId>
          <ArtEmployeeSelect
            v-model="form.model.renewalOwnerId"
            v-model:selected-data="ownerSelection"
            :tenant-id="form.model.tenantId"
            title="选择续签负责人"
            subtitle="负责人将承担到期评估与续签处置"
            placeholder="请选择续签负责人"
          />
        </template>
        <template #responsibleEmployeeId>
          <ArtEmployeeSelect
            v-model="form.model.responsibleEmployeeId"
            v-model:selected-data="ownerSelection"
            :tenant-id="form.model.tenantId"
            title="选择资质责任人"
            subtitle="责任人负责复审、换证和失效处置"
            placeholder="请选择资质责任人"
          />
        </template>
      </ArtForm>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { ElMessage, type FormRules } from 'element-plus'
  import ArtDialog from '@/components/core/dialogs/art-dialog/index.vue'
  import type { ArtDialogExpose } from '@/components/core/dialogs/art-dialog/types'
  import ArtForm, {
    type FormItem,
    type FormItemOption
  } from '@/components/core/forms/art-form/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtEmployeeSelect from '@/components/business/art-employee-select/index.vue'
  import type { EmployeeIntegrationItem } from '@/api/integration/employees'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import { useDocumentNumberRule } from '@/hooks/core/useDocumentNumberRule'
  import { useUserStore } from '@/store/modules/user'
  import { saveComplianceRecord } from '@hr/api'
  import type { DialogType } from '@/types'

  type Entity = Api.Hr.ComplianceRecordEntity
  type RecordItem = Api.Hr.ComplianceContract | Api.Hr.ComplianceQualification

  interface FormModel {
    id?: string
    tenantId?: string
    employeeId?: string
    contractNo: string
    contractType: string
    contractStatus: string
    signDate?: string | null
    startDate?: string
    endDate?: string | null
    probationEndDate?: string | null
    workLocation?: string | null
    monthlySalary?: number | null
    renewalReminderDays: number
    renewalOwnerId?: string
    attachmentUrl?: string | null
    remark?: string | null
    qualificationType: string
    qualificationName: string
    certificateNo?: string | null
    issuer?: string | null
    issueDate?: string | null
    expiryDate?: string | null
    reminderDays: number
    responsibleEmployeeId?: string
    nextReviewDate?: string | null
  }

  interface OpenPayload {
    entity: Entity
    type: DialogType
    editData?: RecordItem
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean | void>
    clearValidate: () => void
  }

  const emit = defineEmits<{ success: [type: DialogType, entity: Entity] }>()
  const userStore = useUserStore()
  const { getDictMap, getUserInfo, isPlatformSuper } = storeToRefs(userStore)
  const dialogRef = ref<ArtDialogExpose>()
  const formRef = ref<ArtFormExpose>()
  const entity = ref<Entity>('contract')
  const editing = ref(false)
  const tenantOptions = ref<FormItemOption[]>([])
  const employeeSelection = ref<EmployeeIntegrationItem[]>([])
  const ownerSelection = ref<EmployeeIntegrationItem[]>([])

  const createInitialModel = (): FormModel => ({
    id: undefined,
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    employeeId: undefined,
    contractNo: '',
    contractType: 'fixed_term',
    contractStatus: 'draft',
    signDate: null,
    startDate: undefined,
    endDate: null,
    probationEndDate: null,
    workLocation: null,
    monthlySalary: null,
    renewalReminderDays: 30,
    renewalOwnerId: undefined,
    attachmentUrl: null,
    remark: null,
    qualificationType: 'professional',
    qualificationName: '',
    certificateNo: null,
    issuer: null,
    issueDate: null,
    expiryDate: null,
    reminderDays: 30,
    responsibleEmployeeId: undefined,
    nextReviewDate: null
  })
  const formModel = reactive<FormModel>(createInitialModel())
  const numberRule = useDocumentNumberRule('hr.employee_contract', () => formModel.tenantId)

  const tenantItems = computed<FormItem[]>(() =>
    isPlatformSuper.value
      ? [
          {
            label: '所属租户',
            key: 'tenantId',
            type: 'select',
            options: tenantOptions.value,
            props: {
              filterable: true,
              placeholder: '请选择所属租户',
              onChange: handleTenantChange
            }
          }
        ]
      : []
  )

  const contractItems = computed<FormItem[]>(() => [
    ...tenantItems.value,
    { label: '合同主体', key: 'identity', type: 'divider', span: 24 },
    { label: '关联员工', key: 'employeeId', type: 'input' },
    {
      label: '合同编号',
      key: 'contractNo',
      type: 'input',
      props: numberRule.inputProps(editing.value, '请输入合同编号', true),
      help: numberRule.description.value
    },
    {
      label: '合同类型',
      key: 'contractType',
      type: 'select',
      options: getDictMap.value.hrContractType ?? []
    },
    {
      label: '初始状态',
      key: 'contractStatus',
      type: 'select',
      options: (getDictMap.value.hrContractStatus ?? []).filter((item) =>
        ['draft', 'active'].includes(String(item.value))
      ),
      hidden: editing.value
    },
    { label: '合同期限', key: 'period', type: 'divider', span: 24 },
    { label: '签订日期', key: 'signDate', type: 'date' },
    { label: '开始日期', key: 'startDate', type: 'date' },
    { label: '结束日期', key: 'endDate', type: 'date' },
    { label: '试用期结束', key: 'probationEndDate', type: 'date' },
    { label: '续签与责任', key: 'renewal', type: 'divider', span: 24 },
    {
      label: '提前提醒天数',
      key: 'renewalReminderDays',
      type: 'number',
      props: { min: 0, max: 365, controls: false }
    },
    { label: '续签负责人', key: 'renewalOwnerId', type: 'input' },
    { label: '工作地点', key: 'workLocation', type: 'input' },
    {
      label: '月薪参考',
      key: 'monthlySalary',
      type: 'number',
      help: '受字段权限保护，仅授权人员可查看。',
      props: { min: 0, precision: 2, controls: false }
    },
    { label: '合同附件地址', key: 'attachmentUrl', type: 'input', span: 24 },
    {
      label: '备注',
      key: 'remark',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 3, maxlength: 500, showWordLimit: true }
    }
  ])

  const qualificationItems = computed<FormItem[]>(() => [
    ...tenantItems.value,
    { label: '证照主体', key: 'identity', type: 'divider', span: 24 },
    { label: '关联员工', key: 'employeeId', type: 'input' },
    {
      label: '资质类型',
      key: 'qualificationType',
      type: 'select',
      options: getDictMap.value.hrQualificationType ?? []
    },
    { label: '资质名称', key: 'qualificationName', type: 'input', span: 24 },
    { label: '证书编号', key: 'certificateNo', type: 'input' },
    { label: '发证机构', key: 'issuer', type: 'input' },
    { label: '有效期与复审', key: 'period', type: 'divider', span: 24 },
    { label: '发证日期', key: 'issueDate', type: 'date' },
    { label: '到期日期', key: 'expiryDate', type: 'date' },
    { label: '下次复审', key: 'nextReviewDate', type: 'date' },
    {
      label: '提前提醒天数',
      key: 'reminderDays',
      type: 'number',
      props: { min: 0, max: 365, controls: false }
    },
    { label: '资质责任人', key: 'responsibleEmployeeId', type: 'input' },
    { label: '证书附件地址', key: 'attachmentUrl', type: 'input' },
    {
      label: '备注',
      key: 'remark',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 3, maxlength: 500, showWordLimit: true }
    }
  ])

  const form = reactive<{
    model: FormModel
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<FormModel>>
  }>({
    model: formModel,
    items: computed(() =>
      entity.value === 'contract' ? contractItems.value : qualificationItems.value
    ),
    rules: computed(() => {
      const rules: FormRules<FormModel> = {
        tenantId: isPlatformSuper.value
          ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
          : [],
        employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }]
      }
      if (entity.value === 'contract') {
        Object.assign(rules, {
          contractNo:
            numberRule.manualRequired(editing.value) || editing.value
              ? [{ required: true, message: '请输入合同编号', trigger: 'blur' }]
              : [],
          contractType: [{ required: true, message: '请选择合同类型', trigger: 'change' }],
          startDate: [{ required: true, message: '请选择合同开始日期', trigger: 'change' }]
        })
      } else {
        Object.assign(rules, {
          qualificationType: [{ required: true, message: '请选择资质类型', trigger: 'change' }],
          qualificationName: [{ required: true, message: '请输入资质名称', trigger: 'blur' }]
        })
      }
      return rules
    })
  })

  const context = computed(() =>
    entity.value === 'contract'
      ? {
          icon: 'ri:file-shield-2-line',
          title: '合同记录是不可覆盖的法律版本',
          description: '到期续签通过专用动作创建新版本；不要直接修改旧合同的期限。',
          signals: ['主体与期限完整', '负责人明确', '附件可追溯']
        }
      : {
          icon: 'ri:verified-badge-line',
          title: '证照有效与真实性核验分开管理',
          description: '修改证书编号、机构或有效期后，系统会自动重新进入待核验。',
          signals: ['证书来源清晰', '复审日期明确', '责任人可追踪']
        }
  )

  const toSelection = (
    reference?: Api.Hr.ComplianceReference | null,
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

  const resetModel = (): void => {
    Object.assign(formModel, createInitialModel())
    employeeSelection.value = []
    ownerSelection.value = []
  }

  const handleTenantChange = async (): Promise<void> => {
    formModel.employeeId = undefined
    formModel.renewalOwnerId = undefined
    formModel.responsibleEmployeeId = undefined
    employeeSelection.value = []
    ownerSelection.value = []
    if (entity.value === 'contract') await numberRule.loadRule()
  }

  const validateBusiness = (): void => {
    if (
      entity.value === 'contract' &&
      formModel.startDate &&
      formModel.endDate &&
      formModel.endDate < formModel.startDate
    ) {
      throw new Error('合同结束日期不能早于开始日期')
    }
    if (
      entity.value === 'qualification' &&
      formModel.issueDate &&
      formModel.expiryDate &&
      formModel.expiryDate < formModel.issueDate
    ) {
      throw new Error('资质到期日期不能早于发证日期')
    }
  }

  const submit = async (): Promise<boolean> => {
    try {
      await formRef.value?.validate()
      validateBusiness()
      const type: DialogType = editing.value ? 'edit' : 'add'
      if (entity.value === 'contract') {
        await saveComplianceRecord('contract', {
          id: formModel.id,
          tenantId: formModel.tenantId,
          employeeId: formModel.employeeId!,
          contractNo: formModel.contractNo || 'AUTO',
          contractType: formModel.contractType,
          contractStatus: formModel.contractStatus,
          signDate: formModel.signDate,
          startDate: formModel.startDate!,
          endDate: formModel.endDate,
          probationEndDate: formModel.probationEndDate,
          workLocation: formModel.workLocation,
          monthlySalary: formModel.monthlySalary,
          renewalReminderDays: Number(formModel.renewalReminderDays),
          renewalOwnerId: formModel.renewalOwnerId,
          renewalDecision: 'not_started',
          attachmentUrl: formModel.attachmentUrl,
          remark: formModel.remark
        })
      } else {
        await saveComplianceRecord('qualification', {
          id: formModel.id,
          tenantId: formModel.tenantId,
          employeeId: formModel.employeeId!,
          qualificationType: formModel.qualificationType,
          qualificationName: formModel.qualificationName,
          certificateNo: formModel.certificateNo,
          issuer: formModel.issuer,
          issueDate: formModel.issueDate,
          expiryDate: formModel.expiryDate,
          status: 'valid',
          attachmentUrl: formModel.attachmentUrl,
          reminderDays: Number(formModel.reminderDays),
          responsibleEmployeeId: formModel.responsibleEmployeeId,
          verificationStatus: 'pending',
          nextReviewDate: formModel.nextReviewDate,
          remark: formModel.remark
        })
      }
      emit('success', type, entity.value)
      return true
    } catch (error) {
      if (error instanceof Error && error.message) ElMessage.warning(error.message)
      return false
    }
  }

  const handleOpen = async (payload: OpenPayload): Promise<void> => {
    entity.value = payload.entity
    editing.value = payload.type === 'edit'
    resetModel()
    if (payload.editData) {
      if (payload.entity === 'contract') {
        const record = payload.editData as Api.Hr.ComplianceContract
        Object.assign(formModel, {
          ...record,
          monthlySalary: typeof record.monthlySalary === 'number' ? record.monthlySalary : undefined
        })
        employeeSelection.value = toSelection(record.employee, record.tenantId)
        ownerSelection.value = toSelection(record.renewalOwner, record.tenantId)
      } else {
        const record = payload.editData as Api.Hr.ComplianceQualification
        Object.assign(formModel, record)
        employeeSelection.value = toSelection(record.employee, record.tenantId)
        ownerSelection.value = toSelection(record.responsibleEmployee, record.tenantId)
      }
    }

    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title: `${editing.value ? '编辑' : '新增'}${payload.entity === 'contract' ? '劳动合同' : '员工资质'}`,
      subtitle:
        payload.entity === 'contract'
          ? '维护合同基础版本；续签和终止请使用生命周期动作'
          : '维护证照资料；保存后进入真实性核验',
      confirmText: editing.value
        ? '保存更改'
        : payload.entity === 'contract'
          ? '创建合同'
          : '创建资质',
      contentMaxHeight: 'calc(100vh - 184px)',
      onOpen: async (_data, api) => {
        api.setLoading(true)
        try {
          await Promise.all([
            ...(isPlatformSuper.value && !tenantOptions.value.length
              ? [
                  fetchGetEnableTenantList().then((response) => {
                    tenantOptions.value = (response.data ?? []).map((tenant) => ({
                      label: `${tenant.tenantName}（${tenant.tenantCode}）`,
                      value: tenant.id!
                    }))
                  })
                ]
              : []),
            ...(payload.entity === 'contract' ? [numberRule.loadRule()] : [])
          ])
          if (
            payload.entity === 'contract' &&
            !editing.value &&
            numberRule.automatic.value &&
            !formModel.contractNo
          ) {
            formModel.contractNo = 'AUTO'
          }
        } finally {
          api.setLoading(false)
        }
      },
      onConfirm: submit
    })
  }

  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .compliance-record-dialog {
    display: grid;
    gap: 18px;
    min-width: 0;

    &__context {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      color: var(--art-text-gray-700);
      background: color-mix(in srgb, var(--theme-color) 7%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 18%, var(--art-card-border));
      border-radius: var(--art-control-radius);

      > :deep(.art-svg-icon) {
        margin-top: 2px;
        font-size: 20px;
        color: var(--theme-color);
      }

      div {
        display: grid;
        gap: 3px;
        min-width: 0;
      }

      strong {
        color: var(--art-text-gray-900);
      }

      span {
        font-size: 13px;
        line-height: 1.6;
      }

      ul {
        display: grid;
        gap: 6px;
        min-width: 142px;
        padding: 0;
        margin: 0;
        list-style: none;
      }

      li {
        display: flex;
        gap: 6px;
        align-items: center;
        font-size: 11px;
        color: var(--art-text-gray-600);
        white-space: nowrap;

        :deep(.art-svg-icon) {
          color: var(--el-color-success);
        }
      }
    }
  }

  @media only screen and (width <= 767px) {
    .compliance-record-dialog__context {
      grid-template-columns: 22px minmax(0, 1fr);

      ul {
        grid-column: 2;
      }
    }
  }
</style>
