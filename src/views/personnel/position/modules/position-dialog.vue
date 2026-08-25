<template>
  <ArtDialog ref="dialogRef" size="md">
    <ArtForm
      ref="formRef"
      class="position-dialog__form"
      v-model="form"
      :items="formItems"
      :rules="formRules"
      :span="12"
      :gutter="24"
      label-position="top"
      :show-reset="false"
      :show-submit="false"
    >
      <template #positionKind>
        <div
          class="position-dialog__kind-summary"
          :class="{ 'is-driver': positionKindMeta.kind === 'driver' }"
        >
          <span class="position-dialog__kind-icon" aria-hidden="true">
            <ArtSvgIcon :icon="positionKindMeta.icon" />
          </span>
          <div class="position-dialog__kind-copy">
            <strong>{{ positionKindMeta.label }}</strong>
            <span>{{ positionKindMeta.description }}</span>
          </div>
          <ElTag :type="positionKindMeta.tagType" effect="plain" round>
            {{ positionKindMeta.badge }}
          </ElTag>
        </div>
      </template>
    </ArtForm>
  </ArtDialog>
</template>

<script setup lang="ts">
  import type { FormRules } from 'element-plus'
  import ArtDialog from '@/components/core/dialogs/art-dialog/index.vue'
  import type { ArtDialogExpose } from '@/components/core/dialogs/art-dialog/types'
  import ArtForm, {
    type FormItem,
    type FormItemOption
  } from '@/components/core/forms/art-form/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    addPosition,
    editPosition,
    fetchEmployeeOrganizationOptions,
    fetchJobArchitectureOptions
  } from '@hr/api'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import { useUserStore } from '@/store/modules/user'
  import { useDocumentNumberRule } from '@/hooks/core/useDocumentNumberRule'

  defineOptions({ name: 'HrPositionDialog' })

  type Position = Api.Hr.Position

  interface DialogExposeForm {
    validate: () => Promise<boolean>
    clearValidate: () => void
    reloadOptions: (key: string) => Promise<void>
  }

  const emit = defineEmits<{ (event: 'success', type: 'add' | 'edit'): void }>()
  const { getUserInfo, isPlatformSuper } = storeToRefs(useUserStore())
  const dialogRef = ref<ArtDialogExpose<Position | undefined>>()
  const formRef = ref<DialogExposeForm>()
  const tenantOptions = ref<FormItemOption[]>([])

  const createInitialForm = (): Position => ({
    tenantId: isPlatformSuper.value ? undefined : getUserInfo.value.tenantId,
    organizationId: null,
    jobProfileId: '',
    gradeId: null,
    positionCode: '',
    positionName: '',
    positionKind: 'standard',
    systemCode: null,
    enabled: true,
    headcountLimit: 1,
    multipleIncumbentsAllowed: false,
    sort: 0,
    description: ''
  })
  const form = reactive<Position>(createInitialForm())
  const positionNumber = useDocumentNumberRule('hr.position')
  const isSystemPosition = computed(() => Boolean(form.systemCode))
  const positionKindMeta = computed(() => {
    const isDriver = form.positionKind === 'driver'
    return {
      kind: isDriver ? ('driver' as const) : ('standard' as const),
      label: isDriver ? '司机岗位' : '普通岗位',
      description: isDriver
        ? '系统唯一司机岗位；员工选择后会同步创建司机运营档案。'
        : '用于员工任职和花名册管理，不触发司机档案联动。',
      icon: isDriver ? 'ri:steering-2-line' : 'ri:briefcase-4-line',
      tagType: isDriver ? ('success' as const) : ('info' as const),
      badge: isSystemPosition.value ? '系统预置' : form.id ? '创建后固定' : '系统默认'
    }
  })

  const formRules = computed<FormRules<Position>>(() => ({
    tenantId: isPlatformSuper.value
      ? [{ required: true, message: '请选择所属租户', trigger: 'change' }]
      : [],
    positionCode: [
      ...(form.id || positionNumber.manualRequired(false)
        ? [{ required: true, message: '请输入岗位编码', trigger: 'blur' as const }]
        : []),
      {
        pattern: /^$|^[A-Za-z][A-Za-z0-9_-]{1,31}$/,
        message: '请输入 2-32 位字母开头的编码',
        trigger: 'blur'
      }
    ],
    positionName: [
      { required: true, message: '请输入岗位名称', trigger: 'blur' },
      { min: 2, max: 50, message: '岗位名称应为 2-50 个字符', trigger: 'blur' }
    ],
    organizationId: [
      { required: !isSystemPosition.value, message: '请选择所属组织', trigger: 'change' }
    ],
    jobProfileId: [{ required: true, message: '请选择标准职务', trigger: 'change' }],
    headcountLimit: [{ required: true, message: '请输入编制上限', trigger: 'change' }],
    sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
    description: [{ max: 300, message: '岗位说明不能超过 300 个字符', trigger: 'blur' }]
  }))

  const formItems = computed<FormItem[]>(() => [
    { label: '岗位信息', key: 'baseSection', type: 'divider', span: 24 },
    {
      label: '所属租户',
      key: 'tenantId',
      type: 'select',
      span: 24,
      hidden: !isPlatformSuper.value,
      options: tenantOptions.value,
      props: {
        filterable: true,
        disabled: Boolean(form.id),
        placeholder: '请选择所属租户',
        onChange: () => {
          form.organizationId = null
          form.jobProfileId = ''
          form.gradeId = null
          void Promise.all([
            positionNumber.loadRule(),
            formRef.value?.reloadOptions('organizationId'),
            formRef.value?.reloadOptions('jobProfileId'),
            formRef.value?.reloadOptions('gradeId')
          ])
        }
      }
    },
    {
      label: '所属组织',
      key: 'organizationId',
      type: 'select',
      hidden: isSystemPosition.value,
      immediate: false,
      api: async () => (await fetchEmployeeOrganizationOptions({ tenantId: form.tenantId })).data,
      valueField: 'id',
      labelFn: (option) => `${option.organizationName ?? ''} · ${option.organizationCode ?? ''}`,
      props: { filterable: true, placeholder: '请选择岗位所属组织' }
    },
    {
      label: '标准职务',
      key: 'jobProfileId',
      type: 'select',
      immediate: false,
      api: async () => (await fetchJobArchitectureOptions('profile', form.tenantId)).data ?? [],
      valueField: 'id',
      labelFn: (option) => `${option.name ?? ''} · ${option.code ?? ''}`,
      props: { filterable: true, placeholder: '请选择岗位对应的标准职务' }
    },
    {
      label: '职级',
      key: 'gradeId',
      type: 'select',
      immediate: false,
      api: async () => (await fetchJobArchitectureOptions('grade', form.tenantId)).data ?? [],
      valueField: 'id',
      labelFn: (option) => `${option.name ?? ''} · ${option.code ?? ''}`,
      props: { filterable: true, clearable: true, placeholder: '可选，默认继承标准职务' }
    },
    {
      label: '岗位编码',
      key: 'positionCode',
      type: 'input',
      props: {
        maxlength: 32,
        ...positionNumber.inputProps(Boolean(form.id), '如 DRIVER', true),
        disabled: isSystemPosition.value || positionNumber.inputProps(Boolean(form.id), '').disabled
      },
      description: positionNumber.description.value
    },
    {
      label: '岗位名称',
      key: 'positionName',
      type: 'input',
      props: { maxlength: 50, placeholder: '请输入岗位名称' }
    },
    {
      label: '业务属性',
      key: 'positionKind',
      type: 'text',
      span: 24,
      help: '业务属性由岗位创建来源确定。司机岗位由系统为每个租户预置，不能手工新增或转换。'
    },
    {
      label: '排序',
      key: 'sort',
      type: 'number',
      props: { min: 0, max: 9999, controlsPosition: 'right', class: '!w-full' }
    },
    {
      label: '编制上限',
      key: 'headcountLimit',
      type: 'number',
      props: {
        min: 1,
        max: 9999,
        disabled: !form.multipleIncumbentsAllowed,
        controlsPosition: 'right',
        class: '!w-full'
      },
      help: form.multipleIncumbentsAllowed
        ? '允许多人共享该岗位时的最大在岗人数。'
        : '单人岗位固定为 1 人。'
    },
    {
      label: '允许多人任职',
      key: 'multipleIncumbentsAllowed',
      type: 'switch',
      props: {
        activeText: '多人岗位',
        inactiveText: '单人岗位',
        inlinePrompt: true,
        onChange: (value: boolean) => {
          if (!value) form.headcountLimit = 1
        }
      }
    },
    {
      label: '状态',
      key: 'enabled',
      type: 'switch',
      props: {
        disabled: form.systemCode === 'driver',
        activeText: '启用',
        inactiveText: '停用',
        inlinePrompt: true
      }
    },
    {
      label: '岗位说明',
      key: 'description',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 4, maxlength: 300, showWordLimit: true }
    }
  ])

  const replaceForm = (next: Position): void => {
    Object.keys(form).forEach((key) => delete form[key as keyof Position])
    Object.assign(form, next)
  }
  const resetForm = async (): Promise<void> => {
    replaceForm(createInitialForm())
    await nextTick()
    formRef.value?.clearValidate()
  }

  const handleSubmit = async (): Promise<boolean> => {
    try {
      await formRef.value?.validate()
      const type = form.id ? 'edit' : 'add'
      if (type === 'edit') await editPosition(structuredClone(toRaw(form)))
      else await addPosition(structuredClone(toRaw(form)))
      emit('success', type)
      return true
    } catch {
      return false
    }
  }

  const handleOpen = async (row?: Position): Promise<void> => {
    await resetForm()
    if (row) replaceForm({ ...createInitialForm(), ...structuredClone(toRaw(row)) })
    await positionNumber.loadRule()
    await dialogRef.value?.handleOpen(row, {
      title: row ? '编辑岗位' : '新增岗位',
      subtitle: row
        ? '维护岗位名称、排序与启用状态；业务属性保持不变'
        : '创建普通任职岗位；司机岗位由系统自动预置',
      confirmText: row ? '保存更改' : '创建岗位',
      contentMaxHeight: 'calc(100vh - 184px)',
      loading: isPlatformSuper.value && !tenantOptions.value.length,
      loadingText: '正在加载租户选项…',
      onOpen: async (_openRow, api) => {
        api.setLoading(true)
        try {
          if (isPlatformSuper.value && !tenantOptions.value.length) {
            const response = await fetchGetEnableTenantList()
            tenantOptions.value = (response.data ?? []).map((tenant) => ({
              label: `${tenant.tenantName}（${tenant.tenantCode}）`,
              value: tenant.id!
            }))
          }
          await Promise.all([
            formRef.value?.reloadOptions('organizationId'),
            formRef.value?.reloadOptions('jobProfileId'),
            formRef.value?.reloadOptions('gradeId')
          ])
        } finally {
          api.setLoading(false)
        }
      },
      onConfirm: handleSubmit,
      onReset: () => void resetForm()
    })
  }

  defineExpose({ handleOpen, handleClose: () => dialogRef.value?.handleClose() })
</script>

<style scoped lang="scss">
  .position-dialog {
    &__kind-summary {
      display: flex;
      gap: 12px;
      align-items: center;
      width: 100%;
      min-width: 0;
      padding: 12px 14px;
      background: var(--art-gray-100);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: var(--el-border-radius-base);

      &.is-driver {
        background: color-mix(in srgb, var(--el-color-success) 8%, var(--default-box-color));

        .position-dialog__kind-icon {
          color: var(--el-color-success);
          background: var(--el-color-success-light-9);
        }
      }

      > .el-tag {
        flex: none;
        margin-left: auto;
      }
    }

    &__kind-icon {
      display: inline-flex;
      flex: 0 0 38px;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, var(--default-box-color));
      border-radius: var(--el-border-radius-base);

      :deep(svg) {
        width: 18px;
        height: 18px;
      }
    }

    &__kind-copy {
      display: grid;
      flex: 1;
      min-width: 0;

      strong {
        line-height: 1.5;
        color: var(--el-text-color-primary);
      }

      span {
        margin-top: 2px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-secondary);
      }
    }

    @media (width <= 600px) {
      &__kind-summary {
        flex-wrap: wrap;

        > .el-tag {
          margin-left: 50px;
        }
      }
    }
  }
</style>
