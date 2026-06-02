<template>
  <div class="page-container">
    <div class="bg-white px-4 py-5 border-b border-border flex-shrink-0">
      <h1 class="text-xl font-bold text-textPrimary">
        {{ isEditMode ? '가맹점 수정' : '가맹점 등록' }}
      </h1>
      <p class="text-sm text-textSecondary mt-1">
        {{ isEditMode ? '가맹점 정보를 수정하세요' : '새로운 가맹점을 등록하세요' }}
      </p>
    </div>

    <div v-if="isLoadingStore" class="flex-1 flex justify-center items-center">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
    </div>

    <form v-else class="form-content" @submit.prevent="handleSubmit">
      <div class="bg-white rounded-xl p-4 mb-4">
        <h2 class="text-base font-bold text-textPrimary mb-4">기본 정보</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-textPrimary mb-2">
            가맹점명 <span class="text-error">*</span>
          </label>
          <BaseInput
            v-model="form.name"
            placeholder="가맹점 이름을 입력하세요"
            :status="errors.name ? 'error' : ''"
            :helper-text="errors.name"
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-textPrimary mb-2">설명</label>
          <textarea
            v-model="form.description"
            placeholder="가맹점에 대한 설명을 입력하세요"
            class="w-full px-4 py-3 rounded-xl border border-border bg-white text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows="3"
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-textPrimary mb-2">
            카테고리
            <span class="text-textSecondary font-normal">(복수 선택 가능)</span>
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="cat in MENU_CATEGORIES"
              :key="cat.value"
              type="button"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors',
                form.categories.includes(cat.value)
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-border bg-white text-textSecondary hover:border-primary-300'
              ]"
              @click="toggleCategory(cat.value)"
            >
              {{ cat.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 mb-4">
        <h2 class="text-base font-bold text-textPrimary mb-4">위치 정보</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-textPrimary mb-2">
            주소 <span class="text-error">*</span>
          </label>
          <div class="flex gap-2">
            <BaseInput
              v-model="form.address"
              placeholder="주소 검색 버튼을 클릭하세요"
              :status="errors.address ? 'error' : ''"
              :helper-text="errors.address"
              readonly
              class="flex-1"
            />
            <BaseButton
              variant="secondary"
              size="medium"
              :loading="isSearchingAddress"
              @click="handleAddressSearch"
            >
              검색
            </BaseButton>
          </div>
        </div>

      </div>

      <div class="bg-white rounded-xl p-4 mb-4">
        <h2 class="text-base font-bold text-textPrimary mb-4">연락처 및 영업시간</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-textPrimary mb-2">전화번호</label>
          <BaseInput
            :model-value="form.phoneNumber"
            type="tel"
            inputmode="numeric"
            placeholder="숫자만 입력하세요"
            @update:model-value="handlePhoneInput"
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-textPrimary mb-2">영업시간</label>
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex-1 min-w-[120px] flex gap-1">
              <select
                v-model="openHour"
                class="flex-1 min-w-0 px-2 py-2.5 rounded-xl border border-border bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary text-center text-sm"
              >
                <option value="" disabled>시</option>
                <option v-for="h in hours" :key="'open-'+h" :value="h">{{ h }}시</option>
              </select>
              <select
                v-model="openMinute"
                class="flex-1 min-w-0 px-2 py-2.5 rounded-xl border border-border bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary text-center text-sm"
              >
                <option value="" disabled>분</option>
                <option v-for="m in minutes" :key="'open-'+m" :value="m">{{ m }}분</option>
              </select>
            </div>
            <span class="text-textSecondary font-medium">~</span>
            <div class="flex-1 min-w-[120px] flex gap-1">
              <select
                v-model="closeHour"
                class="flex-1 min-w-0 px-2 py-2.5 rounded-xl border border-border bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary text-center text-sm"
              >
                <option value="" disabled>시</option>
                <option v-for="h in hours" :key="'close-'+h" :value="h">{{ h }}시</option>
              </select>
              <select
                v-model="closeMinute"
                class="flex-1 min-w-0 px-2 py-2.5 rounded-xl border border-border bg-white text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary text-center text-sm"
              >
                <option value="" disabled>분</option>
                <option v-for="m in minutes" :key="'close-'+m" :value="m">{{ m }}분</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="isEditMode" class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
          <div>
            <p class="font-medium text-textPrimary">영업 종료</p>
            <p class="text-sm text-textSecondary">영업을 종료하면 검색에서 제외됩니다</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.isClosed" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 mb-4">
        <h2 class="text-base font-bold text-textPrimary mb-4">이미지</h2>
        <label class="block text-sm font-medium text-textPrimary mb-2">썸네일</label>
        <OwnerImageUploader
          v-model="form.thumbnailUrl"
          alt="가맹점 썸네일"
        />
      </div>

      <div v-if="!isEditMode" class="bg-white rounded-xl p-4 mb-4">
        <h2 class="text-base font-bold text-textPrimary mb-4">소속 로스터리</h2>
        <div>
          <label class="block text-sm font-medium text-textPrimary mb-2">
            로스터리 <span class="text-error">*</span>
          </label>

          <div v-if="selectedRoastery" class="flex items-center gap-3 p-3 rounded-lg border-2 border-primary bg-primary-50 mb-2">
            <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                v-if="selectedRoastery.logoUrl"
                :src="selectedRoastery.logoUrl"
                :alt="selectedRoastery.name"
                class="w-full h-full object-cover"
              />
              <BaseIcon v-else name="coffee" :size="20" class="text-primary-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-textPrimary truncate">{{ selectedRoastery.name }}</p>
            </div>
            <button
              type="button"
              class="text-textSecondary hover:text-error"
              @click="clearRoastery"
            >
              ✕
            </button>
          </div>

          <BaseButton
            v-else
            variant="secondary"
            size="medium"
            class="w-full"
            @click="showRoasterySelector = true"
          >
            로스터리 검색
          </BaseButton>

          <p v-if="errors.roasteryId" class="text-xs text-error mt-1">{{ errors.roasteryId }}</p>
        </div>
      </div>
    </form>

    <OwnerRoasterySelector
      v-model="showRoasterySelector"
      :initial-roastery-id="form.roasteryId"
      :default-name="form.name"
      @select="handleRoasterySelect"
      @select-pending="handlePendingRoasterySelect"
    />

    <div class="bottom-button-area">
      <BaseButton
        variant="primary"
        size="large"
        class="w-full"
        :loading="isSubmitting"
        :disabled="!isFormValid"
        @click="handleSubmit"
      >
        {{ isEditMode ? '수정 완료' : '등록하기' }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStoreById } from '@/api/cafe'
import { createStore, updateStore, createRoastery } from '@/api/owner'
import { createLogger } from '@/utils/logger'
import { showSuccess, showError, showWarning } from '@/utils/toast'
import { searchAddressWithCoordinates } from '@/utils/address'
import { MENU_CATEGORIES } from '@/constants'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import OwnerRoasterySelector from '@/components/owner/OwnerRoasterySelector.vue'
import OwnerImageUploader from '@/components/owner/OwnerImageUploader.vue'

const logger = createLogger('OwnerStoreForm')
const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => !!route.params.storeId)
const isLoadingStore = ref(false)
const isSubmitting = ref(false)
const isSearchingAddress = ref(false)
const showRoasterySelector = ref(false)
const selectedRoastery = ref(null)
const pendingRoastery = ref(null)

const openHour = ref('')
const openMinute = ref('')
const closeHour = ref('')
const closeMinute = ref('')

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = ['00', '10', '20', '30', '40', '50']

const form = ref({
  name: '',
  description: '',
  address: '',
  latitude: '',
  longitude: '',
  phoneNumber: '',
  categories: [],
  thumbnailUrl: '',
  roasteryId: '',
  isClosed: false
})

/**
 * 전화번호 자동 포맷팅 (숫자만 입력 → 하이픈 자동 추가)
 */
const handlePhoneInput = (value) => {
  const numbers = value.replace(/\D/g, '')

  let formatted = ''
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      formatted = numbers
    } else if (numbers.length <= 5) {
      formatted = `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    } else if (numbers.length <= 9) {
      formatted = `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
    } else {
      formatted = `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    }
  } else if (numbers.startsWith('01')) {
    if (numbers.length <= 3) {
      formatted = numbers
    } else if (numbers.length <= 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  } else {
    if (numbers.length <= 3) {
      formatted = numbers
    } else if (numbers.length <= 6) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 10) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    } else {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  form.value.phoneNumber = formatted
}

const errors = ref({
  name: '',
  address: '',
  roasteryId: ''
})

/**
 * 폼 유효성 검사
 */
const isFormValid = computed(() => {
  const hasName = form.value.name.trim().length > 0
  const hasAddress = form.value.address.trim().length > 0
  const hasLatitude = form.value.latitude !== '' && !isNaN(Number(form.value.latitude))
  const hasLongitude = form.value.longitude !== '' && !isNaN(Number(form.value.longitude))
  const hasRoastery = isEditMode.value || form.value.roasteryId === 'pending' || form.value.roasteryId !== ''

  return hasName && hasAddress && hasLatitude && hasLongitude && hasRoastery
})

/**
 * 폼 유효성 검사 (상세)
 */
const validateForm = () => {
  let isValid = true
  errors.value = { name: '', address: '', roasteryId: '' }

  if (!form.value.name.trim()) {
    errors.value.name = '가맹점명을 입력하세요'
    isValid = false
  }

  if (!form.value.address.trim()) {
    errors.value.address = '주소를 입력하세요'
    isValid = false
  }

  const lat = Number(form.value.latitude)
  const lng = Number(form.value.longitude)
  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
    errors.value.address = '주소를 다시 검색해주세요'
    isValid = false
  }

  if (!isEditMode.value && !form.value.roasteryId) {
    errors.value.roasteryId = '로스터리를 선택하세요'
    isValid = false
  } else if (!isEditMode.value && form.value.roasteryId === 'pending' && !pendingRoastery.value) {
    errors.value.roasteryId = '로스터리를 선택하세요'
    isValid = false
  }

  return isValid
}

/**
 * 기존 가맹점 데이터 로드 (수정 모드)
 */
const loadStoreData = async () => {
  if (!isEditMode.value) return

  isLoadingStore.value = true
  try {
    const response = await getStoreById(route.params.storeId)
    const store = response.data || response

    const categories = store.category
      ? store.category.split(',').map(c => c.trim()).filter(Boolean)
      : []

    if (store.openingHours) {
      const [open, close] = store.openingHours.split('-')
      if (open) {
        const [h, m] = open.trim().split(':')
        openHour.value = h || ''
        openMinute.value = m || '00'
      }
      if (close) {
        const [h, m] = close.trim().split(':')
        closeHour.value = h || ''
        closeMinute.value = m || '00'
      }
    }

    form.value = {
      name: store.name || '',
      description: store.description || '',
      address: store.address || '',
      latitude: store.latitude?.toString() || '',
      longitude: store.longitude?.toString() || '',
      phoneNumber: store.phoneNumber || '',
      categories,
      thumbnailUrl: store.thumbnailUrl || '',
      roasteryId: store.roasteryId?.toString() || '',
      isClosed: store.isClosed || false
    }
  } catch (err) {
    logger.error('가맹점 데이터 로드 실패', err)
    showError('가맹점 정보를 불러오지 못했습니다')
    router.back()
  } finally {
    isLoadingStore.value = false
  }
}

/**
 * 폼 제출
 */
const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const openingHours = (openHour.value && closeHour.value)
      ? `${openHour.value}:${openMinute.value || '00'}-${closeHour.value}:${closeMinute.value || '00'}`
      : null

    const formData = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      address: form.value.address.trim(),
      latitude: Number(form.value.latitude),
      longitude: Number(form.value.longitude),
      phoneNumber: form.value.phoneNumber.trim() || null,
      openingHours,
      category: form.value.categories.length > 0 ? form.value.categories.join(',') : null,
      thumbnailUrl: form.value.thumbnailUrl.trim() || null
    }

    if (isEditMode.value) {
      formData.isClosed = form.value.isClosed
      await updateStore(route.params.storeId, formData)
      showSuccess('가맹점이 수정되었습니다')
    } else {
      let roasteryId = form.value.roasteryId

      if (pendingRoastery.value) {
        try {
          const roasteryResponse = await createRoastery({
            name: pendingRoastery.value.name,
            logoUrl: pendingRoastery.value.logoUrl,
            websiteUrl: pendingRoastery.value.websiteUrl
          })
          const createdRoastery = roasteryResponse.data || roasteryResponse
          roasteryId = createdRoastery.id
          logger.debug('로스터리 생성 완료', createdRoastery)
        } catch (err) {
          logger.error('로스터리 생성 실패', err)
          showError('로스터리 등록에 실패했습니다')
          return
        }
      }

      formData.roasteryId = roasteryId
      await createStore(formData)
      showSuccess('가맹점이 등록되었습니다')
    }

    router.push({ name: 'owner-stores' })
  } catch (err) {
    logger.error('가맹점 저장 실패', err)
    showError(isEditMode.value ? '가맹점 수정에 실패했습니다' : '가맹점 등록에 실패했습니다')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 카테고리 토글
 */
const toggleCategory = (categoryValue) => {
  const index = form.value.categories.indexOf(categoryValue)
  if (index === -1) {
    form.value.categories.push(categoryValue)
  } else {
    form.value.categories.splice(index, 1)
  }
}

/**
 * 로스터리 선택 핸들러 (기존 로스터리)
 */
const handleRoasterySelect = (roastery) => {
  selectedRoastery.value = roastery
  pendingRoastery.value = null
  form.value.roasteryId = roastery.id.toString()
  errors.value.roasteryId = ''
  logger.debug('로스터리 선택', roastery)
}

/**
 * 새 로스터리 선택 핸들러 (가맹점 등록 시 생성됨)
 */
const handlePendingRoasterySelect = (roastery) => {
  pendingRoastery.value = roastery
  selectedRoastery.value = roastery
  form.value.roasteryId = 'pending'
  errors.value.roasteryId = ''
  logger.debug('새 로스터리 선택 (대기)', roastery)
}

/**
 * 로스터리 선택 해제
 */
const clearRoastery = () => {
  selectedRoastery.value = null
  pendingRoastery.value = null
  form.value.roasteryId = ''
}

/**
 * 주소 검색 핸들러
 */
const handleAddressSearch = async () => {
  isSearchingAddress.value = true
  try {
    const result = await searchAddressWithCoordinates()

    form.value.address = result.address
    form.value.latitude = result.latitude.toString()
    form.value.longitude = result.longitude.toString()

    errors.value.address = ''

    logger.debug('주소 검색 완료', result)
  } catch (err) {
    if (err.message !== '주소 검색이 취소되었습니다') {
      logger.error('주소 검색 실패', err)
      showWarning(err.message || '주소 검색에 실패했습니다')
    }
  } finally {
    isSearchingAddress.value = false
  }
}

onMounted(() => {
  loadStoreData()
})
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: var(--color-background);
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 1rem;
}

.bottom-button-area {
  flex-shrink: 0;
  padding: 1rem;
  background-color: white;
  border-top: 1px solid var(--color-border);
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
