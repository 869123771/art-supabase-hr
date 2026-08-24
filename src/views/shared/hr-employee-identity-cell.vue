<template>
  <div class="hr-employee-identity-cell">
    <ElAvatar :size="38" :src="avatarUrl || undefined" :alt="`${employeeName}的头像`">
      {{ employeeInitial }}
    </ElAvatar>
    <div>
      <RouterLink
        v-if="to"
        class="hr-employee-identity-cell__name"
        :to="to"
        :title="`查看员工 ${employeeName} 档案`"
      >
        {{ employeeName }}
      </RouterLink>
      <strong v-else class="hr-employee-identity-cell__name">{{ employeeName }}</strong>
      <small :title="employeeNo">{{ employeeNo }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { RouteLocationRaw } from 'vue-router'

  defineOptions({ name: 'HrEmployeeIdentityCell' })

  const props = withDefaults(
    defineProps<{
      employeeName: string
      employeeNo: string
      avatarUrl?: string | null
      to?: RouteLocationRaw
    }>(),
    {
      avatarUrl: undefined,
      to: undefined
    }
  )

  const employeeInitial = computed(() => props.employeeName.trim().slice(0, 1) || '员')
</script>

<style scoped lang="scss">
  .hr-employee-identity-cell {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;

    :deep(.el-avatar) {
      flex: 0 0 auto;
      color: var(--art-gray-700);
      background: var(--art-gray-200);
    }

    > div {
      display: grid;
      gap: 3px;
      min-width: 0;
    }

    &__name,
    small {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__name {
      font-weight: 700;
      color: var(--art-gray-900);
      text-decoration: none;
      transition: color var(--art-duration-fast);

      &:is(a):hover {
        color: var(--theme-color);
      }

      &:is(a):focus-visible {
        color: var(--theme-color);
        outline: 2px solid var(--theme-color);
        outline-offset: 2px;
        border-radius: var(--el-border-radius-small);
      }
    }

    small {
      font-size: 12px;
      color: var(--art-gray-600);
    }
  }
</style>
