<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="true"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
        @click.self="$emit('close')"
      >
        <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[60vh] flex flex-col shadow-xl mb-16 sm:mb-0">
          
          <div class="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div>
              <h3 class="text-lg font-bold text-textPrimary">메뉴 연결</h3>
              <p class="text-sm text-textSecondary">
                {{ bean.country }}{{ bean.farm ? ` ${bean.farm}` : '' }}
              </p>
            </div>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              @click="$emit('close')"
            >
              <BaseIcon name="close" :size="20" />
            </button>
          </div>

          
          <div class="flex-1 overflow-y-auto p-4 min-h-0">
            
            <div v-if="isLoading" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>

            
            <div v-else-if="menus.length === 0" class="text-center py-8">
              <BaseIcon name="list" :size="48" class="text-textSecondary mx-auto mb-4" />
              <p class="text-textSecondary">등록된 메뉴가 없습니다</p>
              <p class="text-sm text-textSecondary mt-1">먼저 메뉴를 추가해주세요</p>
            </div>

            
            <div v-else class="space-y-3">
              <div
                v-for="menu in menus"
                :key="menu.id"
                class="p-3 rounded-lg border transition-colors"
                :class="linkState[menu.id]?.linked ? 'border-primary-200 bg-primary-50' : 'border-border'"
              >
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="linkState[menu.id]?.linked"
                    class="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    @change="toggleLink(menu.id)"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-textPrimary">{{ menu.name }}</p>
                    <p class="text-xs text-textSecondary mt-0.5">{{ formatCategory(menu.category) }}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          
          <div class="p-4 border-t border-border safe-bottom flex-shrink-0">
            <BaseButton
              variant="primary"
              size="large"
              class="w-full"
              :disabled="!hasChanges || isSaving"
              :loading="isSaving"
              @click="handleSave"
            >
              저장
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMenusByStoreId } from '@/api/menu'
import { linkBeanToMenu, unlinkBeanFromMenu } from '@/api/owner'
import { MENU_CATEGORIES } from '@/constants'
import { createLogger } from '@/utils/logger'
import { showSuccess, showError } from '@/utils/toast'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const logger = createLogger('OwnerMenuLinkModal')

const props = defineProps({
  bean: {
    type: Object,
    required: true
  },
  storeId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const categoryLabelMap = Object.fromEntries(
  MENU_CATEGORIES.map(cat => [cat.value, cat.label])
)

const menus = ref([])
const isLoading = ref(true)
const isSaving = ref(false)

const linkState = ref({})

/**
 * 메뉴 목록 로드 및 연결 상태 초기화
 */
const loadMenus = async () => {
  isLoading.value = true
  try {
    const response = await getMenusByStoreId(props.storeId, { page: 1, size: 100 })
    const data = response.data || response
    menus.value = data.content || data || []

    const state = {}
    menus.value.forEach(menu => {

      const linkedBean = menu.beanBadges?.find(b => b.beanId === props.bean.id)
      const linked = !!linkedBean

      state[menu.id] = {
        linked,
        original: { linked }
      }
    })
    linkState.value = state

    logger.info('메뉴 목록 로드 완료', { count: menus.value.length })
  } catch (err) {
    logger.error('메뉴 목록 로드 실패', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * 연결 토글
 */
const toggleLink = (menuId) => {
  const state = linkState.value[menuId]
  state.linked = !state.linked
}

/**
 * 변경사항 있는지 확인
 */
const hasChanges = computed(() => {
  return Object.values(linkState.value).some(state => {
    return state.linked !== state.original.linked
  })
})

/**
 * 저장
 */
const handleSave = async () => {
  isSaving.value = true
  try {
    const promises = []

    for (const [menuId, state] of Object.entries(linkState.value)) {
      const wasLinked = state.original.linked
      const isLinked = state.linked

      if (!wasLinked && isLinked) {

        promises.push(
          linkBeanToMenu(menuId, {
            beanId: props.bean.id,
            isBlended: false
          })
        )
      } else if (wasLinked && !isLinked) {

        promises.push(
          unlinkBeanFromMenu(menuId, props.bean.id)
        )
      }
    }

    await Promise.all(promises)

    showSuccess('메뉴 연결이 저장되었습니다')
    emit('updated')
    emit('close')
  } catch (err) {
    logger.error('메뉴 연결 저장 실패', err)
    showError('저장에 실패했습니다')
  } finally {
    isSaving.value = false
  }
}

/**
 * 카테고리 포맷팅
 */
const formatCategory = (category) => {
  return categoryLabelMap[category] || category
}

onMounted(() => {
  loadMenus()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
