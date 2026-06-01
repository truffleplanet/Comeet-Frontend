<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-show="true"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
        @click.self="$emit('close')"
      >
        <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[60vh] flex flex-col shadow-xl mb-16 sm:mb-0">
          
          <div class="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div>
              <h3 class="text-lg font-bold text-textPrimary">원두 선택</h3>
              <p class="text-sm text-textSecondary">
                메뉴에 연결할 원두를 선택하세요
              </p>
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
              :class="activeTab === 'roastery' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'"
              @click="activeTab = 'roastery'; loadRoasteryBeans(true)"
            >
              우리 원두
            </button>
            <button
              class="flex-1 py-3 text-sm font-medium transition-colors"
              :class="activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-textSecondary'"
              @click="activeTab = 'all'; loadAllBeans(true)"
            >
              전체 검색
            </button>
          </div>

          
          <div class="flex-1 overflow-y-auto min-h-0">
            
            <div v-if="activeTab === 'roastery'" class="p-4">
              
              <div v-if="isLoadingRoastery && roasteryBeans.length === 0" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>

              
              <div v-else-if="roasteryBeans.length === 0" class="text-center py-6">
                <p class="text-textSecondary text-sm">등록된 원두가 없습니다</p>
                <p class="text-xs text-textSecondary mt-1">원두 탭에서 원두를 등록해보세요</p>
              </div>

              
              <div v-else class="space-y-2">
                <BeanCard
                  v-for="beanItem in roasteryBeans"
                  :key="beanItem.id"
                  :bean="beanItem"
                  :is-selected="isSelected(beanItem.id)"
                  @select="handleSelectBean(beanItem)"
                />

                
                <button
                  v-if="hasMoreRoastery"
                  type="button"
                  class="w-full py-3 text-sm text-primary font-medium hover:bg-primary-50 rounded-lg"
                  :disabled="isLoadingRoastery"
                  @click="loadMoreRoastery"
                >
                  {{ isLoadingRoastery ? '로딩 중...' : '더 보기' }}
                </button>
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

              
              <div class="flex-1 overflow-y-auto p-4">
                
                <div v-if="isLoadingAll && allBeans.length === 0" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>

                
                <div v-else-if="allBeans.length === 0" class="text-center py-8">
                  <p class="text-textSecondary">
                    {{ searchKeyword ? '검색 결과가 없습니다' : '검색어를 입력하세요' }}
                  </p>
                </div>

                
                <div v-else class="space-y-2">
                  <BeanCard
                    v-for="beanItem in allBeans"
                    :key="beanItem.id"
                    :bean="beanItem"
                    :is-selected="isSelected(beanItem.id)"
                    :show-roastery="true"
                    @select="handleSelectBean(beanItem)"
                  />

                  
                  <button
                    v-if="hasMoreAll"
                    type="button"
                    class="w-full py-3 text-sm text-primary font-medium hover:bg-primary-50 rounded-lg"
                    :disabled="isLoadingAll"
                    @click="loadMoreAll"
                  >
                    {{ isLoadingAll ? '로딩 중...' : '더 보기' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBeansByRoastery, getBeans, searchBeans } from '@/api/owner'
import { createLogger } from '@/utils/logger'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseInput from '@/components/common/BaseInput.vue'

const logger = createLogger('OwnerBeanSelectorEnhanced')

const props = defineProps({
  storeInfo: {
    type: Object,
    default: null
  },
  selectedBeanIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select'])

const activeTab = ref('roastery')

const roasteryBeans = ref([])
const isLoadingRoastery = ref(false)
const roasteryPage = ref(1)
const hasMoreRoastery = ref(false)

const allBeans = ref([])
const searchKeyword = ref('')
const isLoadingAll = ref(false)
const isSearching = ref(false)
const allPage = ref(1)
const hasMoreAll = ref(false)

let searchTimer = null

/**
 * 선택 여부 확인
 */
const isSelected = (beanId) => {
  return props.selectedBeanIds.includes(beanId)
}

/**
 * 로스터리 원두 로드
 */
const loadRoasteryBeans = async (reset = false) => {
  if (!props.storeInfo?.roasteryId) {
    logger.warn('로스터리 ID가 없습니다')
    return
  }

  if (reset) {
    roasteryPage.value = 1
    roasteryBeans.value = []
  }

  isLoadingRoastery.value = true
  try {
    const response = await getBeansByRoastery(props.storeInfo.roasteryId, {
      page: roasteryPage.value,
      size: 10
    })

    const data = response.data || response
    const content = data.content || data

    if (reset) {
      roasteryBeans.value = content
    } else {
      roasteryBeans.value = [...roasteryBeans.value, ...content]
    }

    hasMoreRoastery.value = roasteryPage.value < (data.totalPages || 1)
  } catch (err) {
    logger.error('로스터리 원두 로드 실패', err)
  } finally {
    isLoadingRoastery.value = false
  }
}

/**
 * 로스터리 원두 더 보기
 */
const loadMoreRoastery = () => {
  roasteryPage.value++
  loadRoasteryBeans(false)
}

/**
 * 전체 원두 로드
 */
const loadAllBeans = async (reset = false) => {
  if (reset) {
    allPage.value = 1
    allBeans.value = []
  }

  isLoadingAll.value = true
  try {
    const response = searchKeyword.value
      ? await searchBeans(searchKeyword.value, { page: allPage.value, size: 10 })
      : await getBeans({ page: allPage.value, size: 10 })

    const data = response.data || response
    const content = data.content || data

    if (reset) {
      allBeans.value = content
    } else {
      allBeans.value = [...allBeans.value, ...content]
    }

    hasMoreAll.value = allPage.value < (data.totalPages || 1)
  } catch (err) {
    logger.error('전체 원두 로드 실패', err)
  } finally {
    isLoadingAll.value = false
    isSearching.value = false
  }
}

/**
 * 전체 원두 더 보기
 */
const loadMoreAll = () => {
  allPage.value++
  loadAllBeans(false)
}

/**
 * 검색 (디바운스)
 */
const handleSearchDebounced = () => {
  isSearching.value = true
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadAllBeans(true)
  }, 300)
}

/**
 * 원두 선택
 */
const handleSelectBean = (bean) => {
  if (isSelected(bean.id)) return

  emit('select', {
    ...bean,
    isBlended: false
  })
}

onMounted(() => {
  if (props.storeInfo?.roasteryId) {
    loadRoasteryBeans(true)
  }
})
</script>

<!-- Bean Card 서브 컴포넌트 -->
<script>
import { h, defineComponent } from 'vue'

const BeanCard = defineComponent({
  name: 'BeanCard',
  props: {
    bean: { type: Object, required: true },
    isSelected: { type: Boolean, default: false },
    showRoastery: { type: Boolean, default: false }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const ROASTING_LABELS = {
      LIGHT: '라이트',
      MEDIUM: '미디엄',
      DARK: '다크'
    }

    const getRoastingLabel = (level) => ROASTING_LABELS[level] || level || '-'

    return () => h('div', {
      class: [
        'p-3 rounded-lg border transition-colors cursor-pointer',
        props.isSelected
          ? 'border-primary-200 bg-primary-50'
          : 'border-border hover:border-primary-300'
      ],
      onClick: () => emit('select', props.bean)
    }, [
      h('div', { class: 'flex items-start justify-between' }, [
        h('div', { class: 'flex-1 min-w-0' }, [
          // 원두 이름 표시
          props.bean.name && h('p', { class: 'font-medium text-textPrimary truncate' }, props.bean.name),
          h('p', { class: 'text-xs text-textSecondary mt-0.5' }, [
            props.bean.country,
            props.bean.farm && ` / ${props.bean.farm}`
          ]),
          h('p', { class: 'text-xs text-textSecondary mt-0.5' }, [
            props.bean.variety || '-',
            ' · ',
            props.bean.processingMethod || '-',
            ' · ',
            getRoastingLabel(props.bean.roastingLevel)
          ]),
          props.showRoastery && props.bean.roasteryName && h('p', {
            class: 'text-xs text-primary mt-1'
          }, props.bean.roasteryName)
        ]),
        h('div', {
          class: [
            'ml-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex-shrink-0',
            props.isSelected
              ? 'bg-neutral-100 text-textSecondary'
              : 'bg-primary text-white hover:bg-primary-600'
          ]
        }, props.isSelected ? '선택됨' : '선택')
      ])
    ])
  }
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
</style>
