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
              <h3 class="text-lg font-bold text-textPrimary">원두 연결</h3>
              <p class="text-sm text-textSecondary">{{ menu?.name }}</p>
            </div>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              @click="$emit('close')"
            >
              <BaseIcon name="close" :size="20" />
            </button>
          </div>

          
          <div class="flex border-b border-border flex-shrink-0">
            <button
              class="flex-1 py-3 text-sm font-medium transition-colors"
              :class="activeTab === 'linked' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'"
              @click="activeTab = 'linked'"
            >
              연결된 원두 ({{ linkedBeans.length }})
            </button>
            <button
              class="flex-1 py-3 text-sm font-medium transition-colors"
              :class="activeTab === 'search' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'"
              @click="activeTab = 'search'; loadBeans(true)"
            >
              원두 검색
            </button>
          </div>

          
          <div class="flex-1 overflow-y-auto min-h-0">
            
            <div v-if="activeTab === 'linked'" class="p-4">
              <div v-if="linkedBeans.length === 0" class="text-center py-8">
                <p class="text-textSecondary text-sm">연결된 원두가 없습니다</p>
                <button
                  class="mt-2 text-primary text-sm font-medium"
                  @click="activeTab = 'search'; loadBeans(true)"
                >
                  원두 검색하기
                </button>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="bean in linkedBeans"
                  :key="bean.id"
                  class="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200"
                >
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-textPrimary truncate">{{ bean.name }}</p>
                    <p class="text-xs text-textSecondary">{{ bean.roasteryName }}</p>
                  </div>
                  <button
                    class="ml-2 p-1.5 text-error hover:bg-error/10 rounded-full transition-colors"
                    :disabled="isUnlinking === bean.id"
                    @click="handleUnlink(bean)"
                  >
                    <div v-if="isUnlinking === bean.id" class="animate-spin rounded-full h-4 w-4 border-2 border-error border-t-transparent"></div>
                    <BaseIcon v-else name="close" :size="16" />
                  </button>
                </div>
              </div>
            </div>

            
            <div v-else class="flex flex-col h-full">
              
              <div class="p-4 border-b border-border flex-shrink-0">
                <div class="relative">
                  <BaseInput
                    v-model="searchKeyword"
                    placeholder="국가명으로 검색 (예: 에티오피아)"
                    @input="handleSearchDebounced"
                  />
                  <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
                    <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  </div>
                </div>
              </div>

              
              <div class="flex-1 overflow-y-auto p-4 min-h-0">
                
                <div v-if="isLoading && beans.length === 0" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>

                
                <div v-else-if="beans.length === 0" class="text-center py-8">
                  <p class="text-textSecondary">
                    {{ searchKeyword ? '검색 결과가 없습니다' : '등록된 원두가 없습니다' }}
                  </p>
                </div>

                
                <div v-else class="space-y-2">
                  <div
                    v-for="bean in beans"
                    :key="bean.id"
                    class="p-3 rounded-lg border border-border hover:border-primary-300 transition-colors"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1 min-w-0">
                        
                        <p v-if="bean.name" class="font-medium text-textPrimary truncate">{{ bean.name }}</p>
                        <p class="text-xs text-textSecondary mt-0.5">
                          {{ bean.country }}{{ bean.farm ? ` / ${bean.farm}` : '' }}
                        </p>
                        <p class="text-xs text-textSecondary mt-0.5">
                          {{ bean.variety || '-' }} · {{ bean.processingMethod || '-' }} · {{ getRoastingLevelLabel(bean.roastingLevel) }}
                        </p>
                        
                        <p v-if="bean.roasteryName" class="text-xs text-primary mt-1">{{ bean.roasteryName }}</p>
                        
                        <div v-if="bean.flavors?.length" class="flex flex-wrap gap-1 mt-2">
                          <span
                            v-for="flavor in bean.flavors.slice(0, 3)"
                            :key="flavor.id"
                            class="px-2 py-0.5 text-xs rounded-full"
                            :style="{ backgroundColor: flavor.colorHex + '20', color: flavor.colorHex }"
                          >
                            {{ flavor.name }}
                          </span>
                        </div>
                      </div>
                      <button
                        class="ml-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                        :class="isLinked(bean.id)
                          ? 'bg-neutral-100 text-textSecondary cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-primary-600'"
                        :disabled="isLinked(bean.id) || isLinking === bean.id"
                        @click="handleLink(bean)"
                      >
                        <span v-if="isLinking === bean.id">...</span>
                        <span v-else-if="isLinked(bean.id)">연결됨</span>
                        <span v-else>연결</span>
                      </button>
                    </div>
                  </div>

                  
                  <button
                    v-if="hasMore"
                    type="button"
                    class="w-full py-3 text-sm text-primary font-medium hover:bg-primary-50 rounded-lg"
                    :disabled="isLoading"
                    @click="loadMore"
                  >
                    {{ isLoading ? '로딩 중...' : '더 보기' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          
          <div class="p-4 border-t border-border safe-bottom flex-shrink-0">
            <BaseButton
              variant="secondary"
              size="large"
              class="w-full"
              @click="$emit('close')"
            >
              닫기
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getMenuById } from '@/api/menu'
import { linkBeanToMenu, unlinkBeanFromMenu, getBeans, searchBeans } from '@/api/owner'
import { createLogger } from '@/utils/logger'
import { showSuccess, showError } from '@/utils/toast'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const logger = createLogger('OwnerBeanSelector')

const props = defineProps({
  menu: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const activeTab = ref('linked')
const linkedBeans = ref([])
const beans = ref([])
const searchKeyword = ref('')
const isLoading = ref(false)
const isSearching = ref(false)
const isLinking = ref(null)
const isUnlinking = ref(null)
const currentPage = ref(1)
const hasMore = ref(false)

let searchTimer = null

const ROASTING_LABELS = {
  LIGHT: '라이트',
  MEDIUM: '미디엄',
  DARK: '다크'
}

const getRoastingLevelLabel = (level) => ROASTING_LABELS[level] || level || '-'

/**
 * 원두가 이미 연결되어 있는지 확인
 */
const isLinked = (beanId) => {
  return linkedBeans.value.some(b => b.id === beanId)
}

/**
 * 연결된 원두 목록 로드
 */
const loadLinkedBeans = async () => {
  try {
    const response = await getMenuById(props.menu.id)
    const menuData = response.data || response
    linkedBeans.value = menuData.beanBadges || []
  } catch (err) {
    logger.error('연결된 원두 로드 실패', err)
  }
}

/**
 * 원두 목록 로드
 */
const loadBeans = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    beans.value = []
  }

  isLoading.value = true
  try {
    const response = searchKeyword.value
      ? await searchBeans(searchKeyword.value, { page: currentPage.value, size: 10 })
      : await getBeans({ page: currentPage.value, size: 10 })

    const data = response.data || response
    const content = data.content || data

    if (reset) {
      beans.value = content
    } else {
      beans.value = [...beans.value, ...content]
    }

    hasMore.value = currentPage.value < (data.totalPages || 1)
  } catch (err) {
    logger.error('원두 목록 로드 실패', err)
  } finally {
    isLoading.value = false
    isSearching.value = false
  }
}

/**
 * 더 보기
 */
const loadMore = () => {
  currentPage.value++
  loadBeans(false)
}

/**
 * 검색 (디바운스)
 */
const handleSearchDebounced = () => {
  isSearching.value = true
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadBeans(true)
  }, 300)
}

/**
 * 원두 연결
 */
const handleLink = async (bean) => {
  isLinking.value = bean.id
  try {
    await linkBeanToMenu(props.menu.id, {
      beanId: bean.id,
      isBlended: false
    })

    showSuccess('원두가 연결되었습니다')

    await loadLinkedBeans()
    emit('updated')
  } catch (err) {
    logger.error('원두 연결 실패', err)
    showError('원두 연결에 실패했습니다')
  } finally {
    isLinking.value = null
  }
}

/**
 * 원두 연결 해제
 */
const handleUnlink = async (bean) => {
  isUnlinking.value = bean.id
  try {
    await unlinkBeanFromMenu(props.menu.id, bean.id)
    showSuccess('원두 연결이 해제되었습니다')

    linkedBeans.value = linkedBeans.value.filter(b => b.id !== bean.id)
    emit('updated')
  } catch (err) {
    logger.error('원두 연결 해제 실패', err)
    showError('원두 연결 해제에 실패했습니다')
  } finally {
    isUnlinking.value = null
  }
}

watch(() => props.menu?.id, () => {
  if (props.menu?.id) {
    loadLinkedBeans()
  }
}, { immediate: true })

onMounted(() => {
  loadLinkedBeans()
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
