<template>
  <div
    v-auth="'Hr:SelfService:View'"
    class="service-delivery-page business-workspace-page art-full-height"
  >
    <BusinessWorkspaceHeader
      eyebrow="EMPLOYEE SERVICE DELIVERY"
      title="员工服务交付"
      description="以统一服务目录承接员工诉求，用明确处理人、SLA 与不可变沟通轨迹闭环每一次服务交付。"
      icon="ri:customer-service-2-line"
      :tags="workspaceTags"
      :metrics="workspaceMetrics"
    >
      <template #actions><BusinessTableWorkspaceActions :table="tableQueryRef" /></template>
    </BusinessWorkspaceHeader>

    <section
      class="service-delivery-page__control"
      aria-labelledby="service-delivery-control-title"
    >
      <header class="service-delivery-page__heading">
        <div>
          <span class="service-delivery-page__section-icon">
            <ArtSvgIcon icon="ri:route-line" />
          </span>
          <span>
            <strong id="service-delivery-control-title">服务交付控制链</strong>
            <small>服务入口、受理责任、员工补充与解决确认保持同一条可审计轨迹</small>
          </span>
        </div>
        <span class="service-delivery-page__governance">
          <ArtSvgIcon icon="ri:shield-check-line" />租户隔离 · SLA 留痕
        </span>
      </header>

      <ol class="service-delivery-page__rail" aria-label="员工服务交付阶段">
        <li v-for="(stage, index) in deliveryStages" :key="stage.label" :class="stage.state">
          <span class="service-delivery-page__rail-index">0{{ index + 1 }}</span>
          <span class="service-delivery-page__rail-icon"><ArtSvgIcon :icon="stage.icon" /></span>
          <div>
            <strong>{{ stage.label }}</strong>
            <small>{{ stage.description }}</small>
          </div>
          <b>{{ stage.value }}</b>
        </li>
      </ol>

      <HrEntityNavigation
        v-model="activeEntity"
        :items="navigationItems"
        navigation-label="员工服务交付分类"
        compact
        @change="handleTabChange"
      />
      <footer class="service-delivery-page__note">
        <ArtSvgIcon icon="ri:information-line" />
        普通员工只能查看和推进本人服务工单；团队队列、分派、解决和服务目录维护均由受控权限与服务端
        RPC 双重校验。
      </footer>
    </section>

    <ArtTableQuery
      :key="activeEntity"
      ref="tableQueryRef"
      v-model="tableState.searchQuery"
      :search-items="searchItems"
      :api-fn="fetchTableData"
      :columns-factory="columnsFactory"
      :header-actions="headerActions"
      header-actions-placement="workspace"
      :search-bar-props="{ span: 6, labelWidth: 76, showExpand: false }"
      :table-props="{
        rowKey: 'id',
        tableLayout: 'fixed',
        emptyText: activeEntity === 'request' ? '暂无员工服务工单' : '暂无可用服务',
        emptyDescription: activeTab.emptyDescription
      }"
      focusable
    />

    <ServiceDeliveryDialog ref="dialogRef" @success="handleSaveSuccess" />
    <ServiceAssignmentDialog ref="assignmentDialogRef" @success="refreshAfterAction" />
    <ServiceRequestDrawer ref="requestDrawerRef" />
  </div>
</template>

<script setup lang="tsx">
  import { ElButton, ElTag } from 'element-plus'
  import { useRouter } from 'vue-router'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import type {
    ArtTableQueryExpose,
    ArtTableQueryHeaderAction
  } from '@/components/core/tables/art-table-query/index.vue'
  import ArtButtonTable from '@/components/core/forms/art-button-table/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import BusinessWorkspaceHeader, {
    type BusinessWorkspaceMetric,
    type BusinessWorkspaceTag
  } from '@/components/business/business-workspace-header/index.vue'
  import BusinessTableWorkspaceActions from '@/components/business/business-table-workspace-actions/index.vue'
  import { useArtFeedback } from '@/hooks/core/useArtFeedback'
  import { useAuth } from '@/hooks/core/useAuth'
  import { useUserStore } from '@/store/modules/user'
  import { pageInfoHandler } from '@/utils/table/tableUtils'
  import { formatWithDayjs } from '@/utils/time'
  import type { ColumnOption, DialogType } from '@/types'
  import { fetchGetEnableTenantList } from '@/api/system-manage'
  import {
    deleteServiceRequest,
    fetchServiceDeliveryOverview,
    fetchServiceDeliveryRecords,
    transitionServiceRequest
  } from '@hr/api'
  import HrEntityNavigation, {
    type HrEntityNavigationItem
  } from '@hr/views/shared/hr-entity-navigation.vue'
  import ServiceAssignmentDialog from './modules/service-assignment-dialog.vue'
  import ServiceDeliveryDialog from './modules/service-delivery-dialog.vue'
  import ServiceRequestDrawer from './modules/service-request-drawer.vue'

  defineOptions({ name: 'HrSelfService' })

  type Entity = Api.Hr.ServiceDeliveryEntity
  type RecordItem = Api.Hr.ServiceDeliveryRecord
  type TableParams = Api.Hr.ServiceDeliverySearchParams &
    Pick<Api.Common.PaginationParams, 'current' | 'size'>

  interface Tab extends HrEntityNavigationItem {
    value: Entity
    emptyDescription: string
  }
  interface DeliveryDialogExpose {
    handleOpen: (payload: {
      entity: Entity
      type: DialogType
      managerView: boolean
      editData?: RecordItem
      preset?: Partial<Api.Hr.ServiceRequest>
    }) => Promise<void>
  }
  interface AssignmentDialogExpose {
    handleOpen: (request: Api.Hr.ServiceRequest) => Promise<void>
  }
  interface RequestDrawerExpose {
    handleOpen: (id: string) => Promise<void>
  }

  const tabs: Tab[] = [
    {
      value: 'request',
      label: '服务工单',
      description: '诉求、责任人与 SLA',
      emptyDescription: '从服务目录发起工单后，可在这里跟踪受理、补充、解决和确认过程。',
      icon: 'ri:customer-service-2-line'
    },
    {
      value: 'service',
      label: '服务目录',
      description: '入口、队列与交付承诺',
      emptyDescription: '维护员工可发现的服务项目，并明确受理队列和交付时限。',
      icon: 'ri:service-line'
    }
  ]

  const router = useRouter()
  const userStore = useUserStore()
  const { getDictMap, isPlatformSuper } = storeToRefs(userStore)
  const { hasAuth } = useAuth()
  const { confirmAction, promptText } = useArtFeedback()
  const activeEntity = ref<Entity>('request')
  const activeTab = computed(() => tabs.find((tab) => tab.value === activeEntity.value) ?? tabs[0]!)
  const navigationItems: HrEntityNavigationItem[] = tabs
  const tableQueryRef = ref<ArtTableQueryExpose>()
  const dialogRef = ref<DeliveryDialogExpose>()
  const assignmentDialogRef = ref<AssignmentDialogExpose>()
  const requestDrawerRef = ref<RequestDrawerExpose>()
  const tenantOptions = ref<Array<{ label: string; value: string }>>([])
  const tableState = reactive<{ searchQuery: Api.Hr.ServiceDeliverySearchParams }>({
    searchQuery: { keyword: '', status: '', category: '', scope: 'mine', tenantId: '' }
  })
  const overview = reactive<Api.Hr.ServiceDeliveryOverview>({
    availableServiceCount: 0,
    openRequestCount: 0,
    slaRiskCount: 0,
    unassignedCount: 0,
    resolvedMonthCount: 0,
    responseOnTimeRate: 0,
    managerView: false
  })

  const managerView = computed(() => overview.managerView || isPlatformSuper.value)
  const workspaceTags: BusinessWorkspaceTag[] = [
    { label: '员工可追踪', type: 'primary', effect: 'plain' },
    { label: 'SLA 自动计时', type: 'warning', effect: 'light' },
    { label: '交付全留痕', type: 'success', effect: 'light' }
  ]
  const workspaceMetrics = computed<BusinessWorkspaceMetric[]>(() => [
    {
      label: '可用服务',
      value: overview.availableServiceCount,
      description: '统一员工服务入口',
      icon: 'ri:service-line',
      tone: 'primary'
    },
    {
      label: '处理中工单',
      value: overview.openRequestCount,
      description: `${overview.unassignedCount} 条尚未分派`,
      icon: 'ri:customer-service-2-line',
      tone: overview.unassignedCount ? 'warning' : 'info'
    },
    {
      label: 'SLA 风险',
      value: overview.slaRiskCount,
      description: '临近或已经超过时限',
      icon: 'ri:alarm-warning-line',
      tone: overview.slaRiskCount ? 'danger' : 'success'
    },
    {
      label: '首次响应准时率',
      value: `${overview.responseOnTimeRate}%`,
      description: `本月已解决 ${overview.resolvedMonthCount} 条`,
      icon: 'ri:verified-badge-line',
      tone: overview.responseOnTimeRate >= 95 ? 'success' : 'info'
    }
  ])
  const deliveryStages = computed(() => [
    {
      label: '发现服务',
      description: '目录、说明与受理方式',
      value: `${overview.availableServiceCount} 项可用`,
      icon: 'ri:compass-3-line',
      state: overview.availableServiceCount ? 'is-complete' : 'is-current'
    },
    {
      label: '提交诉求',
      description: '问题、附件与优先级',
      value: `${overview.openRequestCount} 条进行中`,
      icon: 'ri:file-add-line',
      state: overview.openRequestCount ? 'is-current' : ''
    },
    {
      label: '受理协同',
      description: '唯一责任人与员工补充',
      value: `${overview.unassignedCount} 条待分派`,
      icon: 'ri:user-settings-line',
      state: overview.unassignedCount ? 'is-risk' : 'is-complete'
    },
    {
      label: '解决确认',
      description: '结果交付与重开闭环',
      value: `${overview.resolvedMonthCount} 条本月解决`,
      icon: 'ri:checkbox-circle-line',
      state: overview.slaRiskCount ? 'is-risk' : 'is-complete'
    }
  ])

  const dictLabel = (code: string, value?: string | null): string =>
    getDictMap.value[code]?.find((item) => item.value === value)?.label ?? value ?? '--'
  const formatDateTime = (value?: string | null): string =>
    value ? (formatWithDayjs(value) ?? '--') : '--'
  const identity = (primary?: string | null, secondary?: string | null) => (
    <div class="service-delivery-page__identity">
      <strong>{primary || '--'}</strong>
      <span>{secondary || '--'}</span>
    </div>
  )
  const statusTone = (status: Api.Hr.ServiceRequestStatus) =>
    ['resolved', 'closed'].includes(status)
      ? 'success'
      : ['submitted', 'waiting_employee'].includes(status)
        ? 'warning'
        : ['assigned', 'in_progress'].includes(status)
          ? 'primary'
          : 'info'
  const slaTone = (status?: Api.Hr.ServiceRequestSlaStatus) =>
    status === 'breached'
      ? 'danger'
      : status === 'at_risk'
        ? 'warning'
        : status === 'on_track'
          ? 'success'
          : 'info'
  const slaLabel = (status?: Api.Hr.ServiceRequestSlaStatus): string =>
    ({ clear: '停止计时', on_track: 'SLA 正常', at_risk: 'SLA 临近', breached: 'SLA 超时' })[
      status || 'clear'
    ]

  const searchItems = computed<SearchFormItem[]>(() => {
    const items: SearchFormItem[] = []
    if (isPlatformSuper.value) {
      items.push({
        label: '租户',
        key: 'tenantId',
        type: 'select',
        options: tenantOptions.value,
        props: {
          clearable: true,
          filterable: true,
          placeholder: '全部租户',
          onChange: () => void refreshOverview()
        }
      })
    }
    if (activeEntity.value === 'request' && managerView.value) {
      items.push({
        label: '范围',
        key: 'scope',
        type: 'select',
        options: [
          { label: '我的工单', value: 'mine' },
          { label: '团队队列', value: 'team' }
        ],
        props: { clearable: false }
      })
    }
    if (activeEntity.value === 'request') {
      items.push({
        label: '状态',
        key: 'status',
        type: 'select',
        options: getDictMap.value.hrServiceRequestStatus ?? [],
        props: { clearable: true, placeholder: '全部状态' }
      })
    }
    items.push({
      label: '类别',
      key: 'category',
      type: 'select',
      options: getDictMap.value.hrServiceCategory ?? [],
      props: { clearable: true, placeholder: '全部类别' }
    })
    items.push({
      label: '关键字',
      key: 'keyword',
      type: 'input',
      props: {
        clearable: true,
        placeholder:
          activeEntity.value === 'request' ? '工单编号、主题或员工' : '服务编码、名称或受理组'
      }
    })
    return items
  })

  const requestColumns = (): ColumnOption<RecordItem>[] => [
    {
      prop: 'requestNo',
      label: '工单 / 申请员工',
      minWidth: 220,
      fixed: 'left',
      formatter: (row) => {
        const item = row as Api.Hr.ServiceRequest
        return identity(
          item.requestNo,
          `${item.requester?.name ?? '--'} · ${item.requester?.code ?? '--'}`
        )
      }
    },
    {
      prop: 'title',
      label: '诉求 / 服务项目',
      minWidth: 245,
      formatter: (row) => {
        const item = row as Api.Hr.ServiceRequest
        return identity(item.title, item.service?.name ?? item.requestType)
      }
    },
    {
      prop: 'assignee',
      label: '处理责任',
      minWidth: 155,
      formatter: (row) => {
        const item = row as Api.Hr.ServiceRequest
        return identity(item.assignee?.name ?? '待分派', item.service?.routingGroup ?? 'HR 服务台')
      }
    },
    {
      prop: 'priority',
      label: '优先级',
      width: 100,
      dict: { code: 'hrServicePriority', display: 'auto' }
    },
    {
      prop: 'status',
      label: '状态',
      width: 110,
      formatter: (row) => {
        const item = row as Api.Hr.ServiceRequest
        return (
          <ElTag type={statusTone(item.status)} effect="light">
            {dictLabel('hrServiceRequestStatus', item.status)}
          </ElTag>
        )
      }
    },
    {
      prop: 'slaStatus',
      label: 'SLA / 解决时限',
      minWidth: 165,
      formatter: (row) => {
        const item = row as Api.Hr.ServiceRequest
        return (
          <div class="service-delivery-page__sla">
            <ElTag type={slaTone(item.slaStatus)} effect="plain">
              {slaLabel(item.slaStatus)}
            </ElTag>
            <span>{formatDateTime(item.resolutionDueAt)}</span>
          </div>
        )
      }
    },
    {
      prop: 'lastActivityAt',
      label: '最近活动',
      minWidth: 150,
      formatter: (row) => formatDateTime((row as Api.Hr.ServiceRequest).lastActivityAt)
    },
    requestActionColumn()
  ]
  const serviceColumns = (): ColumnOption<RecordItem>[] => [
    {
      prop: 'serviceName',
      label: '服务项目',
      minWidth: 220,
      fixed: 'left',
      formatter: (row) => {
        const item = row as Api.Hr.ServiceCatalog
        return identity(
          item.serviceName,
          `${item.serviceCode} · ${dictLabel('hrServiceCategory', item.category)}`
        )
      }
    },
    { prop: 'description', label: '服务说明', minWidth: 280, showOverflowTooltip: true },
    {
      prop: 'serviceMode',
      label: '交付方式',
      minWidth: 130,
      formatter: (row) =>
        (row as Api.Hr.ServiceCatalog).serviceMode === 'case' ? '服务工单' : '专业流程'
    },
    {
      prop: 'routingGroup',
      label: '受理队列',
      minWidth: 145,
      formatter: (row) => (row as Api.Hr.ServiceCatalog).routingGroup || '--'
    },
    {
      prop: 'sla',
      label: '响应 / 解决',
      minWidth: 145,
      formatter: (row) => {
        const item = row as Api.Hr.ServiceCatalog
        return `${item.firstResponseHours} 小时 / ${item.resolutionHours} 小时`
      }
    },
    {
      prop: 'requestCount',
      label: '累计工单',
      width: 105,
      formatter: (row) => `${(row as Api.Hr.ServiceCatalog).requestCount ?? 0} 条`
    },
    {
      prop: 'enabled',
      label: '状态',
      width: 90,
      formatter: (row) => (
        <ElTag type={(row as Api.Hr.ServiceCatalog).enabled ? 'success' : 'info'} effect="light">
          {(row as Api.Hr.ServiceCatalog).enabled ? '启用' : '停用'}
        </ElTag>
      )
    },
    serviceActionColumn()
  ]
  const columnsFactory = (): ColumnOption<RecordItem>[] =>
    activeEntity.value === 'request' ? requestColumns() : serviceColumns()

  const actionButton = (
    label: string,
    type: 'primary' | 'success' | 'warning' | 'danger' | 'info',
    handler: () => void,
    permission?: string
  ) =>
    !permission || hasAuth(permission) ? (
      <ElButton link type={type} onClick={handler}>
        {label}
      </ElButton>
    ) : null
  const requestTransitionButtons = (item: Api.Hr.ServiceRequest) => {
    if (!item.id) return null
    if (item.status === 'draft') {
      return (
        <>
          {actionButton(
            '提交',
            'primary',
            () => void handleRequestAction(item, 'submit'),
            'Hr:SelfService:Submit'
          )}
          {actionButton(
            '编辑',
            'primary',
            () => openDialog('request', item),
            'Hr:SelfService:Edit'
          )}
          <ArtButtonTable
            type="delete"
            permission="Hr:SelfService:Delete"
            onClick={() => void handleDelete(item)}
          />
        </>
      )
    }
    if (item.status === 'submitted') {
      return (
        <>
          {actionButton(
            '分派',
            'primary',
            () => void assignmentDialogRef.value?.handleOpen(item),
            'Hr:SelfService:Assign'
          )}
          {actionButton(
            '开始处理',
            'success',
            () => void handleRequestAction(item, 'start'),
            'Hr:SelfService:Resolve'
          )}
          {actionButton(
            '取消',
            'warning',
            () => void handleRequestAction(item, 'cancel'),
            'Hr:SelfService:Submit'
          )}
        </>
      )
    }
    if (item.status === 'assigned') {
      return (
        <>
          {actionButton(
            '重新分派',
            'primary',
            () => void assignmentDialogRef.value?.handleOpen(item),
            'Hr:SelfService:Assign'
          )}
          {actionButton(
            '开始处理',
            'success',
            () => void handleRequestAction(item, 'start'),
            'Hr:SelfService:Resolve'
          )}
          {actionButton(
            '解决',
            'success',
            () => void handleRequestAction(item, 'resolve'),
            'Hr:SelfService:Resolve'
          )}
        </>
      )
    }
    if (item.status === 'in_progress') {
      return (
        <>
          {actionButton(
            '请求补充',
            'warning',
            () => void handleRequestAction(item, 'wait'),
            'Hr:SelfService:Resolve'
          )}
          {actionButton(
            '解决',
            'success',
            () => void handleRequestAction(item, 'resolve'),
            'Hr:SelfService:Resolve'
          )}
          {actionButton('沟通', 'primary', () => void handleRequestAction(item, 'comment'))}
        </>
      )
    }
    if (item.status === 'waiting_employee') {
      return (
        <>
          {actionButton('已补充', 'primary', () => void handleRequestAction(item, 'resume'))}
          {actionButton('沟通', 'primary', () => void handleRequestAction(item, 'comment'))}
        </>
      )
    }
    if (item.status === 'resolved') {
      return (
        <>
          {actionButton('确认关闭', 'success', () => void handleRequestAction(item, 'close'))}
          {actionButton('重新打开', 'warning', () => void handleRequestAction(item, 'reopen'))}
        </>
      )
    }
    if (item.status === 'closed')
      return actionButton('重新打开', 'warning', () => void handleRequestAction(item, 'reopen'))
    return null
  }
  const requestActionColumn = (): ColumnOption<RecordItem> => ({
    prop: 'action',
    label: '操作',
    width: 350,
    fixed: 'right',
    formatter: (row) => {
      const item = row as Api.Hr.ServiceRequest
      return (
        <div class="service-delivery-page__actions">
          {actionButton(
            '详情',
            'primary',
            () => item.id && void requestDrawerRef.value?.handleOpen(item.id)
          )}
          {requestTransitionButtons(item)}
        </div>
      )
    }
  })
  const serviceActionColumn = (): ColumnOption<RecordItem> => ({
    prop: 'action',
    label: '操作',
    width: 190,
    fixed: 'right',
    formatter: (row) => {
      const item = row as Api.Hr.ServiceCatalog
      return (
        <div class="service-delivery-page__actions">
          {item.enabled && item.serviceMode === 'case'
            ? actionButton('发起服务', 'primary', () =>
                openDialog('request', undefined, {
                  serviceId: item.id,
                  requestType: item.category,
                  title: item.serviceName,
                  priority: 'normal',
                  channel: 'self_service'
                })
              )
            : null}
          {item.enabled && item.serviceMode === 'redirect' && item.routePath
            ? actionButton('进入流程', 'primary', () => void router.push(item.routePath!))
            : null}
          {actionButton(
            '编辑',
            'primary',
            () => openDialog('service', item),
            'Hr:SelfService:Catalog:Manage'
          )}
        </div>
      )
    }
  })

  const headerActions = computed<ArtTableQueryHeaderAction[]>(() => [
    {
      type: 'add',
      label: activeEntity.value === 'request' ? '新建服务工单' : '新增服务项目',
      permission:
        activeEntity.value === 'request' ? 'Hr:SelfService:Add' : 'Hr:SelfService:Catalog:Manage',
      onClick: () => openDialog(activeEntity.value)
    }
  ])
  const fetchTableData = (params: TableParams) => {
    const { from, to } = pageInfoHandler({ current: params.current, size: params.size })
    return fetchServiceDeliveryRecords(activeEntity.value, { ...params, from, to })
  }
  const refreshOverview = async () => {
    const response = await fetchServiceDeliveryOverview(tableState.searchQuery.tenantId)
    if (response.data) Object.assign(overview, response.data)
  }
  const openDialog = (entity: Entity, row?: RecordItem, preset?: Partial<Api.Hr.ServiceRequest>) =>
    void dialogRef.value?.handleOpen({
      entity,
      type: row ? 'edit' : 'add',
      managerView: managerView.value,
      editData: row,
      preset
    })
  const handleSaveSuccess = (type: DialogType, entity: Entity) => {
    if (entity === activeEntity.value) {
      void (type === 'add'
        ? tableQueryRef.value?.refreshCreate()
        : tableQueryRef.value?.refreshUpdate())
    } else {
      activeEntity.value = entity
    }
    void refreshOverview()
  }
  const handleTabChange = () =>
    Object.assign(tableState.searchQuery, {
      keyword: '',
      status: '',
      category: '',
      scope: activeEntity.value === 'request' ? 'mine' : undefined
    })
  const refreshAfterAction = async () => {
    await tableQueryRef.value?.getData()
    await refreshOverview()
  }
  const handleDelete = async (item: Api.Hr.ServiceRequest) => {
    if (!item.id) return
    try {
      await confirmAction('确定删除这条服务工单草稿吗？删除后无法恢复。', '删除服务工单', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      })
      await deleteServiceRequest(item.id)
      await tableQueryRef.value?.refreshRemove()
      await refreshOverview()
    } catch {
      /* 用户取消或服务端门禁拒绝。 */
    }
  }
  const handleRequestAction = async (
    item: Api.Hr.ServiceRequest,
    action: Api.Hr.ServiceRequestAction
  ) => {
    if (!item.id) return
    try {
      let comment: string | undefined
      if (['wait', 'resolve', 'reopen', 'comment'].includes(action)) {
        const prompts: Partial<Record<Api.Hr.ServiceRequestAction, [string, string]>> = {
          wait: ['说明需要员工补充的材料或信息，内容会写入服务轨迹。', '请求员工补充'],
          resolve: ['填写可供员工确认的解决结果，内容会写入服务轨迹。', '提交解决结果'],
          reopen: ['说明重新打开工单的原因，系统将重新启动解决计时。', '重新打开工单'],
          comment: ['输入本次沟通内容，保存后不可从服务轨迹中删除。', '添加沟通记录']
        }
        const [message, title] = prompts[action]!
        comment = await promptText(message, title, { minLength: 2, maxLength: 800 })
      } else if (['submit', 'start', 'resume', 'close', 'cancel'].includes(action)) {
        const labels: Partial<Record<Api.Hr.ServiceRequestAction, string>> = {
          submit: '提交后工单将进入服务队列并开始 SLA 计时，是否继续？',
          start: '确认开始处理该服务工单？',
          resume: '确认员工已补充所需信息并恢复处理？',
          close: '确认解决结果已交付并关闭工单？',
          cancel: '确认取消该服务工单？'
        }
        await confirmAction(labels[action]!, '服务工单状态确认', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: action === 'cancel' ? 'warning' : 'info'
        })
      }
      await transitionServiceRequest(item.id, action, undefined, comment)
      await refreshAfterAction()
    } catch {
      /* 用户取消或服务端门禁拒绝。 */
    }
  }

  onMounted(async () => {
    if (isPlatformSuper.value) {
      const response = await fetchGetEnableTenantList()
      tenantOptions.value = (response.data ?? [])
        .filter((tenant): tenant is typeof tenant & { id: string } => Boolean(tenant.id))
        .map((tenant) => ({ label: tenant.tenantName, value: tenant.id }))
    }
    await refreshOverview()
  })
</script>

<style scoped lang="scss">
  .service-delivery-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;

    &__control {
      display: grid;
      gap: 14px;
      min-width: 0;
      padding: 18px;
      background: var(--art-main-bg-color);
      border: 1px solid var(--art-card-border);
      border-radius: calc(var(--el-border-radius-base) + 6px);
      box-shadow: var(--art-box-shadow-xs);
    }

    &__heading,
    &__heading > div,
    &__governance,
    &__rail li,
    &__actions,
    &__sla {
      display: flex;
      align-items: center;
    }

    &__heading {
      gap: 16px;
      justify-content: space-between;

      > div {
        gap: 12px;
        min-width: 0;
      }

      strong,
      small {
        display: block;
      }

      strong {
        color: var(--art-text-gray-900);
      }

      small {
        margin-top: 3px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--art-text-gray-600);
      }
    }

    &__section-icon {
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      width: 38px;
      height: 38px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 10%, transparent);
      border-radius: var(--el-border-radius-base);
    }

    &__governance {
      flex: 0 0 auto;
      gap: 6px;
      padding: 7px 11px;
      font-size: 12px;
      color: var(--art-text-gray-700);
      background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--el-color-success) 20%, var(--art-card-border));
      border-radius: 999px;
    }

    &__rail {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      min-width: 0;
      padding: 0;
      margin: 0;
      list-style: none;

      li {
        position: relative;
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr);
        gap: 3px 10px;
        min-width: 0;
        padding: 13px;
        background: color-mix(in srgb, var(--art-main-bg-color) 92%, var(--theme-color));
        border: 1px solid var(--art-card-border);
        border-radius: calc(var(--el-border-radius-base) + 3px);

        &.is-current {
          border-color: color-mix(in srgb, var(--theme-color) 38%, var(--art-card-border));
        }

        &.is-risk {
          border-color: color-mix(in srgb, var(--el-color-warning) 42%, var(--art-card-border));
        }

        &.is-complete .service-delivery-page__rail-icon {
          color: var(--el-color-success);
          background: color-mix(in srgb, var(--el-color-success) 11%, transparent);
        }

        div {
          min-width: 0;
        }

        strong,
        small,
        b {
          display: block;
        }

        strong {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
          color: var(--art-text-gray-900);
          white-space: nowrap;
        }

        small {
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 11px;
          color: var(--art-text-gray-500);
          white-space: nowrap;
        }

        b {
          grid-column: 2;
          margin-top: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--theme-color);
        }
      }
    }

    &__rail-index {
      position: absolute;
      top: 7px;
      right: 9px;
      font-size: 10px;
      color: var(--art-text-gray-400);
    }

    &__rail-icon {
      display: grid;
      grid-row: 1 / span 2;
      place-items: center;
      width: 32px;
      height: 32px;
      color: var(--theme-color);
      background: color-mix(in srgb, var(--theme-color) 9%, transparent);
      border-radius: var(--el-border-radius-base);
    }

    &__note {
      display: flex;
      gap: 7px;
      align-items: flex-start;
      font-size: 12px;
      line-height: 1.55;
      color: var(--art-text-gray-500);
    }

    &__identity {
      display: grid;
      min-width: 0;

      strong,
      span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      strong {
        color: var(--art-text-gray-900);
      }

      span {
        margin-top: 3px;
        font-size: 12px;
        color: var(--art-text-gray-500);
      }
    }

    &__actions {
      flex-wrap: wrap;
      gap: 0 4px;
    }

    &__sla {
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;

      span {
        font-size: 11px;
        color: var(--art-text-gray-500);
      }
    }
  }

  @media (width <= 1180px) {
    .service-delivery-page__rail {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 720px) {
    .service-delivery-page {
      &__control {
        padding: 14px;
      }

      &__heading {
        flex-direction: column;
        align-items: flex-start;
      }

      &__rail {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  }
</style>
