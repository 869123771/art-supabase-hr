<template>
  <ArtDialog ref="dialogRef" size="md">
    <div class="compliance-action-dialog">
      <div class="compliance-action-dialog__subject">
        <span aria-hidden="true"><ArtSvgIcon :icon="actionMeta.icon" /></span>
        <div>
          <small>{{ entity === 'contract' ? '劳动合同' : '员工资质' }}</small>
          <strong>{{ subjectTitle }}</strong>
          <p>{{ actionMeta.description }}</p>
        </div>
      </div>
      <ArtForm
        ref="formRef"
        v-model="form.model"
        :items="form.items"
        :rules="form.rules"
        :span="12"
        :gutter="20"
        label-position="top"
        :show-reset="false"
        :show-submit="false"
      >
        <template #renewalOwnerId>
          <ArtEmployeeSelect
            v-model="form.model.renewalOwnerId"
            v-model:selected-data="ownerSelection"
            :tenant-id="record?.tenantId"
            title="选择续签负责人"
            subtitle="负责人承担续签评估、材料和签署跟进"
            placeholder="请选择续签负责人"
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
  import { useDocumentNumberRule } from '@/hooks/core/useDocumentNumberRule'
  import { useUserStore } from '@/store/modules/user'
  import { transitionComplianceRecord } from '@hr/api'

  type Entity = Api.Hr.ComplianceRecordEntity
  type RecordItem = Api.Hr.ComplianceContract | Api.Hr.ComplianceQualification

  interface FormModel {
    tenantId?: string
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
    terminationDate?: string
    comment: string
  }

  interface ActionMeta {
    title: string
    confirmText: string
    icon: string
    description: string
  }

  interface ArtFormExpose {
    validate: () => Promise<boolean | void>
    clearValidate: () => void
  }

  const emit = defineEmits<{ success: [entity: Entity] }>()
  const userStore = useUserStore()
  const { getDictMap } = storeToRefs(userStore)
  const dialogRef = ref<ArtDialogExpose>()
  const formRef = ref<ArtFormExpose>()
  const entity = ref<Entity>('contract')
  const action = ref<Api.Hr.ComplianceAction>('comment')
  const record = shallowRef<RecordItem>()
  const ownerSelection = ref<EmployeeIntegrationItem[]>([])

  const createInitialModel = (): FormModel => ({
    tenantId: undefined,
    contractNo: '',
    contractType: 'fixed_term',
    contractStatus: 'active',
    signDate: null,
    startDate: undefined,
    endDate: null,
    probationEndDate: null,
    workLocation: null,
    monthlySalary: null,
    renewalReminderDays: 30,
    renewalOwnerId: undefined,
    attachmentUrl: null,
    terminationDate: undefined,
    comment: ''
  })
  const formModel = reactive<FormModel>(createInitialModel())
  const numberRule = useDocumentNumberRule('hr.employee_contract', () => formModel.tenantId)

  const actionMetas: Record<Api.Hr.ComplianceAction, ActionMeta> = {
    activate: {
      title: '确认合同生效',
      confirmText: '确认生效',
      icon: 'ri:checkbox-circle-line',
      description: '生效后合同进入到期风险监控，不能再按普通草稿删除。'
    },
    start_renewal: {
      title: '启动合同续签',
      confirmText: '启动续签',
      icon: 'ri:refresh-line',
      description: '明确负责人并进入续签决策阶段，原合同版本保持不变。'
    },
    renew: {
      title: '完成合同续签',
      confirmText: '创建续签合同',
      icon: 'ri:file-copy-2-line',
      description: '系统将创建新合同版本，并把当前合同标记为已续签。'
    },
    terminate: {
      title: '终止劳动合同',
      confirmText: '确认终止',
      icon: 'ri:close-circle-line',
      description: '终止日期和原因会进入不可变审计记录，请确认信息准确。'
    },
    verify: {
      title: '通过资质核验',
      confirmText: '核验通过',
      icon: 'ri:shield-check-line',
      description: '确认已核对证书编号、发证机构、有效期和附件。'
    },
    reject: {
      title: '驳回资质核验',
      confirmText: '确认驳回',
      icon: 'ri:error-warning-line',
      description: '说明材料不一致或缺失内容，便于后续修正后重新核验。'
    },
    revoke: {
      title: '撤销员工资质',
      confirmText: '确认撤销',
      icon: 'ri:shield-cross-line',
      description: '撤销后记录继续保留，不再作为有效任职资质。'
    },
    comment: {
      title: '补充合规说明',
      confirmText: '添加说明',
      icon: 'ri:chat-1-line',
      description: '补充决策依据或处置进展，不改变当前业务状态。'
    }
  }
  const actionMeta = computed(() => actionMetas[action.value])
  const subjectTitle = computed(() => {
    if (!record.value) return '--'
    return entity.value === 'contract'
      ? (record.value as Api.Hr.ComplianceContract).contractNo
      : (record.value as Api.Hr.ComplianceQualification).qualificationName
  })

  const formItems = computed<FormItem[]>(() => {
    if (action.value === 'start_renewal') {
      return [
        { label: '续签负责人', key: 'renewalOwnerId', type: 'input', span: 24 },
        commentItem('续签评估说明', false)
      ]
    }
    if (action.value === 'renew') {
      return [
        { label: '新合同', key: 'identity', type: 'divider', span: 24 },
        {
          label: '新合同编号',
          key: 'contractNo',
          type: 'input',
          props: numberRule.inputProps(false, '请输入新合同编号', true),
          help: numberRule.description.value
        },
        {
          label: '合同类型',
          key: 'contractType',
          type: 'select',
          options: getDictMap.value.hrContractType ?? []
        },
        { label: '签订日期', key: 'signDate', type: 'date' },
        { label: '开始日期', key: 'startDate', type: 'date' },
        { label: '结束日期', key: 'endDate', type: 'date' },
        { label: '试用期结束', key: 'probationEndDate', type: 'date' },
        { label: '续签负责人', key: 'renewalOwnerId', type: 'input' },
        {
          label: '提醒天数',
          key: 'renewalReminderDays',
          type: 'number',
          props: { min: 0, max: 365, controls: false }
        },
        { label: '工作地点', key: 'workLocation', type: 'input' },
        {
          label: '月薪参考',
          key: 'monthlySalary',
          type: 'number',
          props: { min: 0, precision: 2, controls: false }
        },
        { label: '新合同附件地址', key: 'attachmentUrl', type: 'input', span: 24 },
        commentItem('续签说明', false)
      ]
    }
    if (action.value === 'terminate') {
      return [
        { label: '终止日期', key: 'terminationDate', type: 'date', span: 24 },
        commentItem('终止原因', true)
      ]
    }
    return [
      commentItem(
        action.value === 'reject'
          ? '驳回原因'
          : action.value === 'revoke'
            ? '撤销原因'
            : action.value === 'verify'
              ? '核验说明'
              : action.value === 'activate'
                ? '生效说明'
                : '补充说明',
        ['reject', 'revoke', 'comment'].includes(action.value)
      )
    ]
  })

  const commentItem = (label: string, required: boolean): FormItem => ({
    label,
    key: 'comment',
    type: 'input',
    span: 24,
    props: {
      type: 'textarea',
      rows: 3,
      maxlength: 300,
      showWordLimit: true,
      placeholder: required ? `请填写${label}` : `可选：填写${label}`
    }
  })

  const form = reactive<{
    model: FormModel
    items: ComputedRef<FormItem[]>
    rules: ComputedRef<FormRules<FormModel>>
  }>({
    model: formModel,
    items: formItems,
    rules: computed(() => ({
      contractNo:
        action.value === 'renew' && numberRule.manualRequired(false)
          ? [{ required: true, message: '请输入新合同编号', trigger: 'blur' }]
          : [],
      contractType:
        action.value === 'renew'
          ? [{ required: true, message: '请选择合同类型', trigger: 'change' }]
          : [],
      startDate:
        action.value === 'renew'
          ? [{ required: true, message: '请选择新合同开始日期', trigger: 'change' }]
          : [],
      terminationDate:
        action.value === 'terminate'
          ? [{ required: true, message: '请选择终止日期', trigger: 'change' }]
          : [],
      comment: ['reject', 'revoke', 'comment', 'terminate'].includes(action.value)
        ? [{ required: true, message: '请填写处理原因或说明', trigger: 'blur' }]
        : []
    }))
  })

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

  const validateBusiness = (): void => {
    if (action.value !== 'renew' || !formModel.startDate) return
    const oldContract = record.value as Api.Hr.ComplianceContract
    if (formModel.startDate <= oldContract.startDate) {
      throw new Error('新合同开始日期必须晚于原合同开始日期')
    }
    if (formModel.endDate && formModel.endDate < formModel.startDate) {
      throw new Error('新合同结束日期不能早于开始日期')
    }
  }

  const submit = async (): Promise<boolean> => {
    if (!record.value?.id) return false
    try {
      await formRef.value?.validate()
      validateBusiness()
      await transitionComplianceRecord(entity.value, record.value.id, action.value, {
        contractNo: formModel.contractNo || 'AUTO',
        contractType: formModel.contractType,
        contractStatus: formModel.contractStatus,
        signDate: formModel.signDate,
        startDate: formModel.startDate || '',
        endDate: formModel.endDate,
        probationEndDate: formModel.probationEndDate,
        workLocation: formModel.workLocation,
        monthlySalary: formModel.monthlySalary,
        renewalReminderDays: Number(formModel.renewalReminderDays),
        renewalOwnerId: formModel.renewalOwnerId,
        attachmentUrl: formModel.attachmentUrl,
        terminationDate: formModel.terminationDate,
        comment: formModel.comment
      })
      emit('success', entity.value)
      return true
    } catch (error) {
      if (error instanceof Error && error.message) ElMessage.warning(error.message)
      return false
    }
  }

  const handleOpen = async (
    targetEntity: Entity,
    targetAction: Api.Hr.ComplianceAction,
    targetRecord: RecordItem
  ): Promise<void> => {
    entity.value = targetEntity
    action.value = targetAction
    record.value = targetRecord
    Object.assign(formModel, createInitialModel(), {
      tenantId: targetRecord.tenantId,
      comment: ''
    })
    ownerSelection.value = []
    if (targetEntity === 'contract') {
      const contract = targetRecord as Api.Hr.ComplianceContract
      const suggestedStart = contract.endDate
        ? dayjs(contract.endDate).add(1, 'day')
        : dayjs().add(1, 'day')
      Object.assign(formModel, {
        contractType: contract.contractType,
        signDate: dayjs().format('YYYY-MM-DD'),
        startDate: suggestedStart.format('YYYY-MM-DD'),
        endDate:
          contract.contractType === 'open_ended'
            ? null
            : suggestedStart.add(1, 'year').subtract(1, 'day').format('YYYY-MM-DD'),
        workLocation: contract.workLocation,
        monthlySalary: typeof contract.monthlySalary === 'number' ? contract.monthlySalary : null,
        renewalReminderDays: contract.renewalReminderDays ?? 30,
        renewalOwnerId: contract.renewalOwnerId
      })
      ownerSelection.value = toSelection(contract.renewalOwner, contract.tenantId)
    }

    await nextTick()
    formRef.value?.clearValidate()
    await dialogRef.value?.handleOpen(undefined, {
      title: actionMeta.value.title,
      subtitle: `${targetRecord.employee?.employeeName || '员工'} · ${targetRecord.employee?.employeeNo || '未维护工号'}`,
      confirmText: actionMeta.value.confirmText,
      contentMaxHeight: 'calc(100vh - 184px)',
      onOpen: async (_data, api) => {
        if (targetAction !== 'renew') return
        api.setLoading(true)
        try {
          await numberRule.loadRule()
          if (numberRule.automatic.value && !formModel.contractNo) formModel.contractNo = 'AUTO'
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
  .compliance-action-dialog {
    display: grid;
    gap: 18px;

    &__subject {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      gap: 12px;
      align-items: center;
      padding: 14px;
      background: color-mix(in srgb, var(--theme-color) 6%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 16%, var(--art-card-border));
      border-radius: var(--art-control-radius);

      > span {
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
        font-size: 11px;
        color: var(--theme-color);
      }

      strong {
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--art-text-gray-900);
        white-space: nowrap;
      }

      p {
        margin: 5px 0 0;
        font-size: 12px;
        line-height: 1.55;
        color: var(--art-text-gray-600);
      }
    }
  }
</style>
