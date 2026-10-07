import { computed, nextTick, ref, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'

export function useHrMasterDeleteLocation<Entity extends string>(
  entityByDependency: Partial<Record<string, Entity>>,
  activeEntity: Ref<Entity>,
  searchQuery: { keyword?: string; status?: string },
  refresh: () => void,
  resetFilters?: () => void
) {
  const route = useRoute()
  const locationReady = ref(false)
  const targetEntity = computed(() => {
    const dependencyCode = route.query.dependencyCode
    return typeof dependencyCode === 'string' && Object.hasOwn(entityByDependency, dependencyCode)
      ? entityByDependency[dependencyCode]
      : undefined
  })

  watch(activeEntity, () => {
    locationReady.value = false
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
      locationReady.value = false
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
        refresh()
      })
    },
    { immediate: true }
  )

  const markRows = (rows: Array<{ id?: string }>): void => {
    const recordId = route.query.recordId
    locationReady.value =
      route.query.fromMasterDelete === '1' &&
      targetEntity.value !== undefined &&
      activeEntity.value === targetEntity.value &&
      typeof recordId === 'string' &&
      rows.some((row) => row.id === recordId)
  }

  return { locationReady, markRows }
}
