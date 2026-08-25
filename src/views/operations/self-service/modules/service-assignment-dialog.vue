<template>
  <ArtDialog ref="dialogRef" size="md">
    <div class="service-assignment-dialog">
      <div class="service-assignment-dialog__case">
        <span aria-hidden="true"><ArtSvgIcon icon="ri:user-settings-line" /></span>
        <div>
          <small>{{ record?.requestNo }}</small>
          <strong>{{ record?.title }}</strong>
          <p>分派后处理人可开始响应、请求补充材料并提交解决结果。</p>
        </div>
      </div>

      <ElForm label-position="top">
        <ElFormItem label="工单处理人" required>
          <ArtEmployeeSelect
            v-model="assigneeEmployeeId"
            v-model:selected-data="selection"
            :tenant-id="record?.tenantId"
            title="选择员工服务处理人"
            subtitle="仅选择当前租户内承担员工服务交付的有效员工"
            placeholder="请选择处理人"
          />
        </ElFormItem>
        <ElFormItem label="分派说明">
          <ElInput
            v-model="comment"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="可选：补充分派依据或处理要求"
          />
        </ElFormItem>
      </ElForm>
    </div>
  </ArtDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import ArtDialog from '@/components/core/dialogs/art-dialog/index.vue'
  import type { ArtDialogExpose } from '@/components/core/dialogs/art-dialog/types'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtEmployeeSelect from '@/components/business/art-employee-select/index.vue'
  import type { EmployeeIntegrationItem } from '@/api/integration/employees'
  import { transitionServiceRequest } from '@hr/api'

  const emit = defineEmits<{ success: [] }>()
  const dialogRef = ref<ArtDialogExpose>()
  const record = shallowRef<Api.Hr.ServiceRequest>()
  const assigneeEmployeeId = ref<string>()
  const selection = ref<EmployeeIntegrationItem[]>([])
  const comment = ref('')

  const selectedAssignee = (request: Api.Hr.ServiceRequest): EmployeeIntegrationItem[] =>
    request.assignee
      ? [
          {
            id: request.assignee.id,
            tenantId: request.tenantId || '',
            employeeNo: request.assignee.code || '',
            employeeName: request.assignee.name || '未命名员工',
            employmentStatus: 'active'
          }
        ]
      : []

  const submit = async (): Promise<boolean> => {
    if (!record.value?.id || !assigneeEmployeeId.value) {
      ElMessage.warning('请选择工单处理人')
      return false
    }
    await transitionServiceRequest(
      record.value.id,
      'assign',
      assigneeEmployeeId.value,
      comment.value
    )
    emit('success')
    return true
  }

  const handleOpen = async (request: Api.Hr.ServiceRequest): Promise<void> => {
    record.value = request
    assigneeEmployeeId.value = request.assignedEmployeeId || undefined
    selection.value = selectedAssignee(request)
    comment.value = ''
    await dialogRef.value?.handleOpen(undefined, {
      title: '分派员工服务工单',
      subtitle: '明确唯一处理人，避免队列内无人负责',
      confirmText: request.assignedEmployeeId ? '更新分派' : '确认分派',
      onConfirm: submit
    })
  }

  defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
  .service-assignment-dialog {
    display: grid;
    gap: 18px;

    &__case {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 12px;
      align-items: center;
      padding: 14px;
      background: color-mix(in srgb, var(--theme-color) 6%, var(--art-main-bg-color));
      border: 1px solid color-mix(in srgb, var(--theme-color) 16%, var(--art-card-border));
      border-radius: calc(var(--el-border-radius-base) + 4px);

      > span {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
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
        line-height: 1.5;
        color: var(--art-text-gray-600);
      }
    }
  }
</style>
