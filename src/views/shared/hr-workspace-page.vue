<template>
  <div class="hr-workspace-page business-workspace-page art-full-height">
    <BusinessWorkspaceHeader
      class="hr-workspace-page__overview"
      :eyebrow="workspace.eyebrow"
      :title="workspace.title"
      :description="workspace.description"
      :icon="workspace.icon"
      :tags="workspaceTags"
      :metrics="workspaceMetrics"
    >
      <template #actions>
        <BusinessTableWorkspaceActions :table="tableQueryRef" />
      </template>
    </BusinessWorkspaceHeader>

    <section
      v-if="workspace.tabs.length > 1"
      class="hr-workspace-page__tabs"
      :class="{ 'has-detailed-tabs': hasDetailedTabs }"
    >
      <ElTabs v-model="activeTabKey" @tab-change="handleTabChange">
        <ElTabPane v-for="tab in workspace.tabs" :key="tab.key" :name="tab.key">
          <template #label>
            <span v-if="tab.description" class="hr-workspace-page__tab-label">
              <ArtSvgIcon :icon="tab.icon || workspace.icon" />
              <span>
                <strong>{{ tab.label }}</strong>
                <small>{{ tab.description }}</small>
              </span>
            </span>
            <template v-else>{{ tab.label }}</template>
          </template>
        </ElTabPane>
      </ElTabs>
    </section>

    <ArtTableQuery
      :key="tableKey"
      ref="tableQueryRef"
      v-model="search.model"
      :search-items="search.items"
      :api-fn="fetchTableData"
      :columns-factory="columnsFactory"
      :header-actions="headerActions"
      header-actions-placement="workspace"
      :search-bar-props="{ span: 8, labelWidth: 74 }"
      :table-props="{
        rowKey: 'id',
        tableLayout: 'fixed',
        emptyText: `暂无${activeTab.label}`,
        emptyDescription: `可调整筛选条件或新增${activeTab.label}。`
      }"
      :on-success="handleTableSuccess"
      focusable
    />

    <PersonnelChangeDialog
      v-if="props.workspaceKey === 'personnelChange'"
      ref="personnelChangeDialogRef"
      @success="handleDialogSuccess"
    />
    <WorkspaceRecordDialog v-else ref="dialogRef" @success="handleDialogSuccess" />
  </div>
</template>

<script setup lang="tsx">
  import { get } from 'lodash-es'
  import type { ColumnOption } from '@/types'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import type {
    ArtTableQueryApiFn,
    ArtTableQueryExpose,
    ArtTableQueryHeaderAction
  } from '@/components/core/tables/art-table-query/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtButtonMore from '@/components/core/forms/art-button-more/index.vue'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'
  import ArtDictDisplay from '@/components/core/base/art-dict-display/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import BusinessTableWorkspaceActions from '@/components/business/business-table-workspace-actions/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric,
    type BusinessWorkspaceTag
  } from '@/components/business/business-workspace-header/index.vue'
  import { pageInfoHandler } from '@/utils/table/tableUtils'
  import { formatWithDayjs } from '@/utils/time'
  import { useArtFeedback } from '@/hooks/core/useArtFeedback'
  import { useUserStore } from '@/store/modules/user'
  import {
    deleteHrWorkspaceRecord,
    effectPersonnelChange,
    effectRecruitmentRequisition,
    fetchHrWorkspaceRecords,
    submitHrApproval
  } from '@hr/api'
  import WorkspaceRecordDialog from './workspace-record-dialog.vue'
  import PersonnelChangeDialog from '../personnel/personnel-change/modules/personnel-change-dialog.vue'
  import HrTableActions from './hr-table-actions.vue'
  import HrTableIdentityCell from './hr-table-identity-cell.vue'
  import {
    hrWorkspaceDefinitions,
    type HrWorkspaceDefinition,
    type HrWorkspaceKey,
    type HrWorkspaceTab
  } from './workspace-config'

  interface WorkspacePermissions {
    view: string
    add: string
    edit: string
    delete: string
    submit?: string
    effect?: string
  }

  interface WorkspaceRecordDialogExpose {
    handleOpen: (data: {
      workspace: HrWorkspaceDefinition
      tab: HrWorkspaceTab
      record?: Api.Hr.WorkspaceRecord
    }) => Promise<void>
  }

  type TableParams = Api.Hr.WorkspaceSearchParams &
    Pick<Api.Common.PaginationParams, 'current' | 'size'>

  const props = defineProps<{ workspaceKey: HrWorkspaceKey; permissions: WorkspacePermissions }>()
  const userStore = useUserStore()
  const { getDictMap } = storeToRefs(userStore)
  const { confirmAction } = useArtFeedback()
  const tableQueryRef = ref<ArtTableQueryExpose>()
  const dialogRef = ref<WorkspaceRecordDialogExpose>()
  const personnelChangeDialogRef = ref<WorkspaceRecordDialogExpose>()
  const workspace = computed(() => hrWorkspaceDefinitions[props.workspaceKey])
  const activeTabKey = ref(workspace.value.tabs[0].key)
  const activeTab = computed(
    () =>
      workspace.value.tabs.find((tab) => tab.key === activeTabKey.value) ?? workspace.value.tabs[0]
  )
  const tableKey = computed(() => `${props.workspaceKey}-${activeTabKey.value}`)
  const hasDetailedTabs = computed(() => workspace.value.tabs.some((tab) => tab.description))
  const overview = reactive({ total: 0, attention: 0, completed: 0 })

  const search = reactive<{
    model: Api.Hr.WorkspaceSearchParams
    items: ComputedRef<SearchFormItem[]>
  }>({
    model: { keyword: '', status: '' },
    items: computed(() => [
      {
        label: '关键词',
        key: 'keyword',
        type: 'input',
        props: { placeholder: `搜索${activeTab.value.label}`, clearable: true }
      },
      ...(activeTab.value.statusDict
        ? [
            {
              label: '状态',
              key: 'status',
              type: 'select' as const,
              props: {
                options: getDictMap.value[activeTab.value.statusDict] ?? [],
                clearable: true
              }
            }
          ]
        : [])
    ])
  })

  const workspaceTags = computed<BusinessWorkspaceTag[]>(() =>
    workspace.value.tags.map((label, index) => ({
      label,
      type: index === 0 ? 'primary' : index === 1 ? 'success' : 'info',
      effect: index === 0 ? 'plain' : 'light'
    }))
  )
  const workspaceMetrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      label: '当前结果',
      value: overview.total,
      description: activeTab.value.label,
      icon: 'ri:file-list-3-line'
    },
    {
      label: '待关注',
      value: overview.attention,
      description: '审批中、临期或异常',
      icon: 'ri:alarm-warning-line',
      tone: 'warning'
    },
    {
      label: '已完成',
      value: overview.completed,
      description: '已生效、完成或通过',
      icon: 'ri:checkbox-circle-line',
      tone: 'success'
    }
  ])

  const headerActions = computed<ArtTableQueryHeaderAction[]>(() => [
    {
      type: 'add',
      label: `新增${activeTab.value.label}`,
      permission: props.permissions.add,
      onClick: () => void openDialog()
    }
  ])

  const isAttentionStatus = (status: string): boolean =>
    [
      'pending',
      'expiring',
      'expired',
      'late',
      'early_leave',
      'absent',
      'manager_review',
      'in_progress',
      'interview'
    ].includes(status)
  const isCompletedStatus = (status: string): boolean =>
    [
      'approved',
      'effective',
      'completed',
      'valid',
      'normal',
      'worked',
      'passed',
      'hired',
      'confirmed'
    ].includes(status)
  const getRowStatus = (row: Api.Hr.WorkspaceRecord): string =>
    String(get(row, String(activeTab.value.statusKey ?? 'status')) ?? '')
  const canEditRow = (row: Api.Hr.WorkspaceRecord): boolean =>
    !activeTab.value.approvalBusinessType || ['draft', 'rejected'].includes(getRowStatus(row))

  const openDialog = async (record?: Api.Hr.WorkspaceRecord): Promise<void> => {
    const target =
      props.workspaceKey === 'personnelChange' ? personnelChangeDialogRef.value : dialogRef.value
    await target?.handleOpen({ workspace: workspace.value, tab: activeTab.value, record })
  }

  const handleDelete = async (row: Api.Hr.WorkspaceRecord): Promise<void> => {
    if (!row.id) return
    try {
      await confirmAction(
        `确定删除这条${activeTab.value.label}记录吗？删除后无法恢复。`,
        `删除${activeTab.value.label}`,
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
      await deleteHrWorkspaceRecord(activeTab.value.entity, row.id)
      void tableQueryRef.value?.refreshRemove()
    } catch {
      // 用户取消时不需要额外反馈。
    }
  }

  const handleSubmitApproval = async (row: Api.Hr.WorkspaceRecord): Promise<void> => {
    if (!row.id || !activeTab.value.approvalBusinessType) return
    await submitHrApproval(activeTab.value.approvalBusinessType, row.id)
    void tableQueryRef.value?.refreshUpdate()
  }

  const handleEffect = async (row: Api.Hr.WorkspaceRecord): Promise<void> => {
    if (!row.id) return
    if (activeTab.value.approvalBusinessType === 'hr_recruitment_requisition') {
      await effectRecruitmentRequisition(row.id)
    } else {
      await effectPersonnelChange(row.id)
    }
    void tableQueryRef.value?.refreshUpdate()
  }

  const columnsFactory = (): ColumnOption<Api.Hr.WorkspaceRecord>[] => [
    ...activeTab.value.columns.map((column) => ({
      prop: String(column.key),
      label: column.label,
      minWidth: column.minWidth,
      width: column.width,
      showOverflowTooltip: true,
      formatter: (row: Api.Hr.WorkspaceRecord) => {
        const value = get(row, String(column.key))
        if (column.secondaryKey || column.tertiaryKey)
          return (
            <HrTableIdentityCell
              primary={value == null ? undefined : String(value)}
              secondary={String(get(row, String(column.secondaryKey)) ?? '')}
              tertiary={String(get(row, String(column.tertiaryKey)) ?? '')}
            />
          )
        if (column.dictCode)
          return (
            <ArtDictDisplay dictCode={column.dictCode} value={String(value ?? '')} display="auto" />
          )
        if (column.dateTime && value) return formatWithDayjs(String(value), 'YYYY-MM-DD HH:mm')
        return `${value ?? '—'}${value !== null && value !== undefined && column.suffix ? column.suffix : ''}`
      }
    })),
    {
      prop: 'operation',
      label: '操作',
      width: 112,
      fixed: 'right',
      formatter: (row: Api.Hr.WorkspaceRecord) => (
        <HrTableActions>
          {canEditRow(row) && (
            <ArtButtonTable
              type="edit"
              permission={props.permissions.edit}
              onClick={() => void openDialog(row)}
            />
          )}
          <ArtButtonMore
            list={() => rowMoreActions(row)}
            onClick={(item: ButtonMoreItem) => void handleRowMoreAction(item, row)}
          />
        </HrTableActions>
      )
    }
  ]

  const rowMoreActions = (row: Api.Hr.WorkspaceRecord): ButtonMoreItem[] => {
    const actions: ButtonMoreItem[] = []
    if (canEditRow(row)) {
      actions.push({
        key: 'delete',
        label: `删除${activeTab.value.label}`,
        icon: 'ri:delete-bin-5-line',
        color: 'var(--el-color-danger)',
        auth: props.permissions.delete
      })
    }
    if (
      activeTab.value.approvalBusinessType &&
      ['draft', 'rejected'].includes(getRowStatus(row)) &&
      props.permissions.submit
    ) {
      actions.unshift({
        key: 'submit',
        label: '提交审批',
        icon: 'ri:send-plane-line',
        auth: props.permissions.submit
      })
    }
    if (activeTab.value.canEffect && getRowStatus(row) === 'approved' && props.permissions.effect) {
      actions.unshift({
        key: 'effect',
        label: '确认生效',
        icon: 'ri:checkbox-circle-line',
        auth: props.permissions.effect
      })
    }
    return actions
  }

  const handleRowMoreAction = async (
    item: ButtonMoreItem,
    row: Api.Hr.WorkspaceRecord
  ): Promise<void> => {
    if (item.key === 'delete') await handleDelete(row)
    if (item.key === 'submit') await handleSubmitApproval(row)
    if (item.key === 'effect') await handleEffect(row)
  }

  const fetchTableData: ArtTableQueryApiFn = async (params) => {
    const { from, to } = pageInfoHandler(params as TableParams)
    return await fetchHrWorkspaceRecords(activeTab.value.entity, { ...params, from, to })
  }

  const handleTableSuccess = (
    data: Api.Hr.WorkspaceRecord[],
    response: { total?: number }
  ): void => {
    overview.total = response.total ?? data.length
    const statuses = data.map(getRowStatus)
    overview.attention = statuses.filter(isAttentionStatus).length
    overview.completed = statuses.filter(isCompletedStatus).length
  }

  const handleTabChange = (): void => {
    Object.assign(search.model, { keyword: '', status: '' })
    Object.assign(overview, { total: 0, attention: 0, completed: 0 })
  }

  const handleDialogSuccess = (): void => {
    void tableQueryRef.value?.refreshData()
  }

  onMounted(async () => {
    const codes = new Set<string>(['commonBoolean'])
    workspace.value.tabs.forEach((tab) => {
      if (tab.statusDict) codes.add(tab.statusDict)
      tab.columns.forEach((column) => column.dictCode && codes.add(column.dictCode))
      tab.fields.forEach((field) => field.dictCode && codes.add(field.dictCode))
    })
    await Promise.all([...codes].map((code) => userStore.ensureDictLoaded(code)))
  })
</script>

<style scoped lang="scss">
  .hr-workspace-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;

    &__tabs {
      min-width: 0;
      padding-inline: 8px;

      :deep(.el-tabs__header) {
        margin: 0;
      }

      &.has-detailed-tabs {
        padding-inline: 0;

        :deep(.el-tabs__nav-wrap) {
          padding-inline: 0;

          &::after {
            height: 1px;
            background-color: var(--el-border-color-lighter);
          }
        }

        :deep(.el-tabs__item) {
          height: 64px;
          padding-inline: 18px;
          color: var(--art-gray-600);

          &:hover,
          &.is-active {
            color: var(--theme-color);
          }

          &:focus-visible {
            outline: 2px solid color-mix(in srgb, var(--theme-color) 34%, transparent);
            outline-offset: -4px;
            border-radius: var(--el-border-radius-small);
          }
        }

        :deep(.el-tabs__item.is-top:nth-child(2)) {
          padding-left: 0;
        }

        :deep(.el-tabs__active-bar) {
          height: 3px;
          border-radius: 999px 999px 0 0;
        }

        :deep(.el-tabs__nav-next),
        :deep(.el-tabs__nav-prev) {
          display: grid;
          place-items: center;
          width: 32px;
          height: 64px;
          color: var(--art-gray-700);
          background: var(--default-box-color);
        }
      }
    }

    &__tab-label {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;

      > svg {
        flex: 0 0 auto;
        width: 20px;
        height: 20px;
      }

      > span {
        display: flex;
        flex-direction: column;
        min-width: 0;
        line-height: 1.25;
      }

      strong {
        font-size: 14px;
        font-weight: 600;
      }

      small {
        max-width: 224px;
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11px;
        font-weight: 400;
        color: var(--art-gray-500);
        white-space: nowrap;
      }
    }

    &__row-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      min-width: 0;
      white-space: nowrap;
    }

    :deep(.art-table-query) {
      flex: 1;
      min-height: 0;
    }

    @media (width <= 860px) {
      &__tabs.has-detailed-tabs :deep(.el-tabs__item) {
        height: 52px;
        padding-inline: 12px;
      }

      &__tab-label small {
        display: none;
      }

      &__tabs.has-detailed-tabs :deep(.el-tabs__nav-next),
      &__tabs.has-detailed-tabs :deep(.el-tabs__nav-prev) {
        height: 52px;
      }
    }
  }
</style>
