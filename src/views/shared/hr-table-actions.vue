<template>
  <div class="hr-table-actions"><slot /></div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'HrTableActions' })
</script>

<style scoped lang="scss">
  .hr-table-actions {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-start;
    min-width: 0;
    white-space: nowrap;

    :deep(.art-button-table) {
      flex: 0 0 auto;
      margin-right: 0;
    }

    :deep(.el-dropdown) {
      display: inline-flex;
    }
  }
</style>
