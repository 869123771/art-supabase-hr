import type { FormItem } from '@/components/core/forms/art-form/index.vue'

/** Existing rows and parent-owned children retain their tenant when the shell scope changes. */
export function hrTenantScopedFormItems(items: FormItem[], tenantLocked: boolean): FormItem[] {
  return tenantLocked ? items.filter((item) => item.key !== 'tenantId') : items
}
