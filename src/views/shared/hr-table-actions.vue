<template>
  <BusinessTableRowActions><slot /></BusinessTableRowActions>
</template>

<script setup lang="ts">
  import BusinessTableRowActions from '@/components/business/business-table-row-actions/index.vue'

  defineOptions({ name: 'HrTableActions' })
</script>
