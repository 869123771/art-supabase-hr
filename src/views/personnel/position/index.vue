<template>
  <div v-auth="'Hr:Position:View'" class="business-workspace-page art-full-height">
    <BusinessWorkspaceHeader
      eyebrow="POSITION CATALOG"
      title="岗位管理"
      description="维护组织中的具体编制岗位；每个岗位关联标准职务、职级与任职人数规则。"
      icon="ri:briefcase-4-line"
      :tags="workspaceTags"
      :metrics="workspaceMetrics"
    >
      <template #actions>
        <BusinessTableWorkspaceActions :table="tableQueryRef" />
      </template>
    </BusinessWorkspaceHeader>

    <ArtTableQuery
      ref="tableQueryRef"
      v-model="tableState.searchQuery"
      :search-items="searchItems"
      :api-fn="fetchTableData"
      :columns-factory="columnsFactory"
      :header-actions="headerActions"
      header-actions-placement="workspace"
      :search-bar-props="{ span: 6, labelWidth: 80, showExpand: false }"
      :table-props="{
        rowKey: 'id',
        tableLayout: 'fixed',
        emptyText: '暂无岗位',
        emptyDescription: '请先维护职务体系，再为组织新增具体岗位。'
      }"
      :on-success="handleTableSuccess"
      focusable
    />

    <PositionDialog ref="dialogRef" @success="handleSaveSuccess" />
  </div>
</template>

<script setup lang="tsx">
  import { ElTag } from 'element-plus'
  import { useArtFeedback } from '@/hooks/core/useArtFeedback'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import type {
    ArtTableQueryExpose,
    ArtTableQueryHeaderAction,
    ArtTableQueryProps
  } from '@/components/core/tables/art-table-query/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric,
    type BusinessWorkspaceTag
  } from '@/components/business/business-workspace-header/index.vue'
  import BusinessTableWorkspaceActions from '@/components/business/business-table-workspace-actions/index.vue'
  import { ColumnOption, DialogType } from '@/types'
  import { pageInfoHandler } from '@/utils/table/tableUtils'
  import { formatWithDayjs } from '@/utils/time'
  import { useUserStore } from '@/store/modules/user'
  import { deletePosition, fetchPositionList } from '@hr/api'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import PositionDialog from './modules/position-dialog.vue'

  defineOptions({ name: 'HrPosition' })

  type Position = Api.Hr.Position
  type SearchParams = Api.Hr.PositionSearchParams
  type TableParams = SearchParams & Pick<Api.Common.PaginationParams, 'current' | 'size'>

  interface PositionDialogExpose {
    handleOpen: (row?: Position) => Promise<void>
  }

  interface PositionOverviewRow {
    enabled: boolean
    employeeCount: number
  }

  const { confirmAction } = useArtFeedback()
  const userStore = useUserStore()
  const { getDictMap, isPlatformSuper } = storeToRefs(userStore)
  const tableQueryRef = ref<ArtTableQueryExpose>()
  const dialogRef = ref<PositionDialogExpose>()
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const overview = reactive<{ total: number; rows: PositionOverviewRow[] }>({ total: 0, rows: [] })
  const tableState = reactive<{ searchQuery: SearchParams }>({
    searchQuery: { tenantId: '', enabled: undefined, keyword: '' }
  })
  const enabledPositionCount = computed(
    () => overview.rows.filter((position) => position.enabled).length
  )
  const employeeCount = computed(() =>
    overview.rows.reduce((total, position) => total + Number(position.employeeCount ?? 0), 0)
  )
  const booleanOptions = computed(() =>
    (getDictMap.value.commonBoolean ?? []).map((item) => ({
      ...item,
      label: item.value === 'true' ? '启用' : '停用',
      value: item.value === 'true'
    }))
  )
  const workspaceTags: BusinessWorkspaceTag[] = [
    { label: '组织编制', type: 'primary', effect: 'plain' },
    { label: '标准职务关联', type: 'success', effect: 'light' },
    { label: '任职人数控制', type: 'info', effect: 'light' }
  ]
  const workspaceMetrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      label: '当前结果',
      value: overview.total,
      description: '随筛选条件更新',
      icon: 'ri:briefcase-4-line'
    },
    {
      label: '本页启用',
      value: enabledPositionCount.value,
      description: '可用于员工任职',
      icon: 'ri:checkbox-circle-line',
      tone: 'success'
    },
    {
      label: '本页在岗员工',
      value: employeeCount.value,
      description: '按岗位人数汇总',
      icon: 'ri:team-line',
      tone: 'info'
    }
  ])

  const searchItems = computed<SearchFormItem[]>(() => [
    {
      label: '所属租户',
      key: 'tenantId',
      type: 'select',
      hidden: !isPlatformSuper.value,
      props: { options: tenantOptions.value, clearable: true, filterable: true }
    },
    {
      label: '状态',
      key: 'enabled',
      type: 'select',
      props: {
        options: booleanOptions.value,
        clearable: true
      }
    },
    {
      label: '关键字',
      key: 'keyword',
      type: 'input',
      props: { clearable: true, placeholder: '岗位编码、名称或说明' }
    }
  ])

  const columnsFactory = (): ColumnOption<Position>[] => [
    ...(isPlatformSuper.value
      ? [
          {
            prop: 'tenant.tenantName',
            label: '所属租户',
            minWidth: 170,
            showOverflowTooltip: true
          } as ColumnOption<Position>
        ]
      : []),
    {
      prop: 'organization.organizationName',
      label: '所属组织',
      minWidth: 170,
      showOverflowTooltip: true,
      formatter: (row) => row.organization?.organizationName ?? (row.systemCode ? '系统通用' : '—')
    },
    {
      prop: 'positionCode',
      label: '岗位编码',
      minWidth: 150,
      showOverflowTooltip: true,
      formatter: (row) => <span class="position-page__code">{row.positionCode}</span>
    },
    {
      prop: 'positionName',
      label: '岗位名称',
      minWidth: 220,
      formatter: (row) => (
        <div class="position-page__name-cell">
          <strong title={row.positionName}>{row.positionName}</strong>
          <small title={row.description || undefined}>
            {row.description || (row.systemCode ? '系统预置岗位' : '普通任职岗位')}
          </small>
        </div>
      )
    },
    {
      prop: 'jobProfile.jobName',
      label: '标准职务',
      minWidth: 160,
      showOverflowTooltip: true,
      formatter: (row) => row.jobProfile?.jobName ?? '—'
    },
    {
      prop: 'grade.gradeName',
      label: '职级',
      width: 120,
      showOverflowTooltip: true,
      formatter: (row) => row.grade?.gradeName ?? '—'
    },
    {
      prop: 'positionKind',
      label: '业务属性',
      width: 110,
      formatter: (row) => (
        <ElTag
          type={row.positionKind === 'driver' ? 'success' : 'info'}
          effect={row.positionKind === 'driver' ? 'light' : 'plain'}
          round
        >
          {row.positionKind === 'driver' ? '司机岗位' : '普通岗位'}
        </ElTag>
      )
    },
    {
      prop: 'headcountLimit',
      label: '编制上限',
      width: 100,
      align: 'right',
      formatter: (row) => `${row.headcountLimit ?? 1} 人`
    },
    {
      prop: 'employeeCount',
      label: '在岗人数',
      width: 100,
      align: 'right',
      formatter: (row) => (
        <span class="position-page__employee-count">
          <strong>{row.employeeCount ?? 0}</strong>
          <small>人</small>
        </span>
      )
    },
    {
      prop: 'enabled',
      label: '状态',
      width: 90,
      formatter: (row) => (
        <ElTag type={row.enabled ? 'success' : 'info'} effect="plain">
          {row.enabled ? '启用' : '停用'}
        </ElTag>
      )
    },
    { prop: 'sort', label: '排序', width: 80, align: 'right' },
    {
      prop: 'createTime',
      label: '创建时间',
      width: 170,
      formatter: (row) => formatWithDayjs(row.createTime, 'YYYY-MM-DD HH:mm')
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right',
      formatter: (row) => (
        <div class="position-page__actions">
          <ArtButtonTable
            type="edit"
            permission="Hr:Position:Edit"
            onClick={() => openDialog(row)}
          />
          {!row.systemCode && (
            <ArtButtonTable
              type="delete"
              permission="Hr:Position:Delete"
              disabled={Number(row.employeeCount ?? 0) > 0}
              label={Number(row.employeeCount ?? 0) > 0 ? '岗位已有在岗人员，不能删除' : '删除'}
              onClick={() => handleDelete(row)}
            />
          )}
        </div>
      )
    }
  ]

  const headerActions = computed<ArtTableQueryHeaderAction[]>(() => [
    {
      type: 'add',
      label: '新增岗位',
      permission: 'Hr:Position:Add',
      onClick: () => openDialog()
    }
  ])

  const fetchTableData = (params: TableParams) => {
    const { from, to } = pageInfoHandler({ current: params.current, size: params.size })
    return fetchPositionList({ ...params, from, to })
  }

  const handleTableSuccess: NonNullable<ArtTableQueryProps['onSuccess']> = (rows, response) => {
    overview.rows = rows.map((row) => ({
      enabled: Boolean(row.enabled),
      employeeCount: Number(row.employeeCount ?? 0)
    }))
    overview.total = response.total ?? rows.length
  }

  const openDialog = (row?: Position): void => void dialogRef.value?.handleOpen(row)
  const handleSaveSuccess = (type: DialogType): void => {
    void (type === 'add'
      ? tableQueryRef.value?.refreshCreate()
      : tableQueryRef.value?.refreshUpdate())
  }

  const handleDelete = async (row: Position): Promise<void> => {
    if (!row.id) return
    try {
      await confirmAction(`确定删除岗位“${row.positionName}”吗？`, '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      })
      await deletePosition(row.id)
      await tableQueryRef.value?.refreshRemove()
    } catch {
      // 用户取消或服务端依赖校验失败时不追加重复提示。
    }
  }

  onMounted(async () => {
    await userStore.ensureDictLoaded('commonBoolean')
    if (!isPlatformSuper.value) return
    const response = await fetchGetEnableTenantList()
    tenantOptions.value = (response.data ?? []).map((tenant) => ({
      label: `${tenant.tenantName}（${tenant.tenantCode}）`,
      value: tenant.id!
    }))
  })
</script>

<style scoped lang="scss">
  .position-page {
    &__code {
      font-family: var(--el-font-family-monospace, ui-monospace, monospace);
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      letter-spacing: 0.02em;
    }

    &__name-cell {
      display: grid;
      min-width: 0;

      strong,
      small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      strong {
        color: var(--el-text-color-primary);
      }

      small {
        margin-top: 2px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    &__employee-count {
      display: inline-flex;
      gap: 3px;
      align-items: baseline;
      font-variant-numeric: tabular-nums;

      strong {
        color: var(--el-text-color-primary);
      }

      small {
        color: var(--el-text-color-secondary);
      }
    }

    &__actions {
      display: flex;
      align-items: center;
    }
  }
</style>
