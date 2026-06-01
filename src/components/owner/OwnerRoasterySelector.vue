<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
          
          <div class="flex items-center justify-between p-4 border-b border-border">
            <h3 class="text-lg font-bold text-textPrimary">
              {{ isCreateMode ? '새 로스터리 등록' : '로스터리 선택' }}
            </h3>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              @click="handleClose"
            >
              <BaseIcon name="close" :size="20" />
            </button>
          </div>

          
          <template v-if="!isCreateMode">
            
            <div class="p-4 border-b border-border">
              <div class="relative">
                <BaseInput
                  v-model="searchKeyword"
                  placeholder="로스터리 이름으로 검색"
                  @input="handleSearchDebounced"
                />
                <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
                  <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                </div>
              </div>
            </div>

            
            <div class="flex-1 overflow-y-auto p-4">
              
              <div v-if="isLoading && roasteries.length === 0" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>

              
              <div v-else-if="roasteries.length === 0" class="text-center py-8">
                <p class="text-textSecondary mb-4">
                  {{ searchKeyword ? '검색 결과가 없습니다' : '등록된 로스터리가 없습니다' }}
                </p>
                <BaseButton
                  variant="primary"
                  size="medium"
                  @click="startCreateMode"
                >
                  새 로스터리 등록하기
                </BaseButton>
              </div>

              
              <div v-else class="space-y-2">
                
                <button
                  type="button"
                  class="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 hover:bg-primary-100 transition-colors text-left"
                  @click="startCreateMode"
                >
                  <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-xl text-primary">+</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-primary">새 로스터리 등록</p>
                    <p class="text-xs text-primary-600">목록에 없으면 직접 등록하세요</p>
                  </div>
                </button>

                <button
                  v-for="roastery in roasteries"
                  :key="roastery.id"
                  type="button"
                  class="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left"
                  :class="selectedId === roastery.id
                    ? 'border-primary bg-primary-50'
                    : 'border-border hover:border-primary-300'"
                  @click="selectRoastery(roastery)"
                >
                  
                  <div class="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      v-if="roastery.logoUrl"
                      :src="roastery.logoUrl"
                      :alt="roastery.name"
                      class="w-full h-full object-cover"
                      @error="handleImageError"
                    />
                    <BaseIcon v-else name="cafe" :size="24" class="text-textSecondary" />
                  </div>

                  
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-textPrimary truncate">{{ roastery.name }}</p>
                    <p v-if="roastery.websiteUrl" class="text-xs text-textSecondary truncate">
                      {{ roastery.websiteUrl }}
                    </p>
                  </div>

                  
                  <div v-if="selectedId === roastery.id" class="text-primary">
                    <BaseIcon name="check" :size="20" />
                  </div>
                </button>

                
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

            
            <div class="p-4 border-t border-border safe-bottom">
              <BaseButton
                variant="primary"
                size="large"
                class="w-full"
                :disabled="!selectedId"
                @click="confirm"
              >
                선택 완료
              </BaseButton>
            </div>
          </template>

          <!-- 로스터리 생성 모드 -->
          <template v-else>
            <div class="flex-1 overflow-y-auto p-4">
              <!-- 로스터리 이름 -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-textPrimary mb-2">
                  로스터리 이름 <span class="text-error">*</span>
                </label>
                <BaseInput
                  v-model="newRoastery.name"
                  placeholder="로스터리 이름을 입력하세요"
                  :status="createErrors.name ? 'error' : ''"
                  :helper-text="createErrors.name"
                />
              </div>

              <!-- 로고 이미지 -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-textPrimary mb-2">로고 이미지</label>
                <OwnerImageUploader
                  v-model="newRoastery.logoUrl"
                  alt="로스터리 로고"
                  helper-text="로고 이미지를 업로드하세요 (선택)"
                />
              </div>

              <!-- 웹사이트 URL -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-textPrimary mb-2">웹사이트</label>
                <BaseInput
                  v-model="newRoastery.websiteUrl"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <!-- 하단 버튼 -->
            <div class="p-4 border-t border-border safe-bottom space-y-2">
              <BaseButton
                variant="primary"
                size="large"
                class="w-full"
                :disabled="!newRoastery.name.trim()"
                @click="handleCreateRoastery"
              >
                이 로스터리로 선택
              </BaseButton>
              <BaseButton
                variant="secondary"
                size="large"
                class="w-full"
                @click="cancelCreateMode"
              >
                뒤로
              </BaseButton>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getRoasteries, searchRoasteries } from '@/api/owner'
import { createLogger } from '@/utils/logger'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import OwnerImageUploader from '@/components/owner/OwnerImageUploader.vue'

const logger = createLogger('OwnerRoasterySelector')

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialRoasteryId: {
    type: [Number, String],
    default: null
  },
  /** 새 로스터리 등록 시 기본 이름 (가맹점명) */
  defaultName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'select', 'select-pending'])

const roasteries = ref([])
const selectedId = ref(null)
const selectedRoastery = ref(null)
const searchKeyword = ref('')
const isLoading = ref(false)
const isSearching = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)

const isCreateMode = ref(false)
const newRoastery = ref({
  name: '',
  logoUrl: '',
  websiteUrl: ''
})
const createErrors = ref({
  name: ''
})

let searchTimer = null

/**
 * 로스터리 목록 로드
 */
const loadRoasteries = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    roasteries.value = []
  }

  isLoading.value = true
  try {
    const response = searchKeyword.value
      ? await searchRoasteries(searchKeyword.value, { page: currentPage.value, size: 10 })
      : await getRoasteries({ page: currentPage.value, size: 10 })

    const data = response.data || response
    const content = data.content || data

    if (reset) {
      roasteries.value = content
    } else {
      roasteries.value = [...roasteries.value, ...content]
    }

    hasMore.value = currentPage.value < (data.totalPages || 1)
  } catch (err) {
    logger.error('로스터리 목록 로드 실패', err)
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
  loadRoasteries(false)
}

/**
 * 검색 (디바운스)
 */
const handleSearchDebounced = () => {
  isSearching.value = true
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadRoasteries(true)
  }, 300)
}

/**
 * 로스터리 선택
 */
const selectRoastery = (roastery) => {
  selectedId.value = roastery.id
  selectedRoastery.value = roastery
}

/**
 * 선택 확정
 */
const confirm = () => {
  if (selectedRoastery.value) {
    emit('select', selectedRoastery.value)
    emit('update:modelValue', false)
  }
}

/**
 * 생성 모드 시작
 */
const startCreateMode = () => {
  isCreateMode.value = true

  newRoastery.value = {
    name: props.defaultName || '',
    logoUrl: '',
    websiteUrl: ''
  }
  createErrors.value = { name: '' }
}

/**
 * 생성 모드 취소
 */
const cancelCreateMode = () => {
  isCreateMode.value = false
}

/**
 * 로스터리 생성 (지연 - 가맹점 등록 시점에 실제 생성)
 */
const handleCreateRoastery = () => {

  createErrors.value = { name: '' }

  if (!newRoastery.value.name.trim()) {
    createErrors.value.name = '로스터리 이름을 입력하세요'
    return
  }

  const pendingRoastery = {
    id: null,
    name: newRoastery.value.name.trim(),
    logoUrl: newRoastery.value.logoUrl.trim() || null,
    websiteUrl: newRoastery.value.websiteUrl.trim() || null,
    isPending: true
  }

  emit('select-pending', pendingRoastery)
  emit('update:modelValue', false)
}

/**
 * 닫기 핸들러
 */
const handleClose = () => {
  if (isCreateMode.value) {
    cancelCreateMode()
  } else {
    emit('update:modelValue', false)
  }
}

/**
 * 이미지 에러 처리
 */
const handleImageError = (e) => {
  e.target.style.display = 'none'
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedId.value = props.initialRoasteryId ? Number(props.initialRoasteryId) : null
    searchKeyword.value = ''
    isCreateMode.value = false
    loadRoasteries(true)
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

.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
