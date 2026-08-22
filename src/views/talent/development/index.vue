<template><HrWorkspacePage workspace-key="talent" :permissions="permissions" /></template>
<script setup lang="ts">
  import HrWorkspacePage from '@hr/views/shared/hr-workspace-page.vue'
  defineOptions({ name: 'HrTalentDevelopment' })
  const permissions = {
    view: 'Hr:Talent:View',
    add: 'Hr:Talent:Add',
    edit: 'Hr:Talent:Edit',
    delete: 'Hr:Talent:Delete'
  }
</script>
