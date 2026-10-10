import { computed, nextTick, watch, type ComputedRef, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ArtTableQueryExpose } from '@/components/core/tables/art-table-query/index.vue'
import { hasLocatedRecord } from '@/components/business/master-delete-processing-notice/record-location'

/** 人事实体与筛选规则在此管理；记录是否已找到只读取公共表格已接受的结果。 */
export function useHrMasterDeleteLocation<Entity extends string>(
  entityByDependency: Partial<Record<string, Entity>>,
  activeEntity: Ref<Entity>,
  searchQuery: { keyword?: string; status?: string },
  table: Ref<Pick<ArtTableQueryExpose, 'dataState' | 'refreshData'> | undefined>,
  resetFilters?: () => void
): { locationReady: ComputedRef<boolean> } {
  const route = useRoute()
  const targetEntity = computed(() => {
    const dependencyCode = route.query.dependencyCode
    return typeof dependencyCode === 'string' && Object.hasOwn(entityByDependency, dependencyCode)
      ? entityByDependency[dependencyCode]
      : undefined
  })

  const locationReady = computed(() => {
    const state = table.value?.dataState
    const recordId = route.query.recordId
    return Boolean(
      route.query.fromMasterDelete === '1' &&
      targetEntity.value !== undefined &&
      activeEntity.value === targetEntity.value &&
      typeof recordId === 'string' &&
      state &&
      hasLocatedRecord(state.rows.value, recordId, state.loading.value, state.error.value)
    )
  })

  watch(
    () => [
      route.query.fromMasterDelete,
      route.query.dependencyCode,
      route.query.recordId,
      route.query.recordNo
    ],
    (_value, _previousValue, onCleanup) => {
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })
      if (route.query.fromMasterDelete !== '1') return

      const dependencyCode = route.query.dependencyCode
      const entity = targetEntity.value
      if (entity) activeEntity.value = entity
      const recordNo = route.query.recordNo
      const recordId = route.query.recordId
      const keyword =
        typeof recordNo === 'string' && !recordNo.startsWith('关联记录') ? recordNo : ''
      searchQuery.keyword = keyword
      searchQuery.status = ''
      resetFilters?.()
      void nextTick(() => {
        if (
          cancelled ||
          route.query.fromMasterDelete !== '1' ||
          route.query.dependencyCode !== dependencyCode ||
          route.query.recordId !== recordId ||
          route.query.recordNo !== recordNo
        )
          return
        searchQuery.keyword = keyword
        searchQuery.status = ''
        resetFilters?.()
        void table.value?.refreshData()
      })
    },
    { immediate: true }
  )

  return { locationReady }
}
