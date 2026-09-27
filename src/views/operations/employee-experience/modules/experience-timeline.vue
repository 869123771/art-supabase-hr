<template>
  <ElTimeline v-if="events.length" class="experience-timeline">
    <ElTimelineItem
      v-for="event in events"
      :key="event.id"
      :type="eventTone(event)"
      :timestamp="formatDateTime(event.createTime)"
      placement="top"
    >
      <article>
        <div>
          <strong>{{ event.summary }}</strong>
          <span>{{ event.actorName || '系统自动处理' }}</span>
        </div>
        <small v-if="event.fromStatus || event.toStatus">
          {{ event.fromStatus ? statusLabel(event.fromStatus) : '初始状态' }}
          <ArtSvgIcon icon="ri:arrow-right-line" />
          {{ event.toStatus ? statusLabel(event.toStatus) : '状态未变更' }}
        </small>
      </article>
    </ElTimelineItem>
  </ElTimeline>
  <ArtEmptyState v-else title="暂无审计记录" size="compact" :visual-size="64" />
</template>

<script setup lang="ts">
  import { ElTimeline, ElTimelineItem, type TimelineItemProps } from 'element-plus'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ArtEmptyState from '@/components/core/feedback/art-empty-state/index.vue'
  import { formatDateTimeValue as formatDateTime } from '@/utils/ui/format'
  import { useUserStore } from '@/store/modules/user'

  defineProps<{ events: Api.Hr.EmployeeExperienceEvent[] }>()
  const userStore = useUserStore()
  const { getDictMap } = storeToRefs(userStore)
  const statusLabel = (value: string): string => {
    for (const code of ['hrExperienceSurveyStatus', 'commonActionProgressStatus']) {
      const label = getDictMap.value[code]?.find((item) => item.value === value)?.label
      if (label) return label
    }
    return value
  }
  const eventTone = (event: Api.Hr.EmployeeExperienceEvent): TimelineItemProps['type'] =>
    ['closed', 'completed'].includes(event.toStatus || '')
      ? 'success'
      : event.toStatus === 'cancelled'
        ? 'danger'
        : ['open', 'in_progress'].includes(event.toStatus || '')
          ? 'warning'
          : 'primary'
</script>

<style scoped lang="scss">
  .experience-timeline {
    padding: 3px 3px 0 5px;

    article {
      padding: 10px 11px;
      background: color-mix(in srgb, var(--art-gray-100) 45%, transparent);
      border: 1px solid var(--art-card-border);
      border-radius: var(--el-border-radius-base);
    }

    article > div {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }

    strong {
      font-size: 12px;
      color: var(--art-text-gray-900);
    }

    span {
      flex: 0 0 auto;
      font-size: 10px;
      color: var(--art-text-gray-500);
    }

    small {
      display: inline-flex;
      gap: 5px;
      align-items: center;
      margin-top: 5px;
      font-size: 10px;
      color: var(--art-text-gray-500);
    }
  }
</style>
