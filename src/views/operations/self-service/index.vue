<template><HrWorkspacePage workspace-key="selfService" :permissions="permissions" /></template>
<script setup lang="ts">
  import HrWorkspacePage from '@hr/views/shared/hr-workspace-page.vue'
  defineOptions({ name: 'HrSelfService' })
  const permissions = {
    view: 'Hr:SelfService:View',
    add: 'Hr:SelfService:Add',
    edit: 'Hr:SelfService:Edit',
    delete: 'Hr:SelfService:Delete',
    submit: 'Hr:SelfService:Submit'
  }
</script>
