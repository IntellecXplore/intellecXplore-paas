<template>
  <ElDropdown
    v-if="tenantList.length > 1"
    @command="handleSwitch"
    popper-class="tenant-dropdown"
  >
    <div class="flex-c c-p px-2 text-sm tenant-switcher-btn">
      <span class="max-w-20 truncate">{{ currentTenantName }}</span>
      <ArtSvgIcon icon="ri:arrow-down-s-line" class="ml-1 text-xs" />
    </div>
    <template #dropdown>
      <ElDropdownMenu>
        <div v-for="tenant in tenantList" :key="tenant.tenantId" class="tenant-item">
          <ElDropdownItem
            :command="tenant.tenantId"
            :class="{ 'is-selected': tenant.tenantId === currentTenantId }"
            :disabled="!tenant.status"
          >
            <div class="flex-c flex-col items-start">
              <span class="menu-txt">{{ tenant.tenantName }}</span>
              <span v-if="!tenant.status" class="text-xs text-danger">{{ $t('tenant.disabled') }}</span>
            </div>
            <ArtSvgIcon icon="ri:check-fill" v-if="tenant.tenantId === currentTenantId" />
          </ElDropdownItem>
        </div>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
  <div v-else class="flex-c px-2 text-sm text-gray-400">
    <span class="truncate">{{ currentTenantName }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { currentTenantId, tenantList } = storeToRefs(userStore)

const currentTenantName = computed(() => {
  if (!tenantList.value.length) return ''
  const current = tenantList.value.find(t => t.tenantId === currentTenantId.value)
  return current?.tenantName || tenantList.value[0]?.tenantName || ''
})

const handleSwitch = async (tenantId: number) => {
  if (tenantId === currentTenantId.value) return
  await userStore.switchTenant(tenantId)
}

onMounted(async () => {
  await userStore.fetchTenants()
  if (currentTenantId.value === 0 && tenantList.value.length > 0) {
    const def = tenantList.value.find(t => t.isDefault)
    userStore.setCurrentTenantId(def?.tenantId || tenantList.value[0].tenantId)
  }
})
</script>
