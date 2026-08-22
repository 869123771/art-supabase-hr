<template><HrWorkspacePage workspace-key="performance" :permissions="permissions" /></template>
<script setup lang="ts">
  import HrWorkspacePage from '@hr/views/shared/hr-workspace-page.vue'
  defineOptions({ name: 'HrPerformance' })
  const permissions = {
    view: 'Hr:Performance:View',
    add: 'Hr:Performance:Add',
    edit: 'Hr:Performance:Edit',
    delete: 'Hr:Performance:Delete'
  }
</script>
