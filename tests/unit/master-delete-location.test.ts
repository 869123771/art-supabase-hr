import assert from 'node:assert/strict'
import test from 'node:test'
import { createRenderer, defineComponent, nextTick, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useHrMasterDeleteLocation } from '../../src/views/shared/use-hr-master-delete-location'

const renderer = createRenderer<object, object>({
  patchProp() {},
  insert() {},
  remove() {},
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  setText() {},
  setElementText() {},
  parentNode: () => null,
  nextSibling: () => null
})

async function prepareLocation(
  dependencyCode = 'hr_performance_review',
  beforeTick?: (
    app: ReturnType<typeof renderer.createApp>,
    router: ReturnType<typeof createRouter>
  ) => void
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: defineComponent({ render: () => null }) }]
  })
  await router.push({
    path: '/',
    query: { fromMasterDelete: '1', dependencyCode, recordNo: 'REVIEW-001', recordId: 'record-001' }
  })
  const entity = ref<'cycle' | 'review'>('cycle')
  const query = { keyword: '', status: 'draft' }
  let refreshCount = 0
  let locationState: ReturnType<typeof useHrMasterDeleteLocation<'cycle' | 'review'>> | undefined
  const app = renderer.createApp(
    defineComponent({
      setup() {
        locationState = useHrMasterDeleteLocation(
          { hr_performance_review: 'review' },
          entity,
          query,
          () => refreshCount++
        )
        return () => null
      }
    })
  )
  app.use(router)
  app.mount({})
  beforeTick?.(app, router)
  if (!locationState) throw new Error('Location hook did not initialize')
  return { app, router, entity, query, ...locationState, getRefreshCount: () => refreshCount }
}

test('unmount cancels the queued reference refresh', async () => {
  const location = await prepareLocation('hr_performance_review', (app) => app.unmount())
  await nextTick()
  assert.equal(location.getRefreshCount(), 0)
})

test('matching IDs in the wrong or unknown classification do not mark a reference as located', async () => {
  const location = await prepareLocation()
  try {
    await nextTick()
    location.markRows([{ id: 'record-001' }])
    assert.equal(location.locationReady.value, true)
    location.entity.value = 'cycle'
    await nextTick()
    assert.equal(location.locationReady.value, false)
    location.markRows([{ id: 'record-001' }])
    assert.equal(location.locationReady.value, false)
    location.router.currentRoute.value = {
      ...location.router.currentRoute.value,
      query: { fromMasterDelete: '1', dependencyCode: 'unknown', recordId: 'record-001' }
    }
    await nextTick()
    location.markRows([{ id: 'record-001' }])
    assert.equal(location.locationReady.value, false)
  } finally {
    location.app.unmount()
  }
})

test('a newer reference replaces the pending keyword without refreshing the old target', async () => {
  const location = await prepareLocation('hr_performance_review', (_app, router) => {
    router.currentRoute.value = {
      ...router.currentRoute.value,
      query: {
        fromMasterDelete: '1',
        dependencyCode: 'hr_performance_review',
        recordNo: 'REVIEW-002'
      }
    }
  })
  try {
    await nextTick()
    await nextTick()
    assert.equal(location.query.keyword, 'REVIEW-002')
    assert.equal(location.getRefreshCount(), 1)
  } finally {
    location.app.unmount()
  }
})

test('reference query cannot resolve inherited entity names', async () => {
  const location = await prepareLocation('constructor')
  try {
    await nextTick()
    assert.equal(location.entity.value, 'cycle')
    assert.equal(location.query.keyword, 'REVIEW-001')
  } finally {
    location.app.unmount()
  }
})
